import crypto from 'crypto'
import { getDb } from '../db.js'
import { nowIso } from '../db/time.js'
import { config } from '../config.js'

const TOKEN_TTL_MS = 15 * 60 * 1000

export function getBotUsername() {
  return process.env.TELEGRAM_BOT_USERNAME || config.telegram.botUsername || ''
}

export function buildTelegramDeepLink(token) {
  const username = getBotUsername()
  if (!username) return null
  return `https://t.me/${username}?start=link_${token}`
}

export async function createLinkToken(userId) {
  const db = getDb()
  const token = crypto.randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString()
  await db.run(
    `INSERT INTO telegram_link_tokens (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`,
    [token, userId, expiresAt, nowIso()]
  )
  return { token, expiresAt, url: buildTelegramDeepLink(token) }
}

export async function linkByPersonalId(personalId, chatId, username) {
  const db = getDb()
  const normalized = String(personalId || '').trim().toUpperCase()
  if (!/^AIA-[A-Z0-9]{6}$/.test(normalized)) {
    return { ok: false, error: 'Invalid personal ID format' }
  }

  const user = await db.get('SELECT id, email FROM users WHERE personal_id = ?', [normalized])
  if (!user) return { ok: false, error: 'Account not found' }

  const other = await db.get('SELECT id FROM users WHERE telegram_chat_id = ? AND id != ?', [chatId, user.id])
  if (other) {
    await db.run('UPDATE users SET telegram_chat_id = NULL, telegram_username = NULL WHERE id = ?', [other.id])
  }

  await db.run('UPDATE users SET telegram_chat_id = ?, telegram_username = ? WHERE id = ?', [
    chatId,
    username || null,
    user.id,
  ])

  const existing = await db.get('SELECT value FROM analytics WHERE key = ?', [`tg_prefs_${user.id}`])
  if (!existing) {
    await db.run('INSERT INTO analytics (key, value) VALUES (?, ?)', [
      `tg_prefs_${user.id}`,
      JSON.stringify(defaultNotifyPrefs()),
    ])
  }

  return { ok: true, email: user.email, userId: user.id }
}

export async function consumeLinkToken(token, chatId, username) {
  const db = getDb()
  const row = await db.get('SELECT * FROM telegram_link_tokens WHERE token = ?', [token])
  if (!row) return { ok: false, error: 'Invalid or expired link' }
  if (row.used) return { ok: false, error: 'Link already used' }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: 'Link expired' }
  }

  const user = await db.get('SELECT id, email FROM users WHERE id = ?', [row.user_id])
  if (!user) return { ok: false, error: 'User not found' }

  const other = await db.get('SELECT id FROM users WHERE telegram_chat_id = ? AND id != ?', [chatId, user.id])
  if (other) {
    await db.run('UPDATE users SET telegram_chat_id = NULL, telegram_username = NULL WHERE id = ?', [other.id])
  }

  await db.run('UPDATE users SET telegram_chat_id = ?, telegram_username = ? WHERE id = ?', [
    chatId,
    username || null,
    user.id,
  ])
  await db.run('UPDATE telegram_link_tokens SET used = 1, used_at = ? WHERE token = ?', [nowIso(), token])

  const existing = await db.get('SELECT value FROM analytics WHERE key = ?', [`tg_prefs_${user.id}`])
  if (!existing) {
    await db.run('INSERT INTO analytics (key, value) VALUES (?, ?)', [
      `tg_prefs_${user.id}`,
      JSON.stringify(defaultNotifyPrefs()),
    ])
  }

  return { ok: true, email: user.email, userId: user.id }
}

export async function unlinkByChatId(chatId) {
  const db = getDb()
  await db.run('UPDATE users SET telegram_chat_id = NULL, telegram_username = NULL WHERE telegram_chat_id = ?', [chatId])
}

export function defaultNotifyPrefs() {
  return { homework: true, promo: true, news: true, reviews: true, purchases: true }
}

export async function getNotifyPrefs(db, userId) {
  const row = await db.get('SELECT value FROM analytics WHERE key = ?', [`tg_prefs_${userId}`])
  let stored = {}
  try { stored = JSON.parse(row?.value || '{}') } catch { stored = {} }
  return { ...defaultNotifyPrefs(), ...stored }
}

export async function setNotifyPrefs(db, userId, partial) {
  const current = await getNotifyPrefs(db, userId)
  const next = { ...current, ...partial }
  await db.run(
    `INSERT INTO analytics (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [`tg_prefs_${userId}`, JSON.stringify(next)]
  )
  return next
}
