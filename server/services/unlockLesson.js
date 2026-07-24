import { getDb, parseJson } from '../db.js'
import { nowIso } from '../db/time.js'
import { grantCourseAccess } from './grantCourse.js'
import { getCourseSlug, createUserNotification } from './notifications.js'
import * as sheetsTrack from './sheetsTrack.js'
import { prelaunchServiceGuard } from '../middleware/prelaunch.js'

async function getCourseData(db, courseId) {
  const row = await db.get('SELECT data FROM courses WHERE id = ?', [courseId])
  return parseJson(row?.data, null)
}

async function ensureHomeworkAccepted(db, {
  email,
  name,
  courseId,
  courseTitle,
  lessonIndex,
  lessonTitle,
  personalId,
}) {
  const blocked = prelaunchServiceGuard()
  if (blocked) return blocked
  const existing = await db.get(
    'SELECT id, status FROM homework WHERE email = ? AND course_id = ? AND lesson_index = ?',
    [email, courseId, lessonIndex]
  )
  const now = nowIso()
  if (existing) {
    if (existing.status === 'accepted') return existing.id
    await db.run(
      `UPDATE homework SET status = 'accepted', admin_comment = COALESCE(admin_comment, 'Открыто администратором'),
       updated_at = ? WHERE id = ?`,
      [now, existing.id]
    )
    sheetsTrack.trackHomeworkEvent({
      email,
      personalId,
      courseTitle,
      lessonIndex,
      lessonTitle,
      status: 'accepted',
      action: 'админ: открыт урок',
      recordId: existing.id,
    }).catch(() => {})
    return existing.id
  }

  const id = `hw-admin-${Date.now()}-${lessonIndex}`
  await db.run(
    `INSERT INTO homework (id, email, name, course_id, course_title, lesson_index, lesson_title, content, status, date, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'accepted', ?, ?)`,
    [id, email, name || email, courseId, courseTitle, lessonIndex, lessonTitle, 'Открыто администратором', now, now]
  )
  sheetsTrack.trackHomeworkEvent({
    email,
    personalId,
    courseTitle,
    lessonIndex,
    lessonTitle,
    status: 'accepted',
    action: 'админ: открыт урок',
    recordId: id,
  }).catch(() => {})
  return id
}

function mergeProgressIndices(data, indices) {
  const next = {
    watched: [...(data.watched || [])],
    homeworkSubmitted: [...(data.homeworkSubmitted || [])],
    homeworkChecked: [...(data.homeworkChecked || [])],
  }
  for (const i of indices) {
    if (!next.homeworkChecked.includes(i)) next.homeworkChecked.push(i)
    if (!next.homeworkSubmitted.includes(i)) next.homeworkSubmitted.push(i)
    if (!next.watched.includes(i)) next.watched.push(i)
  }
  next.homeworkChecked.sort((a, b) => a - b)
  next.homeworkSubmitted.sort((a, b) => a - b)
  next.watched.sort((a, b) => a - b)
  return next
}

/**
 * Открыть урок lessonIndex (0-based) для пользователя: выдать курс при необходимости,
 * принять ДЗ по предыдущим урокам, обновить progress.
 */
export async function unlockLessonForUser({
  email,
  courseId,
  lessonIndex,
  courseTitle: courseTitleIn,
}) {
  const db = getDb()
  const mail = String(email || '').trim().toLowerCase()
  const cid = String(courseId || '').trim()
  const idx = Number(lessonIndex)

  if (!mail || !cid) return { ok: false, error: 'email and courseId required' }
  if (!Number.isInteger(idx) || idx < 0) return { ok: false, error: 'lessonIndex must be a non-negative integer' }

  const courseData = await getCourseData(db, cid)
  const lessons = Array.isArray(courseData?.lessons) ? courseData.lessons : []
  if (lessons.length && idx >= lessons.length) {
    return { ok: false, error: `lessonIndex out of range (max ${lessons.length - 1})` }
  }

  const title = String(courseTitleIn || courseData?.title || cid).trim()
  const access = await grantCourseAccess({ email: mail, courseId: cid, courseTitle: title })
  if (!access.ok) return access

  const user = await db.get('SELECT id, email, name, personal_id FROM users WHERE email = ?', [mail])
  if (!user) return { ok: false, error: 'User not found' }

  const acceptedLessons = []
  for (let i = 0; i < idx; i += 1) {
    const lessonTitle = lessons[i]?.title || lessons[i]?.titleRu || `Урок ${i + 1}`
    await ensureHomeworkAccepted(db, {
      email: mail,
      name: user.name,
      courseId: cid,
      courseTitle: title,
      lessonIndex: i,
      lessonTitle,
      personalId: user.personal_id,
    })
    acceptedLessons.push(i)
  }

  const progressRow = await db.get(
    'SELECT data FROM progress WHERE user_id = ? AND course_id = ?',
    [user.id, cid]
  )
  const prev = parseJson(progressRow?.data, {})
  const indices = idx > 0 ? [...Array(idx).keys()] : []
  const merged = mergeProgressIndices(prev, indices)
  await db.run(
    `INSERT INTO progress (user_id, course_id, data, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, course_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    [user.id, cid, JSON.stringify(merged), nowIso()]
  )

  const slug = (await getCourseSlug(db, cid)) || courseData?.slug || cid
  const lessonTitle = lessons[idx]?.title || lessons[idx]?.titleRu || `Урок ${idx + 1}`
  const targetPath = slug ? `/courses/${slug}?lesson=${idx}` : '/cabinet'
  await createUserNotification(db, {
    email: mail,
    type: 'lesson_unlocked',
    courseId: cid,
    courseSlug: slug,
    courseTitle: title,
    lessonTitle,
    lessonIndex: idx,
    targetPath,
    message: `Администратор открыл урок ${idx + 1}: ${lessonTitle}`,
  }).catch(() => {})

  return {
    ok: true,
    email: mail,
    courseId: cid,
    lessonIndex: idx,
    lessonTitle,
    courseGranted: access.granted,
    acceptedPreviousLessons: acceptedLessons,
    targetPath,
  }
}
