import { Router } from 'express'
import crypto from 'crypto'
import { getDb, parseJson } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'
import { nowIso } from '../db/time.js'
import { logAudit } from '../services/auditLog.js'
import { getFeatureFlags, setFeatureFlags } from '../services/featureFlags.js'
import { MARKETPLACE_PRODUCTS } from '../../src/data/marketplace/products.js'
import { broadcastTelegram } from '../services/telegramNotify.js'

const router = Router()

router.get('/promo-codes', requireAdmin('admin'), async (_req, res) => {
  const rows = await getDb().all('SELECT * FROM promo_codes ORDER BY created_at DESC')
  res.json(rows.map(mapPromo))
})

router.post('/promo-codes', requireAdmin('admin'), async (req, res) => {
  const db = getDb()
  const code = String(req.body.code || '').trim().toUpperCase()
  if (!code) return res.status(400).json({ error: 'code required' })
  const courseIds = req.body.courseIds?.length ? JSON.stringify(req.body.courseIds) : null
  await db.run(
    `INSERT INTO promo_codes (code, discount_percent, discount_eur, course_ids, max_uses, valid_from, valid_until, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      code,
      req.body.discountPercent ?? null,
      req.body.discountEur ?? null,
      courseIds,
      req.body.maxUses ?? null,
      req.body.validFrom ?? null,
      req.body.validUntil ?? null,
      req.body.active === false ? 0 : 1,
      nowIso(),
    ]
  )
  await logAudit({
    actorEmail: `admin:${req.adminRole}`,
    action: 'promo.create',
    targetType: 'promo',
    targetId: code,
  })
  const discount = req.body.discountPercent
    ? `${req.body.discountPercent}%`
    : req.body.discountEur
      ? `€${req.body.discountEur}`
      : ''
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
  await db.run(
    `UPDATE promo_codes SET
      discount_percent = COALESCE(?, discount_percent),
      discount_eur = COALESCE(?, discount_eur),
      max_uses = COALESCE(?, max_uses),
      valid_until = COALESCE(?, valid_until),
      active = COALESCE(?, active)
     WHERE UPPER(code) = ?`,
    [
      req.body.discountPercent,
      req.body.discountEur,
      req.body.maxUses,
      req.body.validUntil,
      req.body.active === undefined ? null : req.body.active ? 1 : 0,
      code,
    ]
  )
  await logAudit({ actorEmail: req.adminEmail, action: 'promo.update', targetType: 'promo', targetId: code })
  res.json({ ok: true })
})

router.post('/grant-course', requireAdmin('admin', 'moderator'), async (req, res) => {
  const db = getDb()
  const email = String(req.body.email || '').trim().toLowerCase()
  const courseId = String(req.body.courseId || '').trim()
  const courseTitle = String(req.body.courseTitle || courseId)
  if (!email || !courseId) return res.status(400).json({ error: 'email and courseId required' })

  let user = await db.get('SELECT id, email FROM users WHERE email = ?', [email])
  if (!user) {
    const bcrypt = await import('bcryptjs')
    const hash = bcrypt.default.hashSync(crypto.randomBytes(8).toString('hex'), 10)
    const result = await db.run('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)', [email, hash, email.split('@')[0]])
    const userId = result?.lastInsertRowid || (await db.get('SELECT id FROM users WHERE email = ?', [email]))?.id
    user = { id: userId, email }
  }

  const exists = await db.get('SELECT id FROM purchases WHERE user_id = ? AND course_id = ?', [user.id, courseId])
  if (!exists) {
    await db.run('INSERT INTO purchases (user_id, course_id, payment_provider) VALUES (?, ?, ?)', [user.id, courseId, 'admin_grant'])
    await db.run(
      'INSERT INTO purchase_log (id, email, course_id, course_title, amount, date) VALUES (?, ?, ?, ?, ?, ?)',
      [`grant-${Date.now()}`, email, courseId, courseTitle, 0, nowIso()]
    )
  }

  await logAudit({
    actorEmail: `admin:${req.adminRole}`,
    action: 'course.grant',
    targetType: 'user',
    targetId: email,
    meta: { courseId },
  })
  res.json({ ok: true, granted: !exists })
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
  await logAudit({ actorEmail: req.adminEmail, action: 'flags.update', targetType: 'feature_flags', meta: flags })
  res.json(flags)
})

router.get('/marketplace/products', requireAdmin('admin'), async (_req, res) => {
  const db = getDb()
  const overridesRow = await db.get('SELECT value FROM analytics WHERE key = ?', ['marketplace_admin'])
  const overrides = parseJson(overridesRow?.value, {})
  const products = MARKETPLACE_PRODUCTS.map((p) => ({
    id: p.id,
    slug: p.slug,
    titleRu: p.titleRu,
    priceEur: p.priceEur,
    categoryId: p.categoryId,
    creatorEmail: p.creatorEmail || 'marketplace@insiderai.it.com',
    active: overrides[p.id]?.active !== false,
  }))
  res.json({ products })
})

router.patch('/marketplace/products/:id', requireAdmin('admin'), async (req, res) => {
  const db = getDb()
  const productId = req.params.id
  const row = await db.get('SELECT value FROM analytics WHERE key = ?', ['marketplace_admin'])
  const overrides = parseJson(row?.value, {})
  overrides[productId] = { ...overrides[productId], ...req.body }
  await db.run(
    `INSERT INTO analytics (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ['marketplace_admin', JSON.stringify(overrides)]
  )
  await logAudit({ actorEmail: req.adminEmail, action: 'marketplace.update', targetType: 'product', targetId: productId, meta: req.body })
  res.json({ ok: true })
})

router.get('/creator-payouts', requireAdmin('admin'), async (_req, res) => {
  const rows = await getDb().all('SELECT * FROM creator_payouts ORDER BY created_at DESC LIMIT 200')
  res.json(rows.map(mapPayout))
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
