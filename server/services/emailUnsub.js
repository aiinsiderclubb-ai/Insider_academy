import crypto from 'crypto'
import { config } from '../config.js'
import { getDb } from '../db.js'
import { nowIso } from '../db/time.js'

function secret() {
  return config.jwtSecret || 'dev-secret'
}

export function signUnsubscribeToken(email) {
  const payload = Buffer.from(JSON.stringify({ e: String(email || '').trim().toLowerCase(), s: 'm' })).toString('base64url')
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function readUnsubscribeToken(token) {
  const raw = String(token || '')
  const dot = raw.lastIndexOf('.')
  if (dot < 1) return null
  const payload = raw.slice(0, dot)
  const sig = raw.slice(dot + 1)
  const expected = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    const email = String(data?.e || '').trim().toLowerCase()
    return email.includes('@') ? email : null
  } catch {
    return null
  }
}

export function unsubscribeUrl(email) {
  const origin = String(config.appUrl || 'https://myinsideracademy.com').replace(/\/$/, '')
  return `${origin}/api/email/unsubscribe?token=${encodeURIComponent(signUnsubscribeToken(email))}`
}

export async function isUnsubscribed(email) {
  const db = getDb()
  const row = await db.get(
    'SELECT email FROM email_unsubscribes WHERE email = ?',
    [String(email || '').trim().toLowerCase()]
  )
  return Boolean(row)
}

export async function recordUnsubscribe(email) {
  const mail = String(email || '').trim().toLowerCase()
  if (!mail) return false
  const db = getDb()
  const existing = await db.get('SELECT email FROM email_unsubscribes WHERE email = ?', [mail])
  if (existing) return true
  await db.run(
    'INSERT INTO email_unsubscribes (email, scope, created_at) VALUES (?, ?, ?)',
    [mail, 'marketing', nowIso()]
  )
  return true
}
