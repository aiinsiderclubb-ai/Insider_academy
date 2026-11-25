import { Router } from 'express'
import { getDb, parseJson } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'
import { config, isPaddleEnabled } from '../config.js'
import { logAudit } from '../services/auditLog.js'
import { grantAccess } from '../services/access.js'
import { rewardsFor } from '../services/rewards.js'
import { coursePlans } from '../services/coursePlan.js'
import { mapLogin } from '../services/loginLog.js'
import { createUserNotification } from '../services/notifications.js'
import { getMarketplaceProduct, getBundle } from '../services/marketplace.js'
import { revokePaymentAccess } from './webhooks.js'
import { courses as courseCatalog } from '../../src/data/courses.js'
import { VAULT_PRODUCTS } from '../../src/data/vaultProducts.js'
import { COURSE_BUNDLES } from '../../src/data/coursePacks.js'

/**
 * The Studio's money and people views: revenue from the payments table,
 * orders, a learner's card with grants, the referral programme, support.
 * Mounted under /api/admin after requireAdmin('admin','editor','moderator');
 * each route narrows the roles it serves.
 */
const router = Router()
const DAY = 24 * 60 * 60 * 1000
const actor = (req) => `admin:${req.adminRole}`

/** What an item id names, for labels and to tell grants apart. */
export function describeItem(id) {
  const course = courseCatalog.find((c) => c.id === id)
  if (course) return { kind: 'course', title: course.titleRu || course.title || id }
  const pack = COURSE_BUNDLES.find((b) => b.id === id)
  if (pack) return { kind: 'pack', title: pack.title }
  const vault = VAULT_PRODUCTS.find((v) => v.id === id)
  if (vault) return { kind: 'vault', title: vault.titleRu || vault.titleEn || id }
  const product = getMarketplaceProduct(id)
  if (product) return { kind: 'product', title: product.titleRu || product.titleEn || id }
  const bundle = getBundle(id)
  if (bundle) return { kind: 'bundle', title: bundle.title }
  return { kind: 'unknown', title: id }
}

function paymentDate(row) {
  return row.completed_at || row.created_at
}

function mapPayment(row) {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    itemId: row.course_id,
    itemTitle: row.course_title || describeItem(row.course_id).title,
    itemKind: describeItem(row.course_id).kind,
    amount: Number(row.amount || 0),
    currency: row.currency || 'EUR',
    provider: row.provider,
    externalId: row.external_id,
    status: row.status,
    plan: row.plan || null,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }
}

/* --------------------------------- revenue --------------------------------- */

/**
 * Settled money over the last `days` calendar days: completed payments count,
 * refunded ones are shown apart and not counted as revenue.
 */
router.get('/revenue', requireAdmin('admin'), async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365)
  const since = new Date(Date.now() - days * DAY)
  since.setUTCHours(0, 0, 0, 0)
  const rows = await getDb().all(
    "SELECT * FROM payments WHERE status IN ('completed', 'refunded') ORDER BY COALESCE(completed_at, created_at) DESC LIMIT 5000"
  )
  const inWindow = rows.filter((row) => new Date(paymentDate(row)).getTime() >= since.getTime())
  const completed = inWindow.filter((row) => row.status === 'completed')
  const refunded = inWindow.filter((row) => row.status === 'refunded')
  const sum = (list) => Math.round(list.reduce((acc, row) => acc + Number(row.amount || 0), 0) * 100) / 100

  const daily = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * DAY).toISOString().slice(0, 10)
    daily.push({ date, value: sum(completed.filter((row) => String(paymentDate(row)).slice(0, 10) === date)) })
  }
  const providers = new Map()
  for (const row of completed) {
    const entry = providers.get(row.provider) || { provider: row.provider, orders: 0, revenue: 0 }
    entry.orders += 1
    entry.revenue = Math.round((entry.revenue + Number(row.amount || 0)) * 100) / 100
    providers.set(row.provider, entry)
  }
  const items = new Map()
  for (const row of completed) {
    const title = row.course_title || describeItem(row.course_id).title
    items.set(title, Math.round(((items.get(title) || 0) + Number(row.amount || 0)) * 100) / 100)
  }
  const revenue = sum(completed)
  res.json({
    days,
    since: since.toISOString(),
    revenue,
    orders: completed.length,
    averageOrder: completed.length ? Math.round((revenue / completed.length) * 100) / 100 : 0,
    refunds: { count: refunded.length, amount: sum(refunded) },
    byProvider: [...providers.values()].sort((a, b) => b.revenue - a.revenue),
    byItem: [...items.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10),
    daily,
    recent: inWindow.slice(0, 20).map(mapPayment),
  })
})

