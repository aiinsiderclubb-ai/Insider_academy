import crypto from 'crypto'
import { config } from '../config.js'
import { nowIso } from '../db/time.js'
import { listTributeSubscribers } from './tribute.js'

/*
 * Club and Pro memberships.
 *
 * Tribute sells them as subscriptions to the closed Telegram channel and
 * reports every change — new, renewed, cancelled — by webhook. It identifies
 * the buyer only by Telegram id, never by the email on the site, so a row is
 * keyed by telegram_user_id and matched to an account through the Telegram the
 * account has linked (users.telegram_chat_id, which for the bot's private chat
 * is the same id). Paying before linking is therefore fine: the membership is
 * picked up the moment the Telegram is linked, with no claim step.
 *
 * Access lasts until expires_at regardless of status. A cancelled subscription
 * has still paid for its current period, and taking that away early would be
 * taking money for nothing.
 */

const RANK = { club: 1, pro: 2 }

export const TRIBUTE_EVENTS = {
  new_subscription: 'new',
  newSubscription: 'new',
  renewed_subscription: 'renewed',
  renewedSubscription: 'renewed',
  cancelled_subscription: 'cancelled',
  cancelledSubscription: 'cancelled',
}

function isoOrNull(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function tierFor(subscriptionId) {
  return config.tribute.subscriptionMap[String(subscriptionId)] || null
}

/**
 * The membership a user holds right now, or null. The higher tier wins; within
 * a tier, the one that runs longest.
 */
export async function resolveMembership(db, user) {
  if (!user?.id) return null
  const telegram = user.telegram_chat_id ? String(user.telegram_chat_id) : null
  // Two queries rather than `? IS NOT NULL` in one: Postgres cannot infer a
  // type for a bare NULL parameter and rejects that form outright.
  const rows = telegram
    ? await db.all(
        `SELECT tier, status, expires_at, provider FROM memberships
         WHERE expires_at > ? AND (user_id = ? OR telegram_user_id = ?)`,
        [nowIso(), user.id, telegram]
      )
    : await db.all(
        'SELECT tier, status, expires_at, provider FROM memberships WHERE expires_at > ? AND user_id = ?',
        [nowIso(), user.id]
      )
  let best = null
  for (const row of rows) {
    if (!RANK[row.tier]) continue
    if (
      !best ||
      RANK[row.tier] > RANK[best.tier] ||
      (RANK[row.tier] === RANK[best.tier] && row.expires_at > best.expires_at)
    ) {
      best = row
    }
  }
  if (!best) return null
  return {
    tier: best.tier,
    expiresAt: best.expires_at,
    // Whether it will renew on its own — false once cancelled, or for a
    // grant made by hand in the Studio.
    renewing: best.status === 'active' && best.provider === 'tribute',
  }
}

/**
 * One write path for every source — webhook, sync and Studio grant.
 *
 * `authoritative` is for Tribute's own list of subscribers: that is the
 * current truth, so its expiry is taken as given. A webhook is not: they can
 * arrive late or out of order, so there the later expiry of the two wins and a
 * delayed old event can never cut short a period that was already extended.
 */
async function upsertMembership(db, row, { authoritative = false } = {}) {
  const now = nowIso()
  const existing = await db.get(
    `SELECT id, expires_at, user_id FROM memberships
     WHERE provider = ? AND provider_subscription_id = ? AND telegram_user_id = ?`,
    [row.provider, row.providerSubscriptionId, row.telegramUserId]
  )

  if (existing) {
    const expiresAt =
      authoritative || row.expiresAt > existing.expires_at ? row.expiresAt : existing.expires_at
    await db.run(
      `UPDATE memberships
       SET tier = ?, period = ?, status = ?, expires_at = ?, cancel_reason = ?,
           user_id = COALESCE(?, user_id), updated_at = ?
       WHERE id = ?`,
      [row.tier, row.period ?? null, row.status, expiresAt, row.cancelReason ?? null, row.userId ?? null, now, existing.id]
    )
    return { id: existing.id, expiresAt, created: false }
  }

  const id = crypto.randomUUID()
  await db.run(
    `INSERT INTO memberships
       (id, provider, provider_subscription_id, telegram_user_id, user_id, tier, period, status,
        expires_at, cancel_reason, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      row.provider,
      row.providerSubscriptionId,
      row.telegramUserId,
      row.userId ?? null,
      row.tier,
      row.period ?? null,
      row.status,
      row.expiresAt,
      row.cancelReason ?? null,
      now,
      now,
    ]
  )
  return { id, expiresAt: row.expiresAt, created: true }
}

async function userByTelegram(db, telegramUserId) {
  return db.get('SELECT id FROM users WHERE telegram_chat_id = ?', [telegramUserId])
}

/** Applies one Tribute subscription webhook. Never throws for bad input. */
export async function applyTributeSubscriptionEvent(db, kind, payload = {}) {
  const tier = tierFor(payload.subscription_id)
  if (!tier) return { status: 'ignored', reason: 'unmapped_subscription', subscriptionId: payload.subscription_id ?? null }

  const telegramUserId = payload.telegram_user_id != null ? String(payload.telegram_user_id) : null
  if (!telegramUserId) return { status: 'ignored', reason: 'no_telegram_user' }

  const expiresAt = isoOrNull(payload.expires_at)
  if (!expiresAt) return { status: 'ignored', reason: 'no_expiry' }

  const user = await userByTelegram(db, telegramUserId)
  const result = await upsertMembership(db, {
    provider: 'tribute',
    providerSubscriptionId: String(payload.subscription_id),
    telegramUserId,
    userId: user?.id ?? null,
    tier,
    period: payload.period ?? null,
    status: kind === 'cancelled' ? 'cancelled' : 'active',
    expiresAt,
    cancelReason: kind === 'cancelled' ? String(payload.cancel_reason || '').slice(0, 300) || null : null,
  })

  return { status: 'ok', tier, kind, userId: user?.id ?? null, linked: Boolean(user), expiresAt: result.expiresAt }
}

/**
 * Pulls every subscriber of every mapped subscription from Tribute. Run once
 * after going live, to bring in people who subscribed before the site listened
 * for webhooks, and any time a webhook is suspected lost. Idempotent.
 */
export async function syncTributeSubscribers(db, { fetchSubscribers = listTributeSubscribers } = {}) {
  const summary = { subscriptions: 0, subscribers: 0, active: 0, linked: 0, skipped: 0 }
  for (const [subscriptionId, tier] of Object.entries(config.tribute.subscriptionMap)) {
    summary.subscriptions += 1
    const subscribers = await fetchSubscribers(subscriptionId)
    for (const sub of subscribers) {
      summary.subscribers += 1
      const telegramUserId = sub.telegramUserId != null ? String(sub.telegramUserId) : null
      const expiresAt = isoOrNull(sub.expireAt)
      if (!telegramUserId || !expiresAt) {
        summary.skipped += 1
        continue
      }
      const user = await userByTelegram(db, telegramUserId)
      await upsertMembership(
        db,
        {
          provider: 'tribute',
          providerSubscriptionId: String(sub.subscriptionId ?? subscriptionId),
          telegramUserId,
          userId: user?.id ?? null,
          tier,
          status: sub.status === 'active' ? 'active' : 'cancelled',
          expiresAt,
        },
        { authoritative: true }
      )
      if (expiresAt > nowIso()) summary.active += 1
      if (user) summary.linked += 1
    }
  }
  return summary
}

/** A membership granted by hand — support, a gift, or testing before launch. */
export async function grantMembership(db, { userId, tier, days }) {
  if (!RANK[tier]) throw Object.assign(new Error('Unknown tier'), { status: 400 })
  const span = Number(days)
  if (!Number.isInteger(span) || span < 1 || span > 3660) {
    throw Object.assign(new Error('days must be a whole number from 1 to 3660'), { status: 400 })
  }
  const expiresAt = new Date(Date.now() + span * 86_400_000).toISOString()
  const id = crypto.randomUUID()
  await upsertMembership(db, {
    provider: 'admin',
    providerSubscriptionId: id,
    telegramUserId: null,
    userId,
    tier,
    status: 'active',
    expiresAt,
  })
  return { tier, expiresAt }
}

/** Ends a membership now. Kept as a row, so the history stays readable. */
export async function revokeMembership(db, id) {
  const row = await db.get('SELECT id FROM memberships WHERE id = ?', [id])
  if (!row) return false
  const now = nowIso()
  await db.run("UPDATE memberships SET expires_at = ?, status = 'revoked', updated_at = ? WHERE id = ?", [now, now, id])
  return true
}
