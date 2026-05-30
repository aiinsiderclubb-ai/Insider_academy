import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase, getDb } from './db.js'
import { seedIfEmpty } from './seed.js'
import { config } from './config.js'
import authRoutes from './routes/auth.js'
import coursesRoutes from './routes/courses.js'
import meRoutes from './routes/me.js'
import adminRoutes from './routes/admin.js'
import publicRoutes from './routes/public.js'
import paymentsRoutes from './routes/payments.js'
import webhooksRoutes, { handleStripeWebhook } from './routes/webhooks.js'
import chatRoutes from './routes/chat.js'
import reviewsRoutes from './routes/reviews.js'
import teamsRoutes from './routes/teams.js'
import telegramRoutes from './routes/telegram.js'
import filesRoutes from './routes/files.js'
import { sendTelegramMessage } from './services/telegram.js'
import { parseJson } from './db/sqlite.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
for (const dir of ['data', 'uploads']) {
  const p = path.join(__dirname, dir)
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

async function start() {
  await initDatabase()
  await seedIfEmpty()

  const app = express()
  app.use(cors({ origin: config.corsOrigin, credentials: true }))

  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook)

  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true }))

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      version: '2.0.0',
      db: getDb().driver,
      features: {
        stripe: Boolean(config.stripe.secretKey),
        liqpay: Boolean(config.liqpay.publicKey),
        s3: config.storage.driver === 's3',
        email: Boolean(config.email.smtp.host),
        openai: Boolean(config.openai.apiKey),
        telegram: Boolean(config.telegram.botToken),
      },
      time: new Date().toISOString(),
    })
  })

  app.use('/api/webhooks', webhooksRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/courses', coursesRoutes)
  app.use('/api/me', meRoutes)
  app.use('/api/payments', paymentsRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api/chat', chatRoutes)
  app.use('/api/reviews', reviewsRoutes)
  app.use('/api/teams', teamsRoutes)
  app.use('/api/telegram', telegramRoutes)
  app.use('/api/files', filesRoutes)
  app.use('/api', publicRoutes)

  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ error: err.message || 'Internal server error' })
  })

  setInterval(processReminders, 60000)

  app.listen(config.port, () => {
    console.log(`LMS API v2 at http://localhost:${config.port} [${getDb().driver}]`)
  })
}

async function processReminders() {
  try {
    const db = getDb()
    const due = await db.all(
      `SELECT r.*, u.telegram_chat_id, c.data AS course_data FROM lesson_reminders r
       JOIN users u ON u.id = r.user_id LEFT JOIN courses c ON c.id = r.course_id
       WHERE r.sent = 0 AND r.remind_at <= datetime('now') LIMIT 20`
    )
    for (const row of due) {
      const course = parseJson(row.course_data, {})
      const lesson = course.lessons?.[row.lesson_index]
      const text = `🔔 Напоминание: урок «${lesson?.title || row.lesson_index + 1}» курса «${course.title || row.course_id}»`
      if (row.telegram_chat_id) await sendTelegramMessage(row.telegram_chat_id, text)
      await db.run('UPDATE lesson_reminders SET sent = 1 WHERE id = ?', [row.id])
    }
  } catch (err) {
    console.error('[reminders]', err.message)
  }
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
