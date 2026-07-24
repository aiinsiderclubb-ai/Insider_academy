import { Router } from 'express'
import { timingSafeEqual } from 'node:crypto'
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
import {
  enrichApplications,
  sendApplicantTelegram,
  getApplicationAuditHistory,
  hasAcceleratorAccess,
} from '../services/adminApplications.js'
import * as sheetsTrack from '../services/sheetsTrack.js'
import {
  getSheetsStatus,
  syncDatabaseToSheets,
  exportSheetCsv,
  formatGoogleDriveError,
} from '../services/googleSheets.js'
import adminOpsRoutes from './adminOps.js'
import adminGiveawaysRoutes from './adminGiveaways.js'
import { queueEmail } from '../services/emailQueue.js'
import { logAudit } from '../services/auditLog.js'
import { deleteUserAccount } from '../services/deleteUser.js'
import { prelaunchBlocked } from '../middleware/prelaunch.js'

const router = Router()

const WEAK_ADMIN_PASSWORDS = new Set(['admin123', 'editor123', 'moderator123'])

function securePasswordMatch(candidate, configured) {
  const input = String(candidate || '')
  const expected = String(configured || '')
  if (!input || !expected || expected.length < 12 || WEAK_ADMIN_PASSWORDS.has(expected)) return false
  const inputBuffer = Buffer.from(input)
  const expectedBuffer = Buffer.from(expected)
  return inputBuffer.length === expectedBuffer.length && timingSafeEqual(inputBuffer, expectedBuffer)
}

