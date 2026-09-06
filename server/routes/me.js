import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { getDb, parseJson } from '../db.js'
import { nowIso } from '../db/time.js'
import { requireUser } from '../middleware/auth.js'
import { signUserToken } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { saveUploadedFile, getFileUrl } from '../services/storage.js'
import { isPrelaunchMode, isS3Enabled } from '../config.js'
import { computeAchievements, updateStreak, ACHIEVEMENTS } from '../services/achievements.js'
import { sendTelegramMessage } from '../services/telegram.js'
import { mapUserResponse, syncUserRecords, userSelectFields } from '../services/userProfile.js'
import { ensurePersonalId } from '../services/personalId.js'
import { createUserNotification } from '../services/notifications.js'
import * as sheetsTrack from '../services/sheetsTrack.js'
import { issueEmailVerificationCode } from '../services/emailVerification.js'
import { prelaunchBlocked } from '../middleware/prelaunch.js'
import { validateUserPassword } from '../utils/security.js'

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

const router = Router()
router.use(requireUser)

router.get('/', async (req, res) => {
  const db = getDb()
  const prelaunch = isPrelaunchMode()
  let user = await db.get(`SELECT ${userSelectFields()} FROM users WHERE id = ?`, [req.userId])
  if (!user) return res.status(404).json({ error: 'User not found' })
  if (!user.personal_id) {
    await ensurePersonalId(db, req.userId)
    user = await db.get(`SELECT ${userSelectFields()} FROM users WHERE id = ?`, [req.userId])
  }

  const purchases = prelaunch ? [] : await db.all(
    'SELECT course_id AS id, purchased_at AS purchasedAt FROM purchases WHERE user_id = ? ORDER BY purchased_at DESC',
    [req.userId]
  )
  const progressRows = prelaunch ? [] : await db.all('SELECT course_id, data FROM progress WHERE user_id = ?', [req.userId])
  const progress = {}
  for (const row of progressRows) progress[row.course_id] = parseJson(row.data, {})

  const discountRow = await db.get('SELECT percent FROM referral_discounts WHERE email = ?', [user.email])
  const reviews = prelaunch ? [] : await db.all('SELECT course_id FROM reviews WHERE user_id = ?', [req.userId])
  const streak = prelaunch
    ? { current: user.streak_count || 0, best: user.streak_count || 0 }
    : await updateStreak(db, req.userId)
  const achievements = prelaunch ? [] : computeAchievements({ progress, purchases, reviews, streak })

  for (const a of achievements) {
    await db.run(
      'INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)',
      [req.userId, a.id, new Date().toISOString()]
    )
  }

  res.json({
    user: await mapUserResponse(db, user),
    purchases,
    progress,
    discountPercent: discountRow?.percent || 0,
    streak,
    achievements,
    prelaunch,
  })
})

router.get('/stats', async (req, res) => {
  const db = getDb()
  if (isPrelaunchMode()) {
    return res.json({
      chart: [],
      streak: { current: 0, lastActivity: null },
      achievements: [],
      prelaunch: true,
    })
  }
  const progressRows = await db.all('SELECT course_id, data FROM progress WHERE user_id = ?', [req.userId])
  const chart = progressRows.map((row) => {
    const p = parseJson(row.data, {})
    const total = Math.max((p.watched?.length || 0), (p.homeworkChecked?.length || 0) + (p.watched?.length || 0))
    return { courseId: row.course_id, percent: Math.min(100, total * 10) }
  })
  const user = await db.get('SELECT streak_count, last_activity_date FROM users WHERE id = ?', [req.userId])
  const unlocked = await db.all('SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?', [req.userId])
  res.json({
    chart,
    streak: { current: user?.streak_count || 0, lastActivity: user?.last_activity_date },
    achievements: unlocked.map((u) => ({
      ...ACHIEVEMENTS.find((a) => a.id === u.achievement_id),
      unlockedAt: u.unlocked_at,
    })).filter((a) => a.id),
  })
})

router.post('/purchases', async (req, res) => {
  res.status(403).json({
    error: 'Purchases can only be granted by a verified payment webhook',
    errorRu: 'Доступ выдаётся только после подтверждённой оплаты',
  })
})

router.get('/activity', async (req, res) => {
  const db = getDb()
  const user = await db.get('SELECT last_login_at, name FROM users WHERE id = ?', [req.userId])
  const last = user?.last_login_at ? new Date(user.last_login_at).getTime() : Date.now()
  const inactiveDays = Math.floor((Date.now() - last) / 86400000)
  res.json({
    inactiveDays,
    showInactivityBanner: inactiveDays >= 3,
    lastLoginAt: user?.last_login_at,
  })
})

