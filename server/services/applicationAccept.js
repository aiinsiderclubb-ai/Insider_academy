import { nowIso } from '../db/time.js'
import { grantCourseAccess } from './grantCourse.js'
import { createUserNotification } from './notifications.js'
import * as sheetsTrack from './sheetsTrack.js'

export const ACCELERATOR_COURSE_ID = 'ai-insider-accelerator'
export const ACCELERATOR_COURSE_TITLE = 'AI Insider Accelerator'
export const ACCELERATOR_COURSE_PATH = '/courses/ai-insider-accelerator'

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
    accessGranted: true,
  }).catch(() => {})

  return {
    ok: true,
    applicationId: applicationRow.id,
    prevStatus,
    access,
    telegramSent: false,
    telegramHint: null,
  }
}
