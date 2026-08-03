import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'

function setupTestEnv(dbPath) {
  process.env.DATABASE_URL = ''
  process.env.LMS_TEST_DB = dbPath
  process.env.UPLOADS_DIR = path.join(os.tmpdir(), 'lms-test-uploads')
  process.env.JWT_SECRET = 'test-jwt-secret'
  process.env.ADMIN_JWT_SECRET = 'test-admin-jwt'
  process.env.ADMIN_PASSWORD = 'AdminTest-2026-Only!'
  process.env.EDITOR_PASSWORD = 'EditorTest-2026-Only!'
  process.env.MODERATOR_PASSWORD = 'ModeratorTest-2026!'
  process.env.CORS_ORIGIN = 'http://localhost:5173'
  process.env.PRELAUNCH_MODE = '1'
}

test('SQLite schema creates all required tables', async () => {
  const tmpDb = path.join(os.tmpdir(), `lms-schema-${Date.now()}.sqlite`)
  setupTestEnv(tmpDb)

  const { createSqliteDb } = await import('../db/sqlite.js')
  createSqliteDb()

  const Database = (await import('better-sqlite3')).default
  const raw = new Database(tmpDb)
  const tables = raw.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  ).all().map((r) => r.name)
  raw.close()

  const required = [
    'users', 'purchases', 'progress', 'courses', 'blog_posts', 'calendar_events',
    'registrations', 'purchase_log', 'certificates', 'homework', 'notifications',
    'referrals', 'referral_discounts', 'analytics', 'webhook_events', 'admin_seen',
    'email_tokens', 'payments', 'reviews', 'teams', 'team_members',
    'user_achievements', 'lesson_reminders', 'accelerator_applications',
    'giveaway_entries', 'giveaway_bonus_actions', 'giveaway_results',
    'marketplace_products', 'product_assets', 'marketplace_orders',
    'asset_entitlements', 'asset_downloads',
  ]

  for (const t of required) assert.ok(tables.includes(t), `missing table ${t}`)
  fs.unlinkSync(tmpDb)
})

