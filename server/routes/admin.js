import { Router } from 'express'
import { getDb, parseJson } from '../db.js'
import { requireAdmin, signAdminToken } from '../middleware/auth.js'
import { sendEmail, sendHomeworkFeedbackEmail } from '../services/email.js'
import { config, isEmailEnabled } from '../config.js'
import { getFileUrl } from '../services/storage.js'
import { nowIso } from '../db/time.js'
import { mapApplication } from './applications.js'
import { userSelectFields } from '../services/userProfile.js'
import { createUserNotification, getCourseSlug, getNextLessonInfo } from '../services/notifications.js'
import { approveAcceleratorApplication } from '../services/applicationAccept.js'
import * as sheetsTrack from '../services/sheetsTrack.js'
import {
  getSheetsStatus,
  syncDatabaseToSheets,
  exportSheetCsv,
} from '../services/googleSheets.js'
import adminOpsRoutes from './adminOps.js'
import { queueEmail } from '../services/emailQueue.js'
import { logAudit } from '../services/auditLog.js'

const router = Router()

function resolveAdminRole(password) {
  const p = String(password || '')
  if (p === config.adminPassword) return 'admin'
  if (p === config.editorPassword) return 'editor'
  if (p === config.moderatorPassword) return 'moderator'
  return null
}

router.post('/login', (req, res) => {
  const role = resolveAdminRole(req.body.password)
  if (!role) return res.status(401).json({ error: 'Invalid password' })
  res.json({ token: signAdminToken(role), role })
})

router.get('/me', requireAdmin('admin', 'editor', 'moderator'), (req, res) => {
  res.json({
    role: req.adminRole,
    webhookUrl: getTributeWebhookUrl(),
    features: {
      tribute: Boolean(config.tribute.apiKey),
      email: isEmailEnabled(),
      digest: config.adminDigestEnabled && Boolean(config.adminEmail),
    },
    email: {
      enabled: isEmailEnabled(),
      from: config.email.from,
      smtpHost: config.email.smtp.host || null,
      smtpPort: config.email.smtp.port || null,
      adminEmail: config.adminEmail || null,
    },
  })
})

router.post('/test-email', requireAdmin('admin'), async (req, res) => {
  if (!isEmailEnabled()) {
    return res.status(503).json({
      error: 'SMTP not configured',
      errorRu: 'SMTP не настроен. Добавьте SMTP_HOST, SMTP_USER, SMTP_PASS на Render и перезапустите API.',
    })
  }
  const to = String(req.body.email || config.adminEmail || '').trim().toLowerCase()
  if (!to || !to.includes('@')) {
    return res.status(400).json({ error: 'Valid email required', errorRu: 'Укажите email для теста' })
  }
  try {
    await sendEmail({
      to,
      subject: 'Тест почты — AI Insider Academy',
      html: `<p>Почта Academy работает.</p><p>Отправитель: ${config.email.from}</p><p>Время: ${new Date().toISOString()}</p>`,
      text: `Почта Academy работает. Отправитель: ${config.email.from}`,
    })
    res.json({ ok: true, to })
  } catch (err) {
    console.error('[admin/test-email]', err.message)
    res.status(502).json({
      error: err.message || 'Send failed',
      errorRu: 'Не удалось отправить. Проверьте SMTP_HOST, порт, пароль и SPF/DKIM у домена.',
    })
  }
})

router.use(requireAdmin('admin', 'editor', 'moderator'))
router.use(adminOpsRoutes)

