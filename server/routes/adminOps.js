import { Router } from 'express'
import crypto from 'crypto'
import { getDb, parseJson } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'
import { nowIso } from '../db/time.js'
import { logAudit } from '../services/auditLog.js'
import { getFeatureFlags, setFeatureFlags } from '../services/featureFlags.js'
import { broadcastTelegram } from '../services/telegramNotify.js'

const router = Router()

/** Codes the shop issues itself (rewards); kept apart from campaign codes in the Studio. */
const REWARD_PREFIX = /^(FRIEND|NEXT|THANKS)-/

router.get('/promo-codes', requireAdmin('admin'), async (_req, res) => {
  const rows = await getDb().all('SELECT * FROM promo_codes ORDER BY created_at DESC')
  res.json(rows.map(mapPromo))
})

function promoInput(body, { partial = false } = {}) {
  const out = {}
  const errors = []
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key)
  if (!partial || has('discountPercent') || has('discountEur')) {
    const percent = body.discountPercent === '' || body.discountPercent == null ? null : Number(body.discountPercent)
    const eur = body.discountEur === '' || body.discountEur == null ? null : Number(body.discountEur)
    if ((percent == null) === (eur == null)) errors.push('Give either discountPercent or discountEur')
    if (percent != null && !(Number.isInteger(percent) && percent >= 1 && percent <= 100)) errors.push('discountPercent must be 1–100')
    if (eur != null && !(Number.isFinite(eur) && eur > 0)) errors.push('discountEur must be above 0')
    out.discount_percent = percent
    out.discount_eur = eur
  }
  if (!partial || has('maxUses')) {
    const max = body.maxUses === '' || body.maxUses == null ? null : Number(body.maxUses)
    if (max != null && !(Number.isInteger(max) && max >= 1)) errors.push('maxUses must be a whole number from 1')
    out.max_uses = max
  }
  for (const [key, column] of [['validFrom', 'valid_from'], ['validUntil', 'valid_until']]) {
    if (!partial || has(key)) {
      const value = body[key] ? new Date(body[key]) : null
      if (value && Number.isNaN(value.getTime())) errors.push(`${key} is not a date`)
      out[column] = value ? value.toISOString() : null
    }
  }
  if (out.valid_from && out.valid_until && out.valid_from > out.valid_until) errors.push('validFrom is after validUntil')
  if (!partial || has('courseIds')) {
    const ids = Array.isArray(body.courseIds) ? body.courseIds.map(String).map((x) => x.trim()).filter(Boolean) : []
    out.course_ids = ids.length ? JSON.stringify([...new Set(ids)]) : null
  }
  if (has('active')) out.active = body.active ? 1 : 0
  return { out, errors }
}

