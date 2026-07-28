import { Router } from 'express'
import { getDb, parseJson } from '../db.js'
import { getFeatureFlags } from '../services/featureFlags.js'

const router = Router()

router.get('/feature-flags', async (_req, res) => {
  res.json(await getFeatureFlags())
})

router.get('/blog', async (req, res) => {
  const rows = await getDb().all('SELECT data FROM blog_posts ORDER BY id')
  const posts = rows.map((r) => parseJson(r.data, null)).filter(Boolean)
  const lang = String(req.query.lang || '').toLowerCase()
  if (!['ru', 'uk', 'en'].includes(lang)) return res.json(posts)
  res.json(posts.filter((post) => {
    if (lang === 'en') return Boolean(post.titleEn || post.title)
    return post.lang === lang
      || (!post.lang && lang === 'uk' && /[іїєґІЇЄҐ]/.test(`${post.title || ''} ${post.excerpt || ''}`))
      || (!post.lang && lang === 'ru' && !/[іїєґІЇЄҐ]/.test(`${post.title || ''} ${post.excerpt || ''}`))
  }))
})

router.get('/calendar', async (_req, res) => {
  const rows = await getDb().all('SELECT data FROM calendar_events ORDER BY id')
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
  const today = new Date().toISOString().slice(0, 10)
  const dailyRow = await db.get('SELECT value FROM analytics WHERE key = ?', ['daily_visits'])
  const daily = parseJson(dailyRow?.value, {})
  daily[today] = (daily[today] || 0) + 1
  await db.run(
    'INSERT INTO analytics (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    ['daily_visits', JSON.stringify(daily)]
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
