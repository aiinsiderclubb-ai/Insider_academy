import crypto from 'crypto'
import { getDb } from '../db.js'
import { config } from '../config.js'
import { JWT_SECRET } from '../middleware/auth.js'
import { sourceOfVisit } from './trafficSource.js'
import { zurichDay, addDays } from './zurichTime.js'
import { alertCheckoutView } from './checkoutFunnel.js'

/*
 * Page views without cookies.
 *
 * A visitor is a hash of their address and browser, salted with a secret that
 * changes every day. Within a day the same person counts once; across days the
 * hashes do not match, and without the secret none of it leads back to an
 * address. Nothing is stored in the visitor's browser, so there is nothing to
 * ask consent for.
 */

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|quora link|whatsapp|telegrambot|vkshare|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|axios|node-fetch|go-http/i

/** Admin and API-ish paths are the team at work, not visitors. */
const IGNORED_PATH = /^\/(?:[a-z]{2}\/)?(?:studio|api)(?:\/|$)/i

const KEEP_DAYS = 400

function daySalt(day) {
  const secret = process.env.PAGE_VIEW_SALT || JWT_SECRET
  return crypto.createHmac('sha256', secret).update(`page-views:${day}`).digest()
}

export function visitorHash(day, ip, userAgent) {
  return crypto.createHmac('sha256', daySalt(day)).update(`${ip}|${userAgent}`).digest('hex').slice(0, 20)
}

function cleanPath(value) {
  const raw = String(value || '').trim()
  if (!raw.startsWith('/') || raw.startsWith('//')) return ''
  const path = raw.split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  return path.slice(0, 200)
}

/**
 * Records one page view. Returns false when the request is not a visitor's
 * (a bot, an admin page, a malformed path) — the caller answers the same way
 * either way, so a crawler learns nothing from it.
 */
export async function recordPageView({ path, referrer, utmSource, locale, ip, userAgent, userId }) {
  const ua = String(userAgent || '')
  if (!ua || BOT_UA.test(ua)) return false
  const clean = cleanPath(path)
  if (!clean || IGNORED_PATH.test(clean)) return false
  const now = new Date()
  const day = zurichDay(now)
  const source = sourceOfVisit({ utmSource, referrer, ownHost: config.appUrl }) || null
  const lang = ['ru', 'uk', 'en'].includes(String(locale)) ? String(locale) : null
  await getDb().run(
    'INSERT INTO page_views (day, created_at, path, visitor, source, locale, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [day, now.toISOString(), clean, visitorHash(day, ip || '', ua), source, lang, userId ? Number(userId) : null]
  )
  // A checkout page tells the team someone is close to buying; not awaited, the visitor does not wait on Telegram.
  void alertCheckoutView({ path: clean, day, visitor: visitorHash(day, ip || '', ua), source, locale: lang, userId })
  return true
}

/** Old rows go: daily totals live on in the reports already sent. */
export async function prunePageViews(db = getDb()) {
  await db.run('DELETE FROM page_views WHERE day < ?', [addDays(zurichDay(), -KEEP_DAYS)])
}
