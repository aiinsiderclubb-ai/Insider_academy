import { Router } from 'express'
import crypto from 'crypto'
import { getDb, parseJson } from '../db.js'
import { requireUser } from '../middleware/auth.js'
import { rateLimitMiddleware } from '../middleware/rateLimit.js'
import * as sheetsTrack from '../services/sheetsTrack.js'
import { courses } from '../../src/data/courses.js'
import { SEED_REVIEWS, isApprovedSeedReview } from '../../src/data/seedReviews.js'

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

function mapSeedReview(seed) {
  const course = courses.find((c) => c.id === seed.courseId) || null
  return mapPublicReview(
    {
      id: seed.id,
      course_id: seed.courseId,
      user_name: seed.userName,
      rating: seed.rating,
      text: seed.text,
      date: seed.date,
      email: seed.email,
      contact_email: seed.contactEmail,
    },
    course
  )
}

function mergeApprovedReviews(dbRows, courseId = null) {
  const fromDb = dbRows.map((row) => mapPublicReview(row, parseJson(row.course_data, null)))
  const seeds = SEED_REVIEWS.filter(
    (r) => isApprovedSeedReview(r) && (!courseId || r.courseId === courseId)
  ).map(mapSeedReview)
  const byId = new Map()
  for (const r of seeds) byId.set(r.id, r)
  for (const r of fromDb) byId.set(r.id, r)
  return [...byId.values()].sort((a, b) => new Date(b.date) - new Date(a.date))
}

function reviewStatsFromList(list) {
  const count = list.length
  const average = count
    ? Math.round((list.reduce((s, r) => s + Number(r.rating || 0), 0) / count) * 10) / 10
    : null
  return { count, average }
}

router.get('/', async (req, res) => {
  const db = getDb()
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50)
  const rows = await db.all(
    `SELECT r.*, c.data AS course_data FROM reviews r
     LEFT JOIN courses c ON c.id = r.course_id
     WHERE r.status = 'approved' AND TRIM(COALESCE(r.text, '')) != ''
     ORDER BY r.date DESC`
  )
  const merged = mergeApprovedReviews(rows).slice(0, limit)
  const allMerged = mergeApprovedReviews(rows)
  const { count, average } = reviewStatsFromList(allMerged)
  res.json({ reviews: merged, average, count })
})

router.get('/:courseId', async (req, res) => {
  const db = getDb()
  const courseId = req.params.courseId
  const rows = await db.all(
    `SELECT r.*, c.data AS course_data FROM reviews r
     LEFT JOIN courses c ON c.id = r.course_id
     WHERE r.course_id = ? AND r.status = 'approved' AND TRIM(COALESCE(r.text, '')) != ''
     ORDER BY r.date DESC`,
    [courseId]
  )
  const merged = mergeApprovedReviews(rows, courseId).slice(0, 50)
  const { count, average } = reviewStatsFromList(mergeApprovedReviews(rows, courseId))
  res.json({ reviews: merged, average, count })
})

router.post(
  '/:courseId',
  requireUser,
  rateLimitMiddleware({ windowMs: 3600_000, max: 3, keyFn: (req) => `u${req.userId}` }),
  async (req, res) => {
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

  const u = await db.get('SELECT personal_id FROM users WHERE id = ?', [req.userId])
  sheetsTrack.trackReviewEvent({
    email: req.userEmail,
    personalId: u?.personal_id,
    courseId,
    rating: ratingNum,
    status: 'pending',
    text: text.trim(),
    action: 'отправлен',
    reviewId: id,
  }).catch(() => {})

  res.status(201).json({
    id,
    message: 'Review submitted for moderation',
  })
  }
)

export default router
