import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { initDatabase, getDb } from './db.js'
import { ensureMarketplaceSchema } from './db/marketplaceSchema.js'
import { backfillMarketplacePurchases, enforceLegacyMarketplaceAllowlist, seedMarketplaceCatalog } from './services/marketplace.js'
import { seedGovernanceAssets } from './services/governanceAssets.js'
import { enforceGovernanceRetention } from './services/governanceRetention.js'
import { seedIfEmpty } from './seed.js'
import { backfillPersonalIds } from './services/personalId.js'
import { config } from './config.js'
import authRoutes from './routes/auth.js'
import coursesRoutes from './routes/courses.js'
import meRoutes from './routes/me.js'
import adminRoutes from './routes/admin.js'
import publicRoutes from './routes/public.js'
import paymentsRoutes from './routes/payments.js'
import webhooksRoutes, { handleStripeWebhook, handleTributeWebhook } from './routes/webhooks.js'
import { marketplaceWebhookAllowed } from './middleware/prelaunch.js'
import chatRoutes from './routes/chat.js'
import reviewsRoutes from './routes/reviews.js'
import applicationsRoutes from './routes/applications.js'
import teamsRoutes from './routes/teams.js'
import telegramRoutes from './routes/telegram.js'
import giveawaysRoutes from './routes/giveaways.js'
import filesRoutes from './routes/files.js'
import promoRoutes from './routes/promo.js'
import marketplaceRoutes from './routes/marketplace.js'
import n8nRoutes from './routes/n8n.js'
import governanceRoutes from './routes/governance.js'
import { rateLimitMiddleware } from './middleware/rateLimit.js'
import { isGoogleSheetsEnabled } from './services/googleSheets.js'
import { seedVoiceAgentAssets } from './services/voiceAgentAssets.js'

export async function createApp() {
  await initDatabase()
  await ensureMarketplaceSchema(getDb())
  await seedMarketplaceCatalog(getDb())
  await enforceLegacyMarketplaceAllowlist(getDb())
  await seedVoiceAgentAssets(getDb())
  await backfillMarketplacePurchases(getDb())
  await seedGovernanceAssets(getDb())
  await enforceGovernanceRetention(getDb())

  if (process.env.IMPORT_MIGRATION === '1') {
    const { runImport } = await import('./scripts/import-json-to-postgres.js')
    await runImport()
    console.log('[startup] migration import complete')
  }

  await seedIfEmpty()
  await seedMarketplaceCatalog(getDb())
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
  app.set('trust proxy', 1)
  app.disable('x-powered-by')
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }))

  const corsOrigins = String(config.corsOrigin || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  function isAllowedCorsOrigin(origin) {
    if (!origin) return true
    return corsOrigins.includes(origin)
  }

  app.use(cors({
    origin(origin, callback) {
      if (isAllowedCorsOrigin(origin)) return callback(null, true)
      const error = new Error('CORS not allowed')
      error.status = 403
      return callback(error)
    },
    credentials: true,
  }))

  app.use('/api', rateLimitMiddleware({
    windowMs: 60_000,
    max: 300,
    keyFn: (req) => req.ip || 'unknown',
  }))

  app.use('/api', (req, res, next) => {
    if (req.headers.authorization || req.path.startsWith('/admin') || req.path.startsWith('/me') || req.path.startsWith('/marketplace/downloads')) {
      res.setHeader('Cache-Control', 'no-store')
      res.setHeader('Pragma', 'no-cache')
    }
    next()
  })

  app.post('/api/webhooks/stripe', marketplaceWebhookAllowed, express.raw({ type: 'application/json' }), handleStripeWebhook)
  app.post('/api/webhooks/tribute', marketplaceWebhookAllowed, express.raw({ type: 'application/json' }), handleTributeWebhook)

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
        email: Boolean(config.email.smtp.host && config.email.smtp.user),
        openai: Boolean(config.openai.apiKey),
        telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN || config.telegram.botToken),
        tribute: Boolean(config.tribute.apiKey),
        googleSheets: isGoogleSheetsEnabled(),
        googleOAuth: Boolean(config.oauth.google.clientId),
        appleOAuth: Boolean(config.oauth.apple.clientId),
        marketplaceCommerce: process.env.FEATURE_MARKETPLACE_COMMERCE === 'true',
        n8nDeploy: process.env.FEATURE_N8N_DEPLOY === 'true',
        governance: process.env.FEATURE_GOVERNANCE === 'true',
      },
      config: process.env.NODE_ENV === 'production'
        ? { warnings: warnings.length, errors: errors.length }
        : undefined,
      time: new Date().toISOString(),
    })
  })

  app.get('/api/health/ready', async (_req, res) => {
    try {
      const db = getDb()
      await db.get('SELECT 1 AS ok')
      res.json({ ok: true, db: db.driver, time: new Date().toISOString() })
    } catch (err) {
      console.error('[health/ready]', err)
      res.status(503).json({ ok: false, error: 'Database unavailable' })
    }
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
  app.use('/api/giveaways', giveawaysRoutes)
  app.use('/api/files', filesRoutes)
  app.use('/api/promo', promoRoutes)
  app.use('/api/marketplace', marketplaceRoutes)
  app.use('/api/n8n', n8nRoutes)
  app.use('/api/governance', governanceRoutes)
  app.use('/api', publicRoutes)

  app.use((err, _req, res, _next) => {
    console.error(err)
    const status = Number(err.status) >= 400 && Number(err.status) < 500 ? Number(err.status) : 500
    res.status(status).json({
      error: process.env.NODE_ENV === 'production' ? (status === 403 ? 'Forbidden' : 'Internal server error') : err.message || 'Internal server error',
    })
  })

  return app
}
