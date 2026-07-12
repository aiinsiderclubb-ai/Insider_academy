import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const config = {
  port: Number(process.env.PORT) || 3001,
  corsOrigin: process.env.CORS_ORIGIN
    || 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174',
  appUrl: process.env.APP_URL || (process.env.NODE_ENV === 'production' ? 'https://myinsideracademy.com' : 'http://localhost:5173'),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  editorPassword: process.env.EDITOR_PASSWORD || 'editor123',
  moderatorPassword: process.env.MODERATOR_PASSWORD || 'moderator123',
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminDigestEnabled: process.env.ADMIN_DIGEST !== '0',
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
    from: process.env.EMAIL_FROM || 'AI Insider Academy <info@myinsideracademy.com>',
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === '1' || process.env.SMTP_SECURE === 'true',
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
    botUsername: process.env.TELEGRAM_BOT_USERNAME || '',
    botServiceUrl: process.env.TELEGRAM_BOT_SERVICE_URL || '',
    botServiceSecret: process.env.TELEGRAM_BOT_SERVICE_SECRET || process.env.BOT_SERVICE_SECRET || '',
  },
  googleSheets: {
    enabled: process.env.GOOGLE_SHEETS_ENABLED !== '0' && Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
    serviceAccount: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '1JlbsIBxryW8dSemF4XSySdcVabqwxghh',
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '',
    },
    apple: {
      /** Services ID, e.g. com.aiinsider.academy.web */
      clientId: process.env.APPLE_OAUTH_CLIENT_ID || process.env.VITE_APPLE_CLIENT_ID || '',
    },
  },
  tribute: {
    apiKey: process.env.TRIBUTE_API_KEY || '',
    shopId: process.env.TRIBUTE_SHOP_ID ? Number(process.env.TRIBUTE_SHOP_ID) : null,
    defaultProductId: process.env.TRIBUTE_DEFAULT_PRODUCT_ID ? Number(process.env.TRIBUTE_DEFAULT_PRODUCT_ID) : null,
    currency: (process.env.TRIBUTE_CURRENCY || 'eur').toLowerCase(),
    webhookSkipVerify: process.env.TRIBUTE_WEBHOOK_SKIP_VERIFY === '1',
    webhookUrl: process.env.TRIBUTE_WEBHOOK_URL || '',
    /** JSON map courseId -> tribute product id, e.g. {"ai-chatbot-engineer":456} */
    productMap: (() => {
      try {
        return process.env.TRIBUTE_PRODUCT_MAP ? JSON.parse(process.env.TRIBUTE_PRODUCT_MAP) : {}
      } catch {
        return {}
      }
    })(),
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
  return Boolean(config.email.smtp.host && config.email.smtp.user && config.email.smtp.pass)
}

export function isOpenAIEnabled() {
  return Boolean(config.openai.apiKey)
}

export function isTelegramEnabled() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN || config.telegram.botToken)
}

export function isTributeEnabled() {
  return Boolean(config.tribute.apiKey)
}

export function isGoogleSheetsEnabled() {
  return Boolean(config.googleSheets.enabled && config.googleSheets.serviceAccount)
}

export function isGoogleOAuthEnabled() {
  return Boolean(config.oauth.google.clientId)
}

export function isAppleOAuthEnabled() {
  return Boolean(config.oauth.apple.clientId)
}
