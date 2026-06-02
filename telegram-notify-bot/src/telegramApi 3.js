import { config } from './config.js'

const API = () => `https://api.telegram.org/bot${config.botToken}`

export async function sendMessage(chatId, text, extra = {}) {
  const res = await fetch(`${API()}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
      ...extra,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.description || 'Telegram API error')
    err.code = data.error_code
    throw err
  }
  return data
}

export async function getMe() {
  const res = await fetch(`${API()}/getMe`)
  const data = await res.json()
  return data.result
}

export async function setWebhook(url) {
  const res = await fetch(`${API()}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, allowed_updates: ['message', 'callback_query'] }),
  })
  return res.json()
}

export function parseUpdate(body) {
  const msg = body?.message
  if (!msg) return null
  return {
    chatId: String(msg.chat.id),
    text: msg.text || '',
    username: msg.from?.username || '',
    firstName: msg.from?.first_name || '',
  }
}
