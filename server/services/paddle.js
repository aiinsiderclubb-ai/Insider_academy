import crypto from 'node:crypto'
import { config, isPaddleEnabled } from '../config.js'

/**
 * Paddle Billing, server side. Paddle is the merchant of record: it sells to
 * the buyer, charges VAT, handles refunds and chargebacks, and pays us out.
 *
 * Every sellable item exists in the Paddle catalog as a product with a base
 * price, tagged `custom_data.item_id` (scripts/paddle-sync.js keeps them in
 * step with our catalog). What a given buyer pays — after a referral
 * discount, a promo code or a license multiplier — is computed here, so a
 * checkout is a transaction with a one-off price on that product. Prices
 * include tax (`tax_mode: internal`): the buyer pays the number on the site.
 */

const BASES = {
  sandbox: 'https://sandbox-api.paddle.com',
  production: 'https://api.paddle.com',
}

export function paddleBase() {
  // Tests point the client at a local stand-in; production never sets this.
  if (process.env.PADDLE_API_BASE && process.env.NODE_ENV !== 'production') return process.env.PADDLE_API_BASE
  return BASES[config.paddle.env] || BASES.sandbox
}

export async function paddleRequest(method, path, body) {
  if (!isPaddleEnabled()) throw Object.assign(new Error('Paddle not configured'), { status: 503 })
  const res = await fetch(`${paddleBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.paddle.apiKey}`,
      'Content-Type': 'application/json',
      'Paddle-Version': '1',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  if (!res.ok) {
    const detail = json?.error?.detail || json?.error?.code || text.slice(0, 300)
    throw Object.assign(new Error(`Paddle ${method} ${path}: ${res.status} ${detail}`), { status: 502, paddle: json?.error })
  }
  return json
}

/** All pages of a list endpoint. */
export async function paddleList(path) {
  const items = []
  let next = `${path}${path.includes('?') ? '&' : '?'}per_page=200`
  while (next) {
    const page = await paddleRequest('GET', next.startsWith('http') ? next.slice(paddleBase().length) : next)
    items.push(...(page?.data || []))
    next = page?.meta?.pagination?.has_more ? page.meta.pagination.next : null
  }
  return items
}

let productCache = { at: 0, map: new Map() }

/** item_id → Paddle product id, cached for ten minutes. */
export async function paddleProductFor(itemId) {
  if (Date.now() - productCache.at > 10 * 60 * 1000 || !productCache.map.has(itemId)) {
    const products = await paddleList('/products?status=active')
    productCache = {
      at: Date.now(),
      map: new Map(products.filter((p) => p.custom_data?.item_id).map((p) => [p.custom_data.item_id, p.id])),
    }
  }
  const id = productCache.map.get(itemId)
  if (!id) throw Object.assign(new Error(`Item ${itemId} is not in the Paddle catalog — run scripts/paddle-sync.js`), { status: 409 })
  return id
}

export function resetPaddleCache() {
  productCache = { at: 0, map: new Map() }
}

export function toMinor(amountEur) {
  return String(Math.round(Number(amountEur) * 100))
}

/**
 * A transaction for one item at the price we computed. The browser opens it
 * with Paddle.js (`Paddle.Checkout.open({ transactionId })`).
 */
export async function createPaddleTransaction({ paymentId, userId, itemId, title, amountEur, licenseTier }) {
  const productId = await paddleProductFor(itemId)
  const res = await paddleRequest('POST', '/transactions', {
    items: [{
      quantity: 1,
      price: {
        description: licenseTier ? `${title} — ${licenseTier}` : title,
        name: title.slice(0, 150),
        product_id: productId,
        unit_price: { amount: toMinor(amountEur), currency_code: 'EUR' },
        tax_mode: 'internal',
        quantity: { minimum: 1, maximum: 1 },
      },
    }],
    currency_code: 'EUR',
    collection_mode: 'automatic',
    custom_data: { payment_id: paymentId, user_id: String(userId), item_id: itemId },
  })
  return res.data
}

/**
 * `Paddle-Signature: ts=1700000000;h1=<hex>` — HMAC-SHA256 of `${ts}:${rawBody}`
 * with the notification destination's secret. Old timestamps are refused so a
 * captured request cannot be replayed later.
 */
export function verifyPaddleSignature(rawBody, header, secret = config.paddle.webhookSecret, now = Date.now(), toleranceSec = 300) {
  if (!secret || !header) return false
  const parts = Object.fromEntries(String(header).split(';').map((part) => {
    const i = part.indexOf('=')
    return [part.slice(0, i).trim(), part.slice(i + 1).trim()]
  }))
  const ts = Number(parts.ts)
  const h1 = parts.h1
  if (!Number.isFinite(ts) || !h1 || !/^[0-9a-f]+$/i.test(h1)) return false
  if (Math.abs(now / 1000 - ts) > toleranceSec) return false
  const body = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody)
  const expected = crypto.createHmac('sha256', secret).update(`${ts}:${body}`).digest('hex')
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(h1, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/** Amount actually charged, in euros, from a transaction payload. */
export function paidAmount(transaction) {
  const total = transaction?.details?.totals?.grand_total ?? transaction?.details?.totals?.total
  return Number(total || 0) / 100
}
