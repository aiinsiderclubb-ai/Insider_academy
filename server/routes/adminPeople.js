import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { getDb, parseJson } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'
import { isEmailEnabled } from '../config.js'
import { logAudit } from '../services/auditLog.js'
import { resolveAccounts, resolveAudience, SEGMENTS } from '../services/adminAudience.js'
import { queueEmail, processEmailQueue } from '../services/emailQueue.js'
import { mapLogin } from '../services/loginLog.js'
import { referrerRewardCode } from '../services/rewards.js'
import { courses as courseCatalog } from '../../src/data/courses.js'

/**
 * The Studio's people tools: who signed in, temporary passwords, hand-written
 * mail, the referral ledger and who looks at the free courses.
 *
 * Mounted under /api/admin behind requireAdmin('admin','editor','moderator');
 * each route narrows the roles further.
 */
const router = Router()

const actor = (req) => `admin:${req.adminRole}`

/* ------------------------------- resolve people ------------------------------ */

router.get('/people/resolve', requireAdmin('admin', 'moderator'), async (req, res) => {
  const result = await resolveAccounts(getDb(), req.query.q || '')
  res.json(result)
})

/* ---------------------------------- logins ---------------------------------- */

router.get('/logins', requireAdmin('admin', 'moderator'), async (req, res) => {
  const db = getDb()
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 200))
  const params = []
  const where = []
  if (req.query.userId) {
    where.push('user_id = ?')
    params.push(Number(req.query.userId))
  }
  const q = String(req.query.q || '').trim().toLowerCase()
  if (q) {
    where.push("(lower(COALESCE(email, '')) LIKE ? OR lower(COALESCE(personal_id, '')) LIKE ? OR CAST(user_id AS TEXT) = ?)")
    params.push(`%${q}%`, `%${q}%`, q)
  }
  const rows = await db.all(
    `SELECT * FROM login_events ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT ?`,
    [...params, limit]
  ).catch(() => [])
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const day = await db.get(
    'SELECT COUNT(*) AS logins, COUNT(DISTINCT user_id) AS people FROM login_events WHERE created_at >= ?',
    [since]
  ).catch(() => null)
  const week = await db.get(
    'SELECT COUNT(DISTINCT user_id) AS people FROM login_events WHERE created_at >= ?',
    [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()]
  ).catch(() => null)
  res.json({
    logins: rows.map(mapLogin),
    last24h: { logins: Number(day?.logins || 0), people: Number(day?.people || 0) },
    last7d: { people: Number(week?.people || 0) },
  })
})

/* ---------------------------- temporary password ----------------------------- */

const PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function temporaryPassword() {
  for (;;) {
    const bytes = crypto.randomBytes(12)
    const value = [...bytes].map((b) => PASSWORD_ALPHABET[b % PASSWORD_ALPHABET.length]).join('')
    if (/\d/.test(value) && /[a-z]/i.test(value)) return value
  }
}

/**
 * Sets a password chosen by the team (or generated) and signs the person out
 * everywhere. The cabinet then asks them to pick their own; until they do,
 * the account is flagged as on a temporary password.
 */
router.post('/users/:id/temporary-password', requireAdmin('admin'), async (req, res) => {
  const db = getDb()
  const user = await db.get('SELECT id, email FROM users WHERE id = ?', [req.params.id])
  if (!user) return res.status(404).json({ error: 'User not found', errorRu: 'Пользователь не найден' })
  const given = String(req.body?.password || '').trim()
  if (given && (given.length < 10 || !/\d/.test(given) || !/[a-zа-яіїє]/i.test(given))) {
    return res.status(400).json({ error: 'At least 10 characters with a letter and a digit', errorRu: 'Не меньше 10 символов, буква и цифра' })
  }
  const password = given || temporaryPassword()
  const now = new Date().toISOString()
  await db.run(
    `UPDATE users SET password_hash = ?, password_changed_at = ?, password_temporary = 1, email_verified = 1,
       token_version = COALESCE(token_version, 0) + 1 WHERE id = ?`,
    [bcrypt.hashSync(password, 10), now, user.id]
  )
  await logAudit({ actorEmail: actor(req), action: 'user.temporary_password', targetType: 'user', targetId: String(user.id), meta: { email: user.email } })
  res.json({ ok: true, email: user.email, password })
})

/* ----------------------------------- mail ----------------------------------- */

/**
 * A letter written in the Studio. `personal` goes out regardless of the
 * newsletter opt-out (it is about the person's account or order); `news`
 * respects it and carries an unsubscribe link. `dryRun` only counts.
 */