function resolveAdminRole(password) {
  if (securePasswordMatch(password, config.adminPassword)) return 'admin'
  if (securePasswordMatch(password, config.editorPassword)) return 'editor'
  if (securePasswordMatch(password, config.moderatorPassword)) return 'moderator'
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
router.use(adminGiveawaysRoutes)

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
      applications: await enrichApplications(db, await db.all('SELECT * FROM accelerator_applications ORDER BY date DESC LIMIT 300')),
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

router.post('/users/delete', requireAdmin('admin'), async (req, res) => {
  const db = getDb()
  const { userId, email } = req.body || {}
  if (userId == null && !email) {
    return res.status(400).json({ error: 'userId or email required' })
  }

  const result = await deleteUserAccount(db, { userId, email })
  if (!result.ok) {
    return res.status(404).json({ error: result.error || 'User not found' })
  }

  await logAudit({
    actorEmail: `admin:${req.adminRole}`,
    action: 'user.delete',
    targetType: 'user',
    targetId: String(result.userId || result.email || ''),
    meta: {
      email: result.email,
      personalId: result.personalId,
      name: result.name,
      scope: result.deleted,
    },
  })

  sheetsTrack.trackUserDeleted({
    email: result.email,
    personalId: result.personalId,
    name: result.name,
    userId: result.userId,
  }).catch(() => {})

  res.json({ ok: true, ...result })
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

router.patch('/homework/:id', requireAdmin('admin', 'moderator'), prelaunchBlocked, async (req, res) => {
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

router.post('/applications/bulk-approve', requireAdmin('admin', 'moderator'), prelaunchBlocked, async (req, res) => {
  const db = getDb()
  const ids = Array.isArray(req.body.ids) ? req.body.ids.slice(0, 50) : []
  if (!ids.length) return res.status(400).json({ error: 'ids array required' })

  let approved = 0
  const results = []
  for (const id of ids) {
    const row = await db.get('SELECT * FROM accelerator_applications WHERE id = ?', [id])
    if (!row || row.status === 'accepted') continue
    const result = await approveAcceleratorApplication(db, row, {
      adminNote: req.body.adminNote,
      actorRole: req.adminRole,
    })
    if (result.ok) {
      approved += 1
      results.push({ id, telegramSent: result.telegramSent })
    }
  }

  await logAudit({
    actorEmail: `admin:${req.adminRole}`,
    action: 'application.bulk_approve',
    targetType: 'application',
    meta: { ids, approved },
  })

  res.json({ ok: true, approved, results })
})

router.post('/applications/:id/reject', requireAdmin('admin', 'moderator'), async (req, res) => {
  const db = getDb()
  const row = await db.get('SELECT * FROM accelerator_applications WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Not found' })

  const adminNote = String(req.body.adminNote || req.body.reason || '').trim()
  const promoCode = String(req.body.promoCode || '').trim().toUpperCase()
  const discountPercent = req.body.discountPercent != null ? Number(req.body.discountPercent) : null

  await db.run(
    `UPDATE accelerator_applications SET status = 'rejected', admin_note = ?, updated_at = ? WHERE id = ?`,
    [adminNote || row.admin_note || 'Заявка отклонена', nowIso(), req.params.id]
  )

  let promoCreated = null
  if (promoCode && discountPercent > 0) {
    try {
      await db.run(
        `INSERT INTO promo_codes (code, discount_percent, discount_eur, course_ids, max_uses, valid_from, valid_until, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [promoCode, discountPercent, null, JSON.stringify(['ai-start']), null, null, null, 1, nowIso()]
      )
      promoCreated = { code: promoCode, discountPercent }
    } catch (err) {
      console.warn('[application/reject] promo:', err.message)
    }
  }

  await createUserNotification(db, {
    email: row.email,
    type: 'application_status',
    status: 'rejected',
    courseTitle: 'AI Insider Accelerator',
    targetPath: '/courses',
    comment: adminNote || null,
    message: adminNote || 'Заявка на AI Accelerator отклонена',
    reviewedAt: nowIso(),
  })

  sheetsTrack.trackApplication({
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    telegram: row.telegram,
    status: 'rejected',
    adminNote,
    action: `админ: rejected`,
    applicationId: row.id,
    accessGranted: false,
  }).catch(() => {})

  await logAudit({
    actorEmail: `admin:${req.adminRole}`,
    action: 'application.reject',
    targetType: 'application',
    targetId: row.id,
    meta: { email: row.email, promoCreated },
  })

  const updated = await db.get('SELECT * FROM accelerator_applications WHERE id = ?', [req.params.id])
  res.json({
    ok: true,
    application: (await enrichApplications(db, [updated]))[0],
    promoCreated,
    telegramSent: false,
    telegramHint: null,
  })
})

router.post('/applications/:id/send-telegram', requireAdmin('admin', 'moderator'), async (req, res) => {
  const db = getDb()
  const row = await db.get('SELECT * FROM accelerator_applications WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Not found' })

  const text = String(req.body.text || '').trim()
  if (!text) return res.status(400).json({ error: 'text required' })

  const tg = await sendApplicantTelegram(db, {
    email: row.email,
    telegram: row.telegram,
    title: req.body.title || 'AI Insider Academy',
    text,
  })

  await logAudit({
    actorEmail: `admin:${req.adminRole}`,
    action: 'application.telegram',
    targetType: 'application',
    targetId: row.id,
    meta: { template: req.body.template || null, sent: tg.sent },
  })

  res.json({ ok: true, sent: tg.sent, hint: tg.hint })
})

router.get('/applications/:id/history', requireAdmin('admin', 'moderator'), async (req, res) => {
  const db = getDb()
  const row = await db.get('SELECT id FROM accelerator_applications WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Not found' })
  const history = await getApplicationAuditHistory(db, req.params.id)
  res.json({ history })
})

router.post('/applications/:id/approve', requireAdmin('admin', 'moderator'), prelaunchBlocked, async (req, res) => {
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
    application: (await enrichApplications(db, [updated]))[0],
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
        courseTitle: 'AI Insider Accelerator',
        targetPath: '/courses/ai-insider-accelerator',
        message: adminNote ? `${statusMessages[status]}. ${adminNote}` : statusMessages[status],
        comment: adminNote?.trim() || null,
        reviewedAt: nowIso(),
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
      accessGranted: status === 'accepted' ? await hasAcceleratorAccess(db, updated.email) : false,
    }).catch(() => {})
    await logAudit({
      actorEmail: `admin:${req.adminRole}`,
      action: 'application.update',
      targetType: 'application',
      targetId: updated.id,
      meta: { status, prevStatus, email: updated.email },
    })
  }
  res.json({ ok: true, application: (await enrichApplications(db, [updated]))[0] })
})

router.post('/certificates', requireAdmin('admin', 'moderator'), prelaunchBlocked, async (req, res) => {
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
  res.json(await getSheetsStatus(getDb()))
})

router.post('/sheets/sync', requireAdmin('admin'), async (_req, res) => {
  try {
    const db = getDb()
    const result = await syncDatabaseToSheets(db)
    res.json(result)
  } catch (err) {
    res.status(400).json({ error: formatGoogleDriveError(err.message) })
  }
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
