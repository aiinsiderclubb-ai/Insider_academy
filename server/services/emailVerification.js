import crypto from 'crypto'
import { getDb } from '../db.js'
import { isEmailEnabled } from '../config.js'
import { sendVerificationCodeEmail } from './email.js'

const CODE_TTL_MS = 15 * 60 * 1000

export function generateVerificationCode() {
  return String(crypto.randomInt(100000, 999999))
}

export function normalizeVerificationReturnPath(value) {
  const path = String(value || '').trim()
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return '/onboarding'
  return path
}

export async function issueEmailVerificationCode(email, name = '', returnTo = '/onboarding') {
  const db = getDb()
  const code = generateVerificationCode()
  const expires = new Date(Date.now() + CODE_TTL_MS).toISOString()

  await db.run(
    "UPDATE email_tokens SET used = 1 WHERE email = ? AND type IN ('verify_code', 'verify') AND used = 0",
    [email]
  )
  await db.run(
    'INSERT INTO email_tokens (id, email, token, type, expires_at) VALUES (?, ?, ?, ?, ?)',
    [`et-${Date.now()}`, email, code, 'verify_code', expires]
  )

  await sendVerificationCodeEmail(email, code, name, normalizeVerificationReturnPath(returnTo))

  const result = { expiresAt: expires }
  if (process.env.NODE_ENV !== 'production' && !isEmailEnabled()) result.devCode = code
  return result
}

export async function verifyEmailCode(email, code) {
  const db = getDb()
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const normalizedCode = String(code || '').trim()

  if (!/^\d{6}$/.test(normalizedCode)) {
    return { ok: false, error: 'Invalid code format', errorRu: 'Код должен состоять из 6 цифр' }
  }

  const row = await db.get(
    "SELECT * FROM email_tokens WHERE email = ? AND token = ? AND type = 'verify_code' AND used = 0",
    [normalizedEmail, normalizedCode]
  )
  if (!row || new Date(row.expires_at) < new Date()) {
    return { ok: false, error: 'Invalid or expired code', errorRu: 'Неверный или просроченный код. Запросите новый.' }
  }

  await db.run('UPDATE users SET email_verified = 1 WHERE email = ?', [normalizedEmail])
  await db.run('UPDATE email_tokens SET used = 1 WHERE id = ?', [row.id])

  return { ok: true, email: normalizedEmail }
}
