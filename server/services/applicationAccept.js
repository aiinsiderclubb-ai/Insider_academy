import { nowIso } from '../db/time.js'
import { grantCourseAccess } from './grantCourse.js'
import { createUserNotification } from './notifications.js'
import * as sheetsTrack from './sheetsTrack.js'
import { prelaunchServiceGuard } from '../middleware/prelaunch.js'

export const ACCELERATOR_COURSE_ID = 'ai-insider-accelerator'
export const ACCELERATOR_COURSE_TITLE = 'AI Insider Accelerator'
export const ACCELERATOR_COURSE_PATH = '/courses/ai-insider-accelerator'

export async function approveAcceleratorApplication(db, applicationRow, { adminNote, actorRole }) {
  const blocked = prelaunchServiceGuard()
  if (blocked) return blocked
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

  // Two letters: the approval now, and the TODAYFREE gift a little later.
  try {
    const { queueEmail } = await import('./emailQueue.js')
    const { OFFER_DELAY_HOURS, TODAY_FREE_CODE } = await import('./todayFree.js')
    const name = applicationRow.first_name || applicationRow.name || ''
    const locale = applicationRow.locale || 'ru'
    await queueEmail({ to: email, template: 'application_accepted', payload: { name, locale } })
    await queueEmail({
      to: email,
      template: 'todayfree_offer',
      payload: { name, locale, code: TODAY_FREE_CODE },
      sendAfter: new Date(Date.now() + OFFER_DELAY_HOURS * 3_600_000).toISOString(),
    })
    const { processEmailQueue } = await import('./emailQueue.js')
    processEmailQueue(20).catch(() => {})
  } catch (err) {
    console.warn('[application accept] mail:', err.message)
  }

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
