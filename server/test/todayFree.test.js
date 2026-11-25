import test from 'node:test'
import assert from 'node:assert/strict'
import os from 'os'
import path from 'path'

test('Approved application: welcome letter, TODAYFREE gift later, first paid course free once', async () => {
  const dbPath = path.join(os.tmpdir(), `todayfree-${Date.now()}.sqlite`)
  Object.assign(process.env, {
    MENTOR_LAUNCH: '0',
    DATABASE_URL: '', LMS_TEST_DB: dbPath, UPLOADS_DIR: path.join(os.tmpdir(), 'todayfree-uploads'),
    JWT_SECRET: 'todayfree-test-jwt', ADMIN_JWT_SECRET: 'todayfree-test-admin',
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
  const call = (auth, method, url, body) =>
    fetch(`${base}${url}`, { method, headers: auth, body: body ? JSON.stringify(body) : undefined }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }))
  const signIn = async (email) => {
    const reg = await call(json, 'POST', '/api/auth/register', { email, password: 'SecretTest12', name: email.split('@')[0] })
    await call(json, 'POST', '/api/auth/verify-email-code', { email, code: reg.body.devCode })
    const { body } = await call(json, 'POST', '/api/auth/login', { email, password: 'SecretTest12' })
    return { ...json, Authorization: `Bearer ${body.token}` }
  }

  try {
    const admin = { ...json, Authorization: `Bearer ${(await call(json, 'POST', '/api/admin/login', { password: 'AdminTest-2026-Only!' })).body.token}` }
    const nina = await signIn('nina@example.com')
    const now = new Date().toISOString()
    await db.run(
      "INSERT INTO accelerator_applications (id, email, first_name, last_name, status, date, updated_at) VALUES ('app-1', 'nina@example.com', 'Нина', 'Демо', 'new', ?, ?)",
      [now, now]
    )

    // nothing before approval
    assert.equal((await call(nina, 'GET', '/api/me')).body.offers.todayFree, null)

    const approved = await call(admin, 'POST', '/api/admin/applications/app-1/approve', {})
    assert.equal(approved.status, 200, JSON.stringify(approved.body))

    // the welcome letter now, the gift two hours later
    const letters = await db.all('SELECT template, send_after FROM email_queue WHERE email = ? ORDER BY send_after', ['nina@example.com'])
    const welcome = letters.find((l) => l.template === 'application_accepted')
    const gift = letters.find((l) => l.template === 'todayfree_offer')
    assert.ok(welcome && gift)
    const delay = Date.parse(gift.send_after) - Date.parse(welcome.send_after)
    assert.ok(delay > 1.9 * 3600_000 && delay < 2.1 * 3600_000, `delay ${delay}`)
    const { renderTemplate } = await import('../services/emailPurchase.js')
    assert.match(renderTemplate('todayfree_offer', { code: 'TODAYFREE', to: 'nina@example.com' }).html, /TODAYFREE/)
    assert.match(renderTemplate('application_accepted', { to: 'nina@example.com' }).subject, /одобрена/)

    // the Studio lists approved people with what their letters did
    const accepted = (await call(admin, 'GET', '/api/admin/applications/accepted')).body
    const ninaRow = accepted.people.find((p) => p.email === 'nina@example.com')
    assert.ok(ninaRow.letters.application_accepted)
    assert.ok(ninaRow.letters.todayfree_offer)
    // with no SMTP in tests the letter waits in the queue, and the button says so
    const resend = await call(admin, 'POST', '/api/admin/applications/app-1/send-welcome', {})
    assert.equal(resend.status, 503)
    assert.match(resend.body.errorRu, /SMTP/)
    assert.equal((await call(admin, 'POST', '/api/admin/applications/send-missing-welcome', {})).status, 200)
    // the gift is not queued twice
    assert.equal((await db.all("SELECT id FROM email_queue WHERE template = 'todayfree_offer'")).length, 1)

    // the cabinet sees the gift
    const offer = (await call(nina, 'GET', '/api/me')).body.offers.todayFree
    assert.equal(offer.code, 'TODAYFREE')
    assert.ok(Date.parse(offer.endsAt) > Date.now() + 25 * 3600_000)

    // the code takes the paid course to zero for her, not for others, not for a free course
    let v = await call(nina, 'POST', '/api/promo/validate', { code: 'todayfree', courseId: 'ai-automation-engineer', amountEur: 29 })
    assert.equal(v.status, 200)
    assert.equal(v.body.finalEur, 0)
    const other = await signIn('omar@example.com')
    assert.equal((await call(other, 'POST', '/api/promo/validate', { code: 'TODAYFREE', courseId: 'ai-automation-engineer', amountEur: 29 })).status, 400)
    assert.equal((await call(json, 'POST', '/api/promo/validate', { code: 'TODAYFREE', courseId: 'ai-automation-engineer', amountEur: 29 })).status, 400)
    assert.equal((await call(nina, 'POST', '/api/promo/validate', { code: 'TODAYFREE', courseId: 'ai-for-productivity', amountEur: 0 })).status, 400)

    // a free order needs no payment service and opens the course at once
    const order = await call(nina, 'POST', '/api/payments/free', { courseId: 'ai-automation-engineer', plan: 'self', promoCode: 'TODAYFREE' })
    assert.equal(order.status, 200, JSON.stringify(order.body))
    const me = (await call(nina, 'GET', '/api/me')).body
    assert.equal(me.purchases.find((p) => p.id === 'ai-automation-engineer')?.plan, 'self')
    assert.equal(me.offers.todayFree, null)

    // once only
    assert.equal((await call(nina, 'POST', '/api/promo/validate', { code: 'TODAYFREE', courseId: 'ai-agent-engineer', amountEur: 29 })).status, 400)
    assert.equal((await call(nina, 'POST', '/api/payments/free', { courseId: 'ai-agent-engineer', plan: 'self', promoCode: 'TODAYFREE' })).status, 400)

    // the gift letter is skipped once it no longer applies
    const { processEmailQueue } = await import('../services/emailQueue.js')
    await db.run("UPDATE email_queue SET send_after = ? WHERE template = 'todayfree_offer'", [new Date(Date.now() - 1000).toISOString()])
    await processEmailQueue(50)
    assert.equal((await db.get("SELECT status FROM email_queue WHERE template = 'todayfree_offer'")).status, 'skipped')

    // an ordinary code that leaves something to pay is refused by the free route
    await db.run("INSERT INTO promo_codes (code, discount_percent, active, created_at) VALUES ('HALF', 50, 1, ?)", [now])
    const half = await call(other, 'POST', '/api/payments/free', { courseId: 'ai-automation-engineer', plan: 'self', promoCode: 'HALF' })
    assert.equal(half.status, 400)
    assert.equal(half.body.code, 'NOT_FREE')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