test('API: health, courses, blog, auth, admin', async (t) => {
  const tmpDb = path.join(os.tmpdir(), `lms-api-${Date.now()}.sqlite`)
  setupTestEnv(tmpDb)

  const { resetDatabase } = await import('../db/index.js')
  resetDatabase()

  const { createApp } = await import('../app.js')
  const app = await createApp()
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance))
    instance.once('error', reject)
  })
  const port = server.address().port
  const base = `http://127.0.0.1:${port}`

  t.after(() => new Promise((resolve) => { server.close(resolve); fs.unlinkSync(tmpDb) }))

  const health = await fetch(`${base}/api/health`).then((r) => r.json())
  assert.equal(health.ok, true)
  assert.equal(health.db, 'sqlite')

  const courses = await fetch(`${base}/api/courses`).then((r) => r.json())
  assert.ok(Array.isArray(courses) && courses.length >= 1, 'courses should be non-empty')
  for (const course of courses) {
    for (const lesson of course.lessons || []) assert.equal(lesson.videoUrl, null, 'prelaunch must hide video URLs')
  }

  const blogRes = await fetch(`${base}/api/blog`)
  assert.equal(blogRes.status, 200)
  const blog = await blogRes.json()
  assert.ok(Array.isArray(blog))

  const email = `test-${Date.now()}@example.com`
  const reg = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'SecretTest12', name: 'Test User' }),
  })
  assert.equal(reg.status, 201)
  const regData = await reg.json()
  assert.ok(regData.requiresVerification)
  assert.equal(regData.email, email)
  assert.ok(regData.devCode, 'dev mode should return verification code')

  const verify = await fetch(`${base}/api/auth/verify-email-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code: regData.devCode }),
  })
  assert.equal(verify.status, 200)

  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'SecretTest12' }),
  })
  assert.equal(login.status, 200)
  const loginData = await login.json()
  assert.ok(loginData.token)

  const adminLogin = await fetch(`${base}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'AdminTest-2026-Only!' }),
  })
  assert.equal(adminLogin.status, 200)
  const adminData = await adminLogin.json()
  assert.equal(adminData.role, 'admin')

  const userHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${loginData.token}` }
  const adminHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${adminData.token}` }
  const blockedRequests = [
    fetch(`${base}/api/payments/tribute/checkout`, { method: 'POST', headers: userHeaders, body: JSON.stringify({ courseId: 'ai-start', amount: 1 }) }),
    fetch(`${base}/api/payments/demo`, { method: 'POST', headers: userHeaders, body: JSON.stringify({ courseId: 'ai-start' }) }),
    fetch(`${base}/api/webhooks/stripe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }),
    fetch(`${base}/api/webhooks/tribute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }),
    fetch(`${base}/api/webhooks/liqpay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }),
    fetch(`${base}/api/me/progress/ai-start`, { method: 'PUT', headers: userHeaders, body: JSON.stringify({ data: { watched: [0] } }) }),
    fetch(`${base}/api/me/homework`, { method: 'POST', headers: userHeaders, body: JSON.stringify({ courseId: 'ai-start' }) }),
    fetch(`${base}/api/teams/grant-course`, { method: 'POST', headers: userHeaders, body: JSON.stringify({ memberEmail: email, courseId: 'ai-start' }) }),
    fetch(`${base}/api/admin/grant-course`, { method: 'POST', headers: adminHeaders, body: JSON.stringify({ email, courseId: 'ai-start' }) }),
  ]
  for (const request of blockedRequests) {
    const response = await request
    assert.equal(response.status, 423)
    assert.equal((await response.json()).code, 'PRELAUNCH_MODE')
  }

  const removedSelfGrant = await fetch(`${base}/api/me/purchases`, {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({ courseId: 'ai-start' }),
  })
  assert.equal(removedSelfGrant.status, 404)

  const tributeStatus = await fetch(`${base}/api/payments/tribute/status`).then((r) => r.json())
  assert.equal(tributeStatus.enabled, false)
  assert.equal(tributeStatus.prelaunch, true)

  const me = await fetch(`${base}/api/me`, { headers: userHeaders }).then((r) => r.json())
  assert.equal(me.prelaunch, true)
  assert.deepEqual(me.purchases, [])
  assert.deepEqual(me.progress, {})
  assert.deepEqual(me.achievements, [])
  const stats = await fetch(`${base}/api/me/stats`, { headers: userHeaders }).then((r) => r.json())
  assert.equal(stats.prelaunch, true)
  assert.deepEqual(stats.chart, [])

  const marketplace = await fetch(`${base}/api/marketplace/products?type=marketplace`).then((r) => r.json())
  assert.equal(marketplace.products.length, 13)
  assert.ok(marketplace.products.every((product) => product.status === 'published'))
  assert.ok(marketplace.products.every((product) => product.downloads === 0))
  assert.ok(marketplace.products.every((product) => product.reviewCount === 0 && product.rating === null))

  const adminMarketplace = await fetch(`${base}/api/admin/marketplace/products`, { headers: adminHeaders }).then((r) => r.json())
  assert.equal(adminMarketplace.statusCounts.draft, 35)
  assert.equal(adminMarketplace.statusCounts.published, 13)
  assert.ok(adminMarketplace.products.filter((product) => product.status === 'published').every((product) => product.assets.length >= 1))

  const freeProduct = marketplace.products.find((product) => product.isFree)
  assert.ok(freeProduct)
  const freeClaim = await fetch(`${base}/api/marketplace/products/${freeProduct.id}/claim`, {
    method: 'POST', headers: userHeaders,
  })
  assert.equal(freeClaim.status, 201)

  let downloads = await fetch(`${base}/api/marketplace/downloads`, { headers: userHeaders }).then((r) => r.json())
  const freeAsset = downloads.downloads.find((item) => item.product_id === freeProduct.id)
  assert.ok(freeAsset)
  const freeSigned = await fetch(`${base}/api/marketplace/downloads/${freeAsset.asset_id}/url`, {
    method: 'POST', headers: userHeaders,
  })
  assert.equal(freeSigned.status, 200)
  const freeSignedData = await freeSigned.json()
  assert.equal(freeSignedData.expiresIn, 900)
  assert.match(freeSignedData.url, /^\/api\/files\//)
  const freeFile = await fetch(`${base}${freeSignedData.url}`)
  assert.equal(freeFile.status, 200)
  assert.ok((await freeFile.text()).length > 30)

  const { getDb } = await import('../db/index.js')
  const user = await getDb().get('SELECT id FROM users WHERE email = ?', [email])
  const { createMarketplaceOrder, getMarketplaceProduct } = await import('../services/marketplaceCatalog.js')
  const { reconcilePaidPayment } = await import('../services/paymentFulfillment.js')
  const paidProduct = await getMarketplaceProduct(getDb(), 'beauty-business-agent-stack')
  assert.ok(paidProduct && !paidProduct.isFree)
  const payment = {
    id: 'test-marketplace-payment', user_id: user.id, email, course_id: paidProduct.id,
    course_title: paidProduct.titleEn, amount: paidProduct.priceEur, currency: 'EUR',
    provider: 'stripe', external_id: 'cs_test_marketplace', status: 'pending',
  }
  await getDb().run(`INSERT INTO payments (id, user_id, email, course_id, course_title, amount, currency, provider, external_id, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`, [
    payment.id, payment.user_id, payment.email, payment.course_id, payment.course_title,
    payment.amount, payment.currency, payment.provider, payment.external_id, new Date().toISOString(),
  ])
  await createMarketplaceOrder(getDb(), {
    userId: user.id, product: paidProduct, paymentId: payment.id, provider: payment.provider,
    externalId: payment.external_id, amount: payment.amount, currency: payment.currency,
  })
  await assert.rejects(
    reconcilePaidPayment({
      payment, provider: payment.provider, externalId: payment.external_id, userId: user.id,
      productId: paidProduct.id, amount: 1, currency: payment.currency,
    }),
    /Payment reconciliation mismatch/,
  )
  const fulfillment = await reconcilePaidPayment({
    payment, provider: payment.provider, externalId: payment.external_id, userId: user.id,
    productId: paidProduct.id, amount: payment.amount, currency: payment.currency,
  })
  assert.equal(fulfillment.marketplace, true)
  const storedPayment = await getDb().get('SELECT * FROM payments WHERE id = ?', [payment.id])
  const idempotent = await reconcilePaidPayment({
    payment: storedPayment, provider: payment.provider, externalId: payment.external_id, userId: user.id,
    productId: paidProduct.id, amount: payment.amount, currency: payment.currency,
  })
  assert.equal(idempotent.idempotent, true)
  downloads = await fetch(`${base}/api/marketplace/downloads`, { headers: userHeaders }).then((r) => r.json())
  assert.ok(downloads.downloads.some((item) => item.product_id === paidProduct.id))
  for (const bundledProductId of paidProduct.bundleItems) {
    assert.ok(downloads.downloads.some((item) => item.product_id === bundledProductId), `missing bundle entitlement ${bundledProductId}`)
  }

  const reminder = await fetch(`${base}/api/telegram/reminder`, {
    method: 'POST', headers: userHeaders,
    body: JSON.stringify({ courseId: 'ai-start', lessonIndex: 0, remindAt: new Date().toISOString() }),
  })
  assert.equal(reminder.status, 423)
  assert.equal((await reminder.json()).code, 'PRELAUNCH_MODE')

  for (let i = 0; i < 11; i += 1) {
    const response = await fetch(`${base}/api/giveaways/claude-pro/verify-telegram`, {
      method: 'POST', headers: userHeaders,
    })
    assert.equal(response.status, i === 10 ? 429 : 400)
  }
  for (let i = 0; i < 6; i += 1) {
    const response = await fetch(`${base}/api/giveaways/claude-pro/enter`, {
      method: 'POST', headers: userHeaders,
    })
    assert.equal(response.status, i === 5 ? 429 : 400)
  }

  await getDb().run(
    `INSERT INTO giveaway_entries (id, giveaway_id, user_id, email, telegram_username, telegram_verified, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
    ['test-entry', 'claude-pro', user.id, email, 'test_user', new Date().toISOString()]
  )
  const share = await fetch(`${base}/api/giveaways/claude-pro/share`, {
    method: 'POST', headers: userHeaders,
  })
  assert.equal(share.status, 201)
  const shareData = await share.json()
  assert.equal(shareData.shared, true)
  assert.equal(shareData.chances, 4)
  const duplicateShare = await fetch(`${base}/api/giveaways/claude-pro/share`, {
    method: 'POST', headers: userHeaders,
  })
  assert.equal(duplicateShare.status, 200)
  assert.equal((await duplicateShare.json()).alreadyRecorded, true)
  const { SERVER_GIVEAWAYS } = await import('../data/giveaways.js')
  const originalEndsAt = SERVER_GIVEAWAYS['claude-pro'].endsAt
  SERVER_GIVEAWAYS['claude-pro'].endsAt = '2020-01-01T00:00:00Z'
  t.after(() => { SERVER_GIVEAWAYS['claude-pro'].endsAt = originalEndsAt })

  const draw = await fetch(`${base}/api/admin/giveaways/claude-pro/draw`, { method: 'POST', headers: adminHeaders })
  assert.equal(draw.status, 201)
  const drawData = await draw.json()
  assert.equal(drawData.result.winnerEmail, email)
  assert.equal(drawData.result.totalChances, 4)
  assert.equal(drawData.result.winnerChances, 4)
  const redraw = await fetch(`${base}/api/admin/giveaways/claude-pro/draw`, { method: 'POST', headers: adminHeaders })
  assert.equal(redraw.status, 200)
  assert.equal((await redraw.json()).alreadyDrawn, true)

  const exportCsv = await fetch(`${base}/api/admin/giveaways/claude-pro/export.csv`, { headers: adminHeaders })
  assert.equal(exportCsv.status, 200)
  assert.match(await exportCsv.text(), /test_user/)
  const publish = await fetch(`${base}/api/admin/giveaways/claude-pro/publish`, { method: 'POST', headers: adminHeaders })
  assert.equal(publish.status, 200)
  const publicResult = await fetch(`${base}/api/giveaways/claude-pro`).then((r) => r.json())
  assert.equal(publicResult.result.winnerTelegramUsername, '@test_user')

  for (let i = 0; i < 5; i += 1) {
    const response = await fetch(`${base}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong-password' }),
    })
    assert.equal(response.status, i === 4 ? 429 : 401)
  }
})

test('nowIso returns valid ISO string', async () => {
  const { nowIso } = await import('../db/time.js')
  assert.ok(!Number.isNaN(Date.parse(nowIso())))
})

test('email verification only preserves safe internal return paths', async () => {
  const { normalizeVerificationReturnPath } = await import('../services/emailVerification.js')
  assert.equal(
    normalizeVerificationReturnPath('/giveaway/claude-pro?ref=AIA-LCR9XC'),
    '/giveaway/claude-pro?ref=AIA-LCR9XC',
  )
  assert.equal(normalizeVerificationReturnPath('https://evil.example/phish'), '/onboarding')
  assert.equal(normalizeVerificationReturnPath('//evil.example/phish'), '/onboarding')
  assert.equal(normalizeVerificationReturnPath('/safe\\evil'), '/onboarding')
})

test('security helpers enforce passwords, signatures, and safe paths', async () => {
  const { validateUserPassword } = await import('../utils/security.js')
  assert.equal(validateUserPassword('short1').ok, false)
  assert.equal(validateUserPassword('NoDigitsHere').ok, false)
  assert.equal(validateUserPassword('StrongPass123').ok, true)

  const { getFileUrl, resolveLocalFile, verifyLocalFileSignature } = await import('../services/storage.js')
  const root = process.env.UPLOADS_DIR
  fs.mkdirSync(root, { recursive: true })
  const inside = path.join(root, 'homework', 'safe.txt')
  fs.mkdirSync(path.dirname(inside), { recursive: true })
  fs.writeFileSync(inside, 'safe')
  assert.equal(resolveLocalFile('../outside.txt'), null)
  assert.equal(resolveLocalFile('homework/safe.txt'), inside)
  const signed = new URL(await getFileUrl('homework/safe.txt'), 'http://localhost')
  assert.equal(
    verifyLocalFileSignature('homework/safe.txt', signed.searchParams.get('expires'), signed.searchParams.get('signature')),
    true
  )
  assert.equal(
    verifyLocalFileSignature('homework/other.txt', signed.searchParams.get('expires'), signed.searchParams.get('signature')),
    false
  )
  fs.rmSync(root, { recursive: true, force: true })
})

test('giveaway chance totals include Telegram and server-recorded bonuses', async () => {
  const {
    GIVEAWAY_REFERRAL_CHANCES,
    GIVEAWAY_SHARE_CHANCES,
    totalGiveawayChances,
  } = await import('../data/giveawayChances.js')
  assert.equal(totalGiveawayChances(), 2)
  assert.equal(totalGiveawayChances(GIVEAWAY_SHARE_CHANCES), 4)
  assert.equal(
    totalGiveawayChances(GIVEAWAY_SHARE_CHANCES + GIVEAWAY_REFERRAL_CHANCES * 2),
    10,
  )
})

test('Postgres connection and table count', async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip('DATABASE_URL not set')
    return
  }
  const { createPostgresDb } = await import('../db/postgres.js')
  const db = await createPostgresDb(process.env.DATABASE_URL)
  t.after(() => db.raw.end())

  const courses = await db.all('SELECT data FROM courses ORDER BY id')
  assert.ok(Array.isArray(courses))

  const tables = await db.all(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  )
  assert.ok(tables.length >= 20, 'expected at least 20 tables')
})
