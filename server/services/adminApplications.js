import { notifyTelegramByEmail, notifyTelegramChatId } from './telegramNotify.js'
import { mapApplication } from '../routes/applications.js'
import { ACCELERATOR_COURSE_ID } from './applicationAccept.js'

function normalizeTelegramUsername(value) {
  return String(value || '').trim().replace(/^@/, '').toLowerCase()
}

export async function resolveApplicantChatId(db, email, telegramFromApplication) {
  const mail = String(email || '').trim().toLowerCase()
  const byEmail = await db.get(
    `SELECT telegram_chat_id FROM users WHERE lower(email) = ? AND telegram_chat_id IS NOT NULL AND telegram_chat_id != ''`,
    [mail]
  )
  if (byEmail?.telegram_chat_id) return byEmail.telegram_chat_id

  const username = normalizeTelegramUsername(telegramFromApplication)
  if (!username) return null

  const byUsername = await db.get(
    `SELECT telegram_chat_id FROM users
     WHERE lower(replace(coalesce(telegram_username, ''), '@', '')) = ?
       AND telegram_chat_id IS NOT NULL AND telegram_chat_id != ''`,
    [username]
  )
  return byUsername?.telegram_chat_id || null
}

export async function hasAcceleratorAccess(db, email) {
  const mail = String(email || '').trim().toLowerCase()
  const user = await db.get('SELECT id FROM users WHERE lower(email) = ?', [mail])
  if (!user?.id) return false
  const row = await db.get(
    'SELECT id FROM purchases WHERE user_id = ? AND course_id = ?',
    [user.id, ACCELERATOR_COURSE_ID]
  )
  return Boolean(row)
}

export async function enrichApplications(db, rows) {
  const apps = rows.map(mapApplication)
  if (!apps.length) return apps

  const emails = [...new Set(apps.map((a) => String(a.email || '').toLowerCase()).filter(Boolean))]
  if (!emails.length) return apps

  const placeholders = emails.map(() => '?').join(',')
  const users = await db.all(
    `SELECT id, email, telegram_chat_id, telegram_username FROM users WHERE lower(email) IN (${placeholders})`,
    emails
  )
  const userByEmail = Object.fromEntries(users.map((u) => [String(u.email).toLowerCase(), u]))
  const userIds = users.map((u) => u.id).filter(Boolean)

  const grantedIds = new Set()
  if (userIds.length) {
    const idPh = userIds.map(() => '?').join(',')
    const purchases = await db.all(
      `SELECT user_id FROM purchases WHERE course_id = ? AND user_id IN (${idPh})`,
      [ACCELERATOR_COURSE_ID, ...userIds]
    )
    for (const p of purchases) grantedIds.add(p.user_id)
  }

  return apps.map((app) => {
    const u = userByEmail[String(app.email || '').toLowerCase()]
    return {
      ...app,
      telegramConnected: Boolean(u?.telegram_chat_id),
      telegramUsername: u?.telegram_username || null,
      accessGranted: Boolean(u && grantedIds.has(u.id)) || app.status === 'accepted',
    }
  })
}

export async function sendApplicantTelegram(db, { email, telegram, title, text }) {
  const data = { title: title || 'AI Insider Academy', text: text || '', message: text || '' }
  const chatId = await resolveApplicantChatId(db, email, telegram)
  if (chatId) {
    const sent = await notifyTelegramChatId(chatId, 'custom', data)
    if (sent) return { sent: true, via: 'telegram' }
  }
  const sent = await notifyTelegramByEmail(email, 'custom', data)
  return {
    sent: Boolean(sent),
    via: sent ? 'telegram' : null,
    hint: sent ? null : 'Telegram не подключён — попросите написать /start боту @InsiderAcademyNotifyBot',
  }
}

export async function getApplicationAuditHistory(db, applicationId, limit = 15) {
  const rows = await db.all(
    `SELECT id, actor_email, action, target_type, target_id, meta, created_at
     FROM audit_log
     WHERE target_id = ? OR meta LIKE ?
     ORDER BY created_at DESC LIMIT ?`,
    [applicationId, `%${applicationId}%`, limit]
  )
  return rows.map((r) => ({
    id: r.id,
    actor: r.actor_email,
    action: r.action,
    createdAt: r.created_at,
    meta: (() => {
      try { return JSON.parse(r.meta || '{}') } catch { return {} }
    })(),
  }))
}
