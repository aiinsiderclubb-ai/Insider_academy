import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const config = {
  port: Number(process.env.PORT) || 3001,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  adminJwtSecret: process.env.ADMIN_JWT_SECRET || 'dev-admin-secret',
  databaseUrl: process.env.DATABASE_URL || '',
  uploadsDir: process.env.UPLOADS_DIR || path.join(__dirname, 'uploads'),
  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    s3: {
      bucket: process.env.S3_BUCKET || '',
      region: process.env.S3_REGION || 'eu-central-1',
      accessKey: process.env.S3_ACCESS_KEY || '',
      secretKey: process.env.S3_SECRET_KEY || '',
      endpoint: process.env.S3_ENDPOINT || '',
    },
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    currency: process.env.STRIPE_CURRENCY || 'eur',
  },
  liqpay: {
    publicKey: process.env.LIQPAY_PUBLIC_KEY || '',
    privateKey: process.env.LIQPAY_PRIVATE_KEY || '',
  },
  email: {
    from: process.env.EMAIL_FROM || 'AI Insider Academy <noreply@example.com>',
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: Number(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
  },
}

export function isStripeEnabled() {
  return Boolean(config.stripe.secretKey)
}

export function isLiqPayEnabled() {
  return Boolean(config.liqpay.publicKey && config.liqpay.privateKey)
}

export function isS3Enabled() {
  return config.storage.driver === 's3' && Boolean(config.storage.s3.bucket)
}

export function isEmailEnabled() {
  return Boolean(config.email.smtp.host && config.email.smtp.user)
}

export function isOpenAIEnabled() {
  return Boolean(config.openai.apiKey)
}

export function isTelegramEnabled() {
  return Boolean(config.telegram.botToken)
}