router.post('/email/send', requireAdmin('admin'), async (req, res) => {
  const db = getDb()
  const body = req.body || {}
  const segment = SEGMENTS.includes(body.segment) ? body.segment : 'list'
  const subject = String(body.subject || '').trim()
  const text = String(body.body || '').trim()
  const kind = body.kind === 'news' ? 'news' : 'personal'
  if (segment === 'course' && !body.courseId) return res.status(400).json({ error: 'courseId required', errorRu: 'Выберите курс' })

  let audience
  try {
    audience = await resolveAudience(db, { segment, recipients: body.recipients, courseId: body.courseId })
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message })
  }
  const preview = audience.people.slice(0, 20).map((p) => p.email)
  if (body.dryRun) return res.json({ ok: true, count: audience.people.length, preview, unknown: audience.unknown })

  if (!subject || !text) return res.status(400).json({ error: 'subject and body required', errorRu: 'Нужны тема и текст письма' })
  if (!audience.people.length) return res.status(400).json({ error: 'Nobody to send to', errorRu: 'Получателей нет', unknown: audience.unknown })

  const template = kind === 'news' ? 'admin_news' : 'admin_message'
  for (const person of audience.people) {
    await queueEmail({
      to: person.email,
      template,
      payload: {
        subject,
        body: text,
        name: person.name || '',
        ctaLabel: body.ctaLabel || '',
        ctaUrl: body.ctaUrl || '',
        locale: body.locale || 'ru',
      },
    })
  }
  await logAudit({
    actorEmail: actor(req),
    action: 'email.send',
    targetType: 'email',
    targetId: segment,
    meta: { subject, kind, count: audience.people.length, courseId: body.courseId || null },
  })
  // The queue drains 20 every two minutes; start the first batch now.
  processEmailQueue(20).catch(() => {})
  res.json({ ok: true, queued: audience.people.length, smtp: isEmailEnabled(), unknown: audience.unknown })
})

router.get('/email/sent', requireAdmin('admin'), async (_req, res) => {
  const rows = await getDb().all(
    "SELECT id, email, template, status, payload, created_at, sent_at, error FROM email_queue WHERE template IN ('admin_message', 'admin_news', 'personal_promo') ORDER BY created_at DESC LIMIT 200"
  ).catch(() => [])
  res.json({
    letters: rows.map((r) => ({
      id: r.id,
      email: r.email,
      template: r.template,
      subject: parseJson(r.payload, {}).subject || (r.template === 'personal_promo' ? parseJson(r.payload, {}).code : ''),
      status: r.status,
      createdAt: r.created_at,
      sentAt: r.sent_at,
      error: r.error,
    })),
  })
})

/* -------------------------------- referrals --------------------------------- */

async function rewardStatus(db, referralId) {
  const code = referrerRewardCode(referralId)
  const row = await db.get('SELECT * FROM promo_codes WHERE code = ?', [code])
  if (!row) return { code: null, status: null }
  const now = Date.now()
  let status = 'active'
  if (!row.active) status = 'cancelled'
  else if (row.max_uses != null && Number(row.used_count) >= Number(row.max_uses)) status = 'used'
  else if (row.valid_until && new Date(row.valid_until).getTime() < now) status = 'expired'
  else if (row.valid_from && new Date(row.valid_from).getTime() > now) status = 'pending'
  return { code, status, validFrom: row.valid_from, validUntil: row.valid_until }
}

router.get('/referrals/list', requireAdmin('admin'), async (req, res) => {
  const db = getDb()
  const q = String(req.query.q || '').trim().toLowerCase()
  const rows = await db.all(
    `SELECT * FROM referrals ${q ? 'WHERE lower(referrer_email) LIKE ? OR lower(referred_email) LIKE ? OR lower(COALESCE(referrer_code, \'\')) LIKE ?' : ''}
     ORDER BY date DESC LIMIT 500`,
    q ? [`%${q}%`, `%${q}%`, `%${q}%`] : []
  )
  const out = []
  for (const row of rows) {
    const referred = await db.get('SELECT id FROM users WHERE lower(email) = lower(?)', [row.referred_email])
    const referrer = await db.get('SELECT id FROM users WHERE lower(email) = lower(?)', [row.referrer_email])
    out.push({
      id: row.id,
      referrerEmail: row.referrer_email,
      referrerId: referrer?.id ?? null,
      referrerCode: row.referrer_code,
      referredEmail: row.referred_email,
      referredId: referred?.id ?? null,
      purchased: Boolean(Number(row.referred_purchased)),
      date: row.date,
      reward: await rewardStatus(db, row.id),
    })
  }
  res.json({ referrals: out })
})