router.get('/dashboard', async (req, res) => {
  const db = getDb()
  const mainRow = await db.get('SELECT value FROM analytics WHERE key = ?', ['main'])
  const dailyVisitsRow = await db.get('SELECT value FROM analytics WHERE key = ?', ['daily_visits'])
  const charts = await buildChartData(db)

  const payload = {
    role: req.adminRole,
    analytics: parseJson(mainRow?.value, { visits: 0, courseClicks: {} }),
    dailyVisits: parseJson(dailyVisitsRow?.value, {}),
    charts,
    courses: (await db.all('SELECT data FROM courses ORDER BY id')).map((r) => parseJson(r.data, null)).filter(Boolean),
    blog: (await db.all('SELECT data FROM blog_posts ORDER BY id')).map((r) => parseJson(r.data, null)).filter(Boolean),
    calendar: (await db.all('SELECT data FROM calendar_events ORDER BY id')).map((r) => parseJson(r.data, null)).filter(Boolean),
  }

  if (req.adminRole === 'admin' || req.adminRole === 'moderator') {
    const hwRows = await db.all(
      `SELECT h.*, u.personal_id FROM homework h
       LEFT JOIN users u ON lower(u.email) = lower(h.email)
       ORDER BY h.updated_at DESC LIMIT 300`
    )
    Object.assign(payload, {
      registrations: await db.all('SELECT * FROM registrations ORDER BY date DESC LIMIT 500'),
      users: (await db.all(
        `SELECT ${userSelectFields()} FROM users ORDER BY COALESCE(profile_updated_at, created_at) DESC LIMIT 500`
      )).map(mapAdminUser),
      purchases: await db.all('SELECT * FROM purchase_log ORDER BY date DESC LIMIT 500'),
      certificates: (await db.all('SELECT * FROM certificates ORDER BY date DESC LIMIT 500')).map(mapCert),
      homework: await mapHomeworkList(hwRows),
      referrals: await db.all('SELECT * FROM referrals ORDER BY date DESC LIMIT 500'),
      discounts: Object.fromEntries((await db.all('SELECT email, percent FROM referral_discounts')).map((r) => [r.email, r.percent])),
      reviews: (await db.all(
        `SELECT r.*, u.personal_id FROM reviews r
         LEFT JOIN users u ON u.id = r.user_id
         ORDER BY r.date DESC LIMIT 200`
      )).map(mapReview),
      applications: (await db.all('SELECT * FROM accelerator_applications ORDER BY date DESC LIMIT 300')).map(mapApplication),
      teams: await db.all('SELECT * FROM teams ORDER BY created_at DESC LIMIT 50'),
    })
  }

  if (req.adminRole === 'admin') {
    try {
      payload.webhookLog = await db.all(
        'SELECT id, event_name, status, created_at FROM webhook_events ORDER BY created_at DESC LIMIT 20'
      )
    } catch {
      payload.webhookLog = []
    }
    payload.settings = {
      tributeWebhookUrl: getTributeWebhookUrl(),
      tributeEnabled: Boolean(config.tribute.apiKey),
    }
  }

  res.json(payload)
})

router.get('/data-health', requireAdmin('admin'), async (req, res) => {
  const db = getDb()
  const count = async (sql, params = []) => Number((await db.get(sql, params))?.c || 0)

  const users = await count('SELECT COUNT(*) AS c FROM users')
  const registrations = await count('SELECT COUNT(*) AS c FROM registrations')
  const withPersonalId = await count("SELECT COUNT(*) AS c FROM users WHERE personal_id IS NOT NULL AND personal_id != ''")
  const homework = await count('SELECT COUNT(*) AS c FROM homework')
  const reviewsTotal = await count('SELECT COUNT(*) AS c FROM reviews')
  const reviewsPending = await count("SELECT COUNT(*) AS c FROM reviews WHERE status = 'pending'")
  const reviewsApproved = await count("SELECT COUNT(*) AS c FROM reviews WHERE status = 'approved'")
  const purchases = await count('SELECT COUNT(*) AS c FROM purchase_log')
  const certificates = await count('SELECT COUNT(*) AS c FROM certificates')
  const referrals = await count('SELECT COUNT(*) AS c FROM referrals')
  const applications = await count('SELECT COUNT(*) AS c FROM accelerator_applications')
  let supportMessages = 0
  try {
    supportMessages = await count('SELECT COUNT(*) AS c FROM support_messages')
  } catch {
    supportMessages = 0
  }
  const passwordChanges = await count("SELECT COUNT(*) AS c FROM users WHERE password_changed_at IS NOT NULL AND password_changed_at != ''")
  const telegramLinked = await count(
    "SELECT COUNT(*) AS c FROM users WHERE telegram_chat_id IS NOT NULL AND telegram_chat_id != ''"
  )

  res.json({
    db: db.driver || 'sqlite',
    ok: true,
    users,
    registrations,
    withPersonalId,
    telegramLinked,
    homework,
    reviews: { total: reviewsTotal, pending: reviewsPending, approved: reviewsApproved },
    purchases,
    certificates,
    referrals,
    applications,
    supportMessages,
    passwordChanges,
    note: 'Пароли хранятся только в виде хеша (password_hash). В админке видна дата смены пароля, не сам пароль.',
  })
})

