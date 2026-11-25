import crypto from 'crypto'
import { config } from '../config.js'
import { getDb, parseJson } from '../db.js'
import { validatePromoCode } from './promoCodes.js'

/**
 * Discounts a buyer can earn, in one place:
 *
 *  - a friend who arrives by someone's referral link gets FRIEND_PERCENT off
 *    their first purchase, applied by the checkout without a code;
 *  - when that friend's first purchase settles, the person who invited them
 *    gets a single-use REFERRER_PERCENT code. It switches on only after the
 *    refund window, and a refund within it cancels the code;
 *  - every settled purchase earns the buyer a single-use NEXT_PERCENT code for
 *    the next one, valid NEXT_DAYS.
 *
 * One discount per order: the checkout takes the biggest one available,
 * never two stacked.
 */
export const FRIEND_PERCENT = 10
export const REFERRER_PERCENT = 15
export const NEXT_PERCENT = 15
export const NEXT_DAYS = 14
export const REFUND_WINDOW_DAYS = 14
export const REFERRER_CODE_DAYS = 90

const DAY = 24 * 60 * 60 * 1000

function derivedCode(prefix, key) {
  const digest = crypto.createHmac('sha256', config.jwtSecret).update(`${prefix}:${key}`).digest('hex').slice(0, 8).toUpperCase()
  return `${prefix}-${digest}`
}

export const nextPurchaseCode = (paymentId) => derivedCode('NEXT', paymentId)
export const referrerRewardCode = (referralId) => derivedCode('FRIEND', referralId)

/** Has this person ever paid (a refund still counts: the first purchase is spent)? */
async function hasPurchased(db, { userId, email }) {
  const row = await db.get(
    "SELECT 1 AS paid FROM payments WHERE (user_id = ? OR lower(email) = lower(?)) AND status IN ('completed', 'refunded') LIMIT 1",
    [userId ?? -1, email || '']
  )
  return Boolean(row)
}

/**
 * Links a buyer to the friend whose code they arrived with. Only before the
 * buyer's first purchase, never to themselves, and never twice: the first
 * referral sticks.
 */
export async function attachReferral(db, { userId, email, code }) {
  const ref = String(code || '').trim().toUpperCase()
  if (!ref || !email) return { attached: false, reason: 'no_code' }
  const existing = await db.get('SELECT * FROM referrals WHERE lower(referred_email) = lower(?) LIMIT 1', [email])
  if (existing) return { attached: true, existing: true, referral: existing }
  const referrer = await db.get('SELECT id, email FROM users WHERE upper(personal_id) = ? LIMIT 1', [ref])
  if (!referrer) return { attached: false, reason: 'unknown_code' }
  if (Number(referrer.id) === Number(userId) || String(referrer.email).toLowerCase() === String(email).toLowerCase()) {
    return { attached: false, reason: 'self' }
  }
  if (await hasPurchased(db, { userId, email })) return { attached: false, reason: 'not_first_purchase' }
  await db.run(
    'INSERT INTO referrals (referrer_code, referrer_email, referred_email, date) VALUES (?, ?, ?, ?)',
    [ref, referrer.email, email, new Date().toISOString()]
  )
  const referral = await db.get('SELECT * FROM referrals WHERE lower(referred_email) = lower(?) LIMIT 1', [email])
  return { attached: true, referral }
}

/** FRIEND_PERCENT while a referred buyer has not bought anything yet. */
export async function friendDiscountPercent(db, { userId, email }) {
  const referral = await db.get(
    'SELECT referred_purchased FROM referrals WHERE lower(referred_email) = lower(?) LIMIT 1',
    [email || '']
  )
  if (!referral || Number(referral.referred_purchased)) return 0
  return (await hasPurchased(db, { userId, email })) ? 0 : FRIEND_PERCENT
}

function cents(value) {
  return Math.round(Number(value) * 100) / 100
}

/**
 * The price a buyer pays: the base amount less the single biggest discount
 * they qualify for — a valid promo code or the friend discount.
 */
export async function bestPrice(db, { userId, email, itemId, amountEur, promoCode, referralCode }) {
  const base = cents(amountEur)
  if (referralCode) await attachReferral(db, { userId, email, code: referralCode }).catch(() => null)

  const options = [{ kind: null, finalEur: base, discountEur: 0 }]
  let promoError = null
  if (promoCode) {
    const promo = await validatePromoCode({ code: promoCode, courseId: itemId, amountEur: base, userId, email })
    if (promo.valid) options.push({ kind: 'promo', code: promo.code, finalEur: cents(promo.finalEur), discountEur: cents(base - promo.finalEur) })
    else promoError = promo.error
  }
  const friend = await friendDiscountPercent(db, { userId, email })
  if (friend) {
    const discount = cents((base * friend) / 100)
    options.push({ kind: 'referral', percent: friend, finalEur: cents(base - discount), discountEur: discount })
  }
  const best = options.reduce((a, b) => (b.discountEur > a.discountEur ? b : a))
  return { ...best, baseEur: base, promoError }
}

