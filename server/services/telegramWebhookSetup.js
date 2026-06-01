import { config, isTelegramEnabled } from '../config.js'
import { setWebhook, getWebhookInfo } from './telegram.js'

export function getTelegramWebhookUrl() {
  if (process.env.TELEGRAM_WEBHOOK_URL) {
    return process.env.TELEGRAM_WEBHOOK_URL.replace(/\/$/, '')
  }
  const base = (
    process.env.API_PUBLIC_URL
    || process.env.RENDER_EXTERNAL_URL
    || 'https://insider-academy.onrender.com'
  ).replace(/\/$/, '')
  return `${base}/api/telegram/webhook`
}

export async function ensureTelegramWebhook() {
  if (!isTelegramEnabled()) {
    console.log('[telegram] Bot token not set — webhook skipped')
    return
  }

  const url = getTelegramWebhookUrl()
  try {
    const result = await setWebhook(url)
    const info = await getWebhookInfo()
    console.log('[telegram] Webhook set:', url)
    if (result?.ok === false) console.warn('[telegram] setWebhook:', result.description || result)
    if (info?.url && info.url !== url) {
      console.warn('[telegram] Active webhook:', info.url)
    }
  } catch (err) {
    console.error('[telegram] Webhook setup failed:', err.message)
  }
}
