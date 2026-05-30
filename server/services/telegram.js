import { config, isTelegramEnabled } from '../config.js'

export async function sendTelegramMessage(chatId, text) {
  if (!isTelegramEnabled() || !chatId) return false
  const url = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
  return res.ok
}

export async function setWebhook(webhookUrl) {
  if (!isTelegramEnabled()) return
  await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  })
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
