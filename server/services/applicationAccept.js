import { config } from '../config.js'
import { nowIso } from '../db/time.js'
import { grantCourseAccess } from './grantCourse.js'
import { createUserNotification } from './notifications.js'
import { notifyTelegramChatId, notifyTelegramByEmail } from './telegramNotify.js'
import * as sheetsTrack from './sheetsTrack.js'

export const ACCELERATOR_COURSE_ID = 'ai-insider-accelerator'
export const ACCELERATOR_COURSE_TITLE = 'AI Insider Accelerator'
export const ACCELERATOR_COURSE_PATH = '/courses/ai-insider-accelerator'

function normalizeTelegramUsername(value) {
  return String(value || '').trim().replace(/^@/, '').toLowerCase()
}

async function resolveTelegramChatId(db, email, telegramFromApplication) {
  const byEmail = await db.get(
    'SELECT telegram_chat_id FROM users WHERE email = ? AND telegram_chat_id IS NOT NULL AND telegram_chat_id != ""',
    [String(email).trim().toLowerCase()]
  )
  if (byEmail?.telegram_chat_id) return byEmail.telegram_chat_id

  const username = normalizeTelegramUsername(telegramFromApplication)
  if (!username) return null

  const byUsername = await db.get(
    `SELECT telegram_chat_id FROM users
     WHERE LOWER(REPLACE(COALESCE(telegram_username, ''), '@', '')) = ?
       AND telegram_chat_id IS NOT NULL AND telegram_chat_id != ""`,
    [username]
  )
  return byUsername?.telegram_chat_id || null
}

export async function approveAcceleratorApplication(db, applicationRow, { adminNote, actorRole }) {
  if (!applicationRow) return { ok: false, error: 'Application not found' }

  const email = String(applicationRow.email || '').trim().toLowerCase()
  if (!email) return { ok: false, error: 'Application has no email' }

  const prevStatus = applicationRow.status || 'new'
  const note = adminNote?.trim() || applicationRow.admin_note || null
  const now = nowIso()

  await db.run(
    `UPDATE accelerator_applications
     SET status = 'accepted', admin_note = COALESCE(?, admin_note), updated_at = ?
     WHERE id = ?`,
    [note, now, applicationRow.id]
  )

  const access = await grantCourseAccess({
    email,
    courseId: ACCELERATOR_COURSE_ID,
    courseTitle: ACCELERATOR_COURSE_TITLE,
    provider: 'application_accept',
  })

  const appUrl = config.appUrl.replace(/\/$/, '')
  const registerUrl = `${appUrl}/register`
  const loginUrl = `${appUrl}/login`
  const courseUrl = `${appUrl}${ACCELERATOR_COURSE_PATH}`
  const forgotUrl = `${appUrl}/forgot-password`

  const telegramData = {
    firstName: applicationRow.first_name,
    lastName: applicationRow.last_name,
    courseTitle: ACCELERATOR_COURSE_TITLE,
    email,
    telegram: applicationRow.telegram,
    registerUrl,
    loginUrl,
    courseUrl,
    forgotUrl,
    targetPath: ACCELERATOR_COURSE_PATH,
    userCreated: access.userCreated,
    alreadyHadAccess: access.alreadyHadAccess,
    adminNote: note,
    acceptedAt: now,
  }

  let telegramSent = false
  const chatId = await resolveTelegramChatId(db, email, applicationRow.telegram)
  if (chatId) {
    telegramSent = await notifyTelegramChatId(chatId, 'application_accepted', telegramData)
  }
  if (!telegramSent) {
    telegramSent = await notifyTelegramByEmail(email, 'application_accepted', telegramData)
  }

  await createUserNotification(db, {
    email,
    type: 'application_status',
    status: 'accepted',
    courseTitle: ACCELERATOR_COURSE_TITLE,
    targetPath: ACCELERATOR_COURSE_PATH,
    message: note || 'Поздравляем! Заявка на AI Accelerator одобрена. Доступ к курсу открыт.',
    reviewedAt: now,
  })

  sheetsTrack.trackApplication({
    email,
    firstName: applicationRow.first_name,
    lastName: applicationRow.last_name,
    telegram: applicationRow.telegram,
    status: 'accepted',
    adminNote: note,
    action: `админ: accepted${actorRole ? ` (${actorRole})` : ''}`,
    applicationId: applicationRow.id,
  }).catch(() => {})

  return {
    ok: true,
    applicationId: applicationRow.id,
    prevStatus,
    access,
    telegramSent,
    telegramHint: telegramSent
      ? null
      : 'Telegram не отправлен — попросите студента написать /start боту @InsiderAcademyNotifyBot и привязать ID из кабинета.',
  }
}
