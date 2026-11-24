import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'http'
import os from 'os'
import path from 'path'

import { normalizeSource, sourceOfVisit } from '../services/trafficSource.js'
import { addDays, weekStart, zurichDayBounds, zurichDay } from '../services/zurichTime.js'

test('traffic sources collapse to one name per platform', () => {
  assert.equal(normalizeSource('l.instagram.com'), 'instagram')
  assert.equal(normalizeSource('TikTok_bio'), 'tiktok')
  assert.equal(normalizeSource('https://t.me/aiinsider'), 'telegram')
  assert.equal(normalizeSource('www.google.de'), 'google')
  assert.equal(normalizeSource('t.co'), 'x')
  assert.equal(normalizeSource('newsletter'), 'newsletter')
  assert.equal(normalizeSource(''), '')
  assert.equal(sourceOfVisit({ referrer: 'https://myinsideracademy.com/ru/learn', ownHost: 'https://myinsideracademy.com' }), '')
  assert.equal(sourceOfVisit({ utmSource: 'yt', referrer: 'https://www.tiktok.com/@x' }), 'youtube')
  assert.equal(sourceOfVisit({ referrer: 'https://www.tiktok.com/@x' }), 'tiktok')
})

test('Zurich days cover the right UTC hours, clock changes included', () => {
  assert.deepEqual(zurichDayBounds('2026-11-24'), {
    firstDay: '2026-11-24', lastDay: '2026-11-24', from: '2026-11-23T23:00:00.000Z', to: '2026-11-24T23:00:00.000Z',
  })
  // Spring forward: 23 hours.
  const spring = zurichDayBounds('2026-03-29')
  assert.equal(spring.from, '2026-03-28T23:00:00.000Z')
  assert.equal(spring.to, '2026-03-29T22:00:00.000Z')
  // A week of summer days.
  const week = zurichDayBounds('2026-07-12', 7)
  assert.equal(week.firstDay, '2026-07-06')
  assert.equal(week.from, '2026-07-05T22:00:00.000Z')
  assert.equal(zurichDay(new Date('2026-11-24T23:30:00Z')), '2026-11-25')
  assert.equal(weekStart('2026-11-29'), '2026-11-23')
  assert.equal(weekStart('2026-11-23'), '2026-11-23')
  assert.equal(addDays('2026-03-01', -1), '2026-02-28')
})

