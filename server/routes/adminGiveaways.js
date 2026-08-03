import { Router } from 'express'
import crypto from 'node:crypto'
import { getDb } from '../db.js'
import { getServerGiveaway } from '../data/giveaways.js'
import { nowIso } from '../db/time.js'
import { logAudit } from '../services/auditLog.js'
import { totalGiveawayChances } from '../data/giveawayChances.js'

const router = Router()

function csvCell(value) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

async function getResult(db, slug) {
  return db.get(
    `SELECT giveaway_id AS giveawayId, winner_entry_id AS winnerEntryId,
      winner_user_id AS winnerUserId, winner_email AS winnerEmail,
      winner_telegram_username AS winnerTelegramUsername,
      participant_count AS participantCount, selection_index AS selectionIndex,
      selection_ticket AS selectionTicket, total_chances AS totalChances,
      winner_chances AS winnerChances,
      drawn_at AS drawnAt, drawn_by AS drawnBy, published_at AS publishedAt, status
     FROM giveaway_results WHERE giveaway_id = ?`,
    [slug]
  )
}

router.get('/giveaways/:slug/entries', async (req, res) => {
  if (!getServerGiveaway(req.params.slug)) return res.status(404).json({ error: 'Giveaway not found' })
  const db = getDb()
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100))
  const offset = Math.max(0, Number(req.query.offset) || 0)
  const total = await db.get('SELECT COUNT(*) AS c FROM giveaway_entries WHERE giveaway_id = ?', [req.params.slug])
  const entries = await db.all(
    `SELECT id, user_id AS userId, email, telegram_username AS telegramUsername,
      telegram_verified AS telegramVerified, created_at AS createdAt,
      COALESCE((SELECT SUM(a.chances) FROM giveaway_bonus_actions a
        WHERE a.giveaway_id = giveaway_entries.giveaway_id
          AND a.beneficiary_user_id = giveaway_entries.user_id), 0) AS bonusChances,
      COALESCE((SELECT COUNT(*) FROM giveaway_bonus_actions a
        WHERE a.giveaway_id = giveaway_entries.giveaway_id
          AND a.beneficiary_user_id = giveaway_entries.user_id
          AND a.action_type = 'referral'), 0) AS referralCount,
      COALESCE((SELECT COUNT(*) FROM giveaway_bonus_actions a
        WHERE a.giveaway_id = giveaway_entries.giveaway_id
          AND a.beneficiary_user_id = giveaway_entries.user_id
          AND a.action_type = 'share'), 0) AS shareCount
     FROM giveaway_entries WHERE giveaway_id = ? ORDER BY created_at ASC, id ASC LIMIT ? OFFSET ?`,
    [req.params.slug, limit, offset]
  )
  res.json({
    total: Number(total?.c || 0), limit, offset,
    entries: entries.map((entry) => ({
      ...entry,
      bonusChances: Number(entry.bonusChances || 0),
      referralCount: Number(entry.referralCount || 0),
      shared: Number(entry.shareCount || 0) > 0,
      chances: totalGiveawayChances(entry.bonusChances),
    })),
  })
})

router.get('/giveaways/:slug/export.csv', async (req, res) => {
  if (!getServerGiveaway(req.params.slug)) return res.status(404).json({ error: 'Giveaway not found' })
  const rows = await getDb().all(
    `SELECT id, user_id, email, telegram_username, telegram_verified, created_at,
      COALESCE((SELECT SUM(a.chances) FROM giveaway_bonus_actions a
        WHERE a.giveaway_id = giveaway_entries.giveaway_id
          AND a.beneficiary_user_id = giveaway_entries.user_id), 0) AS bonus_chances
     FROM giveaway_entries WHERE giveaway_id = ? ORDER BY created_at ASC, id ASC`,
    [req.params.slug]
  )
  const lines = [
    ['entry_id', 'user_id', 'email', 'telegram_username', 'telegram_verified', 'created_at', 'bonus_chances', 'total_chances'].map(csvCell).join(','),
    ...rows.map((row) => [row.id, row.user_id, row.email, row.telegram_username, row.telegram_verified, row.created_at, row.bonus_chances, totalGiveawayChances(row.bonus_chances)].map(csvCell).join(',')),
  ]
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.slug}-participants.csv"`)
  res.send(`\uFEFF${lines.join('\n')}`)
})