/* --------------------------------- paddle ---------------------------------- */

export function paddleWebhookUrl() {
  const base = (process.env.API_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '')
  if (base) return `${base}/api/webhooks/paddle`
  const app = config.appUrl.replace(/\/$/, '')
  // Locally the API listens on its own port, not the site's.
  return app.includes('localhost') ? `http://localhost:${config.port}/api/webhooks/paddle` : `${app}/api/webhooks/paddle`
}

router.get('/paddle', requireAdmin('admin'), async (_req, res) => {
  const events = await getDb().all(
    "SELECT id, event_name, status, payload, created_at FROM webhook_events WHERE provider = 'paddle' ORDER BY created_at DESC LIMIT 20"
  ).catch(() => [])
  res.json({
    enabled: isPaddleEnabled(),
    environment: config.paddle.env,
    webhookSecretSet: Boolean(config.paddle.webhookSecret),
    webhookUrl: paddleWebhookUrl(),
    events: events.map((e) => ({ id: e.id, event: e.event_name, status: e.status, payload: parseJson(e.payload, {}), createdAt: e.created_at })),
  })
})

/* --------------------------------- orders ---------------------------------- */

async function grantsOf(db, payment) {
  const courses = payment.external_id
    ? await db.all('SELECT course_id FROM purchases WHERE user_id = ? AND payment_id = ?', [payment.user_id, payment.external_id])
    : []
  const sources = [payment.id, `${payment.provider}:${payment.external_id}`]
  const entitlements = await db.all(
    `SELECT product_id, status FROM entitlements
     WHERE user_id = ? AND (source_id IN (?, ?) OR source_id LIKE ?)`,
    [payment.user_id ?? -1, sources[0], sources[1], `%:${sources[1]}`]
  ).catch(() => [])
  return {
    courses: courses.map((c) => c.course_id),
    products: entitlements.map((e) => ({ productId: e.product_id, status: e.status })),
  }
}