router.get('/reminders', async (req, res) => {
  const rows = await getDb().all(
    'SELECT id, course_id AS courseId, lesson_index AS lessonIndex, remind_at AS remindAt, sent FROM lesson_reminders WHERE user_id = ? ORDER BY remind_at DESC LIMIT 20',
    [req.userId]
  )
  res.json(rows)
})

router.post('/peer-reviews', prelaunchBlocked, async (req, res) => {
  const db = getDb()
  const { courseId, lessonIndex, rating, comment, homeworkId } = req.body
  const ratingNum = Number(rating)
  if (!courseId || !Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'courseId and rating 1-5 required' })
  }
  const owned = await db.get('SELECT id FROM purchases WHERE user_id = ? AND course_id = ?', [req.userId, courseId])
  if (!owned) return res.status(403).json({ error: 'Course access required' })

  const id = `peer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  await db.run(
    `INSERT INTO peer_reviews (id, course_id, lesson_index, reviewer_user_id, homework_id, rating, comment, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [id, courseId, Number(lessonIndex) || 0, req.userId, homeworkId || null, ratingNum, comment?.trim() || null, nowIso()]
  )
  res.status(201).json({ id })
})

router.put('/progress/:courseId', prelaunchBlocked, async (req, res) => {
  const db = getDb()
  const data = req.body.data || {}
  await db.run(
    `INSERT INTO progress (user_id, course_id, data, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, course_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    [req.userId, req.params.courseId, JSON.stringify(data), nowIso()]
  )
  await updateStreak(db, req.userId)
  res.json({ ok: true, data })
})

router.post('/referral', async (req, res) => {
  const db = getDb()
  const { referrerCode, referrerEmail } = req.body
  const user = await db.get('SELECT email FROM users WHERE id = ?', [req.userId])
  if (referrerEmail && referrerEmail !== user.email) {
    const exists = await db.get('SELECT id FROM referrals WHERE referred_email = ?', [user.email])
    if (!exists) {
      await db.run(
        'INSERT INTO referrals (referrer_code, referrer_email, referred_email, date) VALUES (?, ?, ?, ?)',
        [referrerCode, referrerEmail, user.email, new Date().toISOString()]
      )
      sheetsTrack.trackReferral({
        referrerEmail,
        referredEmail: user.email,
        purchased: false,
      }).catch(() => {})
      const d = await db.get('SELECT percent FROM referral_discounts WHERE email = ?', [referrerEmail])
      await db.run(
        'INSERT INTO referral_discounts (email, percent) VALUES (?, ?) ON CONFLICT(email) DO UPDATE SET percent = excluded.percent',
        [referrerEmail, (d?.percent || 0) + 1]
      )
    }
  }
  res.json({ ok: true })
})

router.get('/notifications', async (req, res) => {
  const db = getDb()
  const rows = await db.all('SELECT * FROM notifications WHERE email = ? ORDER BY date DESC LIMIT 50', [req.userEmail])
  res.json(rows.map(mapNotification))
})

router.patch('/notifications/read-all', async (req, res) => {
  await getDb().run('UPDATE notifications SET read = 1 WHERE email = ? AND read = 0', [req.userEmail])
  res.json({ ok: true })
})

router.patch('/notifications/:id/read', async (req, res) => {
  await getDb().run('UPDATE notifications SET read = 1 WHERE id = ? AND email = ?', [req.params.id, req.userEmail])
  res.json({ ok: true })
})

router.get('/certificates', async (req, res) => {
  const db = getDb()
  const rows = await db.all('SELECT * FROM certificates WHERE email = ? ORDER BY date DESC', [req.userEmail])
  const mapped = await Promise.all(rows.map(async (row) => {
    const cert = mapCertificate(row)
    if (row.file_path) cert.fileDataUrl = await getFileUrl(row.file_path, row.file_storage)
    return cert
  }))
  res.json(mapped)
})

router.get('/homework/:courseId/:lessonIndex', prelaunchBlocked, async (req, res) => {
  const db = getDb()
  const row = await db.get(
    'SELECT * FROM homework WHERE email = ? AND course_id = ? AND lesson_index = ?',
    [req.userEmail, req.params.courseId, Number(req.params.lessonIndex)]
  )
  if (!row) return res.json(null)
  const hw = mapHomework(row)
  if (row.file_path) hw.fileUrl = await getFileUrl(row.file_path, row.file_storage)
  res.json(hw)
})

router.post('/homework', prelaunchBlocked, upload.single('file'), async (req, res) => {
  const db = getDb()
  const user = await db.get('SELECT email, name FROM users WHERE id = ?', [req.userId])
  if (!user?.email) return res.status(404).json({ error: 'User not found' })
  const { courseId, courseTitle, lessonIndex, lessonTitle, content } = req.body
  const now = new Date().toISOString()
  const existing = await db.get(
    'SELECT id FROM homework WHERE email = ? AND course_id = ? AND lesson_index = ?',
    [user.email, courseId, Number(lessonIndex)]
  )
  const finalId = existing?.id || `hw-${Date.now()}`
  let fileMeta = { fileName: null, fileType: null, filePath: null, fileStorage: 'local' }
  if (req.file) {
    const saved = await saveUploadedFile(req.file, 'homework')
    fileMeta = { fileName: saved.fileName, fileType: saved.fileType, filePath: saved.key, fileStorage: saved.storage }
  }
  await db.run(
    `INSERT INTO homework (id, email, name, course_id, course_title, lesson_index, lesson_title, content, file_name, file_type, file_path, file_storage, status, date, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
     ON CONFLICT(id) DO UPDATE SET content=excluded.content, file_name=excluded.file_name, file_type=excluded.file_type,
     file_path=excluded.file_path, file_storage=excluded.file_storage, status='pending', updated_at=excluded.updated_at`,
    [finalId, user.email, user.name, courseId, courseTitle, Number(lessonIndex), lessonTitle,
      content || '', fileMeta.fileName, fileMeta.fileType, fileMeta.filePath, fileMeta.fileStorage, now, now]
  )
  const uRow = await db.get('SELECT personal_id FROM users WHERE id = ?', [req.userId])
  sheetsTrack.trackHomeworkEvent({
    email: user.email,
    personalId: uRow?.personal_id,
    courseTitle,
    lessonIndex: Number(lessonIndex),
    lessonTitle,
    status: 'pending',
    action: existing ? 'пересдача' : 'сдано',
    recordId: finalId,
  }).catch(() => {})
  res.json({ id: finalId })
})

router.patch('/profile', async (req, res) => {
  const db = getDb()
  const name = String(req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'Name required' })
  const current = await db.get('SELECT email, name FROM users WHERE id = ?', [req.userId])
  if (!current) return res.status(404).json({ error: 'User not found' })
  const now = nowIso()
  await db.run('UPDATE users SET name = ?, profile_updated_at = ? WHERE id = ?', [name, now, req.userId])
  await syncUserRecords(db, current.email, { name })
  const user = await db.get(`SELECT ${userSelectFields()} FROM users WHERE id = ?`, [req.userId])
  res.json({ user: await mapUserResponse(db, user) })
})

router.patch('/password', async (req, res) => {
  const db = getDb()
  const currentPassword = String(req.body.currentPassword || '')
  const newPassword = String(req.body.newPassword || '')
  const passwordCheck = validateUserPassword(newPassword)
  if (!passwordCheck.ok) return res.status(400).json(passwordCheck)
  const row = await db.get('SELECT password_hash, email FROM users WHERE id = ?', [req.userId])
  if (!row || !bcrypt.compareSync(currentPassword, row.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }
  const hash = bcrypt.hashSync(newPassword, 10)
  const now = nowIso()
  await db.run(
    'UPDATE users SET password_hash = ?, password_changed_at = ?, profile_updated_at = ?, token_version = COALESCE(token_version, 0) + 1 WHERE id = ?',
    [hash, now, now, req.userId]
  )
  await createUserNotification(db, {
    email: row.email,
    type: 'password_changed',
    targetPath: '/account',
    message: 'Пароль аккаунта изменён. Если это были не вы — срочно восстановите доступ через «Забыли пароль?».',
  })
  const user = await db.get(`SELECT ${userSelectFields()} FROM users WHERE id = ?`, [req.userId])
  sheetsTrack.trackPasswordChange({
    email: row.email,
    personalId: user?.personal_id,
    action: 'смена в настройках',
  }).catch(() => {})
  res.json({ ok: true, passwordChangedAt: now, user: await mapUserResponse(db, user) })
})

router.patch('/email', async (req, res) => {
  const db = getDb()
  const email = normalizeEmail(req.body.email)
  const currentPassword = String(req.body.currentPassword || '')
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' })
  }
  const row = await db.get(`SELECT ${userSelectFields()}, password_hash FROM users WHERE id = ?`, [req.userId])
  if (!row || !bcrypt.compareSync(currentPassword, row.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }
  const exists = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.userId])
  if (exists) return res.status(409).json({ error: 'Email already in use' })
  const oldEmail = row.email
  const now = nowIso()
  await db.run(
    'UPDATE users SET email = ?, email_verified = 0, profile_updated_at = ?, token_version = COALESCE(token_version, 0) + 1 WHERE id = ?',
    [email, now, req.userId]
  )
  await syncUserRecords(db, oldEmail, { email })
  const user = await db.get(`SELECT ${userSelectFields()} FROM users WHERE id = ?`, [req.userId])
  const token = signUserToken(user)
  const payload = { token, user: await mapUserResponse(db, user), verificationSent: false }
  try {
    const verification = await issueEmailVerificationCode(email, user?.name || email, '/onboarding', user?.locale)
    payload.verificationSent = true
    if (verification.devCode) payload.devCode = verification.devCode
  } catch (err) {
    console.warn('[me/email] verification code:', err.message)
  }
  res.json(payload)
})

router.post('/avatar', upload.single('avatar'), async (req, res) => {
  const db = getDb()
  if (!req.file) return res.status(400).json({ error: 'Avatar file required' })
  if (!req.file.mimetype?.startsWith('image/')) {
    return res.status(400).json({ error: 'Image file required' })
  }
  if (req.file.size > 700 * 1024) {
    return res.status(400).json({ error: 'Image too large (max 700 KB)' })
  }

  let avatarValue
  if (isS3Enabled()) {
    const saved = await saveUploadedFile(req.file, 'avatars')
    avatarValue = saved.key
  } else {
    avatarValue = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
  }

  const now = nowIso()
  await db.run('UPDATE users SET avatar_url = ?, profile_updated_at = ? WHERE id = ?', [avatarValue, now, req.userId])
  const user = await db.get(`SELECT ${userSelectFields()} FROM users WHERE id = ?`, [req.userId])
  res.json({ user: await mapUserResponse(db, user) })
})

router.get('/support', async (req, res) => {
  const db = getDb()
  const rows = await db.all(
    'SELECT id, message, reply, status, date FROM support_messages WHERE user_id = ? ORDER BY date ASC LIMIT 100',
    [req.userId]
  )
  res.json(rows.map((row) => ({
    id: row.id,
    message: row.message,
    reply: row.reply,
    status: row.status,
    date: row.date,
  })))
})

router.post('/support', async (req, res) => {
  const db = getDb()
  const message = String(req.body.message || '').trim()
  if (!message) return res.status(400).json({ error: 'Message required' })
  const user = await db.get('SELECT id, email, name FROM users WHERE id = ?', [req.userId])
  if (!user) return res.status(404).json({ error: 'User not found' })
  const id = `sup-${Date.now()}`
  const date = new Date().toISOString()
  await db.run(
    'INSERT INTO support_messages (id, user_id, email, name, message, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, user.id, user.email, user.name, message, 'new', date]
  )
  const supportChatId = process.env.SUPPORT_TELEGRAM_CHAT_ID || ''
  if (supportChatId) {
    sendTelegramMessage(
      supportChatId,
      `📩 <b>Поддержка</b>\nОт: ${user.name || user.email}\nEmail: ${user.email}\n\n${message.slice(0, 1500)}`
    ).catch(() => {})
  }
  res.status(201).json({ id, message, status: 'new', date })
})

function mapNotification(row) {
  return {
    id: row.id, email: row.email, type: row.type, status: row.status,
    courseId: row.course_id, courseSlug: row.course_slug, courseTitle: row.course_title,
    lessonTitle: row.lesson_title, lessonIndex: row.lesson_index, targetPath: row.target_path,
    message: row.message, read: Boolean(row.read), date: row.date,
  }
}

function mapCertificate(row) {
  return {
    id: row.id, email: row.email, courseId: row.course_id, courseTitle: row.course_title,
    fileName: row.file_name, fileType: row.file_type, fileDataUrl: null, score: row.score,
    date: row.date, updatedAt: row.updated_at,
  }
}

function mapHomework(row) {
  return {
    id: row.id, email: row.email, name: row.name, courseId: row.course_id,
    courseTitle: row.course_title, lessonIndex: row.lesson_index, lessonTitle: row.lesson_title,
    content: row.content, fileName: row.file_name, fileType: row.file_type,
    status: row.status, score: row.score, adminComment: row.admin_comment,
    date: row.date, updatedAt: row.updated_at,
  }
}

export default router