/** Links a newcomer to the person who brought them, when the link was lost (another device, no cookie). */
router.post('/referrals', requireAdmin('admin'), async (req, res) => {
  const db = getDb()
  const { accounts: referrers } = await resolveAccounts(db, req.body?.referrer)
  const referrer = referrers[0]
  if (!referrer) return res.status(400).json({ error: 'Unknown referrer', errorRu: 'Пригласивший не найден' })
  const { accounts: referredAccounts, unknown } = await resolveAccounts(db, req.body?.referred)
  const referredEmail = referredAccounts[0]?.email || unknown.find((t) => t.includes('@'))
  if (!referredEmail) return res.status(400).json({ error: 'Unknown referred account', errorRu: 'Приглашённый не найден' })
  if (referredEmail.toLowerCase() === referrer.email.toLowerCase()) return res.status(400).json({ error: 'Cannot refer oneself', errorRu: 'Нельзя пригласить самого себя' })
  const existing = await db.get('SELECT id, referrer_email FROM referrals WHERE lower(referred_email) = lower(?)', [referredEmail])
  if (existing) return res.status(409).json({ error: 'Already referred', errorRu: `Уже привязан к ${existing.referrer_email}` })
  let code = referrer.personalId
  if (!code) {
    const { ensurePersonalId } = await import('../services/personalId.js')
    code = await ensurePersonalId(db, referrer.id)
  }
  const bought = await db.get(
    "SELECT 1 AS paid FROM payments WHERE lower(email) = lower(?) AND status IN ('completed', 'refunded') LIMIT 1",
    [referredEmail]
  )
  await db.run(
    'INSERT INTO referrals (referrer_code, referrer_email, referred_email, referred_purchased, date) VALUES (?, ?, ?, ?, ?)',
    [String(code).toUpperCase(), referrer.email, referredEmail.toLowerCase(), bought ? 1 : 0, new Date().toISOString()]
  )
  await logAudit({ actorEmail: actor(req), action: 'referral.link', targetType: 'referral', targetId: referredEmail, meta: { referrer: referrer.email } })
  res.status(201).json({ ok: true, alreadyBought: Boolean(bought) })
})

router.delete('/referrals/:id', requireAdmin('admin'), async (req, res) => {
  const db = getDb()
  const row = await db.get('SELECT * FROM referrals WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Not found' })
  await db.run('DELETE FROM referrals WHERE id = ?', [row.id])
  // A reward not yet spent goes with the link.
  await db.run('UPDATE promo_codes SET active = 0 WHERE code = ? AND COALESCE(used_count, 0) = 0', [referrerRewardCode(row.id)])
  await logAudit({ actorEmail: actor(req), action: 'referral.unlink', targetType: 'referral', targetId: row.referred_email, meta: { referrer: row.referrer_email } })
  res.json({ ok: true })
})

/* ------------------------------ free-course views ---------------------------- */

const isFree = (course) => !(Number(course.priceEur) > 0)

/**
 * Who looks at the free material: free courses as a whole, and the first
 * (demo) lesson of every paid course. Guests count by the daily visitor hash,
 * signed-in people by account; "started" is anyone with progress stored.
 */
router.get('/free-views', requireAdmin('admin', 'editor', 'moderator'), async (req, res) => {
  const db = getDb()
  const days = Math.min(365, Math.max(1, Number(req.query.days) || 30))
  const fromDay = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const viewsFor = async (patterns) => {
    const where = patterns.map(() => 'path LIKE ?').join(' OR ')
    const row = await db.get(
      `SELECT COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors, COUNT(DISTINCT user_id) AS accounts
       FROM page_views WHERE day >= ? AND (${where})`,
      [fromDay, ...patterns]
    ).catch(() => null)
    return { views: Number(row?.views || 0), visitors: Number(row?.visitors || 0), accounts: Number(row?.accounts || 0) }
  }

  const free = []
  const demos = []
  for (const course of courseCatalog) {
    const slug = course.slug || course.id
    if (isFree(course)) {
      const views = await viewsFor([`%/study/${slug}/%`, `%/study/${slug}`])
      const started = await db.get('SELECT COUNT(*) AS c FROM progress WHERE course_id = ?', [course.id]).catch(() => null)
      free.push({ id: course.id, slug, title: course.title || course.titleRu || course.id, ...views, started: Number(started?.c || 0) })
    } else {
      const views = await viewsFor([`%/study/${slug}/1`])
      const progress = await db.all('SELECT user_id, data FROM progress WHERE course_id = ?', [course.id]).catch(() => [])
      const demoStarted = progress.filter((p) => parseJson(p.data, {}).demoStartedAt).length
      demos.push({ id: course.id, slug, title: course.title || course.titleRu || course.id, ...views, started: demoStarted })
    }
  }

  const freeSlugs = free.map((c) => c.slug)
  const people = freeSlugs.length
    ? await db.all(
        `SELECT pv.user_id, u.email, u.personal_id, MAX(pv.created_at) AS last_seen, COUNT(*) AS views
         FROM page_views pv JOIN users u ON u.id = pv.user_id
         WHERE pv.day >= ? AND pv.user_id IS NOT NULL AND (${freeSlugs.map(() => 'pv.path LIKE ?').join(' OR ')})
         GROUP BY pv.user_id, u.email, u.personal_id ORDER BY last_seen DESC LIMIT 100`,
        [fromDay, ...freeSlugs.map((slug) => `%/study/${slug}%`)]
      ).catch(() => [])
    : []

  res.json({
    days,
    free,
    demos,
    people: people.map((p) => ({ userId: Number(p.user_id), email: p.email, personalId: p.personal_id, lastSeen: p.last_seen, views: Number(p.views) })),
  })
})

export default router