test('admin chat: alerts for sign-ups, purchases and refunds, page views, reports and commands', async () => {
  const sent = []
  const mock = http.createServer((req, res) => {
    let raw = ''
    req.on('data', (c) => { raw += c })
    req.on('end', () => {
      res.setHeader('content-type', 'application/json')
      if (req.url.endsWith('/sendMessage')) sent.push(JSON.parse(raw))
      res.end(JSON.stringify({ ok: true, result: {} }))
    })
  })
  await new Promise((r) => mock.listen(0, r))

  const ADMIN = '-100777'
  Object.assign(process.env, {
    DATABASE_URL: '', LMS_TEST_DB: path.join(os.tmpdir(), `admin-alerts-${Date.now()}.sqlite`),
    UPLOADS_DIR: path.join(os.tmpdir(), 'admin-alerts-uploads'),
    JWT_SECRET: 'alerts-test-jwt', ADMIN_JWT_SECRET: 'alerts-test-admin', ADMIN_PASSWORD: 'AdminTest-2026-Only!',
    EDITOR_PASSWORD: 'EditorTest-2026-Only!', MODERATOR_PASSWORD: 'ModeratorTest-2026!', CORS_ORIGIN: 'http://localhost:5173',
    PRELAUNCH_MODE: '0', COURSES_PUBLIC: '1',
    TELEGRAM_BOT_TOKEN: 'test-bot-token', TELEGRAM_WEBHOOK_SECRET: '', TELEGRAM_BOT_SERVICE_URL: '',
    TELEGRAM_API_BASE: `http://127.0.0.1:${mock.address().port}`,
    TELEGRAM_ADMIN_CHAT_ID: ADMIN,
  })
  const { config } = await import('../config.js')
  config.prelaunchMode = false
  config.telegram.botToken = 'test-bot-token'
  config.telegram.botServiceUrl = ''
  config.telegram.webhookSecret = ''
  const { resetDatabase, getDb } = await import('../db/index.js')
  resetDatabase()
  const { createApp } = await import('../app.js')
  const app = await createApp()
  const server = app.listen(0)
  await new Promise((r) => server.once('listening', r))
  const base = `http://127.0.0.1:${server.address().port}`
  const json = { 'content-type': 'application/json' }
  const browser = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15'

  const toAdmin = () => sent.filter((m) => String(m.chat_id) === ADMIN)
  async function waitFor(predicate, label) {
    for (let i = 0; i < 100; i += 1) {
      const found = sent.find(predicate)
      if (found) return found
      await new Promise((r) => setTimeout(r, 20))
    }
    assert.fail(`no Telegram message: ${label}\n${JSON.stringify(sent.map((m) => m.text), null, 1)}`)
  }
  const { telegramWebhookSecret } = await import('../services/telegram.js')
  const hook = { ...json, 'x-telegram-bot-api-secret-token': telegramWebhookSecret() }
  const tgUpdate = (chat, text) => fetch(`${base}/api/telegram/webhook`, {
    method: 'POST', headers: hook,
    body: JSON.stringify({ update_id: 1, message: { message_id: 1, chat, from: { id: 5, first_name: 'Vlad' }, text } }),
  })

  try {
    // Page views: a browser counts, a crawler and the studio do not.
    const view = (body, ua = browser) => fetch(`${base}/api/seen`, {
      method: 'POST', headers: { ...json, 'user-agent': ua }, body: JSON.stringify(body),
    })
    assert.equal((await view({ path: '/ru', locale: 'ru', referrer: 'https://www.tiktok.com/@aiinsider' })).status, 204)
    assert.equal((await view({ path: '/ru/learn?x=1', locale: 'ru' })).status, 204)
    assert.equal((await view({ path: '/ru', locale: 'ru' }, 'Googlebot/2.1')).status, 204)
    assert.equal((await view({ path: '/ru/studio/courses', locale: 'ru' })).status, 204)
    assert.equal((await view({ path: 'https://evil.example/', locale: 'ru' })).status, 204)
    const rows = await getDb().all('SELECT path, source, visitor FROM page_views ORDER BY id')
    assert.deepEqual(rows.map((r) => [r.path, r.source]), [['/ru', 'tiktok'], ['/ru/learn', null]])
    assert.equal(rows[0].visitor, rows[1].visitor, 'one visitor across pages within a day')

    // Sign-up: one alert, with where they came from.
    const email = `alerts-${Date.now()}@example.com`
    const reg = await fetch(`${base}/api/auth/register`, {
      method: 'POST', headers: json,
      body: JSON.stringify({ email, password: 'SecretTest12', name: 'Alert Tester', locale: 'ru', source: 'l.instagram.com' }),
    })
    assert.equal(reg.status, 201)
    const signup = await waitFor((m) => /Новая регистрация/.test(m.text), 'registration')
    assert.equal(String(signup.chat_id), ADMIN)
    assert.match(signup.text, new RegExp(email.replace('.', '\\.')))
    assert.match(signup.text, /из instagram/)
    assert.equal((await getDb().get('SELECT source FROM registrations WHERE email = ?', [email])).source, 'instagram')

    // Purchase: the settlement path alerts once, with the running total for the day.
    const user = await getDb().get('SELECT id FROM users WHERE email = ?', [email])
    await getDb().run(
      `INSERT INTO payments (id, user_id, email, course_id, course_title, amount, currency, provider, external_id, status, created_at, plan)
       VALUES ('pay-alert-1', ?, ?, 'ai-productivity-master', 'AI Productivity Master', 29, 'EUR', 'gumroad', 'sale-1', 'pending', ?, 'mentor')`,
      [user.id, email, new Date().toISOString()]
    )
    const { reconcilePaidPayment } = await import('../services/paymentFulfillment.js')
    const settle = async () => reconcilePaidPayment({
      payment: await getDb().get("SELECT * FROM payments WHERE id = 'pay-alert-1'"),
      provider: 'gumroad', externalId: 'sale-1', userId: user.id, productId: 'ai-productivity-master', amount: 29, currency: 'EUR',
    })
    await settle()
    const purchase = await waitFor((m) => /Покупка · €29/.test(m.text), 'purchase')
    assert.match(purchase.text, /AI Productivity Master/)
    assert.match(purchase.text, /с ментором/)
    assert.match(purchase.text, /Первая покупка/)
    assert.match(purchase.text, /Пришёл из: instagram/)
    assert.match(purchase.text, /Сегодня: 1 покупка · €29/)
    await settle()
    await new Promise((r) => setTimeout(r, 100))
    assert.equal(toAdmin().filter((m) => /Покупка/.test(m.text)).length, 1, 'a repeat delivery does not alert again')

    // Commands in the admin chat.
    await tgUpdate({ id: Number(ADMIN), type: 'supergroup', title: 'Team' }, '/today@InsiderBot')
    const today = await waitFor((m) => /Сегодня ·/.test(m.text), '/today')
    assert.match(today.text, /Посетители: <b>1<\/b>/)
    const regsToday = (await getDb().get('SELECT COUNT(*) AS c FROM registrations')).c
    assert.match(today.text, new RegExp(`Регистрации: <b>${regsToday}</b>`))
    assert.match(today.text, /Покупки: <b>1<\/b> · <b>€29<\/b>/)
    assert.match(today.text, /Откуда пришли<\/b>: tiktok 1/)
    assert.match(today.text, /Регистрации из<\/b>: instagram 1/)
    assert.match(today.text, /• \/learn — 1/)

    await tgUpdate({ id: Number(ADMIN), type: 'supergroup', title: 'Team' }, '/sales')
    await waitFor((m) => /Последние 1 продажа/.test(m.text), '/sales')

    // Chatter in the team group, and strangers' groups, get no answer.
    const before = sent.length
    await tgUpdate({ id: Number(ADMIN), type: 'supergroup', title: 'Team' }, 'привет всем')
    await tgUpdate({ id: -100555, type: 'group', title: 'Other' }, 'hello')
    await new Promise((r) => setTimeout(r, 100))
    assert.equal(sent.length, before)
    await tgUpdate({ id: -100555, type: 'group', title: 'Other' }, '/chatid')
    const idReply = await waitFor((m) => String(m.chat_id) === '-100555', '/chatid')
    assert.match(idReply.text, /-100555/)
    // Without Telegram's secret the webhook is refused.
    const forged = await fetch(`${base}/api/telegram/webhook`, {
      method: 'POST', headers: json,
      body: JSON.stringify({ update_id: 2, message: { message_id: 2, chat: { id: Number(ADMIN), type: 'supergroup' }, text: '/sales' } }),
    })
    assert.equal(forged.status, 401)
    // Outside the admin chat, stats stay private.
    await tgUpdate({ id: 42, type: 'private' }, '/today')
    const privateReply = await waitFor((m) => String(m.chat_id) === '42', 'private /today')
    assert.doesNotMatch(privateReply.text, /Посетители/)

    // Refund: access closes, the team hears about it once.
    const { revokePaymentAccess } = await import('../routes/webhooks.js')
    await revokePaymentAccess(getDb(), await getDb().get("SELECT * FROM payments WHERE id = 'pay-alert-1'"), 'gumroad:refund')
    const refund = await waitFor((m) => /Возврат/.test(m.text), 'refund')
    assert.match(refund.text, /€29/)

    // The daily report goes out once, after 09:00 Zurich.
    const { runAdminDigests } = await import('../services/adminDigest.js')
    const day = zurichDay()
    const count = () => toAdmin().filter((m) => /📊 <b>Вчера/.test(m.text)).length
    await runAdminDigests(new Date(`${day}T05:00:00Z`)) // 06:00 or 07:00 in Zurich
    assert.equal(count(), 0)
    await runAdminDigests(new Date(`${day}T10:00:00Z`))
    await runAdminDigests(new Date(`${day}T10:10:00Z`))
    assert.equal(count(), 1)
  } finally {
    server.close()
    mock.close()
  }
})
