import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'

const SECRET = 'pdl_ntfset_plans_secret'
const sign = (body, ts = Math.floor(Date.now() / 1000)) =>
  `ts=${ts};h1=${crypto.createHmac('sha256', SECRET).update(`${ts}:${body}`).digest('hex')}`

test('Course plans: self-study is cheaper and has no review; moving up to the mentor plan costs the difference', async () => {
  const created = []
  const mock = http.createServer((req, res) => {
    let raw = ''
    req.on('data', (c) => { raw += c })
    req.on('end', () => {
      res.setHeader('content-type', 'application/json')
      if (req.method === 'GET' && req.url.startsWith('/products')) {
        return res.end(JSON.stringify({ data: [{ id: 'pro_pm', custom_data: { item_id: 'ai-productivity-master' } }], meta: { pagination: { has_more: false } } }))
      }
      if (req.method === 'POST' && req.url === '/transactions') {
        const body = JSON.parse(raw)
        created.push(body)
        return res.end(JSON.stringify({ data: { id: `txn_plan_${created.length}`, status: 'ready', ...body } }))
      }
      res.statusCode = 404
      res.end('{}')
    })
  })
  await new Promise((r) => mock.listen(0, r))

  const dbPath = path.join(os.tmpdir(), `plans-${Date.now()}.sqlite`)
  Object.assign(process.env, {
    MENTOR_LAUNCH: '0',
    DATABASE_URL: '',
    LMS_TEST_DB: dbPath,
    UPLOADS_DIR: path.join(os.tmpdir(), 'plans-test-uploads'),
    JWT_SECRET: 'plans-test-jwt',
    ADMIN_JWT_SECRET: 'plans-test-admin',
    ADMIN_PASSWORD: 'AdminTest-2026-Only!',
    EDITOR_PASSWORD: 'EditorTest-2026-Only!',
    MODERATOR_PASSWORD: 'ModeratorTest-2026!',
    CORS_ORIGIN: 'http://localhost:5173',
    PRELAUNCH_MODE: '0',
    COURSES_PUBLIC: '1',
    PADDLE_API_KEY: 'pdl_sdbx_apikey_test',
    PADDLE_WEBHOOK_SECRET: SECRET,
    PADDLE_API_BASE: `http://127.0.0.1:${mock.address().port}`,
  })
  const { config } = await import('../config.js')
  Object.assign(config.paddle, { apiKey: 'pdl_sdbx_apikey_test', webhookSecret: SECRET })
  config.prelaunchMode = false

  const { resetDatabase, getDb } = await import('../db/index.js')
  resetDatabase()
  const { resetPaddleCache } = await import('../services/paddle.js')
  resetPaddleCache()
  const { createApp } = await import('../app.js')
  const app = await createApp()
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)) })
  const base = `http://127.0.0.1:${server.address().port}`
  const json = { 'Content-Type': 'application/json' }

  const signIn = async (name) => {
    const email = `${name}-${Date.now()}@example.com`
    const reg = await fetch(`${base}/api/auth/register`, { method: 'POST', headers: json, body: JSON.stringify({ email, password: 'SecretTest12', name }) }).then((r) => r.json())
    await fetch(`${base}/api/auth/verify-email-code`, { method: 'POST', headers: json, body: JSON.stringify({ email, code: reg.devCode }) })
    const { token } = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: json, body: JSON.stringify({ email, password: 'SecretTest12' }) }).then((r) => r.json())
    return { ...json, Authorization: `Bearer ${token}` }
  }
  const call = async (auth, method, url, body) => {
    const res = await fetch(`${base}${url}`, { method, headers: auth, body: body ? JSON.stringify(body) : undefined })
    return { status: res.status, body: await res.json().catch(() => null) }
  }
  const db = getDb()
  const settle = async (transactionId) => {
    const payment = await db.get("SELECT * FROM payments WHERE provider = 'paddle' AND external_id = ?", [transactionId])
    const body = JSON.stringify({
      event_type: 'transaction.completed',
      data: {
        id: transactionId, status: 'completed', currency_code: 'EUR',
        custom_data: { payment_id: payment.id, user_id: String(payment.user_id), item_id: payment.course_id },
        details: { totals: { grand_total: String(Math.round(payment.amount * 100)) } },
      },
    })
    const res = await fetch(`${base}/api/webhooks/paddle`, { method: 'POST', headers: { ...json, 'Paddle-Signature': sign(body) }, body })
    assert.equal(res.status, 200)
  }
  const planOf = async (auth) => (await call(auth, 'GET', '/api/me')).body.purchases.find((p) => p.id === 'ai-productivity-master')?.plan
  const submit = (auth) => call(auth, 'POST', '/api/me/homework', { courseId: 'ai-productivity-master', courseTitle: 'AI Productivity Master', lessonIndex: 2, lessonTitle: 'Lesson 3', content: 'done' })

  try {
    const sam = await signIn('sam')

    // the self-study plan is the default and costs the list price
    const own = await call(sam, 'POST', '/api/payments/paddle/checkout', { courseId: 'ai-productivity-master' })
    assert.equal(own.status, 200, JSON.stringify(own.body))
    assert.equal(own.body.amount, 19)
    assert.equal(own.body.plan, 'self')
    await settle(own.body.transactionId)
    assert.equal(await planOf(sam), 'self')

    // no review on the self-study plan, and it cannot be bought twice
    const refused = await submit(sam)
    assert.equal(refused.status, 403)
    assert.equal(refused.body.code, 'PLAN_NO_REVIEW')
    assert.equal((await call(sam, 'POST', '/api/payments/paddle/checkout', { courseId: 'ai-productivity-master', plan: 'self' })).status, 409)

    // moving up charges only the difference, and opens review
    const up = await call(sam, 'POST', '/api/payments/paddle/checkout', { courseId: 'ai-productivity-master', plan: 'mentor' })
    assert.equal(up.status, 200, JSON.stringify(up.body))
    assert.equal(up.body.amount, 20)
    assert.equal(up.body.plan, 'mentor')
    assert.match(created.at(-1).items[0].price.name, /с ментором/)
    await settle(up.body.transactionId)
    assert.equal(await planOf(sam), 'mentor')
    assert.equal((await submit(sam)).status, 200)
    assert.equal((await call(sam, 'POST', '/api/payments/paddle/checkout', { courseId: 'ai-productivity-master', plan: 'mentor' })).status, 409)

    // bought outright, the mentor plan is about twice the self-study price
    const mia = await signIn('mia')
    const direct = await call(mia, 'POST', '/api/payments/paddle/checkout', { courseId: 'ai-productivity-master', plan: 'mentor' })
    assert.equal(direct.body.amount, 39)
    assert.equal(created.at(-1).items[0].price.unit_price.amount, '3900')

    // a course that came before plans keeps its review
    const lee = await signIn('lee')
    const leeId = (await call(lee, 'GET', '/api/me')).body.user.id
    await db.run('INSERT INTO purchases (user_id, course_id, payment_provider) VALUES (?, ?, ?)', [leeId, 'ai-productivity-master', 'admin'])
    assert.equal(await planOf(lee), 'mentor')
    assert.equal((await submit(lee)).status, 200)

    // ---- the launch window: the mentor plan costs what self-study does
    const { mentorLaunch, MENTOR_LAUNCH } = await import('../services/launchSale.js')
    delete process.env.MENTOR_LAUNCH
    assert.equal(mentorLaunch(Date.parse(MENTOR_LAUNCH.startsAt) - 1), null)
    assert.ok(mentorLaunch(Date.parse(MENTOR_LAUNCH.startsAt)))
    assert.equal(mentorLaunch(Date.parse(MENTOR_LAUNCH.endsAt)), null)
    assert.equal(Date.parse(MENTOR_LAUNCH.endsAt) - Date.parse(MENTOR_LAUNCH.startsAt), 72 * 3600 * 1000)

    process.env.MENTOR_LAUNCH = '1'
    assert.equal((await call(json, 'GET', '/api/payments/offers')).body.mentorAtSelfPrice.endsAt, MENTOR_LAUNCH.endsAt)
    const ivy = await signIn('ivy')
    const launchMentor = await call(ivy, 'POST', '/api/payments/paddle/checkout', { courseId: 'ai-productivity-master', plan: 'mentor' })
    assert.equal(launchMentor.body.amount, 19)
    assert.equal(launchMentor.body.plan, 'mentor')

    // someone already on self-study moves up for nothing
    const kai = await signIn('kai')
    const kaiSelf = await call(kai, 'POST', '/api/payments/paddle/checkout', { courseId: 'ai-productivity-master', plan: 'self' })
    await settle(kaiSelf.body.transactionId)
    assert.equal(await planOf(kai), 'self')
    const free = await call(kai, 'POST', '/api/payments/plan-upgrade', { courseId: 'ai-productivity-master' })
    assert.equal(free.status, 200, JSON.stringify(free.body))
    assert.equal(await planOf(kai), 'mentor')
    assert.equal((await submit(kai)).status, 200)
    assert.equal((await call(kai, 'POST', '/api/payments/plan-upgrade', { courseId: 'ai-productivity-master' })).status, 409)

    process.env.MENTOR_LAUNCH = '0'
    assert.equal((await call(json, 'GET', '/api/payments/offers')).body.mentorAtSelfPrice, null)
    const late = await signIn('late')
    const lateSelf = await call(late, 'POST', '/api/payments/paddle/checkout', { courseId: 'ai-productivity-master', plan: 'self' })
    await settle(lateSelf.body.transactionId)
    const ended = await call(late, 'POST', '/api/payments/plan-upgrade', { courseId: 'ai-productivity-master' })
    assert.equal(ended.status, 409)
    assert.equal(ended.body.code, 'OFFER_ENDED')
  } finally {
    server.close()
    mock.close()
    fs.rmSync(dbPath, { force: true })
  }
})
