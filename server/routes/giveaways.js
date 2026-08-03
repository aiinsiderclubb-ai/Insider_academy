import { Router } from 'express'
import crypto from 'node:crypto'
import { getDb } from '../db.js'
import { requireUser, optionalUser } from '../middleware/auth.js'
import { getServerGiveaway, SERVER_GIVEAWAYS } from '../data/giveaways.js'
import { checkChannelMembership } from '../services/telegramChannel.js'
import { nowIso } from '../db/time.js'
import { rateLimitMiddleware } from '../middleware/rateLimit.js'
import {
  GIVEAWAY_REFERRAL_CHANCES,
  GIVEAWAY_SHARE_CHANCES,
  totalGiveawayChances,
} from '../data/giveawayChances.js'

const router = Router()

async function getParticipantCount(db, giveawayId) {
  const row = await db.get(
    'SELECT COUNT(*) AS c FROM giveaway_entries WHERE giveaway_id = ?',
    [giveawayId]
  )
  return Number(row?.c || 0)
}

async function getUserEntry(db, giveawayId, userId) {
  if (!userId) return null
  return db.get(
    'SELECT id, created_at AS createdAt FROM giveaway_entries WHERE giveaway_id = ? AND user_id = ?',
    [giveawayId, userId]
  )
}

async function getChanceState(db, giveawayId, userId, entered = true) {
  if (!userId || !entered) {
    return { shared: false, referralCount: 0, bonusChances: 0, chances: 0 }
  }
  const rows = await db.all(
    `SELECT action_type AS actionType, COUNT(*) AS actionCount, COALESCE(SUM(chances), 0) AS chanceCount
     FROM giveaway_bonus_actions
     WHERE giveaway_id = ? AND beneficiary_user_id = ?
     GROUP BY action_type`,
    [giveawayId, userId]
  )
  const share = rows.find((row) => row.actionType === 'share')
  const referral = rows.find((row) => row.actionType === 'referral')
  const bonusChances = rows.reduce((sum, row) => sum + Number(row.chanceCount || 0), 0)
  return {
    shared: Number(share?.actionCount || 0) > 0,
    referralCount: Number(referral?.actionCount || 0),
    bonusChances,
    chances: totalGiveawayChances(bonusChances),
  }
}

