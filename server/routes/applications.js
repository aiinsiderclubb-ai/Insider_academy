import { Router } from 'express'
import crypto from 'crypto'
import { getDb, parseJson } from '../db.js'
import { nowIso } from '../db/time.js'
import { optionalUser } from '../middleware/auth.js'

const router = Router()

router.post('/accelerator', optionalUser, async (req, res) => {
  const db = getDb()
  const {
    firstName,
    lastName,
    age,
    country,
    telegram,
    email,
    currentActivity,
    aiExperience,
    interests,
    source,
    motivation,
    futureGoal,
  } = req.body

  const first = String(firstName || '').trim()
  const last = String(lastName || '').trim()
  const mail = String(email || '').trim().toLowerCase()
  const tg = String(telegram || '').trim()
  const countryVal = String(country || '').trim()

  if (!first || !last) return res.status(400).json({ error: 'Name required' })
  if (!mail.includes('@')) return res.status(400).json({ error: 'Valid email required' })
  if (!tg) return res.status(400).json({ error: 'Telegram required' })
  if (!countryVal) return res.status(400).json({ error: 'Country required' })
  if (!currentActivity) return res.status(400).json({ error: 'Current activity required' })
  if (!aiExperience) return res.status(400).json({ error: 'AI experience required' })
  if (!Array.isArray(interests) || interests.length === 0) {
    return res.status(400).json({ error: 'Select at least one interest' })
  }
  if (!source) return res.status(400).json({ error: 'Source required' })
  if (!String(motivation || '').trim()) return res.status(400).json({ error: 'Motivation letter required' })
  if (!String(futureGoal || '').trim()) return res.status(400).json({ error: 'Future goal required' })

  const ageNum = Number(age)
  if (!Number.isFinite(ageNum) || ageNum < 14 || ageNum > 100) {
    return res.status(400).json({ error: 'Valid age required' })
  }

  const id = `app-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`
  const now = nowIso()

  await db.run(
    `INSERT INTO accelerator_applications (
      id, user_id, first_name, last_name, age, country, telegram, email,
      current_activity, ai_experience, interests, source, motivation, future_goal,
      status, date, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
    [
      id,
      req.userId || null,
      first,
      last,
      ageNum,
      countryVal,
      tg,
      mail,
      currentActivity,
      aiExperience,
      JSON.stringify(interests),
      source,
      String(motivation).trim(),
      String(futureGoal).trim(),
      now,
      now,
    ]
  )

  res.status(201).json({ id, message: 'Application submitted' })
})

export function mapApplication(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    age: row.age,
    country: row.country,
    telegram: row.telegram,
    email: row.email,
    currentActivity: row.current_activity,
    aiExperience: row.ai_experience,
    interests: parseJson(row.interests, []),
    source: row.source,
    motivation: row.motivation,
    futureGoal: row.future_goal,
    status: row.status || 'new',
    adminNote: row.admin_note,
    date: row.date,
    updatedAt: row.updated_at,
  }
}

export default router
