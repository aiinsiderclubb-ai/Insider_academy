import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'

const SECRET = 'pdl_ntfset_test_secret'

function sign(body, ts = Math.floor(Date.now() / 1000), secret = SECRET) {
  const h1 = crypto.createHmac('sha256', secret).update(`${ts}:${body}`).digest('hex')
  return `ts=${ts};h1=${h1}`
}

test('Paddle signatures: valid, tampered, wrong secret, stale', async () => {
  const { verifyPaddleSignature } = await import('../services/paddle.js')
  const body = '{"event_type":"transaction.completed"}'
  assert.equal(verifyPaddleSignature(body, sign(body), SECRET), true)
  assert.equal(verifyPaddleSignature(Buffer.from(body), sign(body), SECRET), true)
  assert.equal(verifyPaddleSignature(`${body} `, sign(body), SECRET), false)
  assert.equal(verifyPaddleSignature(body, sign(body, undefined, 'other'), SECRET), false)
  assert.equal(verifyPaddleSignature(body, sign(body, Math.floor(Date.now() / 1000) - 3600), SECRET), false)
  assert.equal(verifyPaddleSignature(body, 'garbage', SECRET), false)
  assert.equal(verifyPaddleSignature(body, sign(body), ''), false)
})

test('Paddle checkout → transaction.completed grants access once; a full refund takes it back', async () => {
  // a stand-in for the Paddle API: one catalog product, transactions echo back
  const created = []
  const mock = http.createServer((req, res) => {
    let raw = ''
    req.on('data', (c) => { raw += c })
    req.on('end', () => {
      res.setHeader('content-type', 'application/json')
      if (req.method === 'GET' && req.url.startsWith('/products')) {
        return res.end(JSON.stringify({ data: [{ id: 'pro_course', custom_data: { item_id: 'ai-productivity-master' } }], meta: { pagination: { has_more: false } } }))
      }
      if (req.method === 'POST' && req.url === '/transactions') {
        const body = JSON.parse(raw)
        created.push({ body, auth: req.headers.authorization })
        return res.end(JSON.stringify({ data: { id: `txn_${created.length}`, status: 'ready', ...body } }))
      }
      res.statusCode = 404
      res.end('{}')
    })
  })
  await new Promise((r) => mock.listen(0, r))

  const dbPath = path.join(os.tmpdir(), `paddle-${Date.now()}.sqlite`)
  Object.assign(process.env, {
    MENTOR_LAUNCH: '0',
    DATABASE_URL: '',
    LMS_TEST_DB: dbPath,
    UPLOADS_DIR: path.join(os.tmpdir(), 'paddle-test-uploads'),
    JWT_SECRET: 'paddle-test-jwt',
    ADMIN_JWT_SECRET: 'paddle-test-admin',
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
  const { createApp } = await import('../app.js')
  const app = await createApp()
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)) })
  const base = `http://127.0.0.1:${server.address().port}`
  const json = { 'Content-Type': 'application/json' }

  try {
    const email = `buyer-${Date.now()}@example.com`
    const reg = await fetch(`${base}/api/auth/register`, { method: 'POST', headers: json, body: JSON.stringify({ email, password: 'SecretTest12', name: 'Buyer' }) }).then((r) => r.json())
    await fetch(`${base}/api/auth/verify-email-code`, { method: 'POST', headers: json, body: JSON.stringify({ email, code: reg.devCode }) })
    const { token } = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: json, body: JSON.stringify({ email, password: 'SecretTest12' }) }).then((r) => r.json())
    const auth = { ...json, Authorization: `Bearer ${token}` }

    const status = await fetch(`${base}/api/payments/paddle/status`).then((r) => r.json())
    assert.deepEqual(status, { enabled: true, environment: 'sandbox' })

    const checkout = await fetch(`${base}/api/payments/paddle/checkout`, { method: 'POST', headers: auth, body: JSON.stringify({ courseId: 'ai-productivity-master', locale: 'en', amount: 0.01 }) })
    assert.equal(checkout.status, 200, await checkout.clone().text())
    const opened = await checkout.json()
    assert.equal(opened.transactionId, 'txn_1')
    assert.equal(opened.amount, 19)
    assert.match(opened.successUrl, /^https?:\/\/.+\/en\/learn\/.+paid=1&provider=paddle/)

    // the price is ours, tax included, on the catalog product — not what the client sent
    const sent = created[0]
    assert.equal(sent.auth, 'Bearer pdl_sdbx_apikey_test')
    assert.equal(sent.body.items[0].price.product_id, 'pro_course')
    assert.equal(sent.body.items[0].price.unit_price.amount, '1900')
    assert.equal(sent.body.items[0].price.tax_mode, 'internal')
    assert.equal(sent.body.custom_data.item_id, 'ai-productivity-master')

    const db = getDb()
    const payment = await db.get("SELECT * FROM payments WHERE provider = 'paddle' AND external_id = 'txn_1'")
    assert.equal(payment.status, 'pending')

    const post = (event, signature) => {
      const body = JSON.stringify(event)
      return fetch(`${base}/api/webhooks/paddle`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Paddle-Signature': signature ?? sign(body) }, body })
    }
    const completed = {
      event_type: 'transaction.completed',
      data: {
        id: 'txn_1', status: 'completed', currency_code: 'EUR',
        custom_data: { payment_id: payment.id, user_id: String(payment.user_id), item_id: 'ai-productivity-master' },
        details: { totals: { grand_total: '1900', total: '1900' } },
      },
    }

    assert.equal((await post(completed, 'ts=1;h1=00')).status, 401)
    assert.equal((await db.get('SELECT status FROM payments WHERE id = ?', [payment.id])).status, 'pending')

    const underpaid = structuredClone(completed)
    underpaid.data.details.totals.grand_total = '100'
    assert.equal((await post(underpaid)).status, 409)
    assert.equal((await db.get('SELECT status FROM payments WHERE id = ?', [payment.id])).status, 'pending')

    assert.equal((await post(completed)).status, 200)
    assert.equal((await post(completed)).status, 200) // Paddle retries; nothing changes
    assert.equal((await db.get('SELECT status FROM payments WHERE id = ?', [payment.id])).status, 'completed')
    const owns = () => db.all('SELECT * FROM purchases WHERE user_id = ? AND course_id = ?', [payment.user_id, 'ai-productivity-master'])
    assert.equal((await owns()).length, 1)

    const partial = { event_type: 'adjustment.updated', data: { action: 'refund', type: 'partial', status: 'approved', transaction_id: 'txn_1' } }
    assert.equal((await post(partial)).status, 200)
    assert.equal((await db.get('SELECT status FROM payments WHERE id = ?', [payment.id])).status, 'completed')

    const pendingRefund = { event_type: 'adjustment.created', data: { action: 'refund', type: 'full', status: 'pending_approval', transaction_id: 'txn_1' } }
    assert.equal((await post(pendingRefund)).status, 200)
    assert.equal((await db.get('SELECT status FROM payments WHERE id = ?', [payment.id])).status, 'completed')

    const refunded = { event_type: 'adjustment.updated', data: { action: 'refund', type: 'full', status: 'approved', transaction_id: 'txn_1' } }
    assert.equal((await post(refunded)).status, 200)
    assert.equal((await db.get('SELECT status FROM payments WHERE id = ?', [payment.id])).status, 'refunded')
    assert.equal((await owns()).length, 0)

    const unknown = await post({ event_type: 'transaction.completed', data: { ...completed.data, id: 'txn_elsewhere' } })
    assert.equal(unknown.status, 200)
  } finally {
    server.close()
    mock.close()
    fs.rmSync(dbPath, { force: true })
  }
})
