import { getDb } from '../db.js'
import { adminChatIds, notifyAdmin } from './adminAlerts.js'
import { sendTelegramMessage } from './telegram.js'
import { prunePageViews } from './pageViews.js'
import {
  collectQueue, collectStats, formatQueue, formatStats, period, periodTitle, previousPeriod, recentSales,
} from './siteStats.js'
import { addDays, weekStart, zurichDay, zurichParts } from './zurichTime.js'

/*
 * Scheduled reports to the team's Telegram chat, and the commands that ask for
 * one on demand. The daily report covers yesterday and goes out at 09:00
 * Zurich; on Mondays the past week follows it. A restart or a sleeping server
 * catches up later the same day — the "last sent" marks live in the database.
 */

const REPORT_HOUR = 9
const DAILY_KEY = 'tg_digest_daily'
const WEEKLY_KEY = 'tg_digest_weekly'

async function lastSent(db, key) {
  return (await db.get('SELECT value FROM analytics WHERE key = ?', [key]))?.value || ''
}

async function markSent(db, key, value) {
  await db.run(
    'INSERT INTO analytics (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  )
}

export async function dailyReport(day = addDays(zurichDay(), -1)) {
  const p = period(day, 1)
  const [stats, prev, queue] = await Promise.all([collectStats(p), collectStats(previousPeriod(p)), collectQueue()])
  return formatStats(periodTitle(p, 'Вчера'), stats, { prev, queue })
}

export async function weeklyReport(monday = addDays(weekStart(), -7)) {
  const p = period(addDays(monday, 6), 7)
  const [stats, prev] = await Promise.all([collectStats(p), collectStats(previousPeriod(p))])
  return formatStats(periodTitle(p, 'Неделя'), stats, { prev })
}

/** Called on a timer; sends whatever report is due and not yet sent. */
export async function runAdminDigests(now = new Date()) {
  if (!adminChatIds().length) return
  const { hour } = zurichParts(now)
  if (hour < REPORT_HOUR) return
  const db = getDb()
  const today = zurichDay(now)

  if (await lastSent(db, DAILY_KEY) !== today) {
    // Mark first: a failure to deliver should not turn into a report every ten minutes.
    await markSent(db, DAILY_KEY, today)
    await notifyAdmin(await dailyReport(addDays(today, -1)))
    await prunePageViews(db).catch((err) => console.warn('[digest] prune:', err.message))
  }

  const monday = weekStart(today)
  if (monday === today && await lastSent(db, WEEKLY_KEY) !== monday) {
    await markSent(db, WEEKLY_KEY, monday)
    await notifyAdmin(await weeklyReport(addDays(monday, -7)))
  }
}

/* ------------------------------- commands -------------------------------- */

const HELP = [
  '🛠 <b>Команды админ-чата</b>',
  '',
  '/today — сегодня с полуночи',
  '/yesterday — вчера (и сравнение с позавчера)',
  '/week — последние 7 дней',
  '/month — последние 30 дней',
  '/sales — последние 10 продаж',
  '/queue — что ждёт проверки',
  '/chatid — id этого чата',
].join('\n')

/**
 * A message in an admin chat. Returns true when it was a command for us; any
 * other chatter in the group is left alone.
 */
export async function handleAdminCommand(chatId, text) {
  const [first, ...args] = String(text || '').trim().split(/\s+/)
  const command = first.toLowerCase().replace(/@\S+$/, '')
  if (!command.startsWith('/')) return false
  // `/start link_…` is a learner linking their account, even in an admin's own chat.
  if (command === '/start' && args.length) return false
  const reply = (body) => sendTelegramMessage(chatId, body, { disable_web_page_preview: true })
  const today = zurichDay()
  switch (command) {
    case '/start':
    case '/help':
      await reply(HELP)
      return true
    case '/today': {
      const p = period(today, 1)
      const [stats, queue] = await Promise.all([collectStats(p), collectQueue()])
      await reply(formatStats(periodTitle(p, 'Сегодня'), stats, { queue }))
      return true
    }
    case '/yesterday':
      await reply(await dailyReport(addDays(today, -1)))
      return true
    case '/week':
    case '/month': {
      const p = period(today, command === '/week' ? 7 : 30)
      const [stats, prev] = await Promise.all([collectStats(p), collectStats(previousPeriod(p))])
      await reply(formatStats(periodTitle(p, command === '/week' ? '7 дней' : '30 дней'), stats, { prev }))
      return true
    }
    case '/sales':
      await reply(await recentSales(10))
      return true
    case '/queue':
      await reply(formatQueue(await collectQueue()))
      return true
    default:
      return false
  }
}