router.get('/orders', requireAdmin('admin'), async (req, res) => {
  const { provider, status, from, to } = req.query
  const q = String(req.query.q || '').trim().toLowerCase()
  const where = []
  const params = []
  if (provider) { where.push('provider = ?'); params.push(String(provider)) }
  if (status) { where.push('status = ?'); params.push(String(status)) }
  if (from) { where.push('created_at >= ?'); params.push(String(from)) }
  if (to) { where.push('created_at <= ?'); params.push(`${String(to)}T23:59:59.999Z`) }
  if (q) { where.push('(lower(email) LIKE ? OR lower(course_id) LIKE ? OR lower(COALESCE(external_id, \'\')) LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`) }
  const limit = Math.min(Number(req.query.limit) || 100, 500)
  const db = getDb()
  const rows = await db.all(
    `SELECT * FROM payments ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT ${limit}`,
    params
  )
  const orders = []
  for (const row of rows) {
    const context = await db.get('SELECT license_tier, quoted_amount_eur FROM checkout_contexts WHERE payment_id = ?', [row.id]).catch(() => null)
    orders.push({
      ...mapPayment(row),
      licenseTier: context?.license_tier ?? null,
      granted: row.status === 'completed' || row.status === 'refunded' ? await grantsOf(db, row) : { courses: [], products: [] },
    })
  }
  const providers = (await db.all('SELECT DISTINCT provider FROM payments')).map((r) => r.provider).filter(Boolean)
  res.json({ orders, providers })
})

/** Takes back what a payment gave. Money is refunded in the provider's dashboard. */
router.post('/orders/:id/revoke', requireAdmin('admin'), async (req, res) => {
  const db = getDb()
  const payment = await db.get('SELECT * FROM payments WHERE id = ?', [req.params.id])
  if (!payment) return res.status(404).json({ error: 'Order not found', errorRu: 'Заказ не найден' })
  if (payment.status !== 'completed') return res.status(409).json({ error: 'Only completed orders can be revoked', errorRu: 'Забрать доступ можно только у оплаченного заказа' })
  const revoked = await revokePaymentAccess(db, payment, `admin:${String(req.body?.reason || 'manual').slice(0, 80)}`)
  await logAudit({ actorEmail: actor(req), action: 'order.revoke', targetType: 'payment', targetId: payment.id, meta: { email: payment.email, item: payment.course_id, revoked, reason: req.body?.reason || null } })
  res.json({ ok: true, revoked })
})

/* --------------------------------- learners -------------------------------- */

router.get('/users', requireAdmin('admin', 'moderator'), async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase()
  const db = getDb()
  const params = []
  let where = ''
  if (q) {
    where = 'WHERE lower(u.email) LIKE ? OR lower(COALESCE(u.name, \'\')) LIKE ? OR lower(COALESCE(u.personal_id, \'\')) LIKE ? OR CAST(u.id AS TEXT) = ?'
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, q.replace(/^#/, ''))
  }
  const rows = await db.all(
    `SELECT u.id, u.email, u.name, u.personal_id, u.email_verified, u.created_at, u.last_login_at,
       (SELECT COUNT(*) FROM purchases p WHERE p.user_id = u.id) AS purchases,
       (SELECT COALESCE(SUM(amount), 0) FROM payments pay WHERE pay.user_id = u.id AND pay.status = 'completed') AS paid
     FROM users u ${where} ORDER BY u.created_at DESC LIMIT 50`,
    params
  )
  res.json({
    users: rows.map((u) => ({
      id: u.id, email: u.email, name: u.name, personalId: u.personal_id,
      emailVerified: Boolean(u.email_verified), createdAt: u.created_at, lastLoginAt: u.last_login_at || null,
      purchases: Number(u.purchases || 0), paid: Math.round(Number(u.paid || 0) * 100) / 100,
    })),
  })
})

router.get('/users/:id', requireAdmin('admin', 'moderator'), async (req, res) => {
  const db = getDb()
  const user = await db.get('SELECT id, email, name, personal_id, email_verified, created_at, auth_provider FROM users WHERE id = ?', [req.params.id])
  if (!user) return res.status(404).json({ error: 'User not found', errorRu: 'Пользователь не найден' })
  const purchases = await db.all('SELECT id, course_id, payment_provider, payment_id, purchased_at FROM purchases WHERE user_id = ? ORDER BY purchased_at DESC', [user.id])
  const entitlements = await db.all('SELECT id, product_id, license_tier, source_type, source_id, status, granted_at, expires_at FROM entitlements WHERE user_id = ? ORDER BY granted_at DESC', [user.id]).catch(() => [])
  const payments = await db.all('SELECT * FROM payments WHERE user_id = ? OR lower(email) = lower(?) ORDER BY created_at DESC LIMIT 100', [user.id, user.email])
  const invitedBy = await db.get('SELECT referrer_email, referrer_code, referred_purchased, date FROM referrals WHERE lower(referred_email) = lower(?)', [user.email])
  const invited = await db.all('SELECT referred_email, referred_purchased, date FROM referrals WHERE lower(referrer_email) = lower(?) ORDER BY date DESC', [user.email])
  const support = await db.get('SELECT COUNT(*) AS c FROM support_messages WHERE user_id = ?', [user.id]).catch(() => ({ c: 0 }))
  const rewards = await rewardsFor(db, { userId: user.id, email: user.email })
  const plans = await coursePlans(db, user.id)
  const logins = await db.all('SELECT * FROM login_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 30', [user.id]).catch(() => [])
  const temp = await db.get('SELECT password_temporary, last_login_at FROM users WHERE id = ?', [user.id]).catch(() => null)
  res.json({
    user: { id: user.id, email: user.email, name: user.name, personalId: user.personal_id, emailVerified: Boolean(user.email_verified), createdAt: user.created_at, authProvider: user.auth_provider },
    purchases: purchases.map((p) => ({ id: p.id, itemId: p.course_id, title: describeItem(p.course_id).title, kind: describeItem(p.course_id).kind, provider: p.payment_provider, paymentRef: p.payment_id, purchasedAt: p.purchased_at, plan: Number(courseCatalog.find((c) => c.id === p.course_id)?.priceEur) > 0 ? (plans.get(p.course_id) || 'mentor') : null })),
    logins: logins.map(mapLogin),
    lastLoginAt: temp?.last_login_at || null,
    passwordTemporary: Boolean(Number(temp?.password_temporary || 0)),
    entitlements: entitlements.map((e) => ({ id: e.id, productId: e.product_id, title: describeItem(e.product_id).title, licenseTier: e.license_tier, sourceType: e.source_type, sourceId: e.source_id, status: e.status, grantedAt: e.granted_at })),
    payments: payments.map(mapPayment),
    referral: {
      invitedBy: invitedBy ? { email: invitedBy.referrer_email, code: invitedBy.referrer_code, converted: Boolean(Number(invitedBy.referred_purchased)), date: invitedBy.date } : null,
      invited: invited.map((r) => ({ email: r.referred_email, converted: Boolean(Number(r.referred_purchased)), date: r.date })),
    },
    rewards: rewards.codes,
    supportMessages: Number(support?.c || 0),
  })
})

/** Gives a course, pack, vault, bundle or store product by hand. */
router.post('/entitlements', requireAdmin('admin'), async (req, res) => {
  const db = getDb()
  const user = await db.get('SELECT id, email FROM users WHERE id = ?', [req.body?.userId])
  if (!user) return res.status(404).json({ error: 'User not found', errorRu: 'Пользователь не найден' })
  const itemId = String(req.body?.itemId || '').trim()
  const item = describeItem(itemId)
  if (!itemId || item.kind === 'unknown') return res.status(400).json({ error: 'Unknown item', errorRu: 'Нет такого курса или товара' })
  const externalId = `manual-${Date.now()}`
  const result = await grantAccess({
    userId: user.id,
    email: user.email,
    courseId: itemId,
    courseTitle: item.title,
    amount: 0,
    provider: 'admin',
    externalId,
    licenseTier: ['personal', 'client', 'agency'].includes(req.body?.licenseTier) ? req.body.licenseTier : 'personal',
  })
  if (!result?.ok) return res.status(400).json({ error: result?.reason || 'Grant failed', errorRu: 'Не удалось выдать доступ' })
  await logAudit({ actorEmail: actor(req), action: 'access.grant', targetType: 'user', targetId: String(user.id), meta: { email: user.email, itemId, kind: item.kind } })
  res.status(201).json({ ok: true, itemId, kind: item.kind })
})

/** Takes back one course row or one store entitlement. */
router.post('/entitlements/revoke', requireAdmin('admin'), async (req, res) => {
  const db = getDb()
  const userId = Number(req.body?.userId)
  let changed = 0
  if (req.body?.purchaseId) {
    const row = await db.get('SELECT * FROM purchases WHERE id = ? AND user_id = ?', [req.body.purchaseId, userId])
    if (!row) return res.status(404).json({ error: 'Not found', errorRu: 'Доступ не найден' })
    const r = await db.run('DELETE FROM purchases WHERE id = ? AND user_id = ?', [row.id, userId])
    changed = Number(r?.changes ?? r?.rowCount ?? 0)
    await logAudit({ actorEmail: actor(req), action: 'access.revoke', targetType: 'user', targetId: String(userId), meta: { courseId: row.course_id } })
  } else if (req.body?.entitlementId) {
    const r = await db.run(
      "UPDATE entitlements SET status = 'revoked', expires_at = ? WHERE id = ? AND user_id = ? AND status = 'active'",
      [new Date().toISOString(), req.body.entitlementId, userId]
    )
    changed = Number(r?.changes ?? r?.rowCount ?? 0)
    if (!changed) return res.status(404).json({ error: 'Not found', errorRu: 'Доступ не найден или уже забран' })
    await logAudit({ actorEmail: actor(req), action: 'access.revoke', targetType: 'user', targetId: String(userId), meta: { entitlementId: req.body.entitlementId } })
  } else {
    return res.status(400).json({ error: 'purchaseId or entitlementId required' })
  }
  res.json({ ok: true, changed })
})

/* -------------------------------- referrals -------------------------------- */

function codeStatus(row, now = Date.now()) {
  if (!row.active) return 'cancelled'
  if (row.used_count >= (row.max_uses ?? 1)) return 'used'
  if (row.valid_until && new Date(row.valid_until).getTime() < now) return 'expired'
  if (row.valid_from && new Date(row.valid_from).getTime() > now) return 'pending'
  return 'active'
}

router.get('/referrals', requireAdmin('admin'), async (_req, res) => {
  const db = getDb()
  const referrals = await db.all('SELECT referrer_email, referred_purchased FROM referrals')
  const tally = (prefix) => async () => {
    const rows = await db.all('SELECT * FROM promo_codes WHERE code LIKE ?', [`${prefix}-%`])
    const out = { issued: rows.length, active: 0, pending: 0, used: 0, expired: 0, cancelled: 0 }
    for (const row of rows) out[codeStatus(row)] += 1
    return out
  }
  const top = new Map()
  for (const r of referrals) {
    const entry = top.get(r.referrer_email) || { email: r.referrer_email, invited: 0, converted: 0 }
    entry.invited += 1
    if (Number(r.referred_purchased)) entry.converted += 1
    top.set(r.referrer_email, entry)
  }
  res.json({
    invited: referrals.length,
    converted: referrals.filter((r) => Number(r.referred_purchased)).length,
    friendCodes: await tally('FRIEND')(),
    nextCodes: await tally('NEXT')(),
    reviewCodes: await tally('THANKS')(),
    topReferrers: [...top.values()].sort((a, b) => b.converted - a.converted || b.invited - a.invited).slice(0, 10),
  })
})

/* --------------------------------- support --------------------------------- */

router.get('/support', requireAdmin('admin', 'moderator'), async (req, res) => {
  const status = req.query.status ? String(req.query.status) : null
  const rows = await getDb().all(
    `SELECT id, user_id, email, name, message, reply, status, date FROM support_messages
     ${status ? 'WHERE status = ?' : ''} ORDER BY date DESC LIMIT 200`,
    status ? [status] : []
  ).catch(() => [])
  res.json({ messages: rows.map((r) => ({ id: r.id, userId: r.user_id, email: r.email, name: r.name, message: r.message, reply: r.reply, status: r.status, date: r.date })) })
})

router.post('/support/:id/reply', requireAdmin('admin', 'moderator'), async (req, res) => {
  const db = getDb()
  const reply = String(req.body?.reply || '').trim().slice(0, 4000)
  if (!reply) return res.status(400).json({ error: 'reply required', errorRu: 'Напишите ответ' })
  const row = await db.get('SELECT * FROM support_messages WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Not found', errorRu: 'Сообщение не найдено' })
  await db.run("UPDATE support_messages SET reply = ?, status = 'answered' WHERE id = ?", [reply, row.id])
  await createUserNotification(db, {
    email: row.email,
    type: 'support_reply',
    status: 'new',
    targetPath: '/app/support',
    message: reply.slice(0, 280),
  }).catch(() => null)
  await logAudit({ actorEmail: actor(req), action: 'support.reply', targetType: 'support', targetId: row.id, meta: { email: row.email } })
  res.json({ ok: true })
})

/* ---------------------------------- store ---------------------------------- */

/** Sales per store item: paid orders for it, and active grants of it from any source. */
router.get('/store-stats', requireAdmin('admin', 'editor'), async (_req, res) => {
  const db = getDb()
  const orders = await db.all("SELECT course_id, COUNT(*) AS c, COALESCE(SUM(amount), 0) AS revenue FROM payments WHERE status = 'completed' GROUP BY course_id")
  const grants = await db.all("SELECT product_id, COUNT(*) AS c FROM entitlements WHERE status = 'active' GROUP BY product_id").catch(() => [])
  res.json({
    orders: Object.fromEntries(orders.map((r) => [r.course_id, { count: Number(r.c), revenue: Math.round(Number(r.revenue) * 100) / 100 }])),
    grants: Object.fromEntries(grants.map((r) => [r.product_id, Number(r.c)])),
  })
})

export default router