/* ------------------------------ after payment ------------------------------ */

const rewardsKey = (paymentId) => `rewards:${paymentId}`

async function rememberRewards(db, paymentId, codes) {
  const row = await db.get('SELECT value FROM analytics WHERE key = ?', [rewardsKey(paymentId)])
  const list = [...new Set([...parseJson(row?.value, []), ...codes])]
  await db.run(
    'INSERT INTO analytics (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [rewardsKey(paymentId), JSON.stringify(list)]
  )
}

async function issueCode(db, { code, percent, validFrom, validUntil }) {
  const existing = await db.get('SELECT code, valid_from, valid_until FROM promo_codes WHERE code = ?', [code])
  if (existing) return { code, validFrom: existing.valid_from, validUntil: existing.valid_until, created: false }
  await db.run(
    `INSERT INTO promo_codes (code, discount_percent, max_uses, valid_from, valid_until, active, created_at)
     VALUES (?, ?, 1, ?, ?, 1, ?)`,
    [code, percent, validFrom, validUntil, new Date().toISOString()]
  )
  return { code, validFrom, validUntil, created: true }
}

/**
 * Runs once when a payment first settles. Returns what to tell the buyer and,
 * when they came by referral, whom to thank and with which code.
 */
export async function rewardSettledPayment(db, payment, now = Date.now()) {
  const next = await issueCode(db, {
    code: nextPurchaseCode(payment.id),
    percent: NEXT_PERCENT,
    validFrom: new Date(now).toISOString(),
    validUntil: new Date(now + NEXT_DAYS * DAY).toISOString(),
  })
  const codes = [next.code]

  let referrer = null
  const referral = await db.get(
    'SELECT * FROM referrals WHERE lower(referred_email) = lower(?) AND referred_purchased = 0 LIMIT 1',
    [payment.email || '']
  )
  if (referral) {
    await db.run('UPDATE referrals SET referred_purchased = 1 WHERE id = ?', [referral.id])
    const from = now + REFUND_WINDOW_DAYS * DAY
    const reward = await issueCode(db, {
      code: referrerRewardCode(referral.id),
      percent: REFERRER_PERCENT,
      validFrom: new Date(from).toISOString(),
      validUntil: new Date(from + REFERRER_CODE_DAYS * DAY).toISOString(),
    })
    codes.push(reward.code)
    referrer = { email: referral.referrer_email, ...reward }
  }
  await rememberRewards(db, payment.id, codes)
  return { next, referrer }
}

/** A refunded or charged-back payment cancels the codes it earned. */
export async function cancelPaymentRewards(db, paymentId) {
  const row = await db.get('SELECT value FROM analytics WHERE key = ?', [rewardsKey(paymentId)])
  const codes = parseJson(row?.value, [])
  for (const code of codes) await db.run('UPDATE promo_codes SET active = 0 WHERE code = ?', [code])
  return codes.length
}

/** What the cabinet shows: the link, who came, and the codes this person holds. */
export async function rewardsFor(db, { userId, email }) {
  const user = await db.get('SELECT personal_id FROM users WHERE id = ?', [userId])
  const invited = await db.all(
    'SELECT referred_purchased FROM referrals WHERE lower(referrer_email) = lower(?)',
    [email || '']
  )
  const referrals = await db.all('SELECT id FROM referrals WHERE lower(referrer_email) = lower(?)', [email || ''])
  const payments = await db.all(
    "SELECT id FROM payments WHERE user_id = ? AND status = 'completed' ORDER BY completed_at DESC LIMIT 50",
    [userId]
  )
  const mine = [
    ...payments.map((p) => nextPurchaseCode(p.id)),
    ...referrals.map((r) => referrerRewardCode(r.id)),
  ]
  const codes = []
  for (const code of mine) {
    const row = await db.get('SELECT * FROM promo_codes WHERE code = ?', [code])
    if (!row) continue
    const now = Date.now()
    const status = !row.active
      ? 'cancelled'
      : row.used_count >= (row.max_uses ?? 1)
        ? 'used'
        : row.valid_until && new Date(row.valid_until).getTime() < now
          ? 'expired'
          : row.valid_from && new Date(row.valid_from).getTime() > now
            ? 'pending'
            : 'active'
    codes.push({
      code: row.code,
      percent: Number(row.discount_percent),
      kind: row.code.startsWith('FRIEND-') ? 'referrer' : 'next',
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      status,
    })
  }
  return {
    referralCode: user?.personal_id || null,
    friendPercent: FRIEND_PERCENT,
    referrerPercent: REFERRER_PERCENT,
    nextPercent: NEXT_PERCENT,
    invited: invited.length,
    purchased: invited.filter((r) => Number(r.referred_purchased)).length,
    friendDiscount: await friendDiscountPercent(db, { userId, email }),
    codes,
  }
}

export { getDb }
