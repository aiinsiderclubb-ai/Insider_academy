import { Router } from 'express'
import { getDb, parseJson } from '../db.js'
import { requireAdmin, signAdminToken } from '../middleware/auth.js'
import { sendHomeworkFeedbackEmail } from '../services/email.js'
import { config } from '../config.js'

const router = Router()

router.post('/login', (req, res) => {
  if (String(req.body.password || '') !== config.adminPassword) {
    return res.status(401).json({ error: 'Invalid password' })
  }
  res.json({ token: signAdminToken() })
})

router.use(requireAdmin)

router.get('/dashboard', async (_req, res) => {
  const db = getDb()
  const mainRow = await db.get('SELECT value FROM analytics WHERE key = ?', ['main'])
  const discountsRows = await db.all('SELECT email, percent FROM referral_discounts')
  res.json({
    registrations: await db.all('SELECT * FROM registrations ORDER BY date DESC LIMIT 500'),
    purchases: await db.all('SELECT * FROM purchase_log ORDER BY date DESC LIMIT 500'),
    certificates: (await db.all('SELECT * FROM certificates ORDER BY date DESC LIMIT 500')).map(mapCert),
    homework: (await db.all('SELECT * FROM homework ORDER BY updated_at DESC LIMIT 300')).map(mapHw),
    referrals: await db.all('SELECT * FROM referrals ORDER BY date DESC LIMIT 500'),
    discounts: Object.fromEntries(discountsRows.map((r) => [r.email, r.percent])),
    analytics: parseJson(mainRow?.value, { visits: 0, courseClicks: {} }),
    courses: (await db.all('SELECT data FROM courses ORDER BY rowid')).map((r) => parseJson(r.data, null)).filter(Boolean),
    blog: (await db.all('SELECT data FROM blog_posts ORDER BY rowid')).map((r) => parseJson(r.data, null)).filter(Boolean),
    calendar: (await db.all('SELECT data FROM calendar_events ORDER BY rowid')).map((r) => parseJson(r.data, null)).filter(Boolean),
    reviews: await db.all('SELECT * FROM reviews ORDER BY date DESC LIMIT 100'),
    teams: await db.all('SELECT * FROM teams ORDER BY created_at DESC LIMIT 50'),
  })
})

router.put('/courses', async (req, res) => {
  const list = req.body.courses
  if (!Array.isArray(list)) return res.status(400).json({ error: 'courses array required' })
  const db = getDb()
  await db.run('DELETE FROM courses')
  for (const c of list) {
    await db.run('INSERT INTO courses (id, data, updated_at) VALUES (?, ?, datetime(\'now\'))', [c.id, JSON.stringify(c)])
  }
  res.json({ ok: true, count: list.length })
})

router.put('/blog', async (req, res) => {
  const list = req.body.posts
  if (!Array.isArray(list)) return res.status(400).json({ error: 'posts array required' })
  const db = getDb()
  await db.run('DELETE FROM blog_posts')
  for (const p of list) await db.run('INSERT INTO blog_posts (id, data) VALUES (?, ?)', [p.id, JSON.stringify(p)])
  res.json({ ok: true })
})

router.put('/calendar', async (req, res) => {
  const list = req.body.events
  if (!Array.isArray(list)) return res.status(400).json({ error: 'events array required' })
  const db = getDb()
  await db.run('DELETE FROM calendar_events')
  for (const e of list) await db.run('INSERT INTO calendar_events (id, data) VALUES (?, ?)', [e.id, JSON.stringify(e)])
  res.json({ ok: true })
})

router.patch('/homework/:id', async (req, res) => {
  const db = getDb()
  const { status, adminComment, score } = req.body
  const row = await db.get('SELECT * FROM homework WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Not found' })
  await db.run(
    `UPDATE homework SET status = COALESCE(?, status), admin_comment = COALESCE(?, admin_comment),
     score = COALESCE(?, score), updated_at = datetime('now') WHERE id = ?`,
    [status ?? null, adminComment ?? null, score ?? null, req.params.id]
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
  res.json({ ok: true })
})

router.post('/certificates', async (req, res) => {
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
    content: row.content, fileName: row.file_name, fileType: row.file_type, fileDataUrl: row.file_path,
    status: row.status, score: row.score, adminComment: row.admin_comment,
    date: row.date, updatedAt: row.updated_at,
  }
}

export default router
