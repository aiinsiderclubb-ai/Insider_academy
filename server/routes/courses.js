import { Router } from 'express'
import { getDb, parseJson } from '../db.js'
import { optionalUser } from '../middleware/auth.js'
import { isPrelaunchMode } from '../config.js'

const router = Router()

const FREE_PREVIEW_LESSONS = 1 // первый урок платного курса — бесплатное превью

function isFreeCourse(course) {
  return Boolean(course?.isFreeTrial) || Number(course?.priceEur ?? course?.price ?? 0) === 0
}

/**
 * Убирает videoUrl из уроков, которые пользователь не купил.
 * Раньше публичный API отдавал все ссылки на видео любому анониму —
 * «доступ после покупки» существовал только на фронте.
 */
function sanitizeCourse(course, purchasedIds) {
  if (!course?.lessons?.length) return course
  if (isPrelaunchMode()) {
    return {
      ...course,
      contentLocked: true,
      availability: 'coming_soon',
      lessons: course.lessons.map((lesson) => ({ ...lesson, videoUrl: null })),
    }
  }
  if (isFreeCourse(course)) return course
  if (purchasedIds.has(course.id)) return course
  return {
    ...course,
    lessons: course.lessons.map((lesson, index) =>
      index < FREE_PREVIEW_LESSONS
        ? lesson
        : { ...lesson, videoUrl: null }
    ),
  }
}

async function getPurchasedIds(req) {
  if (!req.userId) return new Set()
  const rows = await getDb().all('SELECT course_id FROM purchases WHERE user_id = ?', [req.userId])
  return new Set(rows.map((r) => r.course_id))
}

router.get('/', optionalUser, async (req, res) => {
  const db = getDb()
  const rows = await db.all('SELECT data FROM courses ORDER BY id')
  const purchased = await getPurchasedIds(req)
  const list = rows
    .map((r) => parseJson(r.data, null))
    .filter(Boolean)
    .map((course) => sanitizeCourse(course, purchased))
  res.json(list)
})

router.get('/:id', optionalUser, async (req, res) => {
  const row = await getDb().get('SELECT data FROM courses WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Course not found' })
  const purchased = await getPurchasedIds(req)
  res.json(sanitizeCourse(parseJson(row.data, null), purchased))
})

export default router
