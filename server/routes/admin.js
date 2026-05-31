import { Router } from 'express'
import { getDb, parseJson } from '../db.js'
import { requireAdmin, signAdminToken } from '../middleware/auth.js'
import { sendHomeworkFeedbackEmail } from '../services/email.js'
import { getFileUrl } from '../services/storage.js'
import { config } from '../config.js'
import { nowIso } from '../db/time.js'

const router = Router()

function resolveAdminRole(password) {
  const p = String(password || '')
  if (p === config.adminPassword) return 'admin'
  if (p === config.editorPassword) return 'editor'
  if (p === config.moderatorPassword) return 'moderator'
  return null
}

router.post('/login', (req, res) => {
  const role = resolveAdminRole(req.body.password)
  if (!role) return res.status(401).json({ error: 'Invalid password' })
  res.json({ token: signAdminToken(role), role })
})

router.get('/me', requireAdmin('admin', 'editor', 'moderator'), (req, res) => {
  res.json({
    role: req.adminRole,
    webhookUrl: getTributeWebhookUrl(),
    features: {
      tribute: Boolean(config.tribute.apiKey),
      email: Boolean(config.email.smtp.host),
      digest: config.adminDigestEnabled,
    },
  })
})

router.use(requireAdmin('admin', 'editor', 'moderator'))

router.get('/dashboard', async (req, res) => {
  const db = getDb()
  const mainRow = await db.get('SELECT value FROM analytics WHERE key = ?', ['main'])
  const dailyVisitsRow = await db.get('SELECT value FROM analytics WHERE key = ?', ['daily_visits'])
  const charts = await buildChartData(db)

  const payload = {
    role: req.adminRole,
    analytics: parseJson(mainRow?.value, { visits: 0, courseClicks: {} }),
    dailyVisits: parseJson(dailyVisitsRow?.value, {}),
    charts,
    courses: (await db.all('SELECT data FROM courses ORDER BY id')).map((r) => parseJson(r.data, null)).filter(Boolean),
    blog: (await db.all('SELECT data FROM blog_posts ORDER BY id')).map((r) => parseJson(r.data, null)).filter(Boolean),
    calendar: (await db.all('SELECT data FROM calendar_events ORDER BY id')).map((r) => parseJson(r.data, null)).filter(Boolean),
  }

  if (req.adminRole === 'admin' || req.adminRole === 'moderator') {
    const hwRows = await db.all('SELECT * FROM homework ORDER BY updated_at DESC LIMIT 300')
    Object.assign(payload, {
      registrations: await db.all('SELECT * FROM registrations ORDER BY date DESC LIMIT 500'),
      purchases: await db.all('SELECT * FROM purchase_log ORDER BY date DESC LIMIT 500'),
      certificates: (await db.all('SELECT * FROM certificates ORDER BY date DESC LIMIT 500')).map(mapCert),
      homework: await mapHomeworkList(hwRows),
      referrals: await db.all('SELECT * FROM referrals ORDER BY date DESC LIMIT 500'),
      discounts: Object.fromEntries((await db.all('SELECT email, percent FROM referral_discounts')).map((r) => [r.email, r.percent])),
      reviews: (await db.all('SELECT * FROM reviews ORDER BY date DESC LIMIT 200')).map(mapReview),
      teams: await db.all('SELECT * FROM teams ORDER BY created_at DESC LIMIT 50'),
    })
  }

  if (req.adminRole === 'admin') {
    try {
      payload.webhookLog = await db.all(
        'SELECT id, event_name, status, created_at FROM webhook_events ORDER BY created_at DESC LIMIT 20'
      )
    } catch {
      payload.webhookLog = []
    }
    payload.settings = {
      tributeWebhookUrl: getTributeWebhookUrl(),
      tributeEnabled: Boolean(config.tribute.apiKey),
    }
  }

  res.json(payload)
})

