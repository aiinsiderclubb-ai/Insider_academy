import { Router } from 'express'
import { getDb } from '../db.js'
import { requireUser } from '../middleware/auth.js'
import { sendTelegramMessage } from '../services/telegram.js'

const router = Router()
const PERSONAL_ID_RE = /^AIA-[A-Z0-9]{6}$/i

router.post('/link', requireUser, async (req, res) => {
  const chatId = String(req.body.chatId || '').trim()
  if (!chatId) return res.status(400).json({ error: 'chatId required' })
  if (!/^\d{5,20}$/.test(chatId)) {
    return res.status(400).json({
      errorRu: 'Нужен числовой Chat ID. Проще откройте @InsiderAcademyNotifyBot и отправьте личный ID AIA-…',
    })
  }
  await getDb().run('UPDATE users SET telegram_chat_id = ? WHERE id = ?', [chatId, req.userId])
  await sendTelegramMessage(chatId, '✅ Telegram подключён к AI Insider Academy.')
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
  try {
    const msg = req.body?.message
    if (!msg) return res.json({ ok: true })

    const chatId = String(msg.chat.id)
    const text = (msg.text || '').trim()
    const username = msg.from?.username || ''
    const firstName = msg.from?.first_name || ''

    if (text.startsWith('/start')) {
      const name = firstName ? `, ${firstName}` : ''
      await sendTelegramMessage(
        chatId,
        `👋 <b>Здравствуйте${name}!</b>\n\nЯ бот <b>AI Insider Academy</b>.\n\n📩 Пришлите ваш <b>личный ID</b> с сайта одним сообщением.\n\nФормат: <code>AIA-XXXXXX</code>\n(Личный кабинет → Telegram)\n\nПример: <code>AIA-X5MUH7</code>`
      )
      return res.json({ ok: true })
    }

    const personalId = text.startsWith('/link') ? text.slice(5).trim() : text
    if (PERSONAL_ID_RE.test(personalId)) {
      const db = getDb()
      const normalized = personalId.toUpperCase()
      const user = await db.get('SELECT id, email FROM users WHERE personal_id = ?', [normalized])
      if (!user) {
        await sendTelegramMessage(chatId, '❌ Аккаунт не найден. Проверьте ID в личном кабинете Academy.')
        return res.json({ ok: true })
      }
      await db.run('UPDATE users SET telegram_chat_id = ? WHERE id = ?', [chatId, user.id])
      if (username) {
        await db.run('UPDATE users SET telegram_username = ? WHERE id = ?', [username, user.id]).catch(() => {})
      }
      await sendTelegramMessage(
        chatId,
        `✅ <b>Готово!</b> Telegram подключён.\n\nАккаунт: ${user.email}\n\nУведомления: ДЗ, промокоды, новости.`
      )
      return res.json({ ok: true })
    }

    if (text === '/help') {
      await sendTelegramMessage(chatId, 'Отправьте ваш ID: <code>AIA-XXXXXX</code> из личного кабинета Academy.')
    } else if (text) {
      await sendTelegramMessage(
        chatId,
        '🔑 Нужен личный ID формата <code>AIA-XXXXXX</code> из личного кабинета → Telegram.'
      )
    }
  } catch (err) {
    console.error('[telegram webhook]', err.message)
  }
  res.json({ ok: true })
})

router.get('/bot-info', (_req, res) => {
  res.json({
    enabled: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    botUsername: process.env.TELEGRAM_BOT_USERNAME || 'InsiderAcademyNotifyBot',
  })
})

export default router
