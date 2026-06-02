import { getDb } from '../db.js'

export async function validatePromoCode({ code, courseId, amountEur }) {
  const db = getDb()
  const normalized = String(code || '').trim().toUpperCase()
  if (!normalized) return { valid: false, error: 'Code required' }

  const row = await db.get('SELECT * FROM promo_codes WHERE UPPER(code) = ?', [normalized])
  if (!row) return { valid: false, error: 'Invalid promo code' }
  if (!row.active) return { valid: false, error: 'Promo code inactive' }

  const now = Date.now()
  if (row.valid_from && new Date(row.valid_from).getTime() > now) {
    return { valid: false, error: 'Promo not started yet' }
  }
  if (row.valid_until && new Date(row.valid_until).getTime() < now) {
    return { valid: false, error: 'Promo expired' }
  }
  if (row.max_uses != null && row.used_count >= row.max_uses) {
    return { valid: false, error: 'Promo limit reached' }
  }
  if (row.course_ids) {
    const allowed = JSON.parse(row.course_ids)
    if (Array.isArray(allowed) && allowed.length && courseId && !allowed.includes(courseId)) {
      return { valid: false, error: 'Promo not valid for this course' }
    }
  }

  const base = Number(amountEur) || 0
  let discountEur = 0
  if (row.discount_percent) {
    discountEur = Math.round((base * Number(row.discount_percent)) / 100)
  }
  if (row.discount_eur) {
    discountEur = Math.max(discountEur, Number(row.discount_eur))
  }
  const finalEur = Math.max(0, base - discountEur)

  return {
    valid: true,
    code: row.code,
    discountEur,
    finalEur,
    discountPercent: row.discount_percent,
  }
}

export async function consumePromoCode(code) {
  const db = getDb()
  const normalized = String(code || '').trim().toUpperCase()
  await db.run(
    'UPDATE promo_codes SET used_count = used_count + 1 WHERE UPPER(code) = ?',
    [normalized]
  )
}
