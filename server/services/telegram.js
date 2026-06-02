import { config, isTelegramEnabled } from '../config.js'

function botToken() {
  return process.env.TELEGRAM_BOT_TOKEN || config.telegram.botToken || ''
}

export async function sendTelegramMessage(chatId, text, extra = {}) {
  const token = botToken()
  if (!token || !chatId) return false
  const url = `https://api.telegram.org/bot${token}/sendMessage`
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
  const res = await fetch(`https://api.telegram.org/bot${token}/sendSticker`, {
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
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function getWebhookInfo() {
  const token = botToken()
  if (!token) return null
  const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
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