router.put('/courses', requireAdmin('admin', 'editor'), async (req, res) => {
  const list = req.body.courses
  if (!Array.isArray(list)) return res.status(400).json({ error: 'courses array required' })
  const db = getDb()
  await db.run('DELETE FROM courses')
  for (const c of list) {
    await db.run('INSERT INTO courses (id, data, updated_at) VALUES (?, ?, ?)', [c.id, JSON.stringify(c), nowIso()])
  }
  res.json({ ok: true, count: list.length })
})

router.put('/blog', requireAdmin('admin', 'editor'), async (req, res) => {
  const list = req.body.posts
  if (!Array.isArray(list)) return res.status(400).json({ error: 'posts array required' })
  const db = getDb()
  await db.run('DELETE FROM blog_posts')
  for (const p of list) await db.run('INSERT INTO blog_posts (id, data) VALUES (?, ?)', [p.id, JSON.stringify(p)])
  res.json({ ok: true })
})

router.put('/calendar', requireAdmin('admin', 'editor'), async (req, res) => {
  const list = req.body.events
  if (!Array.isArray(list)) return res.status(400).json({ error: 'events array required' })
  const db = getDb()
  await db.run('DELETE FROM calendar_events')
  for (const e of list) await db.run('INSERT INTO calendar_events (id, data) VALUES (?, ?)', [e.id, JSON.stringify(e)])
  res.json({ ok: true })
})

router.patch('/homework/:id', requireAdmin('admin', 'moderator'), async (req, res) => {
  const db = getDb()
  const { status, adminComment, score } = req.body
  const row = await db.get('SELECT * FROM homework WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Not found' })
  const nextScore = score !== undefined && score !== null && score !== '' ? Number(score) : null
  await db.run(
    `UPDATE homework SET status = COALESCE(?, status), admin_comment = COALESCE(?, admin_comment),
     score = COALESCE(?, score), updated_at = ? WHERE id = ?`,
    [status ?? null, adminComment ?? null, nextScore, nowIso(), req.params.id]
  )
  if (status && row.email) {
    const courseSlug = await getCourseSlug(db, row.course_id)
    const lessonPart = Number.isInteger(row.lesson_index) ? `?lesson=${row.lesson_index}` : ''
    const targetPath = courseSlug ? `/courses/${courseSlug}${lessonPart}` : '/cabinet'
    const defaultMsg = status === 'accepted'
      ? 'ДЗ принято'
      : status === 'resubmit'
        ? 'ДЗ отправлено на доработку'
        : 'Обновление по домашнему заданию'
    const nextLesson = Number.isInteger(row.lesson_index)
      ? await getNextLessonInfo(db, row.course_id, row.lesson_index)
      : {}
    await createUserNotification(db, {
      email: row.email,
      type: 'homework_feedback',
      status,
      courseId: row.course_id,
      courseSlug,
      courseTitle: row.course_title,
      lessonTitle: row.lesson_title,
      lessonIndex: row.lesson_index,
      targetPath,
      comment: adminComment?.trim() || null,
      message: adminComment?.trim() || defaultMsg,
      score: nextScore,
      reviewedAt: nowIso(),
      ...nextLesson,
    })
    sendHomeworkFeedbackEmail({
      email: row.email, courseTitle: row.course_title, lessonTitle: row.lesson_title, status, comment: adminComment,
    }).catch(() => {})
    const u = await db.get('SELECT personal_id FROM users WHERE email = ?', [row.email])
    sheetsTrack.trackHomeworkEvent({
      email: row.email,
      personalId: u?.personal_id,
      courseTitle: row.course_title,
      lessonIndex: row.lesson_index,
      lessonTitle: row.lesson_title,
      status,
      score: nextScore,
      adminComment,
      action: `админ: ${status}`,
      recordId: req.params.id,
    }).catch(() => {})
  }
  const updatedHw = await db.get('SELECT * FROM homework WHERE id = ?', [req.params.id])
  if (status === 'accepted' && updatedHw?.email) {
    queueEmail({
      to: updatedHw.email,
      template: 'hw_reviewed',
      payload: { name: updatedHw.name, courseTitle: updatedHw.course_title },
    }).catch(() => {})
  }
  await logAudit({
    actorEmail: `admin:${req.adminRole}`,
    action: 'homework.update',
    targetType: 'homework',
    targetId: req.params.id,
    meta: { status },
  })
  res.json({ ok: true, homework: (await mapHomeworkList([updatedHw]))[0] })
})

