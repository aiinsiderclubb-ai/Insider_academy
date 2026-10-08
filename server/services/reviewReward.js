import crypto from 'crypto'
import { config } from '../config.js'
import { getDb, parseJson } from '../db.js'

/** What a buyer gets for telling us how the purchase went. */
export const REVIEW_REWARD_PERCENT = 10
export const REVIEW_REWARD_DAYS = 30

/**
 * One code per person and purchase, derived rather than stored.
 *
 * Deriving it means "has this review already been rewarded?" is a lookup of the
 * code itself, with no extra table — and a second review of the same purchase
 * lands on the same code instead of minting another discount. The secret keeps
 * the code from being guessable from a user id and a product id.
 */
export function reviewRewardCode(userId, itemId) {
  const digest = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(`review-reward:${userId}:${itemId}`)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase()
  return `THANKS-${digest}`
}

/**
 * Creates the buyer's discount for a review, once.
 *
 * Returns the code either way; `created` tells the caller whether this call
 * issued it, so the email with the code is sent once and not on every edit.
 * The code is good for one purchase: a reward shared in a chat should not
 * become a public coupon.
 */
export async function issueReviewReward(db, { userId, itemId }) {
  const code = reviewRewardCode(userId, itemId)
  const existing = await db.get('SELECT code, valid_until FROM promo_codes WHERE code = ?', [code])
  if (existing) return { code, validUntil: existing.valid_until, created: false }

  const now = new Date()
  const validUntil = new Date(now.getTime() + REVIEW_REWARD_DAYS * 24 * 60 * 60 * 1000).toISOString()
  await db.run(
    `INSERT INTO promo_codes (code, discount_percent, max_uses, valid_from, valid_until, active, created_at)
     VALUES (?, ?, 1, ?, ?, 1, ?)`,
    [code, REVIEW_REWARD_PERCENT, now.toISOString(), validUntil, now.toISOString()]
  )
  return { code, validUntil, created: true }
}

/* -------------------------------------------------------------------------- */

const pendingKey = (paymentId) => `promo_pending:${paymentId}`

/**
 * Remembers which code a checkout was priced with.
 *
 * A code is spent when the money arrives, not when the pay page opens —
 * otherwise closing the tab would burn a single-use reward. The payments table
 * has no column for it, so the pairing lives in the key-value table until the
 * payment settles.
 */
export async function rememberPromoForPayment(db, paymentId, code) {
  await db.run(
    `INSERT INTO analytics (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [pendingKey(paymentId), JSON.stringify(String(code).trim().toUpperCase())]
  )
}

/** Spends the code a settled payment was priced with, if there was one. */
export async function consumePromoForPayment(paymentId, db = getDb()) {
  const row = await db.get('SELECT value FROM analytics WHERE key = ?', [pendingKey(paymentId)])
  const code = parseJson(row?.value, null)
  if (!code) return null
  await db.run('UPDATE promo_codes SET used_count = used_count + 1 WHERE UPPER(code) = ?', [code])
  await db.run('DELETE FROM analytics WHERE key = ?', [pendingKey(paymentId)])
  return code
}