router.put('/courses', requireAdmin('admin', 'editor'), async (req, res) => {
  const list = req.body.courses
  if (!Array.isArray(list)) return res.status(400).json({ error: 'courses array required' })
  const db = getDb()
  await db.run('DELETE FROM courses')
  for (const c of list) {
    await db.run('INSERT INTO courses (id, data, updated_at) VALUES (?, ?, ?)', [c.id, JSON.stringify(c), nowIso()])
  }
  res.json({ ok: true, count: list.length })
})

router.put('/blog', requireAdmin('admin', 'editor'), async (req, res) => {
  const list = req.body.posts
  if (!Array.isArray(list)) return res.status(400).json({ error: 'posts array required' })
  const db = getDb()
  await db.run('DELETE FROM blog_posts')
  for (const p of list) await db.run('INSERT INTO blog_posts (id, data) VALUES (?, ?)', [p.id, JSON.stringify(p)])
  res.json({ ok: true })
})

router.put('/calendar', requireAdmin('admin', 'editor'), async (req, res) => {
  const list = req.body.events
  if (!Array.isArray(list)) return res.status(400).json({ error: 'events array required' })
  const db = getDb()
  await db.run('DELETE FROM calendar_events')
  for (const e of list) await db.run('INSERT INTO calendar_events (id, data) VALUES (?, ?)', [e.id, JSON.stringify(e)])
  res.json({ ok: true })
})

router.patch('/homework/:id', requireAdmin('admin', 'moderator'), async (req, res) => {
  const db = getDb()
  const { status, adminComment, score } = req.body
  const row = await db.get('SELECT * FROM homework WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Not found' })
  const nextScore = score !== undefined && score !== null && score !== '' ? Number(score) : null
  await db.run(
    `UPDATE homework SET status = COALESCE(?, status), admin_comment = COALESCE(?, admin_comment),
     score = COALESCE(?, score), updated_at = ? WHERE id = ?`,
    [status ?? null, adminComment ?? null, nextScore, nowIso(), req.params.id]
  )
  if (status && row.email) {
    await db.run(
      `INSERT INTO notifications (id, email, type, status, course_id, course_title, lesson_title, lesson_index, message, date)
       VALUES (?, ?, 'homework_feedback', ?, ?, ?, ?, ?, ?, ?)`,
      [`n-${Date.now()}`, row.email, status, row.course_id, row.course_title, row.lesson_title,
        row.lesson_index, adminComment || (status === 'accepted' ? 'ДЗ принято' : 'ДЗ на доработку'), new Date().toISOString()]
    )
    sendHomeworkFeedbackEmail({
      email: row.email, courseTitle: row.course_title, lessonTitle: row.lesson_title, status, comment: adminComment,
    }).catch(() => {})
  }
  res.json({ ok: true, homework: (await mapHomeworkList([await db.get('SELECT * FROM homework WHERE id = ?', [req.params.id])]))[0] })
})

router.patch('/reviews/:id', requireAdmin('admin', 'moderator'), async (req, res) => {
  const db = getDb()
  const { status } = req.body
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved, rejected, or pending' })
  }
  const row = await db.get('SELECT * FROM reviews WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Not found' })
  await db.run('UPDATE reviews SET status = ? WHERE id = ?', [status, req.params.id])
  if (status === 'approved' && row.user_id) {
    await db.run(
      'INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)',
      [row.user_id, 'reviewer', new Date().toISOString()]
    )
  }
  res.json({ ok: true, review: mapReview(await db.get('SELECT * FROM reviews WHERE id = ?', [req.params.id])) })
})

