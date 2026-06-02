import crypto from 'crypto'

export function tributeSignature(rawBody, apiKey) {
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody)
  return crypto.createHmac('sha256', apiKey).update(body).digest('hex')
}

export async function apiRegisterAndVerify(request, { email, password, name = 'E2E User' }) {
  const base = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001/api'
  const reg = await request.post(`${base}/auth/register`, {
    data: { email, password, name },
  })
  if (reg.status() !== 201) {
    throw new Error(`register failed: ${reg.status()} ${await reg.text()}`)
  }
  const regBody = await reg.json()
  if (!regBody.requiresVerification) throw new Error('expected requiresVerification')

  let code = regBody.devCode
  if (!code) {
    const row = await request.post(`${base}/auth/resend-verification-code`, { data: { email } })
    const body = await row.json()
    code = body.devCode
  }
  if (!code) throw new Error('no verification devCode (enable test env without SMTP or check email mock)')

  const verify = await request.post(`${base}/auth/verify-email-code`, {
    data: { email, code: String(code) },
  })
  if (!verify.ok()) throw new Error(`verify failed: ${await verify.text()}`)
  const { token, user } = await verify.json()
  return { token, user, base }
}