router.patch('/reviews/:id', requireAdmin('admin', 'moderator'), async (req, res) => {
  const db = getDb()
  const { status } = req.body
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved, rejected, or pending' })
  }
  const row = await db.get('SELECT * FROM reviews WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Not found' })
  if (status === 'approved' && !String(row.text || '').trim()) {
    return res.status(400).json({
      error: 'Cannot publish empty review',
      errorRu: 'Нельзя опубликовать отзыв без текста — удалите или отправьте на доработку',
    })
  }
  await db.run('UPDATE reviews SET status = ? WHERE id = ?', [status, req.params.id])
  if (status === 'approved' && row.user_id) {
    try {
      await db.run(
        'INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)',
        [row.user_id, 'reviewer', new Date().toISOString()]
      )
    } catch (err) {
      console.warn('[admin] reviewer achievement skipped:', err.message)
    }
  }
  if (status !== 'pending') {
    let notifyEmail = row.email || row.contact_email
    if (!notifyEmail && row.user_id) {
      const u = await db.get('SELECT email FROM users WHERE id = ?', [row.user_id])
      notifyEmail = u?.email
    }
    if (notifyEmail) {
      const courseSlug = await getCourseSlug(db, row.course_id)
      const courseRow = await db.get('SELECT data FROM courses WHERE id = ?', [row.course_id])
      const courseData = parseJson(courseRow?.data, null)
      const courseTitle = courseData?.title || row.course_id
      const message = status === 'approved'
        ? 'Ваш отзыв опубликован на странице курса'
        : status === 'rejected'
          ? 'Отзыв не опубликован. При необходимости отправьте новый'
          : 'Статус отзыва обновлён'
      await createUserNotification(db, {
        email: notifyEmail,
        type: 'review_status',
        status,
        courseId: row.course_id,
        courseSlug,
        courseTitle,
        targetPath: courseSlug ? `/courses/${courseSlug}` : '/cabinet',
        message,
      })
    }
    const u = row.user_id
      ? await db.get('SELECT personal_id FROM users WHERE id = ?', [row.user_id])
      : null
    sheetsTrack.trackReviewEvent({
      email: notifyEmail || row.email,
      personalId: u?.personal_id,
      courseId: row.course_id,
      rating: row.rating,
      status,
      text: row.text,
      action: `админ: ${status}`,
      reviewId: req.params.id,
    }).catch(() => {})
  }
  res.json({ ok: true, review: mapReview(await db.get('SELECT * FROM reviews WHERE id = ?', [req.params.id])) })
})

router.delete('/reviews/:id', requireAdmin('admin', 'moderator'), async (req, res) => {
  const db = getDb()
  const row = await db.get('SELECT id FROM reviews WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Not found' })
  await db.run('DELETE FROM reviews WHERE id = ?', [req.params.id])
  res.json({ ok: true, id: req.params.id })
})

router.post('/applications/:id/approve', requireAdmin('admin', 'moderator'), async (req, res) => {
  const db = getDb()
  const row = await db.get('SELECT * FROM accelerator_applications WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Not found' })

  if (row.status === 'accepted') {
    return res.status(400).json({
      error: 'Already accepted',
      errorRu: 'Заявка уже одобрена',
    })
  }

  const result = await approveAcceleratorApplication(db, row, {
    adminNote: req.body.adminNote,
    actorRole: req.adminRole,
  })

  if (!result.ok) {
    return res.status(400).json({ error: result.error, errorRu: result.error })
  }

  await logAudit({
    actorEmail: `admin:${req.adminRole}`,
    action: 'application.approve',
    targetType: 'application',
    targetId: row.id,
    meta: {
      email: row.email,
      granted: result.access?.granted,
      telegramSent: result.telegramSent,
    },
  })

  const updated = await db.get('SELECT * FROM accelerator_applications WHERE id = ?', [req.params.id])
  res.json({
    ok: true,
    application: mapApplication(updated),
    granted: result.access?.granted,
    userCreated: result.access?.userCreated,
    telegramSent: result.telegramSent,
    telegramHint: result.telegramHint,
  })
})

