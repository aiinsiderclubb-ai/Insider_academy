import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'

function setupTestEnv(dbPath) {
  process.env.DATABASE_URL = ''
  process.env.LMS_TEST_DB = dbPath
  process.env.UPLOADS_DIR = path.join(os.tmpdir(), 'lms-email-uploads')
  process.env.JWT_SECRET = 'test-jwt-secret'
  process.env.ADMIN_JWT_SECRET = 'test-admin-jwt'
  process.env.ADMIN_PASSWORD = 'AdminTest-2026-Only!'
  process.env.EDITOR_PASSWORD = 'EditorTest-2026-Only!'
  process.env.MODERATOR_PASSWORD = 'ModeratorTest-2026!'
  process.env.PRELAUNCH_MODE = '1'
  process.env.APP_URL = 'https://myinsideracademy.com'
}

test('email templates render kit, locales and unsubscribe', async () => {
  setupTestEnv(path.join(os.tmpdir(), `lms-email-render-${Date.now()}.sqlite`))
  const { renderEmail } = await import('../services/emailRender.js')
  const { MARKETING_TEMPLATES } = await import('../services/emailCopy.js')

  const verify = renderEmail('verify_code', {
    to: 'ada@example.com',
    name: 'Ada',
    code: '482193',
    locale: 'ru',
  })
  assert.match(verify.subject, /482193/)
  assert.match(verify.html, /AI Insider/)
  assert.match(verify.html, /482193/)
  assert.match(verify.html, /#ffffff/)
  assert.equal(verify.marketing, false)
  assert.equal(verify.headers, undefined)

  const welcome = renderEmail('welcome_1', { to: 'ada@example.com', name: 'Ada', locale: 'en' })
  assert.equal(welcome.marketing, true)
  assert.match(welcome.subject, /AI Insider Academy/)
  assert.match(welcome.html, /unsubscribe/)
  assert.ok(welcome.headers['List-Unsubscribe'])

  const uk = renderEmail('password_reset', { to: 'ada@example.com', token: 'abc', locale: 'ukr' })
  assert.match(uk.html, /Скидання|парол/i)
  assert.match(uk.html, /\/ukr\/reset-password/)

  const prelaunch = renderEmail('welcome_3', { to: 'ada@example.com', locale: 'ru', prelaunch: true })
  assert.match(prelaunch.html, /предстарте|каталог/i)

  const miss = renderEmail('inactive_7d', {
    to: 'ada@example.com',
    name: 'Ada',
    locale: 'ru',
    courseTitle: 'AI Agent Engineer',
    lessonTitle: 'Первый агент',
  })
  assert.match(miss.subject, /соскучились/i)
  assert.match(miss.html, /Первый агент/)

  for (const id of MARKETING_TEMPLATES) {
    const rendered = renderEmail(id, { to: 'ada@example.com', locale: 'ru' })
    assert.equal(rendered.marketing, true)
  }

  const accessRu = renderEmail('access_granted', {
    to: 'ada@example.com',
    name: 'Ada',
    locale: 'ru',
    courseTitle: 'AI Productivity Master',
    courseSlug: 'ai-productivity-master',
  })
  assert.match(accessRu.html, /той же почтой/)
  assert.match(accessRu.text, /той же почтой/)
  assert.match(accessRu.html, /\/learn\/ai-productivity-master/)

  const accessEn = renderEmail('access_granted', {
    to: 'ada@example.com',
    locale: 'en',
    courseTitle: 'AI Productivity Master',
    courseSlug: 'ai-productivity-master',
  })
  assert.match(accessEn.html, /same email you paid with/)

  const accessUk = renderEmail('access_granted', {
    to: 'ada@example.com',
    locale: 'ukr',
    courseTitle: 'AI Productivity Master',
    courseSlug: 'ai-productivity-master',
  })
  assert.match(accessUk.html, /тією ж поштою/)

  assert.throws(() => renderEmail('nope', { to: 'a@b.c' }))
})

test('unsubscribe token round-trip and welcome stop conditions', async () => {
  const tmpDb = path.join(os.tmpdir(), `lms-email-q-${Date.now()}.sqlite`)
  setupTestEnv(tmpDb)

  const { resetDatabase, initDatabase, getDb } = await import('../db/index.js')
  resetDatabase()
  await initDatabase()
  const db = getDb()

  const { signUnsubscribeToken, readUnsubscribeToken, recordUnsubscribe, isUnsubscribed } = await import('../services/emailUnsub.js')
  const token = signUnsubscribeToken('Ada@Example.com')
  assert.equal(readUnsubscribeToken(token), 'ada@example.com')
  assert.equal(readUnsubscribeToken('bad'), null)
  assert.equal(await isUnsubscribed('ada@example.com'), false)
  await recordUnsubscribe('Ada@Example.com')
  assert.equal(await isUnsubscribed('ada@example.com'), true)

  await db.run(
    "INSERT INTO users (email, password_hash, name, locale, email_verified) VALUES (?, ?, ?, ?, 1)",
    ['learner@example.com', 'x', 'Learner', 'ru']
  )
  const { scheduleWelcomeSeries, processEmailQueue } = await import('../services/emailQueue.js')
  const ids = await scheduleWelcomeSeries('learner@example.com', 'Learner', 'ru')
  assert.equal(ids.length, 3)
  const queued = await db.all("SELECT template, status FROM email_queue WHERE email = 'learner@example.com' ORDER BY template")
  assert.deepEqual(queued.map((row) => row.template), ['welcome_1', 'welcome_2', 'welcome_3'])

  const again = await scheduleWelcomeSeries('learner@example.com', 'Learner', 'ru')
  assert.deepEqual(again, [])

  await db.run("UPDATE users SET last_login_at = ? WHERE email = ?", [new Date().toISOString(), 'learner@example.com'])
  await db.run("UPDATE email_queue SET send_after = ? WHERE template = 'welcome_2'", [new Date(Date.now() - 1000).toISOString()])
  const result = await processEmailQueue(20)
  assert.ok(result.skipped >= 1)
  const welcome2 = await db.get("SELECT status, error FROM email_queue WHERE template = 'welcome_2'")
  assert.equal(welcome2.status, 'skipped')
  assert.equal(welcome2.error, 'already_active')

  fs.unlinkSync(tmpDb)
})

test('email HTTP: preview, unsubscribe and welcome queue', async (t) => {
  const tmpDb = path.join(os.tmpdir(), `lms-email-http-${Date.now()}.sqlite`)
  setupTestEnv(tmpDb)
  const { resetDatabase } = await import('../db/index.js')
  resetDatabase()
  const { createApp } = await import('../app.js')
  const app = await createApp()
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance))
    instance.once('error', reject)
  })
  const base = `http://127.0.0.1:${server.address().port}`
  t.after(() => new Promise((resolve) => { server.close(resolve); fs.unlinkSync(tmpDb) }))

  const email = `mail-${Date.now()}@example.com`
  const reg = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'SecretTest12', name: 'Mail User', locale: 'en' }),
  })
  assert.equal(reg.status, 201)
  const { devCode } = await reg.json()
  const verify = await fetch(`${base}/api/auth/verify-email-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code: devCode }),
  })
  assert.equal(verify.status, 200)

  const admin = await fetch(`${base}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'AdminTest-2026-Only!' }),
  }).then((r) => r.json())

  const overview = await fetch(`${base}/api/admin/email/overview`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  }).then((r) => r.json())
  assert.equal(overview.counts.pending, 3)
  assert.ok(overview.templates.some((item) => item.id === 'welcome_2'))

  const preview = await fetch(`${base}/api/admin/email/preview?template=inactive_7d&locale=ru`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  }).then((r) => r.json())
  assert.match(preview.html, /AI Insider/)
  assert.match(preview.subject, /соскучились/i)
  assert.match(preview.html, /не хватает/)

  const { signUnsubscribeToken } = await import('../services/emailUnsub.js')
  const unsub = await fetch(`${base}/api/email/unsubscribe?token=${encodeURIComponent(signUnsubscribeToken(email))}`)
  assert.equal(unsub.status, 200)
  assert.match(await unsub.text(), /unsubscribed|отписк/i)

  const { getDb } = await import('../db.js')
  const user = await getDb().get('SELECT locale FROM users WHERE email = ?', [email])
  assert.equal(user.locale, 'en')
})
