import { Router } from 'express'
import { getDb, parseJson } from '../db.js'

const router = Router()

router.get('/blog', async (_req, res) => {
  const rows = await getDb().all('SELECT data FROM blog_posts ORDER BY rowid')
  res.json(rows.map((r) => parseJson(r.data, null)).filter(Boolean))
})

router.get('/calendar', async (_req, res) => {
  const rows = await getDb().all('SELECT data FROM calendar_events ORDER BY rowid')
  res.json(rows.map((r) => parseJson(r.data, null)).filter(Boolean))
})

router.post('/analytics/visit', async (_req, res) => {
  const db = getDb()
  const row = await db.get('SELECT value FROM analytics WHERE key = ?', ['main'])
  const data = parseJson(row?.value, { visits: 0, courseClicks: {} })
  data.visits = (data.visits || 0) + 1
  await db.run(
    'INSERT INTO analytics (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    ['main', JSON.stringify(data)]
  )
  res.json({ ok: true })
})

router.post('/analytics/course-click', async (req, res) => {
  const db = getDb()
  const courseId = String(req.body.courseId || '')
  const row = await db.get('SELECT value FROM analytics WHERE key = ?', ['main'])
  const data = parseJson(row?.value, { visits: 0, courseClicks: {} })
  data.courseClicks = data.courseClicks || {}
  if (courseId) data.courseClicks[courseId] = (data.courseClicks[courseId] || 0) + 1
  await db.run(
    'INSERT INTO analytics (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    ['main', JSON.stringify(data)]
  )
  res.json({ ok: true })
})

export default router
