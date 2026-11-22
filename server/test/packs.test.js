import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'

const SECRET = 'pdl_ntfset_packs_secret'
const sign = (body) => {
  const ts = Math.floor(Date.now() / 1000)
  return `ts=${ts};h1=${crypto.createHmac('sha256', SECRET).update(`${ts}:${body}`).digest('hex')}`
}

test('a course pack opens its courses and hands over its bonus products; a vault its products; refunds take all of it back', async () => {
  let n = 0
  const mock = http.createServer((req, res) => {
    let raw = ''
    req.on('data', (c) => { raw += c })
    req.on('end', () => {
      res.setHeader('content-type', 'application/json')
      if (req.method === 'GET' && req.url.startsWith('/products')) {
        return res.end(JSON.stringify({ data: [
          { id: 'pro_pack', custom_data: { item_id: 'ai-creator-pack' } },
          { id: 'pro_vault', custom_data: { item_id: 'vault-prompt' } },
        ], meta: { pagination: { has_more: false } } }))
      }
      if (req.method === 'POST' && req.url === '/transactions') return res.end(JSON.stringify({ data: { id: `txn_p${++n}`, ...JSON.parse(raw) } }))
      res.statusCode = 404
      res.end('{}')
    })
  })
  await new Promise((r) => mock.listen(0, r))

  const dbPath = path.join(os.tmpdir(), `packs-${Date.now()}.sqlite`)
  Object.assign(process.env, {
    DATABASE_URL: '', LMS_TEST_DB: dbPath, UPLOADS_DIR: path.join(os.tmpdir(), 'packs-uploads'),
    JWT_SECRET: 'packs-test-jwt', ADMIN_JWT_SECRET: 'packs-test-admin', ADMIN_PASSWORD: 'AdminTest-2026-Only!',
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
  const { COURSE_BUNDLES } = await import('../../src/data/coursePacks.js')
  const { MARKETPLACE_BUNDLES } = await import('../services/marketplace.js')
  const { createApp } = await import('../app.js')
  const app = await createApp()
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)) })
  const base = `http://127.0.0.1:${server.address().port}`
  const json = { 'Content-Type': 'application/json' }
  const db = getDb()

  const hook = async (event) => {
    const body = JSON.stringify(event)
    const res = await fetch(`${base}/api/webhooks/paddle`, { method: 'POST', headers: { ...json, 'Paddle-Signature': sign(body) }, body })
    assert.equal(res.status, 200, await res.clone().text())
  }
  const settle = async (txn) => {
    const p = await db.get('SELECT * FROM payments WHERE external_id = ?', [txn])
    await hook({ event_type: 'transaction.completed', data: { id: txn, status: 'completed', currency_code: 'EUR', custom_data: { user_id: String(p.user_id), item_id: p.course_id }, details: { totals: { grand_total: String(Math.round(p.amount * 100)) } } } })
    return p
  }
  const refund = (txn) => hook({ event_type: 'adjustment.updated', data: { action: 'refund', type: 'full', status: 'approved', transaction_id: txn } })

  try {
    const email = `pack-${Date.now()}@example.com`
    const reg = await fetch(`${base}/api/auth/register`, { method: 'POST', headers: json, body: JSON.stringify({ email, password: 'SecretTest12', name: 'Pack' }) }).then((r) => r.json())
    await fetch(`${base}/api/auth/verify-email-code`, { method: 'POST', headers: json, body: JSON.stringify({ email, code: reg.devCode }) })
    const { token } = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: json, body: JSON.stringify({ email, password: 'SecretTest12' }) }).then((r) => r.json())
    const auth = { ...json, Authorization: `Bearer ${token}` }
    const buy = (courseId) => fetch(`${base}/api/payments/paddle/checkout`, { method: 'POST', headers: auth, body: JSON.stringify({ courseId }) }).then((r) => r.json())

    // a course pack
    const pack = COURSE_BUNDLES.find((b) => b.id === 'ai-creator-pack')
    const packOrder = await buy(pack.id)
    assert.equal(packOrder.amount, pack.priceEur)
    const packPayment = await settle(packOrder.transactionId)
    const courses = (await db.all('SELECT course_id FROM purchases WHERE user_id = ?', [packPayment.user_id])).map((r) => r.course_id).sort()
    assert.deepEqual(courses, [...pack.courseIds, pack.id].sort())
    const active = async () => (await db.all("SELECT product_id FROM entitlements WHERE user_id = ? AND status = 'active'", [packPayment.user_id])).map((r) => r.product_id).sort()
    assert.deepEqual(await active(), [...pack.bonusProductIds].sort())
    const me = await fetch(`${base}/api/marketplace/entitlements`, { headers: auth }).then((r) => r.json()).catch(() => null)
    if (me?.items) assert.ok(pack.bonusProductIds.every((id) => me.items.some((item) => item.productId === id)))

    // a vault
    const vault = MARKETPLACE_BUNDLES.find((b) => b.id === 'vault-prompt')
    const vaultOrder = await buy(vault.id)
    await settle(vaultOrder.transactionId)
    const afterVault = await active()
    assert.ok(vault.productIds.every((id) => afterVault.includes(id)))

    // refunds take back exactly what each payment gave
    await refund(vaultOrder.transactionId)
    const afterVaultRefund = await active()
    assert.deepEqual(afterVaultRefund, [...pack.bonusProductIds].sort())
    await refund(packOrder.transactionId)
    assert.deepEqual(await active(), [])
    assert.equal((await db.all('SELECT * FROM purchases WHERE user_id = ?', [packPayment.user_id])).length, 0)
  } finally {
    server.close()
    mock.close()
    fs.rmSync(dbPath, { force: true })
  }
})
