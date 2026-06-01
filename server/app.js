import express from 'express'
import cors from 'cors'
import { initDatabase, getDb } from './db.js'
import { seedIfEmpty } from './seed.js'
import { backfillPersonalIds } from './services/personalId.js'
import { config, isGoogleSheetsEnabled } from './config.js'
import authRoutes from './routes/auth.js'
import coursesRoutes from './routes/courses.js'
import meRoutes from './routes/me.js'
import adminRoutes from './routes/admin.js'
import publicRoutes from './routes/public.js'
import paymentsRoutes from './routes/payments.js'
import webhooksRoutes, { handleStripeWebhook, handleTributeWebhook } from './routes/webhooks.js'
import chatRoutes from './routes/chat.js'
import reviewsRoutes from './routes/reviews.js'
import applicationsRoutes from './routes/applications.js'
import teamsRoutes from './routes/teams.js'
import telegramRoutes from './routes/telegram.js'
import filesRoutes from './routes/files.js'
import promoRoutes from './routes/promo.js'

export async function createApp() {
  await initDatabase()

  if (process.env.IMPORT_MIGRATION === '1') {
    const { runImport } = await import('./scripts/import-json-to-postgres.js')
    await runImport()
    console.log('[startup] migration import complete')
  }

  await seedIfEmpty()
  try {
    await backfillPersonalIds(getDb())
  } catch (err) {
    console.warn('[startup] personal_id backfill:', err.message)
  }

  try {
    const { initGoogleSheets, isGoogleSheetsEnabled, bootstrapArchiveIfNeeded } = await import('./services/googleSheets.js')
    if (isGoogleSheetsEnabled()) {
      const r = await initGoogleSheets()
      console.log('[startup] Google Sheets:', r.ok ? 'connected' : r.error || r.reason)
      const bootstrap = await bootstrapArchiveIfNeeded(getDb())
      if (bootstrap.ok && bootstrap.results) {
        const filled = Object.entries(bootstrap.results)
          .filter(([, v]) => v.action === 'backfilled')
          .map(([k, v]) => `${k}:${v.rows}`)
        if (filled.length) console.log('[startup] Google Sheets bootstrap:', filled.join(', '))
      }
    }
  } catch (err) {
    console.warn('[startup] Google Sheets:', err.message)
  }

  const app = express()
  const corsOrigins = String(config.corsOrigin || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  function isAllowedCorsOrigin(origin) {
    if (!origin) return true
    if (corsOrigins.includes(origin)) return true
    if (/^https:\/\/(www\.)?insiderai\.it\.com$/i.test(origin)) return true
    if (/^https:\/\/(www\.)?myinsideracademy\.com$/i.test(origin)) return true
    if (/^https:\/\/[\w-]+\.vercel\.app$/i.test(origin)) return true
    if (/^https:\/\/insider-academy\.onrender\.com$/i.test(origin)) return true
    if (/^http:\/\/localhost(:\d+)?$/i.test(origin)) return true
    if (/^http:\/\/127\.0\.0\.1(:\d+)?$/i.test(origin)) return true
    return false
  }

  app.use(cors({
    origin(origin, callback) {
      if (isAllowedCorsOrigin(origin)) return callback(null, true)
      return callback(new Error('CORS not allowed'))
    },
    credentials: true,
  }))

  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook)
  app.post('/api/webhooks/tribute', express.raw({ type: 'application/json' }), handleTributeWebhook)

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
        telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN || config.telegram.botToken),
        tribute: Boolean(config.tribute.apiKey),
        googleSheets: isGoogleSheetsEnabled(),
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
  app.use('/api/applications', applicationsRoutes)
  app.use('/api/teams', teamsRoutes)
  app.use('/api/telegram', telegramRoutes)
  app.use('/api/files', filesRoutes)
  app.use('/api/promo', promoRoutes)
  app.use('/api', publicRoutes)

  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ error: err.message || 'Internal server error' })
  })

  return app
}