router.get('/giveaways/:slug/result', async (req, res) => {
  if (!getServerGiveaway(req.params.slug)) return res.status(404).json({ error: 'Giveaway not found' })
  res.json({ result: await getResult(getDb(), req.params.slug) })
})

router.post('/giveaways/:slug/draw', async (req, res) => {
  const meta = getServerGiveaway(req.params.slug)
  if (!meta) return res.status(404).json({ error: 'Giveaway not found' })
  if (!meta.endsAt || new Date(meta.endsAt).getTime() > Date.now()) {
    return res.status(409).json({ error: 'Giveaway is still active', endsAt: meta.endsAt })
  }
  const db = getDb()
  const existing = await getResult(db, req.params.slug)
  if (existing) return res.json({ ok: true, alreadyDrawn: true, result: existing })
  const entries = await db.all(
    `SELECT giveaway_entries.*,
      COALESCE((SELECT SUM(a.chances) FROM giveaway_bonus_actions a
        WHERE a.giveaway_id = giveaway_entries.giveaway_id
          AND a.beneficiary_user_id = giveaway_entries.user_id), 0) AS bonus_chances
     FROM giveaway_entries WHERE giveaway_id = ? ORDER BY created_at ASC, id ASC`,
    [req.params.slug]
  )
  if (!entries.length) return res.status(409).json({ error: 'No participants' })

  const weightedEntries = entries.map((entry) => ({
    ...entry,
    chances: totalGiveawayChances(entry.bonus_chances),
  }))
  const totalChances = weightedEntries.reduce((sum, entry) => sum + entry.chances, 0)
  const selectionTicket = crypto.randomInt(totalChances)
  let cursor = 0
  let selectionIndex = 0
  for (let index = 0; index < weightedEntries.length; index += 1) {
    cursor += weightedEntries[index].chances
    if (selectionTicket < cursor) {
      selectionIndex = index
      break
    }
  }
  const winner = weightedEntries[selectionIndex]
  const drawnAt = nowIso()
  try {
    await db.run(
      `INSERT INTO giveaway_results
       (giveaway_id, winner_entry_id, winner_user_id, winner_email, winner_telegram_username,
        participant_count, selection_index, selection_ticket, total_chances, winner_chances,
        drawn_at, drawn_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'drawn')`,
      [req.params.slug, winner.id, winner.user_id, winner.email, winner.telegram_username || null,
        entries.length, selectionIndex, selectionTicket, totalChances, winner.chances,
        drawnAt, req.adminEmail || `admin:${req.adminRole}`]
    )
  } catch (err) {
    const raced = await getResult(db, req.params.slug)
    if (raced) return res.json({ ok: true, alreadyDrawn: true, result: raced })
    throw err
  }
  await logAudit({
    actorEmail: req.adminEmail || `admin:${req.adminRole}`,
    action: 'giveaway.draw', targetType: 'giveaway', targetId: req.params.slug,
    meta: {
      participantCount: entries.length,
      totalChances,
      winnerEntryId: winner.id,
      winnerChances: winner.chances,
      selectionIndex,
      selectionTicket,
    },
  })
  res.status(201).json({ ok: true, result: await getResult(db, req.params.slug) })
})

router.post('/giveaways/:slug/publish', async (req, res) => {
  const db = getDb()
  const existing = await getResult(db, req.params.slug)
  if (!existing) return res.status(409).json({ error: 'Draw result does not exist' })
  if (existing.status !== 'published') {
    await db.run(
      `UPDATE giveaway_results SET status = 'published', published_at = ? WHERE giveaway_id = ?`,
      [nowIso(), req.params.slug]
    )
    await logAudit({
      actorEmail: req.adminEmail || `admin:${req.adminRole}`,
      action: 'giveaway.publish', targetType: 'giveaway', targetId: req.params.slug,
      meta: { winnerEntryId: existing.winnerEntryId },
    })
  }
  res.json({ ok: true, result: await getResult(db, req.params.slug) })
})

export default router
