import { getDb } from '../db.js'
import { nowIso } from '../db/time.js'
import crypto from 'crypto'
import { sendEmail } from './email.js'
import { isEmailEnabled } from '../config.js'

const TEMPLATES = {
  welcome_1: {
    subject: 'Добро пожаловать в AI Insider Academy',
    body: (name) => `Здравствуйте${name ? `, ${name}` : ''}!\n\nСпасибо за регистрацию. Начните с бесплатного курса AI Starter Week: https://insiderai.it.com/courses/ai-start\n\n— AI Insider Academy`,
  },
  hw_reviewed: {
    subject: 'Домашнее задание проверено',
    body: (name, courseTitle) => `Здравствуйте${name ? `, ${name}` : ''}!\n\nВаше ДЗ по курсу «${courseTitle || 'курс'}» проверено. Зайдите в личный кабинет за результатом.\n\n— AI Insider Academy`,
  },
  inactive_3d: {
    subject: 'Мы скучаем — продолжите обучение',
    body: (name) => `Здравствуйте${name ? `, ${name}` : ''}!\n\nВы не заходили в Academy 3 дня. Продолжите с того места, где остановились: https://insiderai.it.com/cabinet\n\n— AI Insider Academy`,
  },
}

export async function queueEmail({ to, template, payload = {}, sendAfter = null }) {
  const db = getDb()
  const id = `em-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`
  await db.run(
    `INSERT INTO email_queue (id, email, template, payload, status, send_after, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
    [id, to, template, JSON.stringify(payload), sendAfter || nowIso(), nowIso()]
  )
  return id
}

export async function processEmailQueue(limit = 20) {
  if (!isEmailEnabled()) return { processed: 0, reason: 'smtp_disabled' }
  const db = getDb()
  const rows = await db.all(
    `SELECT * FROM email_queue WHERE status = 'pending' AND send_after <= ?
     ORDER BY created_at ASC LIMIT ?`,
    [nowIso(), limit]
  )
  let sent = 0
  for (const row of rows) {
    const tpl = TEMPLATES[row.template]
    if (!tpl) {
      await db.run("UPDATE email_queue SET status = 'failed' WHERE id = ?", [row.id])
      continue
    }
    const payload = JSON.parse(row.payload || '{}')
    try {
      await sendEmail({
        to: row.email,
        subject: tpl.subject,
        text: typeof tpl.body === 'function' ? tpl.body(payload.name, payload.courseTitle) : tpl.body,
      })
      await db.run("UPDATE email_queue SET status = 'sent', sent_at = ? WHERE id = ?", [nowIso(), row.id])
      sent += 1
    } catch (err) {
      await db.run("UPDATE email_queue SET status = 'failed', error = ? WHERE id = ?", [err.message, row.id])
    }
  }
  return { processed: sent }
}

export async function scheduleWelcomeSeries(email, name) {
  await queueEmail({ to: email, template: 'welcome_1', payload: { name } })
}

export async function processInactiveUsers() {
  const db = getDb()
  const cutoff = new Date(Date.now() - 3 * 86400000).toISOString()
  const users = await db.all(
    `SELECT id, email, name, last_login_at FROM users
     WHERE last_login_at IS NOT NULL AND last_login_at < ? LIMIT 30`,
    [cutoff]
  )
  let queued = 0
  for (const u of users) {
    const sent = await db.get(
      "SELECT id FROM email_queue WHERE email = ? AND template = 'inactive_3d' AND created_at > ?",
      [u.email, cutoff]
    )
    if (sent) continue
    await queueEmail({ to: u.email, template: 'inactive_3d', payload: { name: u.name } })
    queued += 1
  }
  return { queued }
}
