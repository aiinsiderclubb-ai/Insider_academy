import { Router } from 'express'
import { getDb } from '../db.js'
import { requireUser } from '../middleware/auth.js'
import { config } from '../config.js'
import { sendTelegramMessage } from '../services/telegram.js'
import { handleTelegramUpdate } from '../services/telegramBotHandlers.js'
import { getTelegramWebhookUrl } from '../services/telegramWebhookSetup.js'
import {
  createLinkToken,
  consumeLinkToken,
  linkByPersonalId,
  unlinkByChatId,
  getNotifyPrefs,
  setNotifyPrefs,
  getBotUsername,
  findUserByPersonalId,
  isValidPersonalId,
  normalizePersonalId,
} from '../services/telegramLink.js'
import { backfillPersonalIds } from '../services/personalId.js'

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

function verifyTelegramWebhookSecret(req, res, next) {
  const expected = config.telegram.webhookSecret
  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'Telegram webhook secret not configured' })
    }
    return next()
  }
  const header = req.headers['x-telegram-bot-api-secret-token'] || ''
  if (header !== expected) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

router.post('/webhook', verifyTelegramWebhookSecret, async (req, res) => {
  try {
    await handleTelegramUpdate(req.body)
    res.json({ ok: true })
  } catch (err) {
    console.error('[telegram webhook]', err.message)
    res.json({ ok: true })
  }
})

router.get('/webhook-info', async (_req, res) => {
  if (!config.telegram.botToken) return res.json({ configured: false })
  const { getWebhookInfo } = await import('../services/telegram.js')
  const info = await getWebhookInfo()
  res.json({
    configured: true,
    expectedUrl: getTelegramWebhookUrl(),
    activeUrl: info?.url || null,
    pendingUpdates: info?.pending_update_count ?? 0,
  })
})

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
  const normalized = normalizePersonalId(personalId)
  if (!isValidPersonalId(normalized)) {
    return res.status(400).json({ error: 'Invalid personal ID format', errorRu: 'Неверный формат ID' })
  }
  let result = await linkByPersonalId(normalized, chatId, username)
  if (!result.ok && result.error === 'Account not found') {
    try {
      await backfillPersonalIds(getDb())
      result = await linkByPersonalId(normalized, chatId, username)
    } catch (_) {}
  }
  if (!result.ok) {
    return res.status(400).json({
      error: result.error,
      errorRu: 'Аккаунт не найден. Зарегистрируйтесь на сайте Academy и скопируйте ID из личного кабинета.',
    })
  }
  res.json({ ok: true, email: result.email, userId: result.userId })
})

router.get('/bot/lookup/:personalId', requireBotSecret, async (req, res) => {
  const normalized = normalizePersonalId(req.params.personalId)
  if (!isValidPersonalId(normalized)) {
    return res.status(400).json({ ok: false, error: 'Invalid format' })
  }
  const user = await findUserByPersonalId(normalized)
  if (!user) return res.json({ ok: false, found: false })
  res.json({
    ok: true,
    found: true,
    email: user.email,
    userId: user.id,
    personalId: user.personal_id,
    telegramConnected: Boolean(user.telegram_chat_id),
  })
})

router.post('/bot/unlink', requireBotSecret, async (req, res) => {
  const chatId = String(req.body.chatId || '')
  if (!chatId) return res.status(400).json({ error: 'chatId required' })
  await unlinkByChatId(chatId)
  res.json({ ok: true })
})

export default router
