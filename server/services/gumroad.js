import crypto from 'node:crypto'
import { config, isGumroadEnabled } from '../config.js'

/**
 * Gumroad, server side. Gumroad is the merchant of record: it sells to the
 * buyer, charges VAT, handles refunds and pays us out by PayPal.
 *
 * Every sellable item is a Gumroad product whose custom permalink is our item
 * id (scripts/gumroad-sync.js keeps them in step). Store products carry a
 * "License" variant with one option per license tier. A buyer's discount —
 * referral, promo, next-purchase — becomes a single-use offer code on that
 * product, and the checkout link carries our payment id as a URL parameter,
 * which Gumroad hands back in the ping (`url_params`).
 */

export const GUMROAD_API = 'https://api.gumroad.com/v2'
export const LICENSE_VARIANT = 'License'
export const TIER_NAMES = { personal: 'Personal', client: 'Client', agency: 'Agency' }

function apiBase() {
  if (process.env.GUMROAD_API_BASE && process.env.NODE_ENV !== 'production') return process.env.GUMROAD_API_BASE
  return GUMROAD_API
}

export async function gumroadRequest(method, path, body, attempt = 0) {
  if (!isGumroadEnabled()) throw Object.assign(new Error('Gumroad not configured'), { status: 503 })
  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.gumroad.accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  })
  const text = await res.text()
  if (res.status === 429 && attempt < 3) {
    // "Rate limited. Retry after 6 seconds." — wait as told (Retry-After or the message), at most 30 s
    const seconds = Number(res.headers.get('retry-after')) || Number(text.match(/retry after (\d+)/i)?.[1]) || 5
    await new Promise((r) => setTimeout(r, Math.min(seconds, 30) * 1000 + 250))
    return gumroadRequest(method, path, body, attempt + 1)
  }
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  if (!res.ok || json?.success === false) {
    const detail = json?.message || text.slice(0, 300)
    throw Object.assign(new Error(`Gumroad ${method} ${path}: ${res.status} ${detail}`), { status: res.status === 404 ? 404 : 502 })
  }
  return json
}

let productCache = { at: 0, map: new Map() }

/** Our item id → Gumroad product, cached for ten minutes. */
export async function gumroadProducts({ fresh = false } = {}) {
  if (fresh || Date.now() - productCache.at > 10 * 60 * 1000) {
    const { products = [] } = await gumroadRequest('GET', '/products')
    productCache = {
      at: Date.now(),
      map: new Map(products.filter((p) => p.custom_permalink && !p.deleted).map((p) => [p.custom_permalink, p])),
    }
  }
  return productCache.map
}

export async function gumroadProductFor(itemId) {
  let product = (await gumroadProducts()).get(itemId)
  if (!product) product = (await gumroadProducts({ fresh: true })).get(itemId)
  if (!product) throw Object.assign(new Error(`Item ${itemId} is not on Gumroad — run scripts/gumroad-sync.js`), { status: 409 })
  return product
}

export function resetGumroadCache() {
  productCache = { at: 0, map: new Map() }
}

const cents = (eur) => Math.round(Number(eur) * 100)

/**
 * The link a buyer follows to pay. `listEur` is the price before our
 * discount for the chosen license; when the buyer pays less, a single-use
 * offer code for the difference is created and put in the link.
 */
export async function createGumroadCheckout({ paymentId, itemId, listEur, amountEur, licenseTier, email, now = Date.now() }) {
  const product = await gumroadProductFor(itemId)
  const off = cents(listEur) - cents(amountEur)
  let code = null
  if (off > 0) {
    code = `IA${crypto.randomBytes(5).toString('hex').toUpperCase()}`
    await gumroadRequest('POST', `/products/${encodeURIComponent(product.id)}/offer_codes`, {
      name: code,
      amount_off: off,
      offer_type: 'cents',
      max_purchase_count: 1,
      valid_at: new Date(now - 60 * 1000).toISOString(),
      expires_at: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
    })
  }
  const base = String(product.short_url || `https://gumroad.com/l/${itemId}`).replace(/\/$/, '')
  const url = new URL(code ? `${base}/${code}` : base)
  url.searchParams.set('wanted', 'true')
  url.searchParams.set('pid', paymentId)
  if (licenseTier && TIER_NAMES[licenseTier]) url.searchParams.set('option', TIER_NAMES[licenseTier])
  if (email) url.searchParams.set('email', email)
  return { url: url.toString(), offerCode: code, productId: product.id }
}

/**
 * `X-Gumroad-Signature: t=1751472000,v1=<hex>` — HMAC-SHA256 of `${t}.` plus
 * the raw body, with the secret from Settings → Advanced → Sign pings.
 */
export function verifyGumroadSignature(rawBody, header, secret = config.gumroad.pingSecret, now = Date.now(), toleranceSec = 300) {
  if (!secret || !header) return false
  const parts = Object.fromEntries(String(header).split(',').map((part) => {
    const i = part.indexOf('=')
    return [part.slice(0, i).trim(), part.slice(i + 1).trim()]
  }))
  const t = parts.t
  const v1 = parts.v1
  if (!/^\d+$/.test(t || '') || !/^[0-9a-f]+$/i.test(v1 || '')) return false
  if (Math.abs(now / 1000 - Number(t)) > toleranceSec) return false
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody))
  const expected = Buffer.from(crypto.createHmac('sha256', secret).update(`${t}.`).update(body).digest('hex'))
  const received = Buffer.from(v1)
  return expected.length === received.length && crypto.timingSafeEqual(expected, received)
}

/**
 * A ping body is form-encoded with nested keys (`url_params[pid]=…`,
 * `variants[License]=Agency`); this folds them into plain objects.
 */
export function parsePing(rawBody) {
  const text = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody || '')
  const out = {}
  for (const [key, value] of new URLSearchParams(text)) {
    const m = key.match(/^([^[\]]+)\[([^\]]*)\]$/)
    if (m) {
      out[m[1]] = typeof out[m[1]] === 'object' && out[m[1]] ? out[m[1]] : {}
      out[m[1]][m[2]] = value
    } else {
      out[key] = value
    }
  }
  for (const key of ['url_params', 'variants', 'custom_fields']) {
    if (typeof out[key] === 'string') {
      try {
        out[key] = JSON.parse(out[key])
      } catch {
        out[key] = {}
      }
    }
  }
  return out
}

/** License tier the buyer actually chose on Gumroad's page, if the product has one. */
export function tierFromVariants(variants) {
  const chosen = String(variants?.[LICENSE_VARIANT] || '').toLowerCase()
  return Object.keys(TIER_NAMES).find((tier) => chosen.startsWith(tier)) || null
}

/** The sale as Gumroad records it — the ping is a trigger, this is the truth. */
export async function getGumroadSale(saleId) {
  const { sale } = await gumroadRequest('GET', `/sales/${encodeURIComponent(saleId)}`)
  return sale
}
