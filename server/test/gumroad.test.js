import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'

const SECRET = 'gumroad_ping_test_secret'
const sign = (body, t = Math.floor(Date.now() / 1000)) => `t=${t},v1=${crypto.createHmac('sha256', SECRET).update(`${t}.`).update(body).digest('hex')}`

test('Gumroad: discounted checkout link with a single-use code, signed pings grant, storefront sales match by email, refunds revoke', async () => {
  const offerCodes = []
  const sales = new Map()
  const products = [
    { id: 'g_course', custom_permalink: 'ai-productivity-master', short_url: 'https://insider.gumroad.com/l/ai-productivity-master', published: true },
    { id: 'g_store', custom_permalink: 'mp-voice-beauty-salon', short_url: 'https://insider.gumroad.com/l/mp-voice-beauty-salon', published: true },
    { id: 'g_pack', custom_permalink: 'ai-creator-pack', short_url: 'https://insider.gumroad.com/l/ai-creator-pack', published: true },
  ]
  const mock = http.createServer((req, res) => {
    let raw = ''
    req.on('data', (c) => { raw += c })
    req.on('end', () => {
      res.setHeader('content-type', 'application/json')
      assert.equal(req.headers.authorization, 'Bearer gumroad-test-token')
      // Paged like Gumroad: two per page here, with a link to the next page.
      if (req.method === 'GET' && req.url === '/products') {
        return res.end(JSON.stringify({ success: true, products: products.slice(0, 2), next_page_url: '/v2/products?page_key=p2' }))
      }
      if (req.method === 'GET' && req.url === '/products?page_key=p2') return res.end(JSON.stringify({ success: true, products: products.slice(2) }))
      const code = req.url.match(/^\/products\/([^/]+)\/offer_codes$/)
      if (req.method === 'POST' && code) {
        offerCodes.push({ product: decodeURIComponent(code[1]), ...JSON.parse(raw) })
        return res.end(JSON.stringify({ success: true, offer_code: { id: 'oc1' } }))
      }
      const sale = req.url.match(/^\/sales\/(.+)$/)
      if (req.method === 'GET' && sale && sales.has(decodeURIComponent(sale[1]))) {
        return res.end(JSON.stringify({ success: true, sale: sales.get(decodeURIComponent(sale[1])) }))
      }
      res.statusCode = 404
      res.end(JSON.stringify({ success: false, message: 'not found' }))
    })
  })
  await new Promise((r) => mock.listen(0, r))

  const dbPath = path.join(os.tmpdir(), `gumroad-${Date.now()}.sqlite`)
  Object.assign(process.env, {
    MENTOR_LAUNCH: '0',
    DATABASE_URL: '', LMS_TEST_DB: dbPath, UPLOADS_DIR: path.join(os.tmpdir(), 'gumroad-uploads'),
    JWT_SECRET: 'gumroad-test-jwt', ADMIN_JWT_SECRET: 'gumroad-test-admin', ADMIN_PASSWORD: 'AdminTest-2026-Only!',
    EDITOR_PASSWORD: 'EditorTest-2026-Only!', MODERATOR_PASSWORD: 'ModeratorTest-2026!', CORS_ORIGIN: 'http://localhost:5173',
    PRELAUNCH_MODE: '0', COURSES_PUBLIC: '1', FEATURE_MARKETPLACE_COMMERCE: 'true',
    GUMROAD_ACCESS_TOKEN: 'gumroad-test-token', GUMROAD_PING_SECRET: SECRET,
    GUMROAD_API_BASE: `http://127.0.0.1:${mock.address().port}`,
  })
  const { config } = await import('../config.js')
  Object.assign(config.gumroad, { accessToken: 'gumroad-test-token', pingSecret: SECRET })
  config.prelaunchMode = false
  const { resetDatabase, getDb } = await import('../db/index.js')
  resetDatabase()
  const { resetGumroadCache } = await import('../services/gumroad.js')
  resetGumroadCache()
  const { COURSE_BUNDLES } = await import('../../src/data/coursePacks.js')
  const { createApp } = await import('../app.js')
  const app = await createApp()
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)) })
  const base = `http://127.0.0.1:${server.address().port}`
  const json = { 'Content-Type': 'application/json' }
  const db = getDb()

  const ping = async (fields, { signed = true } = {}) => {
    const body = new URLSearchParams(fields).toString()
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
    if (signed) headers['X-Gumroad-Signature'] = sign(body)
    return fetch(`${base}/api/webhooks/gumroad`, { method: 'POST', headers, body })
  }
  const sell = (saleId, fields) => {
    sales.set(saleId, { id: saleId, refunded: false, chargedback: false })
    return ping({ sale_id: saleId, resource_name: 'sale', price: '1600', currency: 'eur', ...fields })
  }

  try {
    // The store asks which items Gumroad has on sale; every page of the list counts.
    const status = await fetch(`${base}/api/payments/gumroad/status`).then((r) => r.json())
    assert.equal(status.enabled, true)
    assert.deepEqual([...status.onSale].sort(), ['ai-creator-pack', 'ai-productivity-master', 'mp-voice-beauty-salon'])

    const email = `gr-${Date.now()}@example.com`
    const reg = await fetch(`${base}/api/auth/register`, { method: 'POST', headers: json, body: JSON.stringify({ email, password: 'SecretTest12', name: 'Gum' }) }).then((r) => r.json())
    await fetch(`${base}/api/auth/verify-email-code`, { method: 'POST', headers: json, body: JSON.stringify({ email, code: reg.devCode }) })
    const { token } = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: json, body: JSON.stringify({ email, password: 'SecretTest12' }) }).then((r) => r.json())
    const auth = { ...json, Authorization: `Bearer ${token}` }
    const user = await db.get('SELECT id FROM users WHERE email = ?', [email])
    const owns = async (courseId) => Boolean(await db.get('SELECT 1 AS ok FROM purchases WHERE user_id = ? AND course_id = ?', [user.id, courseId]))

    // a Gumroad product has one price, so the dearer mentor plan is not sold there
    const mentor = await fetch(`${base}/api/payments/gumroad/checkout`, { method: 'POST', headers: auth, body: JSON.stringify({ courseId: 'ai-productivity-master', plan: 'mentor' }) })
    assert.equal(mentor.status, 409)
    assert.equal((await mentor.json()).code, 'PLAN_NOT_AVAILABLE')
    // …except in the launch window, when it costs the same as self-study
    process.env.MENTOR_LAUNCH = '1'
    const launch = await fetch(`${base}/api/payments/gumroad/checkout`, { method: 'POST', headers: auth, body: JSON.stringify({ courseId: 'ai-productivity-master', plan: 'mentor' }) }).then((r) => r.json())
    assert.equal(launch.amount, 19)
    assert.equal((await db.get('SELECT plan FROM payments WHERE id = ?', [launch.paymentId])).plan, 'mentor')
    await db.run('DELETE FROM payments WHERE id = ?', [launch.paymentId])
    process.env.MENTOR_LAUNCH = '0'

    // 50% campaign code → the link carries a single-use Gumroad code for the difference
    await db.run("INSERT INTO promo_codes (code, discount_percent, active, created_at) VALUES ('BIG50', 50, 1, ?)", [new Date().toISOString()])
    const order = await fetch(`${base}/api/payments/gumroad/checkout`, { method: 'POST', headers: auth, body: JSON.stringify({ courseId: 'ai-productivity-master', promoCode: 'BIG50' }) }).then((r) => r.json())
    assert.equal(order.amount, 9.5)
    const link = new URL(order.checkoutUrl)
    const code = offerCodes.at(-1)
    assert.equal(code.product, 'g_course')
    assert.equal(code.amount_off, 950)
    assert.equal(code.offer_type, 'cents')
    assert.equal(code.max_purchase_count, 1)
    assert.equal(link.pathname, `/l/ai-productivity-master/${code.name}`)
    assert.equal(link.searchParams.get('pid'), order.paymentId)

    // an unsigned or stale ping is refused
    assert.equal((await ping({ sale_id: 's1', resource_name: 'sale' }, { signed: false })).status, 401)
    assert.equal(await owns('ai-productivity-master'), false)

    // the signed sale opens the course, once, however often it is delivered
    const fields = { product_permalink: 'ai-productivity-master', email, 'url_params[pid]': order.paymentId, offer_code: code.name }
    assert.equal((await sell('s1', fields)).status, 200)
    assert.equal((await sell('s1', fields)).status, 200)
    assert.equal(await owns('ai-productivity-master'), true)
    const paid = await db.get('SELECT * FROM payments WHERE id = ?', [order.paymentId])
    assert.equal(paid.status, 'completed')
    assert.equal(paid.external_id, 's1')

    // a store product: the buyer switched to the Agency license on Gumroad's page — they get Agency
    // The opening sale: a Personal license for 1 € while it runs, the difference taken off by an offer code.
    const { launchSale } = await import('../services/launchSale.js')
    const personal = await fetch(`${base}/api/payments/gumroad/marketplace`, { method: 'POST', headers: auth, body: JSON.stringify({ productId: 'mp-voice-beauty-salon', licenseTier: 'personal' }) }).then((r) => r.json())
    if (launchSale()) {
      assert.equal(personal.quote.amountEur, 1)
      assert.equal(offerCodes.at(-1).amount_off, (personal.baseAmount - 1) * 100)
    } else {
      assert.equal(personal.quote.amountEur, personal.baseAmount)
    }

    const storeOrder = await fetch(`${base}/api/payments/gumroad/marketplace`, { method: 'POST', headers: auth, body: JSON.stringify({ productId: 'mp-voice-beauty-salon', licenseTier: 'client' }) }).then((r) => r.json())
    assert.ok(storeOrder.checkoutUrl, JSON.stringify(storeOrder))
    assert.equal(new URL(storeOrder.checkoutUrl).searchParams.get('option'), 'Client')
    assert.equal((await sell('s2', { product_permalink: 'mp-voice-beauty-salon', email, 'url_params[pid]': storeOrder.paymentId, 'variants[License]': 'Agency' })).status, 200)
    const ent = await db.get("SELECT * FROM entitlements WHERE user_id = ? AND product_id = 'mp-voice-beauty-salon' AND status = 'active'", [user.id])
    assert.ok(ent)
    assert.equal(ent.license_tier, 'agency')

    // bought straight from the Gumroad storefront: matched to the account by email
    const pack = COURSE_BUNDLES.find((b) => b.id === 'ai-creator-pack')
    assert.equal((await sell('s3', { product_permalink: pack.id, email })).status, 200)
    for (const id of pack.courseIds) assert.equal(await owns(id), true)

    // a stranger's storefront sale is kept, unclaimed, and grants nothing
    assert.equal((await sell('s4', { product_permalink: 'ai-productivity-master', email: 'nobody@example.com' })).status, 200)
    assert.equal((await db.get("SELECT status FROM payments WHERE external_id = 's4'")).status, 'unclaimed')

    // refunds take it back
    assert.equal((await ping({ sale_id: 's3', resource_name: 'refund', refunded: 'true' })).status, 200)
    // the pack's other course goes; the one bought on its own (s1) stays
    assert.equal(await owns('ai-content-creator'), false)
    assert.equal(await owns('ai-productivity-master'), true)
    assert.equal((await ping({ sale_id: 's2', resource_name: 'dispute' })).status, 200)
    assert.equal(await db.get("SELECT 1 AS ok FROM entitlements WHERE user_id = ? AND product_id = 'mp-voice-beauty-salon' AND status = 'active'", [user.id]), undefined)
    assert.equal(await owns('ai-productivity-master'), true)
  } finally {
    server.close()
    mock.close()
    fs.rmSync(dbPath, { force: true })
  }
})