router.patch('/applications/:id', requireAdmin('admin', 'moderator'), async (req, res) => {
  const db = getDb()
  const { status, adminNote } = req.body
  if (status && !['new', 'reviewed', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }
  const row = await db.get('SELECT * FROM accelerator_applications WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Not found' })
  const prevStatus = row.status
  await db.run(
    `UPDATE accelerator_applications
     SET status = COALESCE(?, status),
         admin_note = COALESCE(?, admin_note),
         updated_at = ?
     WHERE id = ?`,
    [status ?? null, adminNote ?? null, nowIso(), req.params.id]
  )
  const updated = await db.get('SELECT * FROM accelerator_applications WHERE id = ?', [req.params.id])
  if (status && status !== prevStatus && updated?.email) {
    const statusMessages = {
      reviewed: 'Заявка на AI Accelerator просмотрена',
      accepted: 'Поздравляем! Заявка на AI Accelerator одобрена',
      rejected: 'Заявка на AI Accelerator отклонена',
    }
    if (statusMessages[status]) {
      await createUserNotification(db, {
        email: updated.email,
        type: 'application_status',
        status,
        courseTitle: 'AI Accelerator',
        targetPath: '/courses/ai-insider-accelerator',
        message: adminNote ? `${statusMessages[status]}. ${adminNote}` : statusMessages[status],
      })
    }
    sheetsTrack.trackApplication({
      email: updated.email,
      firstName: updated.first_name,
      lastName: updated.last_name,
      telegram: updated.telegram,
      status,
      adminNote,
      action: `админ: ${status}`,
      applicationId: updated.id,
    }).catch(() => {})
  }
  res.json({ ok: true, application: mapApplication(updated) })
})

