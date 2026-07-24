import { config } from '../config.js'

const MEMBER_STATUSES = new Set(['creator', 'administrator', 'member', 'restricted'])

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN || config.telegram.botToken || ''
}

export function normalizeChannelId(channel) {
  const raw = String(channel || '').trim()
  if (!raw) return ''
  if (raw.startsWith('@')) return raw
  if (/^-?\d+$/.test(raw)) return raw
  return `@${raw.replace(/^@/, '')}`
}

export async function checkChannelMembership(chatId, channel) {
  // E2E / local QA: skip live Telegram API when explicitly enabled (never in production).
  if (
    process.env.GIVEAWAY_TELEGRAM_BYPASS === '1'
    && process.env.NODE_ENV !== 'production'
    && chatId
  ) {
    return { ok: true, subscribed: true, status: 'member', bypass: true }
  }

  const token = getBotToken()
  const channelId = normalizeChannelId(channel)
  if (!token) {
    return { ok: false, subscribed: false, error: 'Telegram bot not configured', errorRu: 'Бот Telegram не настроен' }
  }
  if (!chatId) {
    return { ok: false, subscribed: false, error: 'Telegram not linked', errorRu: 'Telegram не подключён' }
  }
  if (!channelId) {
    return { ok: false, subscribed: false, error: 'Channel not configured', errorRu: 'Канал не настроен' }
  }

  try {
    const url = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${encodeURIComponent(channelId)}&user_id=${encodeURIComponent(chatId)}`
    const res = await fetch(url)
    const data = await res.json()
    if (!data?.ok) {
      const desc = data?.description || 'getChatMember failed'
      return {
        ok: false,
        subscribed: false,
        error: desc,
        errorRu: desc.includes('member not found')
          ? 'Вы не подписаны на канал'
          : 'Не удалось проверить подписку. Убедитесь, что бот — админ канала.',
      }
    }
    const status = data.result?.status
    const subscribed = MEMBER_STATUSES.has(status)
    return { ok: true, subscribed, status }
  } catch (err) {
    return { ok: false, subscribed: false, error: err.message, errorRu: 'Ошибка проверки подписки' }
  }
}
