import { Router } from 'express'
import { getDb } from '../db.js'
import { requireUser } from '../middleware/auth.js'
import { parseTelegramUpdate, sendTelegramMessage } from '../services/telegram.js'
import { config } from '../config.js'

const router = Router()

router.post('/link', requireUser, async (req, res) => {
  const db = getDb()
  const chatId = String(req.body.chatId || '').trim()
  if (!chatId) return res.status(400).json({ error: 'chatId required' })
  await db.run('UPDATE users SET telegram_chat_id = ? WHERE id = ?', [chatId, req.userId])
  await sendTelegramMessage(chatId, '✅ Telegram подключён к AI Insider Academy. Напоминания об уроках включены.')
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

router.post('/webhook', async (req, res) => {
  const update = parseTelegramUpdate(req.body)
  if (!update) return res.json({ ok: true })
  if (update.text.startsWith('/start')) {
    await sendTelegramMessage(update.chatId, `Ваш Chat ID: <code>${update.chatId}</code>\nВставьте его в личном кабинете → Telegram.`)
  }
  res.json({ ok: true })
})

router.get('/bot-info', (_req, res) => {
  res.json({
    enabled: Boolean(config.telegram.botToken),
    botUsername: config.telegram.botToken ? 'configure in @BotFather' : null,
  })
})

export default router
