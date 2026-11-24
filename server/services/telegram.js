import crypto from 'crypto'
import { config, isTelegramEnabled } from '../config.js'

/**
 * The secret Telegram sends back with every webhook call. TELEGRAM_WEBHOOK_SECRET
 * wins; without it one is derived from JWT_SECRET, so the webhook is
 * authenticated anyway. The same value registers the webhook at startup and
 * checks each request, so either way the two always match.
 */
export function telegramWebhookSecret() {
  const explicit = String(config.telegram.webhookSecret || process.env.TELEGRAM_WEBHOOK_SECRET || '').trim()
  if (explicit) return explicit
  const base = process.env.JWT_SECRET
  if (!base) return ''
  return crypto.createHmac('sha256', base).update('telegram-webhook').digest('hex')
}

function botToken() {
  return process.env.TELEGRAM_BOT_TOKEN || config.telegram.botToken || ''
}

/** Tests point this at a local stand-in; production always talks to Telegram. */
function apiBase() {
  return (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/$/, '')
}

export async function sendTelegramMessage(chatId, text, extra = {}) {
  const token = botToken()
  if (!token || !chatId) return false
  const url = `${apiBase()}/bot${token}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
  })
  return res.ok
}

export async function sendTelegramSticker(chatId, stickerFileId) {
  const token = botToken()
  if (!token || !chatId || !stickerFileId) return false
  const res = await fetch(`${apiBase()}/bot${token}/sendSticker`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, sticker: stickerFileId }),
  })
  return res.ok
}

export async function setWebhook(webhookUrl, secretToken) {
  const token = botToken()
  if (!token) return { ok: false }
  const body = {
    url: webhookUrl,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  }
  if (secretToken) body.secret_token = secretToken
  const res = await fetch(`${apiBase()}/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function getWebhookInfo() {
  const token = botToken()
  if (!token) return null
  const res = await fetch(`${apiBase()}/bot${token}/getWebhookInfo`)
  const data = await res.json()
  return data.result || null
}

export function parseTelegramUpdate(body) {
  const msg = body?.message
  if (!msg) return null
  return {
    chatId: String(msg.chat.id),
    text: msg.text || '',
    username: msg.from?.username || '',
  }
}
