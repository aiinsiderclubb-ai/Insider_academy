import { getDb } from '../db.js'
import { config } from '../config.js'
import { sendTelegramMessage, sendTelegramSticker } from './telegram.js'
import { getNotifyPrefs, defaultNotifyPrefs } from './telegramLink.js'
import { formatNotification, getInlineKeyboard } from './telegramMessages.js'

const PREF_BY_TYPE = {
  homework_accepted: 'homework',
  homework_resubmit: 'homework',
  promo_new: 'promo',
  course_news: 'news',
  review_approved: 'reviews',
  review_rejected: 'reviews',
  purchase: 'purchases',
  lesson_reminder: 'homework',
  application_accepted: 'news',
  custom: 'news',
}

const STICKER_ENV = {
  homework_accepted: 'STICKER_HW_ACCEPTED',
  homework_resubmit: 'STICKER_HW_RESUBMIT',
  review_approved: 'STICKER_REVIEW_OK',
  review_rejected: 'STICKER_REVIEW_NO',
  purchase: 'STICKER_PURCHASE',
  promo_new: 'STICKER_PROMO',
  lesson_reminder: 'STICKER_REMINDER',
  course_news: 'STICKER_NEWS',
}

function getStickerFileId(type) {
  const envKey = STICKER_ENV[type]
  if (!envKey) return null
  return process.env[envKey]?.trim() || null
}

async function sendViaBotService(chatId, type, data) {
  const url = config.telegram.botServiceUrl
  if (!url) return false
  const res = await fetch(`${url.replace(/\/$/, '')}/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bot-secret': config.telegram.botServiceSecret,
    },
    body: JSON.stringify({ chatId, type, data, appUrl: config.appUrl }),
  })
  return res.ok
}

async function sendDirectTelegram(chatId, type, data) {
  const appUrl = config.appUrl
  await sendTelegramSticker(chatId, getStickerFileId(type))
  const text = formatNotification(type, data, appUrl)
  const replyMarkup = getInlineKeyboard(type, data, appUrl)
  return sendTelegramMessage(chatId, text, replyMarkup ? { reply_markup: replyMarkup } : {})
}

export async function notifyTelegramUser(userId, type, data = {}) {
  const db = getDb()
  const user = await db.get('SELECT id, telegram_chat_id FROM users WHERE id = ?', [userId])
  if (!user?.telegram_chat_id) return false

  const prefKey = PREF_BY_TYPE[type] || 'news'
  const prefs = await getNotifyPrefs(db, userId)
  if (prefs[prefKey] === false) return false

  const chatId = user.telegram_chat_id
  try {
    if (config.telegram.botServiceUrl) {
      return await sendViaBotService(chatId, type, data)
    }
    return await sendDirectTelegram(chatId, type, data)
  } catch (err) {
    console.warn('[telegramNotify]', type, err.message)
    return false
  }
}

export async function notifyTelegramByEmail(email, type, data = {}) {
  const db = getDb()
  const user = await db.get('SELECT id FROM users WHERE email = ?', [String(email).trim().toLowerCase()])
  if (!user?.id) return false
  return notifyTelegramUser(user.id, type, data)
}

export async function notifyTelegramChatId(chatId, type, data = {}) {
  if (!chatId) return false
  try {
    if (config.telegram.botServiceUrl) {
      return await sendViaBotService(chatId, type, data)
    }
    return await sendDirectTelegram(chatId, type, data)
  } catch (err) {
    console.warn('[telegramNotify]', type, chatId, err.message)
    return false
  }
}

export async function broadcastTelegram(type, data = {}, { prefKey = 'news' } = {}) {
  const db = getDb()
  const users = await db.all(
    'SELECT id, telegram_chat_id FROM users WHERE telegram_chat_id IS NOT NULL AND telegram_chat_id != ""'
  )
  const items = []
  for (const u of users) {
    const prefs = await getNotifyPrefs(db, u.id)
    if (prefs[prefKey] === false) continue
    items.push({ chatId: u.telegram_chat_id, type, data })
  }

  if (!items.length) return { sent: 0 }

  if (config.telegram.botServiceUrl) {
    const res = await fetch(`${config.telegram.botServiceUrl.replace(/\/$/, '')}/notify/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-secret': config.telegram.botServiceSecret,
      },
      body: JSON.stringify({ items, appUrl: config.appUrl }),
    })
    const body = await res.json().catch(() => ({}))
    return { sent: body.sent || 0 }
  }

  let sent = 0
  for (const item of items) {
    try {
      if (await sendDirectTelegram(item.chatId, item.type, item.data)) sent += 1
    } catch (_) {}
  }
  return { sent }
}

export { defaultNotifyPrefs }
