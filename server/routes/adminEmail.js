import { Router } from 'express'
import { getDb } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'
import { isEmailEnabled } from '../config.js'
import { TEMPLATE_CATALOG } from '../services/emailCopy.js'
import { renderEmail } from '../services/emailRender.js'
import { sendTemplateEmail } from '../services/email.js'

const router = Router()

router.get('/email/overview', requireAdmin('admin', 'editor', 'moderator'), async (_req, res) => {
  const db = getDb()
  const counts = await db.all('SELECT status, COUNT(*) AS c FROM email_queue GROUP BY status')
  const byTemplate = await db.all(
    'SELECT template, status, COUNT(*) AS c FROM email_queue GROUP BY template, status'
  )
  const recent = await db.all(
    `SELECT id, email, template, status, send_after, sent_at, error, created_at
     FROM email_queue ORDER BY created_at DESC LIMIT 40`
  )
  const unsubscribed = (await db.get('SELECT COUNT(*) AS c FROM email_unsubscribes'))?.c || 0
  const byStatus = Object.fromEntries((counts || []).map((row) => [row.status, Number(row.c) || 0]))
  res.json({
    enabled: isEmailEnabled(),
    counts: {
      pending: byStatus.pending || 0,
      sent: byStatus.sent || 0,
      failed: byStatus.failed || 0,
      skipped: byStatus.skipped || 0,
      unsubscribed: Number(unsubscribed) || 0,
    },
    byTemplate,
    recent,
    templates: TEMPLATE_CATALOG,
  })
})

router.get('/email/preview', requireAdmin('admin', 'editor', 'moderator'), (req, res) => {
  const template = String(req.query.template || 'welcome_1')
  const locale = String(req.query.locale || 'ru')
  try {
    const rendered = renderEmail(template, {
      to: 'preview@myinsideracademy.com',
      name: 'Vlad',
      locale,
      code: '482193',
      token: 'preview-token',
      courseTitle: 'AI Agent Engineer',
      lessonTitle: 'Первый агент',
      status: 'accepted',
      comment: 'Сильный разбор. Можно следующий урок.',
      courseSlug: 'ai-agent-engineer',
      lines: ['Домашних заданий на проверке: 3', 'Новых регистраций сегодня: 2'],
      pendingHw: 3,
      sentAt: new Date().toISOString(),
    })
    res.json({ ok: true, template, ...rendered })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/email/test', requireAdmin('admin'), async (req, res) => {
  if (!isEmailEnabled()) {
    return res.status(503).json({
      error: 'SMTP not configured',
      errorRu: 'SMTP не настроен.',
    })
  }
  const to = String(req.body.email || '').trim().toLowerCase()
  const template = String(req.body.template || 'test_email')
  const locale = String(req.body.locale || 'ru')
  if (!to.includes('@')) {
    return res.status(400).json({ error: 'Valid email required', errorRu: 'Укажите email' })
  }
  try {
    await sendTemplateEmail(to, template, {
      name: req.body.name || 'Vlad',
      locale,
      code: '482193',
      token: 'preview-token',
      courseTitle: 'AI Agent Engineer',
      lessonTitle: 'Первый агент',
      status: 'accepted',
      comment: 'Тестовый комментарий к ДЗ.',
      courseSlug: 'ai-agent-engineer',
      lines: ['Это тестовый дайджест из Studio.'],
      pendingHw: 1,
    })
    res.json({ ok: true, to, template })
  } catch (err) {
    res.status(502).json({ error: err.message, errorRu: 'Не удалось отправить письмо.' })
  }
})

export default router
