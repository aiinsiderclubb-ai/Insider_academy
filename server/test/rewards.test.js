import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'

const SECRET = 'pdl_ntfset_rewards_secret'
const sign = (body) => {
  const ts = Math.floor(Date.now() / 1000)
  return `ts=${ts};h1=${crypto.createHmac('sha256', SECRET).update(`${ts}:${body}`).digest('hex')}`
}

test('referral 10% for the friend, 15% for the inviter after the refund window, 15% next-purchase code; refunds cancel them', async () => {
  const created = []
  const mock = http.createServer((req, res) => {
    let raw = ''
    req.on('data', (c) => { raw += c })
    req.on('end', () => {
      res.setHeader('content-type', 'application/json')
      if (req.method === 'GET' && req.url.startsWith('/products')) {
        return res.end(JSON.stringify({ data: [{ id: 'pro_course', custom_data: { item_id: 'ai-productivity-master' } }, { id: 'pro_course2', custom_data: { item_id: 'ai-content-creator' } }], meta: { pagination: { has_more: false } } }))
      }
      if (req.method === 'POST' && req.url === '/transactions') {
        const body = JSON.parse(raw)
        created.push(body)
        return res.end(JSON.stringify({ data: { id: `txn_r${created.length}`, ...body } }))
      }
      res.statusCode = 404
      res.end('{}')
    })
  })
  await new Promise((r) => mock.listen(0, r))

  const dbPath = path.join(os.tmpdir(), `rewards-${Date.now()}.sqlite`)
  Object.assign(process.env, {
    DATABASE_URL: '', LMS_TEST_DB: dbPath, UPLOADS_DIR: path.join(os.tmpdir(), 'rewards-uploads'),
    JWT_SECRET: 'rewards-test-jwt', ADMIN_JWT_SECRET: 'rewards-test-admin', ADMIN_PASSWORD: 'AdminTest-2026-Only!',
    EDITOR_PASSWORD: 'EditorTest-2026-Only!', MODERATOR_PASSWORD: 'ModeratorTest-2026!', CORS_ORIGIN: 'http://localhost:5173',
    PRELAUNCH_MODE: '0', COURSES_PUBLIC: '1', PADDLE_API_KEY: 'pdl_sdbx_apikey_test', PADDLE_WEBHOOK_SECRET: SECRET,
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

  async function user(name) {
    const email = `${name}-${Date.now()}@example.com`
    const reg = await fetch(`${base}/api/auth/register`, { method: 'POST', headers: json, body: JSON.stringify({ email, password: 'SecretTest12', name }) }).then((r) => r.json())
    await fetch(`${base}/api/auth/verify-email-code`, { method: 'POST', headers: json, body: JSON.stringify({ email, code: reg.devCode }) })
    const { token } = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: json, body: JSON.stringify({ email, password: 'SecretTest12' }) }).then((r) => r.json())
    return { email, auth: { ...json, Authorization: `Bearer ${token}` } }
  }
  const call = (who, method, url, body) => fetch(`${base}${url}`, { method, headers: who.auth, body: body ? JSON.stringify(body) : undefined }).then(async (r) => ({ status: r.status, body: await r.json() }))
  const db = getDb()
  const settle = async (transactionId) => {
    const payment = await db.get("SELECT * FROM payments WHERE external_id = ?", [transactionId])
    const event = { event_type: 'transaction.completed', data: { id: transactionId, status: 'completed', currency_code: 'EUR', custom_data: { user_id: String(payment.user_id), item_id: payment.course_id }, details: { totals: { grand_total: String(Math.round(payment.amount * 100)) } } } }
    const body = JSON.stringify(event)
    const res = await fetch(`${base}/api/webhooks/paddle`, { method: 'POST', headers: { ...json, 'Paddle-Signature': sign(body) }, body })
    assert.equal(res.status, 200)
    return payment
  }

  try {
    const anna = await user('anna')
    const boris = await user('boris')
    const annaRewards = (await call(anna, 'GET', '/api/me/rewards')).body
    assert.match(annaRewards.referralCode, /^[A-Z0-9-]{4,}$/)

    // nobody refers themselves
    const self = await call(anna, 'POST', '/api/me/referral', { referralCode: annaRewards.referralCode })
    assert.equal(self.body.attached, false)

    // Boris arrives by Anna's link and pays 10% less on his first purchase
    const first = await call(boris, 'POST', '/api/payments/paddle/checkout', { courseId: 'ai-productivity-master', referralCode: annaRewards.referralCode })
    assert.equal(first.status, 200, JSON.stringify(first.body))
    assert.equal(first.body.amount, 26.1)
    assert.deepEqual(first.body.discount, { kind: 'referral', eur: 2.9, percent: 10 })
    assert.equal(created.at(-1).items[0].price.unit_price.amount, '2610')
    const firstPayment = await settle(first.body.transactionId)

    // Boris now holds a 15% next-purchase code; Anna a 15% code that waits out the refund window
    const borisRewards = (await call(boris, 'GET', '/api/me/rewards')).body
    const next = borisRewards.codes.find((c) => c.kind === 'next')
    assert.equal(next.percent, 15)
    assert.equal(next.status, 'active')
    assert.equal(borisRewards.friendDiscount, 0)
    const annaAfter = (await call(anna, 'GET', '/api/me/rewards')).body
    assert.equal(annaAfter.invited, 1)
    assert.equal(annaAfter.purchased, 1)
    const inviter = annaAfter.codes.find((c) => c.kind === 'referrer')
    assert.equal(inviter.percent, 15)
    assert.equal(inviter.status, 'pending')
    const daysAway = (new Date(inviter.validFrom).getTime() - Date.now()) / 86400000
    assert.ok(daysAway > 13.9 && daysAway < 14.1)
    const tooEarly = await call(anna, 'POST', '/api/payments/paddle/checkout', { courseId: 'ai-content-creator', promoCode: inviter.code })
    assert.equal(tooEarly.status, 400)

    // the friend discount was for the first purchase only; the next-purchase code works instead
    const second = await call(boris, 'POST', '/api/payments/paddle/checkout', { courseId: 'ai-content-creator', referralCode: annaRewards.referralCode, promoCode: next.code })
    assert.equal(second.status, 200, JSON.stringify(second.body))
    assert.equal(second.body.discount.kind, 'promo')
    assert.equal(second.body.amount, Math.round(second.body.baseAmount * 0.85 * 100) / 100)

    // the biggest single discount wins: a 50% campaign code beats the friend's 10%
    const carla = await user('carla')
    await db.run("INSERT INTO promo_codes (code, discount_percent, active, created_at) VALUES ('BIG50', 50, 1, ?)", [new Date().toISOString()])
    const big = await call(carla, 'POST', '/api/payments/paddle/checkout', { courseId: 'ai-productivity-master', referralCode: annaRewards.referralCode, promoCode: 'BIG50' })
    assert.equal(big.body.amount, 14.5)
    assert.equal(big.body.discount.kind, 'promo')
    const bad = await call(carla, 'POST', '/api/payments/paddle/checkout', { courseId: 'ai-productivity-master', promoCode: 'NOPE' })
    assert.equal(bad.status, 400)

    // Boris refunds the first purchase: his code and Anna's reward are cancelled
    const refund = JSON.stringify({ event_type: 'adjustment.updated', data: { action: 'refund', type: 'full', status: 'approved', transaction_id: firstPayment.external_id } })
    assert.equal((await fetch(`${base}/api/webhooks/paddle`, { method: 'POST', headers: { ...json, 'Paddle-Signature': sign(refund) }, body: refund })).status, 200)
    const cancelled = await db.all('SELECT code, active FROM promo_codes WHERE code IN (?, ?)', [next.code, inviter.code])
    assert.deepEqual(cancelled.map((c) => c.active), [0, 0])

    // a refunded first purchase still counts: no second friend discount
    const again = await call(boris, 'POST', '/api/payments/paddle/checkout', { courseId: 'ai-productivity-master', referralCode: annaRewards.referralCode })
    assert.equal(again.body.discount, null)
  } finally {
    server.close()
    mock.close()
    fs.rmSync(dbPath, { force: true })
  }
})
