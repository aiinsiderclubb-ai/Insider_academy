import crypto from 'crypto'
import { getDb, parseJson } from '../db.js'
import { nowIso } from '../db/time.js'
import { sendEmail } from './email.js'
import { isEmailEnabled } from '../config.js'
import { MARKETING_TEMPLATES, normalizeLocale } from './emailCopy.js'
import { renderEmail } from './emailRender.js'
import { isUnsubscribed } from './emailUnsub.js'

const DAY = 86400000

function later(ms) {
  return new Date(Date.now() + ms).toISOString()
}

export async function queueEmail({ to, template, payload = {}, sendAfter = null }) {
  const db = getDb()
  const id = `em-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`
  await db.run(
    `INSERT INTO email_queue (id, email, template, payload, status, send_after, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
    [id, String(to).trim().toLowerCase(), template, JSON.stringify(payload), sendAfter || nowIso(), nowIso()]
  )
  return id
}

async function resolveSkip(row, payload) {
  const email = row.email
  if (MARKETING_TEMPLATES.has(row.template) && await isUnsubscribed(email)) {
    return 'unsubscribed'
  }

  const db = getDb()
  const user = await db.get(
    'SELECT id, last_login_at, last_activity_date FROM users WHERE email = ?',
    [email]
  )

  if (row.template === 'welcome_2') {
    if (user?.last_login_at || user?.last_activity_date) return 'already_active'
    if (user?.id) {
      const progress = await db.get('SELECT user_id FROM progress WHERE user_id = ? LIMIT 1', [user.id])
      if (progress) return 'already_active'
    }
  }

  if (row.template === 'welcome_3' && user?.id) {
    const purchase = await db.get('SELECT id FROM purchases WHERE user_id = ? LIMIT 1', [user.id])
    if (purchase) return 'already_purchased'
  }

  if ((row.template === 'inactive_3d' || row.template === 'inactive_7d' || row.template === 'inactive_14d') && user?.last_login_at) {
    if (user.last_login_at > row.created_at) return 'returned'
  }

  return payload.skipReason || null
}

export async function processEmailQueue(limit = 20) {
  const db = getDb()
  const rows = await db.all(
    `SELECT * FROM email_queue WHERE status = 'pending' AND send_after <= ?
     ORDER BY created_at ASC LIMIT ?`,
    [nowIso(), limit]
  )
  let sent = 0
  let skipped = 0
  for (const row of rows) {
    const payload = parseJson(row.payload, {})
    try {
      const reason = await resolveSkip(row, payload)
      if (reason) {
        await db.run(
          "UPDATE email_queue SET status = 'skipped', error = ? WHERE id = ?",
          [reason, row.id]
        )
        skipped += 1
        continue
      }
      if (!isEmailEnabled()) continue
      const rendered = renderEmail(row.template, {
        ...payload,
        to: row.email,
        email: row.email,
        locale: payload.locale,
      })
      await sendEmail({
        to: row.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        headers: rendered.headers,
      })
      await db.run("UPDATE email_queue SET status = 'sent', sent_at = ? WHERE id = ?", [nowIso(), row.id])
      sent += 1
    } catch (err) {
      await db.run("UPDATE email_queue SET status = 'failed', error = ? WHERE id = ?", [err.message, row.id])
    }
  }
  return { processed: sent, skipped, reason: isEmailEnabled() ? undefined : 'smtp_disabled' }
}

export async function scheduleWelcomeSeries(email, name, locale = 'ru') {
  const mail = String(email || '').trim().toLowerCase()
  if (!mail) return []
  const db = getDb()
  const existing = await db.get(
    `SELECT id FROM email_queue
     WHERE email = ? AND template IN ('welcome_1', 'welcome_2', 'welcome_3')
       AND status IN ('pending', 'sent')
     LIMIT 1`,
    [mail]
  )
  if (existing) return []

  const loc = normalizeLocale(locale)
  const payload = { name, locale: loc }
  return Promise.all([
    queueEmail({ to: mail, template: 'welcome_1', payload }),
    queueEmail({ to: mail, template: 'welcome_2', payload, sendAfter: later(2 * DAY) }),
    queueEmail({ to: mail, template: 'welcome_3', payload, sendAfter: later(5 * DAY) }),
  ])
}

async function lessonHint(userId) {
  const db = getDb()
  const rows = await db.all(
    'SELECT course_id, data, updated_at FROM progress WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
    [userId]
  )
  const row = rows[0]
  if (!row) return {}
  const data = parseJson(row.data, {})
  const watched = Array.isArray(data.watched) ? data.watched : []
  const nextIndex = watched.length
  const course = await db.get('SELECT data FROM courses WHERE id = ?', [row.course_id])
  const parsed = parseJson(course?.data, {})
  const lesson = parsed.lessons?.[nextIndex] || parsed.lessons?.[0]
  const slug = parsed.slug || row.course_id
  return {
    courseTitle: parsed.title || row.course_id,
    lessonTitle: lesson?.title || '',
    lessonPath: `/learn/${slug}`,
  }
}

export async function processInactiveUsers() {
  const db = getDb()
  const cutoff3 = new Date(Date.now() - 3 * DAY).toISOString()
  const cutoff7 = new Date(Date.now() - 7 * DAY).toISOString()
  const cutoff14 = new Date(Date.now() - 14 * DAY).toISOString()
  const users = await db.all(
    `SELECT id, email, name, locale, last_login_at FROM users
     WHERE last_login_at IS NOT NULL AND last_login_at < ?
     LIMIT 40`,
    [cutoff3]
  )
  let queued = 0
  for (const user of users) {
    if (await isUnsubscribed(user.email)) continue
    const template = user.last_login_at < cutoff14
      ? 'inactive_14d'
      : user.last_login_at < cutoff7
        ? 'inactive_7d'
        : 'inactive_3d'
    const windowStart = template === 'inactive_14d' ? cutoff14 : template === 'inactive_7d' ? cutoff7 : cutoff3
    const sent = await db.get(
      'SELECT id FROM email_queue WHERE email = ? AND template = ? AND created_at > ?',
      [user.email, template, windowStart]
    )
    if (sent) continue
    const hint = await lessonHint(user.id)
    await queueEmail({
      to: user.email,
      template,
      payload: {
        name: user.name,
        locale: normalizeLocale(user.locale),
        ...hint,
      },
    })
    queued += 1
  }
  return { queued }
}

export { later }
