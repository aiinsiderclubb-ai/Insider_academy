import { Router } from 'express'
import { getDb } from '../db.js'
import { requireUser, optionalUser } from '../middleware/auth.js'
import { getServerGiveaway, SERVER_GIVEAWAYS } from '../data/giveaways.js'
import { checkChannelMembership } from '../services/telegramChannel.js'
import { nowIso } from '../db/time.js'

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
    telegramChannel: meta.telegramChannel,
  }
}

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

router.post('/:slug/verify-telegram', requireUser, async (req, res) => {
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

router.post('/:slug/enter', requireUser, async (req, res) => {
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
    const count = await getParticipantCount(db, req.params.slug)
    return res.json({ ok: true, alreadyEntered: true, participantCount: count, enteredAt: existing.createdAt })
  }

  const id = `ge-${Date.now()}-${req.userId}`
  await db.run(
    `INSERT INTO giveaway_entries (id, giveaway_id, user_id, email, telegram_username, telegram_verified, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [id, req.params.slug, req.userId, user.email, user.telegram_username || null, nowIso()]
  )

  const count = await getParticipantCount(db, req.params.slug)
  res.status(201).json({ ok: true, participantCount: count, enteredAt: nowIso() })
})

export default router
