import { config, isTelegramEnabled } from '../config.js'

const LEAKED_BOT_SECRET = '0e4a1374271a72377b84dfc5191df55d62bd6b118e5eb569'

const WEAK_VALUES = new Set([
  'admin123',
  'editor123',
  'moderator123',
  'dev-secret',
  'dev-admin-secret',
  'change-me',
  'change-me-long-random-secret',
  'TestAll2026!',
])

function isProduction() {
  return process.env.NODE_ENV === 'production'
}

function isWeakSecret(value) {
  const v = String(value || '').trim()
  if (!v) return true
  if (WEAK_VALUES.has(v)) return true
  if (v === LEAKED_BOT_SECRET) return true
  return v.length < 12
}

/** @returns {{ errors: string[], warnings: string[] }} */
export function validateProductionConfig() {
  const errors = []
  const warnings = []

  if (!isProduction()) return { errors, warnings }
  if (process.env.SKIP_PRODUCTION_CHECKS === '1') {
    warnings.push('SKIP_PRODUCTION_CHECKS=1 — startup security checks disabled')
    return { errors, warnings }
  }

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required in production')
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters')
  }
  if (!process.env.ADMIN_JWT_SECRET || process.env.ADMIN_JWT_SECRET.length < 32) {
    errors.push('ADMIN_JWT_SECRET must be at least 32 characters')
  }

  for (const key of ['ADMIN_PASSWORD', 'EDITOR_PASSWORD', 'MODERATOR_PASSWORD']) {
    const val = process.env[key]
    if (!String(val || '').trim()) {
      errors.push(`${key} is missing — set in Render → Environment (12+ characters)`)
    } else if (WEAK_VALUES.has(String(val).trim())) {
      errors.push(`${key} is a default/example password — set a unique value in Render Dashboard`)
    } else if (String(val).trim().length < 12) {
      errors.push(`${key} must be at least 12 characters`)
    }
  }

  if (isTelegramEnabled()) {
    if (!config.telegram.webhookSecret) {
      warnings.push('TELEGRAM_WEBHOOK_SECRET not set — Telegram webhook is not authenticated')
    }
    if (isWeakSecret(config.telegram.botServiceSecret)) {
      errors.push('TELEGRAM_BOT_SERVICE_SECRET / BOT_SERVICE_SECRET must be rotated (never commit secrets)')
    } else if (config.telegram.botServiceSecret === LEAKED_BOT_SECRET) {
      errors.push('BOT_SERVICE_SECRET matches leaked value from git history — rotate in Render')
    }
  }

  if (!process.env.APP_URL?.includes('myinsideracademy.com')) {
    warnings.push('APP_URL should be https://myinsideracademy.com for password-reset emails')
  }

  const s3Configured = config.storage.driver === 's3'
    && config.storage.s3.bucket
    && config.storage.s3.accessKey
    && config.storage.s3.secretKey
  if (!s3Configured) {
    const message = 'S3 storage is required before launch; Render local files are ephemeral'
    if (config.prelaunchMode) warnings.push(message)
    else errors.push(message)
  }

  if (!config.prelaunchMode && !config.tribute.apiKey) {
    errors.push('TRIBUTE_API_KEY is required when PRELAUNCH_MODE=0')
  }

  return { errors, warnings }
}

export function assertProductionConfig() {
  const { errors, warnings } = validateProductionConfig()
  for (const w of warnings) console.warn(`[production] ${w}`)
  if (errors.length) {
    console.error('[production] Startup blocked:\n' + errors.map((e) => `  • ${e}`).join('\n'))
    process.exit(1)
  }
}