router.post('/certificates', requireAdmin('admin', 'moderator'), async (req, res) => {
  const db = getDb()
  const { email, courseId, courseTitle, fileName, fileType, fileDataUrl, score } = req.body
  const id = `cert-${Date.now()}`
  const now = new Date().toISOString()
  await db.run(
    `INSERT INTO certificates (id, email, course_id, course_title, file_name, file_type, file_path, score, date, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, email, courseId, courseTitle, fileName, fileType, fileDataUrl, score, now, now]
  )
  await db.run(
    `INSERT INTO notifications (id, email, type, course_id, course_title, target_path, message, date)
     VALUES (?, ?, 'certificate_added', ?, ?, '/cabinet#certificates', ?, ?)`,
    [`n-${Date.now()}`, email, courseId, courseTitle, 'Сертификат добавлен', now]
  )
  res.json({ ok: true, id })
})

function getTributeWebhookUrl() {
  if (config.tribute.webhookUrl) return config.tribute.webhookUrl
  const base = config.appUrl.replace(/\/$/, '')
  if (base.includes('localhost')) return `${base.replace(':5173', ':3001')}/api/webhooks/tribute`
  return `${base}/api/webhooks/tribute`
}

async function buildChartData(db) {
  const isPg = db.driver === 'postgres'
  const sinceFilter = isPg
    ? "(date::timestamptz >= NOW() - INTERVAL '30 days')"
    : "date >= date('now', '-30 days')"
  const dayExpr = isPg ? '(date::timestamptz)::date AS day' : 'date(date) AS day'

  const purchasesByDay = await db.all(
    `SELECT ${dayExpr}, COALESCE(SUM(amount), 0) AS revenue, COUNT(*) AS count
     FROM purchase_log WHERE ${sinceFilter} GROUP BY day ORDER BY day`
  )
  const registrationsByDay = await db.all(
    `SELECT ${dayExpr}, COUNT(*) AS count
     FROM registrations WHERE ${sinceFilter} GROUP BY day ORDER BY day`
  )
  const dailyVisits = parseJson((await db.get('SELECT value FROM analytics WHERE key = ?', ['daily_visits']))?.value, {})
  const visitDays = Object.entries(dailyVisits)
    .filter(([day]) => day >= new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day))

  const main = parseJson((await db.get('SELECT value FROM analytics WHERE key = ?', ['main']))?.value, { visits: 0 })
  const totalVisits = main.visits || 0
  const totalRegs = Number((await db.get('SELECT COUNT(*) AS c FROM registrations'))?.c || 0)
  const totalPurchases = Number((await db.get('SELECT COUNT(*) AS c FROM purchase_log'))?.c || 0)

  return {
    purchasesByDay,
    registrationsByDay,
    visitsByDay: visitDays,
    funnel: {
      visits: totalVisits,
      registrations: totalRegs,
      purchases: totalPurchases,
      conversionReg: totalVisits ? Math.round((totalRegs / totalVisits) * 1000) / 10 : 0,
      conversionPurchase: totalRegs ? Math.round((totalPurchases / totalRegs) * 1000) / 10 : 0,
    },
  }
}

function mapCert(row) {
  return {
    id: row.id, email: row.email, courseId: row.course_id, courseTitle: row.course_title,
    fileName: row.file_name, fileType: row.file_type, fileDataUrl: row.file_path,
    score: row.score, date: row.date, updatedAt: row.updated_at,
  }
}

function mapHw(row) {
  return {
    id: row.id, email: row.email, name: row.name, courseId: row.course_id,
    courseTitle: row.course_title, lessonIndex: row.lesson_index, lessonTitle: row.lesson_title,
    content: row.content, fileName: row.file_name, fileType: row.file_type, fileDataUrl: null,
    fileUrl: null, status: row.status, score: row.score, adminComment: row.admin_comment,
    date: row.date, updatedAt: row.updated_at,
  }
}

async function mapHomeworkList(rows = []) {
  return Promise.all(rows.map(async (row) => {
    const hw = mapHw(row)
    if (row.file_path) {
      const url = await getFileUrl(row.file_path, row.file_storage)
      hw.fileDataUrl = url
      hw.fileUrl = url
    }
    return hw
  }))
}

function mapReview(row) {
  return {
    id: row.id,
    courseId: row.course_id,
    userId: row.user_id,
    email: row.email,
    contactEmail: row.contact_email || row.email,
    userName: row.user_name,
    rating: row.rating,
    text: row.text,
    status: row.status || 'pending',
    date: row.date,
  }
}

export default router
