import crypto from 'crypto'

function secret() {
  return process.env.DOWNLOAD_SIGNING_SECRET || process.env.JWT_SECRET || 'dev-download-secret'
}

export function createDownloadTicket({ assetId, userId, ttlSeconds = 300 }) {
  const payload = Buffer.from(JSON.stringify({
    assetId,
    userId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  })).toString('base64url')
  const signature = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function verifyDownloadTicket(ticket) {
  const [payload, signature] = String(ticket || '').split('.')
  if (!payload || !signature) return null
  const expected = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  if (!decoded.exp || decoded.exp <= Math.floor(Date.now() / 1000)) return null
  return decoded
}
