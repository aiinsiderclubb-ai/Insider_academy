import { Router } from 'express'
import { getDb } from '../db.js'
import { config } from '../config.js'
import { requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { logAudit } from '../services/auditLog.js'
import { isTributeEnabled, listTributeSubscriptions } from '../services/tribute.js'
import { grantMembership, revokeMembership, syncTributeSubscribers } from '../services/memberships.js'

/*
 * Studio controls for Club / Pro. Admin only: these hand out paid access.
 * Mounted under /api/admin so the web proxy sends the admin bearer here and
 * never a learner's.
 */
const router = Router()
const admin = requireAdmin('admin')

async function userByEmail(db, email) {
  const clean = String(email || '').trim().toLowerCase()
  if (!clean) return null
  return db.get('SELECT id, email, telegram_chat_id FROM users WHERE LOWER(email) = ?', [clean])
}

function publicRow(row) {
  return {
    id: row.id,
    tier: row.tier,
    provider: row.provider,
    status: row.status,
    period: row.period,
    expiresAt: row.expires_at,
    telegramUserId: row.telegram_user_id,
    cancelReason: row.cancel_reason,
    createdAt: row.created_at,
  }
}

/** Every membership that could apply to one account, newest first. */
router.get('/', admin, asyncHandler(async (req, res) => {
  const db = getDb()
  const user = await userByEmail(db, req.query.email)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const telegram = user.telegram_chat_id ? String(user.telegram_chat_id) : null
  const rows = telegram
    ? await db.all(
        'SELECT * FROM memberships WHERE user_id = ? OR telegram_user_id = ? ORDER BY expires_at DESC',
        [user.id, telegram]
      )
    : await db.all('SELECT * FROM memberships WHERE user_id = ? ORDER BY expires_at DESC', [user.id])
  res.json({ user: { id: user.id, email: user.email, telegramLinked: Boolean(telegram) }, memberships: rows.map(publicRow) })
}))

router.post('/grant', admin, asyncHandler(async (req, res) => {
  const db = getDb()
  const user = await userByEmail(db, req.body?.email)
  if (!user) return res.status(404).json({ error: 'User not found', errorRu: 'Пользователь с такой почтой не найден' })

  const tier = String(req.body?.tier || '').toLowerCase()
  try {
    const result = await grantMembership(db, { userId: user.id, tier, days: Number(req.body?.days) })
    await logAudit({
      actorEmail: `admin:${req.adminRole}`,
      action: 'membership.grant',
      targetType: 'user',
      targetId: String(user.id),
      meta: { email: user.email, ...result },
    })
    res.status(201).json(result)
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
}))

router.post('/:id/revoke', admin, asyncHandler(async (req, res) => {
  const revoked = await revokeMembership(getDb(), req.params.id)
  if (!revoked) return res.status(404).json({ error: 'Membership not found' })
  await logAudit({
    actorEmail: `admin:${req.adminRole}`,
    action: 'membership.revoke',
    targetType: 'membership',
    targetId: req.params.id,
  })
  res.json({ ok: true })
}))

/**
 * The account's subscriptions as Tribute lists them, next to the tier each is
 * mapped to here. This is where the ids for TRIBUTE_SUBSCRIPTION_MAP come from,
 * so nobody has to dig them out of the Tribute dashboard.
 */
router.get('/tribute/subscriptions', admin, asyncHandler(async (_req, res) => {
  if (!isTributeEnabled()) return res.status(409).json({ error: 'TRIBUTE_API_KEY is not configured' })
  const subscriptions = await listTributeSubscriptions()
  res.json({
    subscriptions: subscriptions.map((sub) => ({
      id: sub.subscriptionId,
      name: sub.name,
      currency: sub.currency,
      periods: sub.periods,
      mappedTier: config.tribute.subscriptionMap[String(sub.subscriptionId)] || null,
    })),
  })
}))

/** Brings in everyone already subscribed. Safe to run any number of times. */
router.post('/tribute/sync', admin, asyncHandler(async (req, res) => {
  if (!isTributeEnabled()) return res.status(409).json({ error: 'TRIBUTE_API_KEY is not configured' })
  if (!Object.keys(config.tribute.subscriptionMap).length) {
    return res.status(409).json({ error: 'TRIBUTE_SUBSCRIPTION_MAP is empty — nothing to sync' })
  }
  const summary = await syncTributeSubscribers(getDb())
  await logAudit({
    actorEmail: `admin:${req.adminRole}`,
    action: 'membership.tribute_sync',
    targetType: 'memberships',
    meta: summary,
  })
  res.json(summary)
}))

export default router
