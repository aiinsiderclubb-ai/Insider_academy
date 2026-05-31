import { Router } from 'express'
import crypto from 'crypto'
import { getDb, parseJson } from '../db.js'
import { requireUser } from '../middleware/auth.js'

const router = Router()

function maskEmail(email) {
  if (!email || !email.includes('@')) return ''
  const [local, domain] = email.split('@')
  if (local.length <= 1) return `*@${domain}`
  if (local.length === 2) return `${local[0]}*@${domain}`
  return `${local[0]}***${local[local.length - 1]}@${domain}`
}

function mapPublicReview(row, course = null) {
  const contact = row.contact_email || row.email
  return {
    id: row.id,
    courseId: row.course_id,
    courseTitle: course?.title || row.course_id,
    courseTitleEn: course?.titleEn || course?.title || row.course_id,
    courseSlug: course?.slug || row.course_id,
    userName: row.user_name,
    rating: row.rating,
    text: row.text,
    date: row.date,
    emailMasked: maskEmail(contact),
  }
}

router.get('/', async (req, res) => {
  const db = getDb()
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50)
  const rows = await db.all(
    `SELECT r.*, c.data AS course_data FROM reviews r
     LEFT JOIN courses c ON c.id = r.course_id
     WHERE r.status = 'approved' AND TRIM(COALESCE(r.text, '')) != ''
     ORDER BY r.date DESC LIMIT ?`,
    [limit]
  )
  const stats = await db.get(
    "SELECT COUNT(*) AS count, AVG(rating) AS avg FROM reviews WHERE status = 'approved' AND TRIM(COALESCE(text, '')) != ''"
  )
  res.json({
    reviews: rows.map((row) => mapPublicReview(row, parseJson(row.course_data, null))),
    average: stats?.avg ? Math.round(Number(stats.avg) * 10) / 10 : null,
    count: Number(stats?.count || 0),
  })
})

router.get('/:courseId', async (req, res) => {
  const db = getDb()
  const rows = await db.all(
    `SELECT r.*, c.data AS course_data FROM reviews r
     LEFT JOIN courses c ON c.id = r.course_id
     WHERE r.course_id = ? AND r.status = 'approved' AND TRIM(COALESCE(r.text, '')) != ''
     ORDER BY r.date DESC LIMIT 50`,
    [req.params.courseId]
  )
  const stats = await db.get(
    "SELECT COUNT(*) AS count, AVG(rating) AS avg FROM reviews WHERE course_id = ? AND status = 'approved' AND TRIM(COALESCE(text, '')) != ''",
    [req.params.courseId]
  )
  res.json({
    reviews: rows.map((row) => mapPublicReview(row, parseJson(row.course_data, null))),
    average: stats?.avg ? Math.round(Number(stats.avg) * 10) / 10 : null,
    count: Number(stats?.count || 0),
  })
})

router.post('/:courseId', requireUser, async (req, res) => {
  const db = getDb()
  const courseId = req.params.courseId
  const { rating, text, contactEmail, userName } = req.body
  const ratingNum = Number(rating)
  if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Rating 1-5 required' })
  }
  if (!text?.trim()) return res.status(400).json({ error: 'Review text required' })
  const email = (contactEmail || req.userEmail || '').trim().toLowerCase()
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid contact email required' })

  const owned = await db.get(
    'SELECT id FROM purchases WHERE user_id = ? AND course_id = ?',
    [req.userId, courseId]
  )
  if (!owned) {
    return res.status(403).json({
      error: 'Review requires purchasing this course',
      errorRu: 'Отзыв могут оставить только те, кто купил этот курс',
    })
  }

  const user = await db.get('SELECT name FROM users WHERE id = ?', [req.userId])
  const id = `rev-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`
  const displayName = (userName || user?.name || req.userEmail?.split('@')[0] || 'Student').trim()

  await db.run(
    `INSERT INTO reviews (id, course_id, user_id, email, contact_email, user_name, rating, text, status, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [id, courseId, req.userId, req.userEmail, email, displayName, ratingNum, text.trim(), new Date().toISOString()]
  )

  res.status(201).json({
    id,
    message: 'Review submitted for moderation',
  })
})

export default router
