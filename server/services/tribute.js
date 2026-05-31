import crypto from 'crypto'
import { config } from '../config.js'

const API_BASE = 'https://tribute.tg/api/v1'

export function isTributeEnabled() {
  return Boolean(config.tribute.apiKey)
}

async function tributeRequest(path, { method = 'GET', body } = {}) {
  if (!config.tribute.apiKey) throw new Error('Tribute API key not configured')
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Api-Key': config.tribute.apiKey,
      'Content-Type': 'application/json',
    },
    body: body != null ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || data.error || `Tribute API error ${res.status}`)
  }
  return data
}

/** Создать заказ в Tribute Shop — возвращает paymentUrl для браузера */
export async function createShopOrder({
  shopId,
  amountCents,
  currency = 'eur',
  title,
  description,
  email,
  customerId,
  successUrl,
  failUrl,
  comment,
}) {
  const payload = {
    amount: amountCents,
    currency: currency.toLowerCase(),
    title: String(title).slice(0, 100),
    description: String(description).slice(0, 300),
    email,
    customerId: String(customerId),
    successUrl,
    failUrl,
    comment,
    period: 'onetime',
  }
  if (shopId) payload.shopId = Number(shopId)
  return tributeRequest('/shop/orders', { method: 'POST', body: payload })
}

/** Получить цифровой продукт и ссылку на оплату */
export async function getDigitalProduct(productId) {
  return tributeRequest(`/products/${productId}`)
}

export function verifyTributeSignature(rawBody, signatureHeader) {
  if (!config.tribute.apiKey || !signatureHeader) return false
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody))
  const expectedHex = crypto.createHmac('sha256', config.tribute.apiKey).update(body).digest('hex')
  const expectedBase64 = crypto.createHmac('sha256', config.tribute.apiKey).update(body).digest('base64')
  const sig = String(signatureHeader).trim()
  try {
    if (sig.length === expectedHex.length && crypto.timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expectedHex, 'utf8'))) {
      return true
    }
  } catch (_) {}
  return sig === expectedHex || sig === expectedBase64
}

export function getProductIdForCourse(courseId) {
  const map = config.tribute.productMap
  return map[courseId] || config.tribute.defaultProductId || null
}

export function getCourseIdForProduct(productId) {
  const map = config.tribute.productMap
  for (const [courseId, pid] of Object.entries(map)) {
    if (String(pid) === String(productId)) return courseId
  }
  return null
}
