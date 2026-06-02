import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT) || 3080,
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  botUsername: (process.env.TELEGRAM_BOT_USERNAME || '').replace('@', ''),
  lmsApiUrl: (process.env.LMS_API_URL || 'http://localhost:3001').replace(/\/$/, ''),
  botSecret: process.env.BOT_SERVICE_SECRET || '',
  publicUrl: (process.env.BOT_PUBLIC_URL || '').replace(/\/$/, ''),
  appUrl: process.env.APP_URL || 'https://insider-academy-vsxg.vercel.app',
}

export function isConfigured() {
  return Boolean(config.botToken && config.botSecret)
}
