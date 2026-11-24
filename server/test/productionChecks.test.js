import test from 'node:test'
import assert from 'node:assert/strict'

test('production start: a bot token alone does not block startup; a weak or leaked bot-service secret does', async () => {
  const saved = { ...process.env }
  Object.assign(process.env, {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://example/db',
    JWT_SECRET: 'j'.repeat(40),
    ADMIN_JWT_SECRET: 'a'.repeat(40),
    ADMIN_PASSWORD: 'Admin-Password-2026',
    EDITOR_PASSWORD: 'Editor-Password-2026',
    MODERATOR_PASSWORD: 'Moderator-Pass-2026',
    APP_URL: 'https://myinsideracademy.com',
    TELEGRAM_BOT_TOKEN: '123:abc',
    TELEGRAM_WEBHOOK_SECRET: '',
  })
  delete process.env.TELEGRAM_BOT_SERVICE_SECRET
  delete process.env.BOT_SERVICE_SECRET
  delete process.env.FEATURE_MARKETPLACE_COMMERCE
  delete process.env.SKIP_PRODUCTION_CHECKS
  try {
    const { config } = await import('../config.js')
    const { validateProductionConfig } = await import('../utils/productionChecks.js')
    const { telegramWebhookSecret } = await import('../services/telegram.js')
    Object.assign(config.telegram, { botToken: '123:abc', webhookSecret: '', botServiceUrl: '', botServiceSecret: '' })

    let report = validateProductionConfig()
    assert.deepEqual(report.errors, [])
    // The webhook is authenticated with a secret derived from JWT_SECRET.
    assert.match(telegramWebhookSecret(), /^[a-f0-9]{64}$/)
    assert.ok(!report.warnings.some((w) => /TELEGRAM_WEBHOOK_SECRET/.test(w)))

    config.telegram.botServiceSecret = 'short'
    report = validateProductionConfig()
    assert.ok(report.errors.some((e) => /BOT_SERVICE_SECRET/.test(e)))

    config.telegram.botServiceSecret = ''
    config.telegram.botServiceUrl = 'https://bot.example'
    report = validateProductionConfig()
    assert.ok(report.errors.some((e) => /BOT_SERVICE_SECRET/.test(e)), 'a bot service needs its secret')
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]
    Object.assign(process.env, saved)
  }
})
