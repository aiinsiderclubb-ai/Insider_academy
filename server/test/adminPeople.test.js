import test from 'node:test'
import assert from 'node:assert/strict'
import os from 'os'
import path from 'path'

test('Studio people tools: personal promo codes, temporary password, login log, mail, referrals, plans, free views', async () => {
  const dbPath = path.join(os.tmpdir(), `people-${Date.now()}.sqlite`)
  Object.assign(process.env, {
    DATABASE_URL: '', LMS_TEST_DB: dbPath, UPLOADS_DIR: path.join(os.tmpdir(), 'people-uploads'),
    JWT_SECRET: 'people-test-jwt', ADMIN_JWT_SECRET: 'people-test-admin',
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

  const adminLogin = async (password) => {
    const r = await fetch(`${base}/api/admin/login`, { method: 'POST', headers: json, body: JSON.stringify({ password }) }).then((x) => x.json())
    return { ...json, Authorization: `Bearer ${r.token}` }
  }
  const call = (auth, method, url, body) =>
    fetch(`${base}${url}`, { method, headers: auth, body: body ? JSON.stringify(body) : undefined }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }))

  try {
    const admin = await adminLogin('AdminTest-2026-Only!')
    const moderator = await adminLogin('ModeratorTest-2026!')
    const bcrypt = (await import('bcryptjs')).default
    const hash = bcrypt.hashSync('Original-pass-1', 4)
    await db.run("INSERT INTO users (email, password_hash, name, email_verified, personal_id) VALUES ('anna@example.com', ?, 'Anna', 1, 'AIA-ANNA01')", [hash])
    await db.run("INSERT INTO users (email, password_hash, name, email_verified, personal_id) VALUES ('boris@example.com', ?, 'Boris', 1, 'AIA-BORI01')", [hash])
    await db.run("INSERT INTO users (email, password_hash, name, email_verified, personal_id) VALUES ('vera@example.com', ?, 'Vera', 1, 'AIA-VERA01')", [hash])
    const anna = await db.get("SELECT id FROM users WHERE email = 'anna@example.com'")
    const boris = await db.get("SELECT id FROM users WHERE email = 'boris@example.com'")

    // ---- logins are recorded with the account id
    let r = await call(json, 'POST', '/api/auth/login', { email: 'anna@example.com', password: 'Original-pass-1' })
    assert.equal(r.status, 200)
    const annaToken = r.body.token
    const logins = (await call(moderator, 'GET', `/api/admin/logins?userId=${anna.id}`)).body
    assert.equal(logins.logins.length, 1)
    assert.equal(logins.logins[0].email, 'anna@example.com')
    assert.equal(logins.logins[0].personalId, 'AIA-ANNA01')
    assert.equal(logins.logins[0].method, 'password')
    assert.equal(logins.last24h.people, 1)
    const card = (await call(admin, 'GET', `/api/admin/users/${anna.id}`)).body
    assert.equal(card.logins.length, 1)

    // ---- personal promo code: by id and by email, nobody else can use it
    r = await call(admin, 'POST', '/api/admin/promo-codes', { code: 'ANNA30', discountPercent: 30, recipients: `${anna.id}, nobody@example.com` })
    assert.equal(r.status, 400)
    assert.deepEqual(r.body.unknown, ['nobody@example.com'])
    r = await call(admin, 'POST', '/api/admin/promo-codes', { code: 'ANNA30', discountPercent: 30, recipients: `${anna.id}\nAIA-BORI01`, notify: true })
    assert.equal(r.status, 201)
    assert.equal(r.body.recipients, 2)
    const listed = (await call(admin, 'GET', '/api/admin/promo-codes')).body.find((c) => c.code === 'ANNA30')
    assert.equal(listed.kind, 'personal')
    assert.deepEqual(listed.recipients.map((x) => x.email).sort(), ['anna@example.com', 'boris@example.com'])
    const { validatePromoCode } = await import('../services/promoCodes.js')
    assert.equal((await validatePromoCode({ code: 'ANNA30', courseId: 'x', amountEur: 10, userId: anna.id })).valid, true)
    assert.equal((await validatePromoCode({ code: 'ANNA30', courseId: 'x', amountEur: 10, email: 'boris@example.com' })).valid, true)
    assert.equal((await validatePromoCode({ code: 'ANNA30', courseId: 'x', amountEur: 10, email: 'vera@example.com' })).valid, false)
    assert.equal((await validatePromoCode({ code: 'ANNA30', courseId: 'x', amountEur: 10 })).valid, false)
    const promoMail = await db.all("SELECT email FROM email_queue WHERE template = 'personal_promo'")
    assert.equal(promoMail.length, 2)

    // ---- temporary password: signs the person out, works, flags the account until changed
    assert.equal((await call(moderator, 'POST', `/api/admin/users/${anna.id}/temporary-password`, {})).status, 403)
    assert.equal((await call(admin, 'POST', `/api/admin/users/${anna.id}/temporary-password`, { password: 'short1' })).status, 400)
    r = await call(admin, 'POST', `/api/admin/users/${anna.id}/temporary-password`, {})
    assert.equal(r.status, 200)
    const temp = r.body.password
    assert.ok(temp.length >= 10 && /\d/.test(temp))
    assert.equal((await call({ ...json, Authorization: `Bearer ${annaToken}` }, 'GET', '/api/me')).status, 401)
    r = await call(json, 'POST', '/api/auth/login', { email: 'anna@example.com', password: temp })
    assert.equal(r.status, 200)
    const annaAuth = { ...json, Authorization: `Bearer ${r.body.token}` }
    assert.equal((await call(annaAuth, 'GET', '/api/me')).body.user.passwordTemporary, true)
    assert.equal((await call(admin, 'GET', `/api/admin/users/${anna.id}`)).body.passwordTemporary, true)
    r = await call(annaAuth, 'PATCH', '/api/me/password', { currentPassword: temp, newPassword: 'Annas-own-pass-2' })
    assert.equal(r.status, 200)
    assert.equal(r.body.user.passwordTemporary, false)
    // The change signs out other sessions but hands this one a fresh token.
    assert.equal((await call(annaAuth, 'GET', '/api/me')).status, 401)
    assert.equal((await call({ ...json, Authorization: `Bearer ${r.body.token}` }, 'GET', '/api/me')).status, 200)
    // Learner search finds an account by its numeric id.
    const byId = (await call(moderator, 'GET', `/api/admin/users?q=${anna.id}`)).body.users
    assert.ok(byId.some((u) => u.id === anna.id))

    // ---- plans on the learner card and in mail segments
    const pay = (id, userId, email, course, plan) => db.run(
      "INSERT INTO payments (id, user_id, email, course_id, course_title, amount, currency, provider, external_id, status, created_at, completed_at, plan) VALUES (?, ?, ?, ?, ?, 19, 'EUR', 'demo', ?, 'completed', ?, ?, ?)",
      [id, userId, email, course, course, id, new Date().toISOString(), new Date().toISOString(), plan]
    )
    await pay('pa', anna.id, 'anna@example.com', 'ai-productivity-master', 'self')
    await pay('pb', boris.id, 'boris@example.com', 'ai-productivity-master', 'mentor')
    await db.run("INSERT INTO purchases (user_id, course_id, payment_provider, payment_id) VALUES (?, 'ai-productivity-master', 'demo', 'pa')", [anna.id])
    await db.run("INSERT INTO purchases (user_id, course_id, payment_provider, payment_id) VALUES (?, 'ai-productivity-master', 'demo', 'pb')", [boris.id])
    assert.equal((await call(admin, 'GET', `/api/admin/users/${anna.id}`)).body.purchases[0].plan, 'self')
    assert.equal((await call(admin, 'GET', `/api/admin/users/${boris.id}`)).body.purchases[0].plan, 'mentor')

    // ---- homework carries the plan
    await db.run(
      "INSERT INTO homework (id, email, name, course_id, course_title, lesson_index, lesson_title, content, status, date, updated_at) VALUES ('hw1', 'boris@example.com', 'Boris', 'ai-productivity-master', 'PM', 0, 'L1', 'my work', 'pending', ?, ?)",
      [new Date().toISOString(), new Date().toISOString()]
    )
    const dashboard = (await call(moderator, 'GET', '/api/admin/dashboard')).body
    const hw = dashboard.homework.find((h) => h.id === 'hw1')
    assert.equal(hw.plan, 'mentor')
    assert.equal(hw.userId, boris.id)

    // ---- mail: count first, then queue; segments by plan
    r = await call(admin, 'POST', '/api/admin/email/send', { segment: 'mentor', courseId: 'ai-productivity-master', dryRun: true })
    // The seeded test account owns the course with no plan on record: that counts as mentor.
    assert.ok(r.body.preview.includes('boris@example.com'))
    assert.ok(!r.body.preview.includes('anna@example.com'))
    r = await call(admin, 'POST', '/api/admin/email/send', { segment: 'self', dryRun: true })
    assert.deepEqual(r.body.preview, ['anna@example.com'])
    r = await call(admin, 'POST', '/api/admin/email/send', { segment: 'list', recipients: `${boris.id} guest@example.org AIA-VERA01 ???`, dryRun: true })
    assert.equal(r.body.count, 3)
    assert.deepEqual(r.body.unknown, ['???'])
    assert.equal((await call(admin, 'POST', '/api/admin/email/send', { segment: 'list', recipients: 'vera@example.com' })).status, 400)
    r = await call(admin, 'POST', '/api/admin/email/send', { segment: 'list', recipients: 'vera@example.com', subject: 'Привет', body: 'Первый абзац.\n\nВторой.', ctaLabel: 'Открыть', ctaUrl: '/learn' })
    assert.equal(r.status, 200)
    assert.equal(r.body.queued, 1)
    const { renderTemplate } = await import('../services/emailPurchase.js')
    const rendered = renderTemplate('admin_message', { subject: 'Привет', body: 'Первый абзац.\n\nВторой.', name: 'Vera', to: 'vera@example.com' })
    assert.equal(rendered.subject, 'Привет')
    assert.match(rendered.html, /Второй\./)
    assert.equal(rendered.marketing, false)
    assert.equal(renderTemplate('admin_news', { subject: 'Новости', body: 'x', to: 'vera@example.com' }).marketing, true)
    const sent = (await call(admin, 'GET', '/api/admin/email/sent')).body.letters
    assert.ok(sent.some((l) => l.email === 'vera@example.com' && l.subject === 'Привет'))
    assert.equal((await call(moderator, 'POST', '/api/admin/email/send', { segment: 'all', dryRun: true })).status, 403)

    // ---- referrals: link by hand, list, unlink
    r = await call(admin, 'POST', '/api/admin/referrals', { referrer: 'AIA-ANNA01', referred: 'vera@example.com' })
    assert.equal(r.status, 201)
    assert.equal((await call(admin, 'POST', '/api/admin/referrals', { referrer: 'boris@example.com', referred: 'vera@example.com' })).status, 409)
    assert.equal((await call(admin, 'POST', '/api/admin/referrals', { referrer: 'anna@example.com', referred: 'anna@example.com' })).status, 400)
    let list = (await call(admin, 'GET', '/api/admin/referrals/list')).body.referrals
    assert.equal(list.length, 1)
    assert.equal(list[0].referrerEmail, 'anna@example.com')
    assert.equal(list[0].referredEmail, 'vera@example.com')
    assert.equal(list[0].purchased, false)
    assert.equal((await call(admin, 'DELETE', `/api/admin/referrals/${list[0].id}`)).status, 200)
    list = (await call(admin, 'GET', '/api/admin/referrals/list')).body.referrals
    assert.equal(list.length, 0)

    // ---- free-course views
    const day = new Date().toISOString().slice(0, 10)
    const view = (pathName, visitor, userId = null) => db.run(
      'INSERT INTO page_views (day, created_at, path, visitor, source, locale, user_id) VALUES (?, ?, ?, ?, NULL, ?, ?)',
      [day, new Date().toISOString(), pathName, visitor, 'ru', userId]
    )
    await view('/ru/study/ai-start/1', 'v1')
    await view('/ru/study/ai-start/2', 'v1')
    await view('/ru/study/ai-start/1', 'v2', boris.id)
    await view('/ru/study/ai-productivity-master/1', 'v3')
    const free = (await call(moderator, 'GET', '/api/admin/free-views?days=7')).body
    const start = free.free.find((c) => c.id === 'ai-start')
    assert.equal(start.visitors, 2)
    assert.equal(start.views, 3)
    assert.equal(start.accounts, 1)
    assert.equal(free.demos.find((c) => c.id === 'ai-productivity-master').visitors, 1)
    assert.deepEqual(free.people.map((p) => p.email), ['boris@example.com'])
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
