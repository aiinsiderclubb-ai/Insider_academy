import crypto from 'crypto'
import { parseJson } from '../db.js'
import { notifyTelegramByEmail } from './telegramNotify.js'

export async function getCourseSlug(db, courseId) {
  if (!courseId) return null
  const row = await db.get('SELECT data FROM courses WHERE id = ?', [courseId])
  const data = parseJson(row?.data, null)
  return data?.slug || courseId
}

export async function createUserNotification(db, payload) {
  const email = String(payload.email || '').trim().toLowerCase()
  if (!email) return null

  const id = payload.id || `n-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO notifications (
      id, email, type, status, course_id, course_slug, course_title,
      lesson_title, lesson_index, target_path, message, read, date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [
      id,
      email,
      payload.type,
      payload.status ?? null,
      payload.courseId ?? null,
      payload.courseSlug ?? null,
      payload.courseTitle ?? null,
      payload.lessonTitle ?? null,
      payload.lessonIndex ?? null,
      payload.targetPath ?? null,
      payload.message ?? null,
      now,
    ]
  )

  const tgType = mapNotificationToTelegram(payload)
  if (tgType) {
    notifyTelegramByEmail(email, tgType, {
      courseTitle: payload.courseTitle,
      lessonTitle: payload.lessonTitle,
      message: payload.message,
      targetPath: payload.targetPath,
      status: payload.status,
      score: payload.score,
      code: payload.code,
      discount: payload.discount,
      title: payload.title,
      text: payload.text,
      url: payload.url,
    }).catch(() => {})
  }

  return id
}

function mapNotificationToTelegram(payload) {
  if (payload.type === 'homework_feedback') {
    if (payload.status === 'accepted') return 'homework_accepted'
    if (payload.status === 'resubmit') return 'homework_resubmit'
    return 'homework_resubmit'
  }
  if (payload.type === 'review_status') {
    if (payload.status === 'approved') return 'review_approved'
    if (payload.status === 'rejected') return 'review_rejected'
  }
  if (payload.type === 'application_status') return 'course_news'
  if (payload.type === 'password_changed') return 'course_news'
  if (payload.type === 'certificate_added') return 'course_news'
  return null
}