async function recordBonusAction(db, {
  giveawayId, beneficiaryUserId, actionUserId, actionType, chances,
}) {
  const existing = await db.get(
    `SELECT id FROM giveaway_bonus_actions
     WHERE giveaway_id = ? AND action_user_id = ? AND action_type = ?`,
    [giveawayId, actionUserId, actionType]
  )
  if (existing) return false
  try {
    await db.run(
      `INSERT INTO giveaway_bonus_actions
       (id, giveaway_id, beneficiary_user_id, action_user_id, action_type, chances, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), giveawayId, beneficiaryUserId, actionUserId, actionType, chances, nowIso()]
    )
    return true
  } catch (err) {
    const raced = await db.get(
      `SELECT id FROM giveaway_bonus_actions
       WHERE giveaway_id = ? AND action_user_id = ? AND action_type = ?`,
      [giveawayId, actionUserId, actionType]
    )
    if (raced) return false
    throw err
  }
}

async function resolveReferrer(db, giveawayId, referralCode, currentUserId) {
  const code = String(referralCode || '').trim().slice(0, 64)
  if (!code) return null
  let referrer = await db.get('SELECT id FROM users WHERE personal_id = ?', [code])
  if (!referrer && /^U\d+$/.test(code)) {
    referrer = await db.get('SELECT id FROM users WHERE id = ?', [Number(code.slice(1))])
  }
  if (!referrer || Number(referrer.id) === Number(currentUserId)) return null
  const entry = await getUserEntry(db, giveawayId, referrer.id)
  return entry ? referrer : null
}

async function buildGiveawayState(db, slug, userId) {
  const meta = getServerGiveaway(slug)
  if (!meta) return null

  const user = userId
    ? await db.get(
        'SELECT telegram_chat_id, telegram_username FROM users WHERE id = ?',
        [userId]
      )
    : null

  const entry = await getUserEntry(db, slug, userId)
  const chanceState = await getChanceState(db, slug, userId, Boolean(entry))
  const publishedResult = await db.get(
    `SELECT winner_telegram_username, participant_count, drawn_at, published_at
     FROM giveaway_results WHERE giveaway_id = ? AND status = 'published'`,
    [slug]
  )
  let channelSubscribed = false
  if (user?.telegram_chat_id) {
    const check = await checkChannelMembership(user.telegram_chat_id, meta.telegramChannel)
    channelSubscribed = Boolean(check.subscribed)
  }

  return {
    slug,
    status: meta.status,
    endsAt: meta.endsAt,
    participantCount: await getParticipantCount(db, slug),
    entered: Boolean(entry),
    enteredAt: entry?.createdAt || null,
    telegramConnected: Boolean(user?.telegram_chat_id),
    telegramUsername: user?.telegram_username || null,
    channelSubscribed,
    ...chanceState,
    telegramChannel: meta.telegramChannel,
    result: publishedResult ? {
      winnerTelegramUsername: publishedResult.winner_telegram_username
        ? `@${String(publishedResult.winner_telegram_username).replace(/^@/, '')}`
        : null,
      participantCount: Number(publishedResult.participant_count),
      drawnAt: publishedResult.drawn_at,
      publishedAt: publishedResult.published_at,
    } : null,
  }
}

const giveawayRateKey = (req) => `${req.userId || 'guest'}:${req.ip || 'unknown'}`
const verifyTelegramLimit = rateLimitMiddleware({ windowMs: 10 * 60_000, max: 10, keyFn: giveawayRateKey })
const enterLimit = rateLimitMiddleware({ windowMs: 10 * 60_000, max: 5, keyFn: giveawayRateKey })
const shareLimit = rateLimitMiddleware({ windowMs: 10 * 60_000, max: 5, keyFn: giveawayRateKey })

router.get('/', optionalUser, async (req, res) => {
  const db = getDb()
  const items = await Promise.all(
    Object.keys(SERVER_GIVEAWAYS).map((slug) => buildGiveawayState(db, slug, req.userId))
  )
  res.json(items.filter(Boolean))
})

router.get('/:slug', optionalUser, async (req, res) => {
  const state = await buildGiveawayState(getDb(), req.params.slug, req.userId)
  if (!state) return res.status(404).json({ error: 'Giveaway not found' })
  res.json(state)
})

router.post('/:slug/verify-telegram', requireUser, verifyTelegramLimit, async (req, res) => {
  const meta = getServerGiveaway(req.params.slug)
  if (!meta || meta.status !== 'active') {
    return res.status(404).json({ error: 'Giveaway not found or not active' })
  }

  const db = getDb()
  const user = await db.get(
    'SELECT telegram_chat_id, telegram_username FROM users WHERE id = ?',
    [req.userId]
  )
  if (!user?.telegram_chat_id) {
    return res.status(400).json({
      subscribed: false,
      error: 'Connect Telegram bot first',
      errorRu: 'Сначала подключите Telegram-бота в личном кабинете',
    })
  }

  const check = await checkChannelMembership(user.telegram_chat_id, meta.telegramChannel)
  res.json({
    subscribed: Boolean(check.subscribed),
    status: check.status || null,
    error: check.error || null,
    errorRu: check.errorRu || null,
  })
})

router.post('/:slug/enter', requireUser, enterLimit, async (req, res) => {
  const meta = getServerGiveaway(req.params.slug)
  if (!meta || meta.status !== 'active') {
    return res.status(404).json({ error: 'Giveaway not found or not active' })
  }
  if (meta.endsAt && new Date(meta.endsAt).getTime() < Date.now()) {
    return res.status(400).json({ error: 'Giveaway ended', errorRu: 'Розыгрыш завершён' })
  }

  const db = getDb()
  const user = await db.get(
    'SELECT id, email, telegram_chat_id, telegram_username FROM users WHERE id = ?',
    [req.userId]
  )
  if (!user?.telegram_chat_id) {
    return res.status(400).json({
      error: 'Connect Telegram bot first',
      errorRu: 'Подключите Telegram-бота в кабинете → раздел Telegram',
    })
  }

  const check = await checkChannelMembership(user.telegram_chat_id, meta.telegramChannel)
  if (!check.subscribed) {
    return res.status(403).json({
      error: 'Not subscribed to channel',
      errorRu: 'Подпишитесь на Telegram-канал AI Insider и нажмите «Проверить подписку»',
      detail: check.errorRu || check.error,
    })
  }

  const existing = await getUserEntry(db, req.params.slug, req.userId)
  if (existing) {
    const state = await buildGiveawayState(db, req.params.slug, req.userId)
    return res.json({ ok: true, alreadyEntered: true, ...state })
  }

  const id = `ge-${Date.now()}-${req.userId}`
  await db.run(
    `INSERT INTO giveaway_entries (id, giveaway_id, user_id, email, telegram_username, telegram_verified, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [id, req.params.slug, req.userId, user.email, user.telegram_username || null, nowIso()]
  )

  const referrer = await resolveReferrer(db, req.params.slug, req.body?.referralCode, req.userId)
  if (referrer) {
    await recordBonusAction(db, {
      giveawayId: req.params.slug,
      beneficiaryUserId: referrer.id,
      actionUserId: req.userId,
      actionType: 'referral',
      chances: GIVEAWAY_REFERRAL_CHANCES,
    })
  }

  const state = await buildGiveawayState(db, req.params.slug, req.userId)
  res.status(201).json({ ok: true, referralApplied: Boolean(referrer), ...state })
})

router.post('/:slug/share', requireUser, shareLimit, async (req, res) => {
  const meta = getServerGiveaway(req.params.slug)
  if (!meta || meta.status !== 'active') {
    return res.status(404).json({ error: 'Giveaway not found or not active' })
  }
  if (meta.endsAt && new Date(meta.endsAt).getTime() < Date.now()) {
    return res.status(400).json({ error: 'Giveaway ended', errorRu: 'Розыгрыш завершён' })
  }
  const db = getDb()
  const entry = await getUserEntry(db, req.params.slug, req.userId)
  if (!entry) {
    return res.status(409).json({ error: 'Enter giveaway first', errorRu: 'Сначала подтвердите участие в розыгрыше' })
  }
  const recorded = await recordBonusAction(db, {
    giveawayId: req.params.slug,
    beneficiaryUserId: req.userId,
    actionUserId: req.userId,
    actionType: 'share',
    chances: GIVEAWAY_SHARE_CHANCES,
  })
  const state = await buildGiveawayState(db, req.params.slug, req.userId)
  res.status(recorded ? 201 : 200).json({ ok: true, alreadyRecorded: !recorded, ...state })
})

export default router
