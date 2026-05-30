import { Router } from 'express'
import crypto from 'crypto'
import { getDb } from '../db.js'
import { requireUser } from '../middleware/auth.js'

const router = Router()

router.get('/:courseId', async (req, res) => {
  const db = getDb()
  const rows = await db.all(
    'SELECT * FROM reviews WHERE course_id = ? ORDER BY date DESC LIMIT 50',
    [req.params.courseId]
  )
  const stats = await db.get(
    'SELECT COUNT(*) AS count, AVG(rating) AS avg FROM reviews WHERE course_id = ?',
    [req.params.courseId]
  )
  res.json({
    reviews: rows.map(mapReview),
    average: stats?.avg ? Math.round(Number(stats.avg) * 10) / 10 : null,
    count: Number(stats?.count || 0),
  })
})

router.post('/:courseId', requireUser, async (req, res) => {
  const db = getDb()
  const { rating, text } = req.body
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5 required' })
  const user = await db.get('SELECT name FROM users WHERE id = ?', [req.userId])
  const id = `rev-${Date.now()}`
  await db.run(
    'INSERT INTO reviews (id, course_id, user_id, email, user_name, rating, text, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, req.params.courseId, req.userId, req.userEmail, user?.name, rating, text || '', new Date().toISOString()]
  )
  await db.run(
    'INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)',
    [req.userId, 'reviewer', new Date().toISOString()]
  )
  res.status(201).json({ id })
})

function mapReview(row) {
  return {
    id: row.id,
    courseId: row.course_id,
    userName: row.user_name,
    rating: row.rating,
    text: row.text,
    date: row.date,
  }
}

export default router
