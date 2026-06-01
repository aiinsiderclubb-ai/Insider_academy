import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createApp } from './app.js'
import { config } from './config.js'
import { getDb } from './db.js'
import { parseJson } from './db/sqlite.js'
import { nowIso } from './db/time.js'
import { notifyTelegramUser } from './services/telegramNotify.js'
import { ensureTelegramWebhook } from './services/telegramWebhookSetup.js'
import { sendAdminDailyDigest } from './services/digest.js'
import { processEmailQueue, processInactiveUsers } from './services/emailQueue.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
for (const dir of ['data', 'uploads']) {
  const p = path.join(__dirname, dir)
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

async function processReminders() {
  try {
    const db = getDb()
    const due = await db.all(
      `SELECT r.*, u.telegram_chat_id, c.data AS course_data FROM lesson_reminders r
       JOIN users u ON u.id = r.user_id LEFT JOIN courses c ON c.id = r.course_id
       WHERE r.sent = 0 AND r.remind_at <= ? LIMIT 20`,
      [nowIso()]
    )
    for (const row of due) {
      const course = parseJson(row.course_data, {})
      const lesson = course.lessons?.[row.lesson_index]
      await notifyTelegramUser(row.user_id, 'lesson_reminder', {
        courseTitle: course.title || row.course_id,
        lessonTitle: lesson?.title,
        targetPath: course.slug ? `/courses/${course.slug}?lesson=${row.lesson_index}` : '/cabinet',
      })
      await db.run('UPDATE lesson_reminders SET sent = 1 WHERE id = ?', [row.id])
    }
  } catch (err) {
    console.error('[reminders]', err.message)
  }
}

async function start() {
  const app = await createApp()

  setInterval(processReminders, 60000)
  setInterval(() => { processEmailQueue().catch((e) => console.error('[email-queue]', e.message)) }, 120000)
  setInterval(() => { processInactiveUsers().catch((e) => console.error('[inactive]', e.message)) }, 86400000)
  setInterval(() => { sendAdminDailyDigest().catch((e) => console.error('[digest]', e.message)) }, 3600000)
  sendAdminDailyDigest().catch(() => {})

  await ensureTelegramWebhook()

  app.listen(config.port, () => {
    console.log(`LMS API v2 at http://localhost:${config.port} [${getDb().driver}]`)
  })
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
