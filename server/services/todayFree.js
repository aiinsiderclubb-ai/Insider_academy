/**
 * TODAYFREE — a thank-you for an approved application.
 *
 * Approval sends a welcome letter right away and, OFFER_DELAY_HOURS later, a
 * second one with the code. The code takes the first paid course for nothing
 * (the self-study price comes off; during the launch window the mentor plan
 * costs the same, so it is free too). It works only for that person, only
 * until OFFER_HOURS after the second letter, only once, and only while they
 * have not bought a paid course.
 */
import { courses as courseCatalog } from '../../src/data/courses.js'

export const TODAY_FREE_CODE = 'TODAYFREE'
export const OFFER_DELAY_HOURS = 2
export const OFFER_HOURS = 24

const HOUR = 3_600_000
const isPaidCourse = (id) => Number(courseCatalog.find((c) => c.id === id)?.priceEur) > 0

export function isTodayFree(code) {
  return String(code || '').trim().toUpperCase() === TODAY_FREE_CODE
}

/** When the code stops working for this person, or null when it does not apply to them. */
export async function todayFreeWindow(db, { userId = null, email = null } = {}, now = Date.now()) {
  let mail = email
  let id = userId
  if (id != null && !mail) mail = (await db.get('SELECT email FROM users WHERE id = ?', [id]))?.email
  if (!mail) return null
  if (id == null) id = (await db.get('SELECT id FROM users WHERE lower(email) = lower(?)', [mail]))?.id ?? null

  const app = await db.get(
    "SELECT updated_at, date FROM accelerator_applications WHERE lower(email) = lower(?) AND status = 'accepted' ORDER BY updated_at DESC LIMIT 1",
    [mail]
  ).catch(() => null)
  if (!app) return null
  const acceptedAt = Date.parse(app.updated_at || app.date)
  if (!Number.isFinite(acceptedAt)) return null
  const endsAt = acceptedAt + (OFFER_DELAY_HOURS + OFFER_HOURS) * HOUR
  if (now >= endsAt) return null

  if (id != null) {
    const owned = await db.all('SELECT course_id FROM purchases WHERE user_id = ?', [id])
    if (owned.some((row) => isPaidCourse(row.course_id))) return null
  }
  const used = await db.get(
    "SELECT 1 AS used FROM payments WHERE (user_id = ? OR lower(email) = lower(?)) AND external_id LIKE 'TODAYFREE:%' AND status = 'completed' LIMIT 1",
    [id ?? -1, mail]
  )
  if (used) return null
  return { code: TODAY_FREE_CODE, endsAt: new Date(endsAt).toISOString() }
}

/** The promo check for TODAYFREE, shaped like validatePromoCode's answer. */
export async function validateTodayFree(db, { courseId, amountEur, userId, email }) {
  if (!isPaidCourse(courseId)) {
    return { valid: false, error: 'TODAYFREE is for a paid course', errorRu: 'Промокод действует на платный курс.' }
  }
  if (userId == null && !email) {
    return { valid: false, error: 'Sign in to use TODAYFREE', errorRu: 'Войдите в аккаунт, чтобы применить промокод.' }
  }
  const window = await todayFreeWindow(db, { userId, email })
  if (!window) {
    return { valid: false, error: 'TODAYFREE is not available for this account', errorRu: 'Этот промокод недоступен для вашего аккаунта или уже истёк.' }
  }
  const base = Number(amountEur) || 0
  const self = Number(courseCatalog.find((c) => c.id === courseId)?.priceEur) || 0
  const discountEur = Math.min(base, self)
  return {
    valid: true,
    code: TODAY_FREE_CODE,
    discountEur,
    finalEur: Math.max(0, Math.round((base - discountEur) * 100) / 100),
    discountPercent: base ? Math.round((discountEur / base) * 100) : 100,
    endsAt: window.endsAt,
  }
}
