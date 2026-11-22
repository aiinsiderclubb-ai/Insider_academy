import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'

test('Studio admin API: promo codes, revenue, orders, learner card and grants, referrals, support, roles', async () => {
  const dbPath = path.join(os.tmpdir(), `studio-${Date.now()}.sqlite`)
  Object.assign(process.env, {
    DATABASE_URL: '', LMS_TEST_DB: dbPath, UPLOADS_DIR: path.join(os.tmpdir(), 'studio-uploads'),
    JWT_SECRET: 'studio-test-jwt', ADMIN_JWT_SECRET: 'studio-test-admin',
    ADMIN_PASSWORD: 'AdminTest-2026-Only!', EDITOR_PASSWORD: 'EditorTest-2026-Only!', MODERATOR_PASSWORD: 'ModeratorTest-2026!',
    CORS_ORIGIN: 'http://localhost:5173', PRELAUNCH_MODE: '0', COURSES_PUBLIC: '1',
  })
  const { config } = await import('../config.js')
  config.prelaunchMode = false
  const { resetDatabase, getDb } = await import('../db/index.js')
  resetDatabase()
  const { createApp } = await import('../app.js')
  const app = await createApp()
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)) })
  const base = `http://127.0.0.1:${server.address().port}`
  const json = { 'Content-Type': 'application/json' }
  const db = getDb()

  const login = async (password) => {
    const r = await fetch(`${base}/api/admin/login`, { method: 'POST', headers: json, body: JSON.stringify({ password }) }).then((x) => x.json())
    return { ...json, Authorization: `Bearer ${r.token}` }
  }
  const call = (auth, method, url, body) =>
    fetch(`${base}/api/admin${url}`, { method, headers: auth, body: body ? JSON.stringify(body) : undefined }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }))

  try {
    const admin = await login('AdminTest-2026-Only!')
    const editor = await login('EditorTest-2026-Only!')
    const moderator = await login('ModeratorTest-2026!')

    // ---- promo codes
    let r = await call(admin, 'POST', '/promo-codes', { code: 'launch20', discountPercent: 20, maxUses: 100, validUntil: '2030-01-01', courseIds: ['vault-prompt'] })
    assert.equal(r.status, 201)
    r = await call(admin, 'POST', '/promo-codes', { code: 'MINUS5', discountEur: 5 })
    assert.equal(r.status, 201)
    assert.equal((await call(admin, 'POST', '/promo-codes', { code: 'BOTH', discountPercent: 10, discountEur: 5 })).status, 400)
    assert.equal((await call(admin, 'POST', '/promo-codes', { code: 'NONE' })).status, 400)
    assert.equal((await call(admin, 'POST', '/promo-codes', { code: 'FRIEND-X1', discountPercent: 10 })).status, 400)
    assert.equal((await call(admin, 'POST', '/promo-codes', { code: 'LAUNCH20', discountPercent: 10 })).status, 409)
    assert.equal((await call(editor, 'POST', '/promo-codes', { code: 'EDIT1', discountPercent: 10 })).status, 403)
    await db.run("INSERT INTO promo_codes (code, discount_percent, max_uses, active, created_at) VALUES ('NEXT-AAAA1111', 15, 1, 1, ?)", [new Date().toISOString()])
    const codes = (await call(admin, 'GET', '/promo-codes')).body
    const launch = codes.find((c) => c.code === 'LAUNCH20')
    assert.equal(launch.discountPercent, 20)
    assert.equal(launch.maxUses, 100)
    assert.deepEqual(launch.courseIds, ['vault-prompt'])
    assert.equal(launch.kind, 'campaign')
    assert.equal(codes.find((c) => c.code === 'MINUS5').discountEur, 5)
    assert.equal(codes.find((c) => c.code === 'NEXT-AAAA1111').kind, 'reward')
    assert.equal((await call(admin, 'PATCH', '/promo-codes/LAUNCH20', { active: false })).status, 200)
    assert.equal((await call(admin, 'GET', '/promo-codes')).body.find((c) => c.code === 'LAUNCH20').active, false)
    const { validatePromoCode } = await import('../services/promoCodes.js')
    assert.equal((await validatePromoCode({ code: 'MINUS5', courseId: 'x', amountEur: 29 })).finalEur, 24)

    // ---- users and payments
    const now = Date.now()
    const iso = (days) => new Date(now - days * 86400000).toISOString()
    await db.run("INSERT INTO users (email, password_hash, name, email_verified, personal_id) VALUES ('anna@example.com', 'x', 'Anna', 1, 'AIA-ANNA01')")
    await db.run("INSERT INTO users (email, password_hash, name, email_verified, personal_id) VALUES ('boris@example.com', 'x', 'Boris', 1, 'AIA-BORI01')")
    const anna = await db.get("SELECT id FROM users WHERE email = 'anna@example.com'")
    const insertPayment = (id, amount, status, days, provider = 'paddle', course = 'ai-productivity-master') =>
      db.run('INSERT INTO payments (id, user_id, email, course_id, course_title, amount, currency, provider, external_id, status, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, anna.id, 'anna@example.com', course, null, amount, 'EUR', provider, `txn_${id}`, status, iso(days), status === 'pending' ? null : iso(days)])
    await insertPayment('p1', 29, 'completed', 2)
    await insertPayment('p2', 39, 'completed', 10, 'tribute', 'ai-content-creator')
    await insertPayment('p3', 59, 'completed', 60)
    await insertPayment('p4', 49, 'refunded', 5)
    await insertPayment('p5', 79, 'pending', 1)
    await db.run("INSERT INTO purchases (user_id, course_id, payment_provider, payment_id) VALUES (?, 'ai-productivity-master', 'paddle', 'txn_p1')", [anna.id])

    // ---- revenue: 30 calendar days, completed only, refunds apart
    const revenue = (await call(admin, 'GET', '/revenue?days=30')).body
    assert.equal(revenue.revenue, 68)
    assert.equal(revenue.orders, 2)
    assert.equal(revenue.averageOrder, 34)
    assert.deepEqual(revenue.refunds, { count: 1, amount: 49 })
    assert.equal(revenue.daily.length, 30)
    assert.deepEqual(revenue.byProvider.map((p) => p.provider).sort(), ['paddle', 'tribute'])
    assert.equal((await call(editor, 'GET', '/revenue')).status, 403)

    // ---- orders and revoke
    const orders = (await call(admin, 'GET', '/orders?provider=paddle')).body
    assert.ok(orders.orders.every((o) => o.provider === 'paddle'))
    const p1 = orders.orders.find((o) => o.id === 'p1')
    assert.deepEqual(p1.granted.courses, ['ai-productivity-master'])
    assert.equal((await call(admin, 'GET', '/orders?q=content')).body.orders.length, 1)
    assert.equal((await call(moderator, 'POST', '/orders/p1/revoke', {})).status, 403)
    assert.equal((await call(admin, 'POST', '/orders/p5/revoke', {})).status, 409)
    r = await call(admin, 'POST', '/orders/p1/revoke', { reason: 'test' })
    assert.equal(r.status, 200)
    assert.equal((await db.get("SELECT status FROM payments WHERE id = 'p1'")).status, 'refunded')
    assert.equal((await db.all('SELECT * FROM purchases WHERE user_id = ?', [anna.id])).length, 0)

    // ---- learner search, card, grants
    const found = (await call(moderator, 'GET', '/users?q=ann')).body.users
    assert.equal(found.length, 1)
    assert.equal(found[0].email, 'anna@example.com')
    assert.equal((await call(editor, 'GET', '/users')).status, 403)
    assert.equal((await call(admin, 'POST', '/entitlements', { userId: anna.id, itemId: 'nope' })).status, 400)
    assert.equal((await call(moderator, 'POST', '/entitlements', { userId: anna.id, itemId: 'ai-content-creator' })).status, 403)
    assert.equal((await call(admin, 'POST', '/entitlements', { userId: anna.id, itemId: 'ai-content-creator' })).status, 201)
    assert.equal((await call(admin, 'POST', '/entitlements', { userId: anna.id, itemId: 'vault-prompt' })).status, 201)
    let card = (await call(admin, 'GET', `/users/${anna.id}`)).body
    assert.ok(card.purchases.some((p) => p.itemId === 'ai-content-creator' && p.provider === 'admin'))
    assert.equal(card.entitlements.filter((e) => e.status === 'active').length, 5)
    assert.equal(card.payments.length, 5)
    r = await call(admin, 'POST', '/entitlements/revoke', { userId: anna.id, entitlementId: card.entitlements[0].id })
    assert.equal(r.status, 200)
    r = await call(admin, 'POST', '/entitlements/revoke', { userId: anna.id, purchaseId: card.purchases[0].id })
    assert.equal(r.status, 200)
    card = (await call(admin, 'GET', `/users/${anna.id}`)).body
    assert.equal(card.entitlements.filter((e) => e.status === 'active').length, 4)
    assert.equal(card.purchases.length, 0)

    // ---- referrals
    await db.run("INSERT INTO referrals (referrer_code, referrer_email, referred_email, referred_purchased, date) VALUES ('AIA-ANNA01', 'anna@example.com', 'boris@example.com', 1, ?)", [iso(1)])
    await db.run("INSERT INTO promo_codes (code, discount_percent, max_uses, valid_from, active, created_at) VALUES ('FRIEND-BBBB2222', 15, 1, ?, 1, ?)", [new Date(now + 86400000).toISOString(), iso(0)])
    const refs = (await call(admin, 'GET', '/referrals')).body
    assert.equal(refs.invited, 1)
    assert.equal(refs.converted, 1)
    assert.equal(refs.friendCodes.issued, 1)
    assert.equal(refs.friendCodes.pending, 1)
    assert.equal(refs.nextCodes.active, 1)
    assert.equal(refs.topReferrers[0].email, 'anna@example.com')

    // ---- support
    await db.run("INSERT INTO support_messages (id, user_id, email, name, message, status, date) VALUES ('sup-1', ?, 'anna@example.com', 'Anna', 'Where is my file?', 'new', ?)", [anna.id, iso(0)])
    const inbox = (await call(moderator, 'GET', '/support')).body.messages
    assert.equal(inbox[0].id, 'sup-1')
    assert.equal((await call(moderator, 'POST', '/support/sup-1/reply', { reply: '' })).status, 400)
    assert.equal((await call(moderator, 'POST', '/support/sup-1/reply', { reply: 'In your Library.' })).status, 200)
    const answered = await db.get("SELECT reply, status FROM support_messages WHERE id = 'sup-1'")
    assert.deepEqual(answered, { reply: 'In your Library.', status: 'answered' })

    // ---- paddle status, giveaways admin-only, audit trail
    const paddle = (await call(admin, 'GET', '/paddle')).body
    assert.match(paddle.webhookUrl, /\/api\/webhooks\/paddle$/)
    assert.equal(typeof paddle.enabled, 'boolean')
    assert.equal((await call(editor, 'POST', '/giveaways/anything/draw')).status, 403)
    const audit = (await call(admin, 'GET', '/audit-log')).body
    for (const action of ['promo.create', 'order.revoke', 'access.grant', 'access.revoke', 'support.reply']) {
      assert.ok(audit.some((e) => e.action === action && e.actorEmail === 'admin:' + (action === 'support.reply' ? 'moderator' : 'admin')), action)
    }
    const stats = (await call(editor, 'GET', '/store-stats')).body
    assert.equal(stats.orders['ai-content-creator'].count, 1)
  } finally {
    server.close()
    fs.rmSync(dbPath, { force: true })
  }
})
