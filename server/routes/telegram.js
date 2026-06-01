import { Router } from 'express'
import { getDb } from '../db.js'
import { requireUser } from '../middleware/auth.js'
import { config } from '../config.js'
import { sendTelegramMessage } from '../services/telegram.js'
import {
  createLinkToken,
  consumeLinkToken,
  linkByPersonalId,
  unlinkByChatId,
  getNotifyPrefs,
  setNotifyPrefs,
  getBotUsername,
} from '../services/telegramLink.js'

const router = Router()

async function resolveBotUsername() {
  const fromEnv = getBotUsername()
  if (fromEnv) return fromEnv
  if (!config.telegram.botToken) return ''
  try {
    const res = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/getMe`)
    const data = await res.json()
    return data?.result?.username || ''
  } catch {
    return ''
  }
}

function requireBotSecret(req, res, next) {
  const secret = req.headers['x-bot-secret'] || ''
  const expected = config.telegram.botServiceSecret
  if (!expected || secret !== expected) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

router.get('/bot-info', async (_req, res) => {
  const username = await resolveBotUsername()
  res.json({
    enabled: Boolean(config.telegram.botToken || config.telegram.botServiceUrl),
    botUsername: username || null,
    botUrl: username ? `https://t.me/${username}` : null,
    deepLinkSupported: Boolean(username),
    botService: Boolean(config.telegram.botServiceUrl),
  })
})

router.post('/link', requireUser, async (req, res) => {
  const chatId = String(req.body.chatId || '').trim()
  if (!chatId) return res.status(400).json({ error: 'chatId required' })
  if (!/^\d{5,20}$/.test(chatId)) {
    return res.status(400).json({
      error: 'Use numeric Chat ID or connect via the bot link in your cabinet.',
      errorRu: 'Нужен числовой Chat ID. Проще нажать «Открыть бота» в кабинете — username не подходит.',
    })
  }
  await getDb().run('UPDATE users SET telegram_chat_id = ? WHERE id = ?', [chatId, req.userId])
  await sendTelegramMessage(chatId, '✅ Telegram подключён к AI Insider Academy.')
  res.json({ ok: true })
})

router.post('/link-token', requireUser, async (req, res) => {
  const db = getDb()
  const user = await db.get('SELECT personal_id FROM users WHERE id = ?', [req.userId])
  const link = await createLinkToken(req.userId)
  const botUsername = await resolveBotUsername()
  const url = link.url || (botUsername ? `https://t.me/${botUsername}` : null)
  res.json({
    ...link,
    url,
    botUsername: botUsername || null,
    personalId: user?.personal_id || null,
    manualCommand: user?.personal_id ? `/link ${user.personal_id}` : null,
  })
})

router.get('/status', requireUser, async (req, res) => {
  const db = getDb()
  const user = await db.get(
    'SELECT telegram_chat_id, telegram_username, personal_id FROM users WHERE id = ?',
    [req.userId]
  )
  const prefs = await getNotifyPrefs(db, req.userId)
  const botUsername = await resolveBotUsername()
  res.json({
    connected: Boolean(user?.telegram_chat_id),
    chatId: user?.telegram_chat_id || null,
    username: user?.telegram_username || null,
    personalId: user?.personal_id || null,
    botUsername: botUsername || null,
    botUrl: botUsername ? `https://t.me/${botUsername}` : null,
    prefs,
  })
})

router.patch('/prefs', requireUser, async (req, res) => {
  const db = getDb()
  const prefs = await setNotifyPrefs(db, req.userId, req.body || {})
  res.json({ prefs })
})

router.post('/disconnect', requireUser, async (req, res) => {
  await getDb().run(
    'UPDATE users SET telegram_chat_id = NULL, telegram_username = NULL WHERE id = ?',
    [req.userId]
  )
  res.json({ ok: true })
})

router.post('/reminder', requireUser, async (req, res) => {
  const db = getDb()
  const { courseId, lessonIndex, remindAt } = req.body
  const id = `rem-${Date.now()}`
  await db.run(
    'INSERT INTO lesson_reminders (id, user_id, course_id, lesson_index, remind_at) VALUES (?, ?, ?, ?, ?)',
    [id, req.userId, courseId, lessonIndex, remindAt]
  )
  res.json({ id })
})

router.post('/bot/confirm-link', requireBotSecret, async (req, res) => {
  const { token, chatId, username } = req.body
  if (!token || !chatId) return res.status(400).json({ error: 'token and chatId required' })
  const result = await consumeLinkToken(token, chatId, username)
  if (!result.ok) return res.status(400).json({ error: result.error })
  res.json({ ok: true, email: result.email })
})

router.post('/bot/link-personal-id', requireBotSecret, async (req, res) => {
  const { personalId, chatId, username } = req.body
  if (!personalId || !chatId) return res.status(400).json({ error: 'personalId and chatId required' })
  const result = await linkByPersonalId(personalId, chatId, username)
  if (!result.ok) return res.status(400).json({ error: result.error })
  res.json({ ok: true, email: result.email })
})

router.post('/bot/unlink', requireBotSecret, async (req, res) => {
  const chatId = String(req.body.chatId || '')
  if (!chatId) return res.status(400).json({ error: 'chatId required' })
  await unlinkByChatId(chatId)
  res.json({ ok: true })
})

export default router
