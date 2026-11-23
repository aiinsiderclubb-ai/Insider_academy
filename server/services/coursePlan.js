/**
 * Paid courses sell in two plans:
 *
 * - `self`   — every lesson and resource; assignments are for self-checking,
 *              nobody reviews them and there is no mentor;
 * - `mentor` — the same course plus assignment review and a mentor, priced at
 *              about twice the self-study price.
 *
 * The plan is recorded on the payment. A purchase with no planned payment
 * behind it (bought before plans existed, opened by a course pack, granted by
 * an admin) keeps everything it had, so it counts as `mentor`.
 */

export const PLANS = ['self', 'mentor']

export function normalizePlan(value) {
  return value === 'mentor' ? 'mentor' : 'self'
}

/** course id → plan, for every course this user owns. */
export async function coursePlans(db, userId) {
  const plans = new Map()
  if (!userId) return plans
  const rows = await db.all(
    "SELECT course_id, plan FROM payments WHERE user_id = ? AND status = 'completed' AND plan IS NOT NULL",
    [userId]
  )
  for (const row of rows) {
    if (row.plan === 'mentor' || plans.get(row.course_id) === 'mentor') plans.set(row.course_id, 'mentor')
    else plans.set(row.course_id, 'self')
  }
  return plans
}

/** The plan this user holds for a course: null when they do not own it. */
export async function coursePlanFor(db, userId, courseId) {
  if (!userId || !courseId) return null
  const owned = await db.get('SELECT id FROM purchases WHERE user_id = ? AND course_id = ?', [userId, courseId])
  if (!owned) return null
  const plans = await coursePlans(db, userId)
  return plans.get(courseId) || 'mentor'
}

/**
 * What a course costs in a plan. Someone who already owns the self-study plan
 * and moves up to the mentor plan pays only the difference.
 */
export function planPrice(course, plan, currentPlan = null) {
  const self = Number(course?.priceEur)
  const mentor = Number(course?.mentorPriceEur)
  if (!Number.isFinite(mentor) || mentor <= 0) return { plan: null, amount: self, upgrade: false }
  if (plan !== 'mentor') return { plan: 'self', amount: self, upgrade: false }
  if (currentPlan === 'self') return { plan: 'mentor', amount: Math.max(0, mentor - self), upgrade: true }
  return { plan: 'mentor', amount: mentor, upgrade: false }
}