router.post('/certificates', requireAdmin('admin', 'moderator'), async (req, res) => {
  const db = getDb()
  const { email, courseId, courseTitle, fileName, fileType, fileDataUrl, score } = req.body
  const id = `cert-${Date.now()}`
  const now = new Date().toISOString()
  await db.run(
    `INSERT INTO certificates (id, email, course_id, course_title, file_name, file_type, file_path, score, date, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, email, courseId, courseTitle, fileName, fileType, fileDataUrl, score, now, now]
  )
  await db.run(
    `INSERT INTO notifications (id, email, type, course_id, course_title, target_path, message, date)
     VALUES (?, ?, 'certificate_added', ?, ?, '/cabinet#certificates', ?, ?)`,
    [`n-${Date.now()}`, email, courseId, courseTitle, 'Сертификат добавлен', now]
  )
  const u = await db.get('SELECT personal_id FROM users WHERE email = ?', [email])
  sheetsTrack.trackCertificate({
    email,
    personalId: u?.personal_id,
    courseId,
    courseTitle,
    score,
    action: 'выдан админом',
  }).catch(() => {})
  res.json({ ok: true, id })
})

router.get('/sheets/status', requireAdmin('admin', 'moderator'), async (_req, res) => {
  res.json(await getSheetsStatus())
})

router.post('/sheets/sync', requireAdmin('admin'), async (_req, res) => {
  const db = getDb()
  const result = await syncDatabaseToSheets(db)
  res.json(result)
})

router.get('/sheets/export/:sheetKey', requireAdmin('admin', 'moderator'), async (req, res) => {
  try {
    const csv = await exportSheetCsv(req.params.sheetKey)
    const name = req.params.sheetKey
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${name}.csv"`)
    res.send(csv)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

function getTributeWebhookUrl() {
  if (config.tribute.webhookUrl) return config.tribute.webhookUrl
  const base = config.appUrl.replace(/\/$/, '')
  if (base.includes('localhost')) return `${base.replace(':5173', ':3001')}/api/webhooks/tribute`
  return `${base}/api/webhooks/tribute`
}

async function buildChartData(db) {
  const isPg = db.driver === 'postgres'
  const sinceFilter = isPg
    ? "(date::timestamptz >= NOW() - INTERVAL '30 days')"
    : "date >= date('now', '-30 days')"
  const dayExpr = isPg ? '(date::timestamptz)::date AS day' : 'date(date) AS day'

  const purchasesByDay = await db.all(
    `SELECT ${dayExpr}, COALESCE(SUM(amount), 0) AS revenue, COUNT(*) AS count
     FROM purchase_log WHERE ${sinceFilter} GROUP BY day ORDER BY day`
  )
  const registrationsByDay = await db.all(
    `SELECT ${dayExpr}, COUNT(*) AS count
     FROM registrations WHERE ${sinceFilter} GROUP BY day ORDER BY day`
  )
  const dailyVisits = parseJson((await db.get('SELECT value FROM analytics WHERE key = ?', ['daily_visits']))?.value, {})
  const visitDays = Object.entries(dailyVisits)
    .filter(([day]) => day >= new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day))

  const main = parseJson((await db.get('SELECT value FROM analytics WHERE key = ?', ['main']))?.value, { visits: 0 })
  const totalVisits = main.visits || 0
  const totalRegs = Number((await db.get('SELECT COUNT(*) AS c FROM registrations'))?.c || 0)
  const totalPurchases = Number((await db.get('SELECT COUNT(*) AS c FROM purchase_log'))?.c || 0)

  return {
    purchasesByDay,
    registrationsByDay,
    visitsByDay: visitDays,
    funnel: {
      visits: totalVisits,
      registrations: totalRegs,
      purchases: totalPurchases,
      conversionReg: totalVisits ? Math.round((totalRegs / totalVisits) * 1000) / 10 : 0,
      conversionPurchase: totalRegs ? Math.round((totalPurchases / totalRegs) * 1000) / 10 : 0,
    },
  }
}

function mapAdminUser(row) {
  return {
    id: row.id,
    personalId: row.personal_id || null,
    email: row.email,
    name: row.name,
    emailVerified: Boolean(row.email_verified),
    hasAvatar: Boolean(row.avatar_url),
    registeredAt: row.created_at,
    profileUpdatedAt: row.profile_updated_at || null,
    passwordChangedAt: row.password_changed_at || null,
    lastLoginAt: row.last_login_at || null,
    telegramChatId: row.telegram_chat_id || null,
    telegramUsername: row.telegram_username || null,
    telegramConnected: Boolean(row.telegram_chat_id),
  }
}

function mapCert(row) {
  return {
    id: row.id, email: row.email, courseId: row.course_id, courseTitle: row.course_title,
    fileName: row.file_name, fileType: row.file_type, fileDataUrl: row.file_path,
    score: row.score, date: row.date, updatedAt: row.updated_at,
  }
}

function mapHw(row) {
  return {
    id: row.id, email: row.email, name: row.name, personalId: row.personal_id || null, courseId: row.course_id,
    courseTitle: row.course_title, lessonIndex: row.lesson_index, lessonTitle: row.lesson_title,
    content: row.content, fileName: row.file_name, fileType: row.file_type, fileDataUrl: null,
    fileUrl: null, status: row.status, score: row.score, adminComment: row.admin_comment,
    date: row.date, updatedAt: row.updated_at,
  }
}

async function mapHomeworkList(rows = []) {
  return Promise.all(rows.map(async (row) => {
    const hw = mapHw(row)
    if (row.file_path) {
      const url = await getFileUrl(row.file_path, row.file_storage)
      hw.fileDataUrl = url
      hw.fileUrl = url
    }
    return hw
  }))
}

function mapReview(row) {
  return {
    id: row.id,
    courseId: row.course_id,
    userId: row.user_id,
    personalId: row.personal_id || null,
    email: row.email,
    contactEmail: row.contact_email || row.email,
    userName: row.user_name,
    rating: row.rating,
    text: row.text,
    status: row.status || 'pending',
    date: row.date,
  }
}

export default router
