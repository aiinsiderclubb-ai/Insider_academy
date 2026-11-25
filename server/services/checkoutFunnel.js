import { getDb } from '../db.js'
import { courses } from '../../src/data/courses.js'
import { COURSE_BUNDLES } from '../../src/data/coursePacks.js'
import { MARKETPLACE_PRODUCTS } from '../../src/data/marketplace/products.js'
import { escapeHtml, notifyAdmin } from './adminAlerts.js'

/*
 * How far people get towards buying: the item's page, its checkout page, a
 * payment started, a payment completed. Page counts are unique visitors from
 * page_views (one per person per day); payments come from the payments table.
 *
 * Checkout pages on the site:
 *   /learn/<course>/buy · /store/<product>/buy · /learn/bundles/<pack>
 * The pack page is its own checkout.
 */

const num = (value) => Number(value || 0)
const LOCALE_PREFIX = /^\/(?:ru|uk|ukr|en)(?=\/|$)/

const ITEMS = new Map()
for (const c of courses) ITEMS.set(`course:${c.slug || c.id}`, { id: c.id, title: c.titleEn || c.title, page: `/learn/${c.slug || c.id}` })
for (const p of MARKETPLACE_PRODUCTS) ITEMS.set(`store:${p.slug}`, { id: p.id, title: p.titleEn || p.titleRu, page: `/store/${p.slug}` })
for (const b of COURSE_BUNDLES) ITEMS.set(`pack:${b.slug || b.id}`, { id: b.id, title: b.titleEn || b.title || b.id, page: null })

/** The item a checkout path sells, or null when the path is not a checkout. */
export function checkoutItem(path) {
  const bare = String(path || '').replace(LOCALE_PREFIX, '')
  let match = /^\/learn\/bundles\/([^/]+)$/.exec(bare)
  if (match) return ITEMS.get(`pack:${match[1]}`) || null
  match = /^\/(learn|store)\/([^/]+)\/buy$/.exec(bare)
  if (!match) return null
  return ITEMS.get(`${match[1] === 'learn' ? 'course' : 'store'}:${match[2]}`) || null
}

/**
 * Who saw each learn/store page in the period: the set of "day:visitor" keys,
 * so one person reading a page in two languages still counts once.
 */
async function visitorsByPage(db, p) {
  const rows = await db.all(
    `SELECT DISTINCT path, day, visitor FROM page_views
     WHERE day >= ? AND day <= ? AND (path LIKE '%/learn/%' OR path LIKE '%/store/%')`,
    [p.firstDay, p.lastDay]
  )
  const pages = new Map()
  for (const row of rows) {
    const bare = String(row.path).replace(LOCALE_PREFIX, '')
    if (!pages.has(bare)) pages.set(bare, new Set())
    pages.get(bare).add(`${row.day}:${row.visitor}`)
  }
  return pages
}

/**
 * The funnel for a period: everyone who opened any checkout, and per item the
 * four steps. Items nobody reached checkout for are left out.
 */
export async function collectFunnel(p, db = getDb()) {
  const range = [p.from, p.to]
  const [pages, started, paid] = await Promise.all([
    visitorsByPage(db, p),
    db.all(
      `SELECT course_id AS id, COUNT(*) AS c FROM payments
       WHERE created_at >= ? AND created_at < ? AND status != 'unclaimed' GROUP BY course_id`,
      range
    ),
    db.all(
      `SELECT course_id AS id, COUNT(*) AS c FROM payments
       WHERE status = 'completed' AND completed_at >= ? AND completed_at < ? GROUP BY course_id`,
      range
    ),
  ])
  const startedBy = new Map(started.map((r) => [r.id, num(r.c)]))
  const paidBy = new Map(paid.map((r) => [r.id, num(r.c)]))

  const everyone = new Set()
  const items = new Map()
  for (const [path, seen] of pages) {
    const item = checkoutItem(path)
    if (!item) continue
    const entry = items.get(item.id) || { ...item, seen: new Set() }
    for (const key of seen) {
      entry.seen.add(key)
      everyone.add(key)
    }
    items.set(item.id, entry)
  }

  const list = [...items.values()]
    .map((item) => ({
      id: item.id,
      title: item.title,
      page: item.page ? pages.get(item.page)?.size || 0 : null,
      checkout: item.seen.size,
      started: startedBy.get(item.id) || 0,
      paid: paidBy.get(item.id) || 0,
    }))
    .sort((a, b) => b.checkout - a.checkout || b.paid - a.paid)

  return { checkoutVisitors: everyone.size, items: list }
}

/** One line per item: page → checkout → payment started → paid. */
export function formatFunnel(funnel, { limit = 6 } = {}) {
  if (!funnel.items.length) return []
  const lines = ['🧭 <b>Воронка</b> (страница → оформление → начали оплату → купили)']
  for (const item of funnel.items.slice(0, limit)) {
    const page = item.page === null ? '' : `${item.page} → `
    lines.push(`• ${escapeHtml(item.title)}: ${page}<b>${item.checkout}</b> → ${item.started} → <b>${item.paid}</b>`)
  }
  return lines
}

/* ------------------------------- live alert ------------------------------- */

const LOCALE_LABEL = { ru: 'RU', uk: 'UA', en: 'EN' }

/**
 * Someone opened a checkout page. One message per person, item and day, so a
 * reload or a second look does not ping again. Off with ADMIN_CHECKOUT_ALERTS=0.
 */
export async function alertCheckoutView({ path, day, visitor, source, locale, userId }, db = getDb()) {
  if (process.env.ADMIN_CHECKOUT_ALERTS === '0') return false
  const item = checkoutItem(path)
  if (!item) return false
  try {
    const user = userId ? await db.get('SELECT email FROM users WHERE id = ? LIMIT 1', [Number(userId)]) : null
    const today = await db.get(
      'SELECT COUNT(DISTINCT visitor) AS c FROM page_views WHERE day = ? AND path LIKE ?',
      [day, `%${String(path).replace(LOCALE_PREFIX, '')}`]
    )
    const who = user?.email ? `вошёл: ${escapeHtml(user.email)}` : 'гость, не вошёл'
    const lines = [
      `👀 Открыли оформление · <b>${escapeHtml(item.title)}</b>`,
      [who, source ? `откуда: ${escapeHtml(source)}` : null, LOCALE_LABEL[locale] || null].filter(Boolean).join(' · '),
      `Сегодня на этом оформлении: ${num(today?.c)}`,
    ]
    return notifyAdmin(lines.join('\n'), { once: `checkout:${day}:${visitor}:${item.id}` })
  } catch (err) {
    console.warn('[checkoutFunnel]', err.message)
    return false
  }
}