router.post('/promo-codes', requireAdmin('admin'), async (req, res) => {
  const db = getDb()
  const code = String(req.body.code || '').trim().toUpperCase()
  if (!/^[A-Z0-9-]{3,32}$/.test(code)) {
    return res.status(400).json({ error: 'Code: 3–32 letters, digits or dashes', errorRu: 'Код: 3–32 символа — латинские буквы, цифры, дефис' })
  }
  if (REWARD_PREFIX.test(code)) {
    return res.status(400).json({ error: 'FRIEND-, NEXT- and THANKS- are reserved for reward codes', errorRu: 'Префиксы FRIEND-, NEXT- и THANKS- заняты кодами наград' })
  }
  const { out, errors } = promoInput(req.body || {})
  if (errors.length) return res.status(400).json({ error: errors.join('; '), errorRu: 'Проверьте поля: нужна скидка в % или в €, лимит — целое число, даты — корректные' })
  const exists = await db.get('SELECT code FROM promo_codes WHERE UPPER(code) = ?', [code])
  if (exists) return res.status(409).json({ error: 'Code exists', errorRu: 'Такой код уже есть' })
  await db.run(
    `INSERT INTO promo_codes (code, discount_percent, discount_eur, course_ids, max_uses, valid_from, valid_until, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [code, out.discount_percent, out.discount_eur, out.course_ids, out.max_uses, out.valid_from, out.valid_until, req.body.active === false ? 0 : 1, nowIso()]
  )
  await logAudit({ actorEmail: `admin:${req.adminRole}`, action: 'promo.create', targetType: 'promo', targetId: code, meta: { ...out } })
  const discount = out.discount_percent ? `${out.discount_percent}%` : `€${out.discount_eur}`
  broadcastTelegram('promo_new', { code, discount }, { prefKey: 'promo' }).catch(() => {})
  res.status(201).json({ ok: true, code })
})

router.post('/telegram/broadcast', requireAdmin('admin'), async (req, res) => {
  const { title, text, url, prefKey } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'text required' })
  const result = await broadcastTelegram(
    'course_news',
    { title: title || 'AI Insider Academy', text: text.trim(), url: url || '/courses' },
    { prefKey: prefKey || 'news' }
  )
  await logAudit({
    actorEmail: `admin:${req.adminRole}`,
    action: 'telegram.broadcast',
    meta: { title, sent: result.sent },
  })
  res.json({ ok: true, sent: result.sent })
})

router.patch('/promo-codes/:code', requireAdmin('admin'), async (req, res) => {
  const db = getDb()
  const code = String(req.params.code || '').toUpperCase()
  const row = await db.get('SELECT code FROM promo_codes WHERE UPPER(code) = ?', [code])
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { out, errors } = promoInput(req.body || {}, { partial: true })
  if (errors.length) return res.status(400).json({ error: errors.join('; '), errorRu: 'Проверьте поля промокода' })
  const columns = Object.keys(out)
  if (columns.length) {
    await db.run(
      `UPDATE promo_codes SET ${columns.map((c) => `${c} = ?`).join(', ')} WHERE UPPER(code) = ?`,
      [...columns.map((c) => out[c]), code]
    )
  }
  await logAudit({ actorEmail: `admin:${req.adminRole}`, action: 'promo.update', targetType: 'promo', targetId: code, meta: out })
  res.json({ ok: true })
})

import { grantCourseAccess } from '../services/grantCourse.js'
import { unlockLessonForUser } from '../services/unlockLesson.js'
import { prelaunchBlocked } from '../middleware/prelaunch.js'

router.post('/grant-course', requireAdmin('admin', 'moderator'), prelaunchBlocked, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const courseId = String(req.body.courseId || '').trim()
  const courseTitle = String(req.body.courseTitle || courseId)
  if (!email || !courseId) return res.status(400).json({ error: 'email and courseId required' })

  const access = await grantCourseAccess({ email, courseId, courseTitle, provider: 'admin_grant' })
  if (!access.ok) return res.status(400).json({ error: access.error })

  await logAudit({
    actorEmail: `admin:${req.adminRole}`,
    action: 'course.grant',
    targetType: 'user',
    targetId: email,
    meta: { courseId },
  })
  res.json({ ok: true, granted: access.granted, userCreated: access.userCreated })
})

router.post('/unlock-lesson', requireAdmin('admin', 'moderator'), prelaunchBlocked, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const courseId = String(req.body.courseId || '').trim()
  const courseTitle = String(req.body.courseTitle || courseId)
  const lessonIndex = Number(req.body.lessonIndex)
  if (!email || !courseId) return res.status(400).json({ error: 'email and courseId required' })
  if (!Number.isInteger(lessonIndex) || lessonIndex < 0) {
    return res.status(400).json({ error: 'lessonIndex must be a non-negative integer (0 = first lesson)' })
  }

  const result = await unlockLessonForUser({ email, courseId, lessonIndex, courseTitle })
  if (!result.ok) return res.status(400).json({ error: result.error })

  await logAudit({
    actorEmail: `admin:${req.adminRole}`,
    action: 'lesson.unlock',
    targetType: 'user',
    targetId: email,
    meta: { courseId, lessonIndex, targetPath: result.targetPath },
  })
  res.json(result)
})

router.post('/reviews/bulk-approve', requireAdmin('admin', 'moderator'), async (req, res) => {
  const db = getDb()
  const ids = Array.isArray(req.body.ids) ? req.body.ids : []
  if (!ids.length) return res.status(400).json({ error: 'ids array required' })

  let approved = 0
  for (const id of ids) {
    const row = await db.get('SELECT * FROM reviews WHERE id = ?', [id])
    if (!row || row.status === 'approved' || !String(row.text || '').trim()) continue
    await db.run("UPDATE reviews SET status = 'approved' WHERE id = ?", [id])
    approved += 1
  }

  await logAudit({
    actorEmail: `admin:${req.adminRole}`,
    action: 'reviews.bulk_approve',
    targetType: 'reviews',
    meta: { ids, approved },
  })
  res.json({ ok: true, approved })
})

router.get('/audit-log', requireAdmin('admin'), async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500)
  const rows = await getDb().all('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?', [limit])
  res.json(rows.map((r) => ({
    id: r.id,
    actorEmail: r.actor_email,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    meta: parseJson(r.meta, {}),
    createdAt: r.created_at,
  })))
})

router.get('/feature-flags', requireAdmin('admin'), async (_req, res) => {
  res.json(await getFeatureFlags())
})

router.put('/feature-flags', requireAdmin('admin'), async (req, res) => {
  const flags = await setFeatureFlags(req.body || {})
  await logAudit({ actorEmail: `admin:${req.adminRole}`, action: 'flags.update', targetType: 'feature_flags', meta: flags })
  res.json(flags)
})

router.get('/creator-payouts', requireAdmin('admin'), async (_req, res) => {
  try {
    const rows = await getDb().all('SELECT * FROM creator_payouts ORDER BY created_at DESC LIMIT 200')
    res.json(rows.map(mapPayout))
  } catch (err) {
    console.warn('[creator-payouts]', err.message)
    res.json([])
  }
})

router.post('/creator-payouts', requireAdmin('admin'), async (req, res) => {
  const db = getDb()
  const id = `payout-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`
  const amount = Number(req.body.amountEur)
  if (!req.body.creatorEmail || !Number.isFinite(amount)) {
    return res.status(400).json({ error: 'creatorEmail and amountEur required' })
  }
  await db.run(
    `INSERT INTO creator_payouts (id, creator_email, product_id, amount_eur, status, note, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
    [id, req.body.creatorEmail, req.body.productId || null, amount, req.body.note || null, nowIso()]
  )
  await logAudit({ actorEmail: req.adminEmail, action: 'payout.create', targetType: 'payout', targetId: id })
  res.status(201).json({ id })
})

router.patch('/creator-payouts/:id', requireAdmin('admin'), async (req, res) => {
  const db = getDb()
  const status = req.body.status
  if (!['pending', 'paid', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }
  await db.run(
    'UPDATE creator_payouts SET status = ?, paid_at = COALESCE(?, paid_at), note = COALESCE(?, note) WHERE id = ?',
    [status, status === 'paid' ? nowIso() : null, req.body.note, req.params.id]
  )
  await logAudit({
    actorEmail: `admin:${req.adminRole}`,
    action: 'payout.update',
    targetType: 'payout',
    targetId: req.params.id,
    meta: { status },
  })
  res.json({ ok: true })
})

function mapPromo(row) {
  return {
    code: row.code,
    discountPercent: row.discount_percent,
    discountEur: row.discount_eur,
    courseIds: row.course_ids ? JSON.parse(row.course_ids) : null,
    maxUses: row.max_uses,
    usedCount: row.used_count,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    active: Boolean(row.active),
    kind: REWARD_PREFIX.test(String(row.code)) ? 'reward' : 'campaign',
    createdAt: row.created_at,
  }
}

function mapPayout(row) {
  return {
    id: row.id,
    creatorEmail: row.creator_email,
    productId: row.product_id,
    amountEur: row.amount_eur,
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  }
}

export default router
