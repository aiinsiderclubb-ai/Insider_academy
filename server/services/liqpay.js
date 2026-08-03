import crypto from 'crypto'
import { config, isLiqPayEnabled } from '../config.js'
import { safeSecretEqual } from '../utils/security.js'

function sign(data) {
  const str = config.liqpay.privateKey + data + config.liqpay.privateKey
  return crypto.createHash('sha1').update(str).digest('base64')
}

export function createPaymentPayload({ amount, currency = 'EUR', description, orderId, resultUrl, serverUrl }) {
  if (!isLiqPayEnabled()) throw new Error('LiqPay not configured')
  const payload = {
    public_key: config.liqpay.publicKey,
    version: 3,
    action: 'pay',
    amount,
    currency,
    description,
    order_id: orderId,
    result_url: resultUrl,
    server_url: serverUrl,
  }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64')
  return { data, signature: sign(data) }
}

export function verifyCallback(data, signature) {
  if (!isLiqPayEnabled()) return null
  if (!safeSecretEqual(sign(data), signature)) return null
  try {
    return JSON.parse(Buffer.from(data, 'base64').toString('utf8'))
  } catch {
    return null
  }
}
