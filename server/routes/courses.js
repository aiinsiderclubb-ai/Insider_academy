import { Router } from 'express'
import { getDb, parseJson } from '../db.js'

const router = Router()

router.get('/', async (_req, res) => {
  const db = getDb()
  const rows = await db.all('SELECT data FROM courses ORDER BY rowid')
  res.json(rows.map((r) => parseJson(r.data, null)).filter(Boolean))
})

router.get('/:id', async (req, res) => {
  const row = await getDb().get('SELECT data FROM courses WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Course not found' })
  res.json(parseJson(row.data, null))
})

export default router
