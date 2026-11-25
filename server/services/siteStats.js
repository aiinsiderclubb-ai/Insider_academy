import { getDb } from '../db.js'
import { escapeHtml, formatMoney, plural } from './adminAlerts.js'
import { addDays, ruDay, zurichDay, zurichDayBounds } from './zurichTime.js'
import { collectFunnel, formatFunnel } from './checkoutFunnel.js'

/*
 * The numbers behind the Telegram reports: who came, who signed up, who paid,
 * and what is waiting for the team. A period is a run of whole Zurich calendar
 * days; "today" ends now.
 */

const num = (value) => Number(value || 0)
const LOCALE_PREFIX = /^\/(ru|uk|ukr|en)(?=\/|$)/

/** A period of `days` Zurich days ending with `lastDay`. */
export function period(lastDay = zurichDay(), days = 1) {
  return zurichDayBounds(lastDay, days)
}

export function previousPeriod(p) {
  const days = Math.round((Date.parse(`${p.lastDay}T00:00:00Z`) - Date.parse(`${p.firstDay}T00:00:00Z`)) / 86400000) + 1
  return period(addDays(p.firstDay, -1), days)
}

async function topPages(db, p) {
  const rows = await db.all(
    `SELECT path, COUNT(DISTINCT day || ':' || visitor) AS visitors FROM page_views
     WHERE day >= ? AND day <= ? GROUP BY path ORDER BY visitors DESC LIMIT 200`,
    [p.firstDay, p.lastDay]
  )
  // /ru/learn and /en/learn are one page in three languages.
  const merged = new Map()
  for (const row of rows) {
    const path = String(row.path).replace(LOCALE_PREFIX, '') || '/'
    merged.set(path, (merged.get(path) || 0) + num(row.visitors))
  }
  return [...merged.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([path, visitors]) => ({ path, visitors }))
}

export async function collectStats(p, db = getDb()) {
  const days = [p.firstDay, p.lastDay]
  const range = [p.from, p.to]
  const [funnel, views, sources, pages, regs, regSources, started, abandoned, paid, refunds, products] = await Promise.all([
    collectFunnel(p, db),
    db.get(
      `SELECT COUNT(*) AS views, COUNT(DISTINCT day || ':' || visitor) AS visitors FROM page_views WHERE day >= ? AND day <= ?`,
      days
    ),
    db.all(
      `SELECT source, COUNT(DISTINCT day || ':' || visitor) AS visitors FROM page_views
       WHERE day >= ? AND day <= ? AND source IS NOT NULL AND source != '' GROUP BY source ORDER BY visitors DESC LIMIT 6`,
      days
    ),
    topPages(db, p),
    db.get('SELECT COUNT(*) AS c FROM registrations WHERE date >= ? AND date < ?', range),
    db.all(
      `SELECT source, COUNT(*) AS c FROM registrations WHERE date >= ? AND date < ? AND source IS NOT NULL AND source != ''
       GROUP BY source ORDER BY c DESC LIMIT 5`,
      range
    ),
    db.get("SELECT COUNT(*) AS c FROM payments WHERE created_at >= ? AND created_at < ? AND status != 'unclaimed'", range),
    db.get(
      "SELECT COUNT(*) AS c FROM payments WHERE status = 'pending' AND created_at >= ? AND created_at < ? AND created_at < ?",
      [...range, new Date(Date.now() - 3600_000).toISOString()]
    ),
    db.get(
      "SELECT COUNT(*) AS c, COALESCE(SUM(amount), 0) AS revenue FROM payments WHERE status = 'completed' AND completed_at >= ? AND completed_at < ?",
      range
    ),
    db.get(
      "SELECT COUNT(*) AS c, COALESCE(SUM(amount), 0) AS amount FROM payments WHERE status = 'refunded' AND completed_at >= ? AND completed_at < ?",
      range
    ),
    db.all(
      `SELECT COALESCE(course_title, course_id) AS title, COUNT(*) AS c, COALESCE(SUM(amount), 0) AS revenue FROM payments
       WHERE status = 'completed' AND completed_at >= ? AND completed_at < ?
       GROUP BY COALESCE(course_title, course_id) ORDER BY revenue DESC LIMIT 5`,
      range
    ),
  ])
  return {
    visitors: num(views?.visitors),
    views: num(views?.views),
    sources: sources.map((r) => ({ source: r.source, visitors: num(r.visitors) })),
    pages,
    registrations: num(regs?.c),
    regSources: regSources.map((r) => ({ source: r.source, count: num(r.c) })),
    checkoutVisitors: funnel.checkoutVisitors,
    funnel,
    checkouts: num(started?.c),
    abandoned: num(abandoned?.c),
    purchases: num(paid?.c),
    revenue: num(paid?.revenue),
    refunds: num(refunds?.c),
    refunded: num(refunds?.amount),
    products: products.map((r) => ({ title: r.title, count: num(r.c), revenue: num(r.revenue) })),
  }
}

/** What is waiting on a person right now. */
export async function collectQueue(db = getDb()) {
  const count = async (sql) => num((await db.get(sql).catch(() => null))?.c)
  const [homework, reviews, applications, support, unclaimed] = await Promise.all([
    count("SELECT COUNT(*) AS c FROM homework WHERE status = 'pending'"),
    count("SELECT COUNT(*) AS c FROM reviews WHERE status = 'pending'"),
    count("SELECT COUNT(*) AS c FROM accelerator_applications WHERE status = 'new'"),
    count("SELECT COUNT(*) AS c FROM support_messages WHERE status = 'new'"),
    count("SELECT COUNT(*) AS c FROM payments WHERE status = 'unclaimed'"),
  ])
  return { homework, reviews, applications, support, unclaimed }
}

/* ------------------------------ formatting ------------------------------- */

function delta(now, before, { money = false } = {}) {
  if (before === undefined || before === null) return ''
  if (now === before) return ' (=)'
  if (!before) return now ? ' (🆕)' : ''
  const diff = now - before
  if (money) return ` (${diff > 0 ? '↑' : '↓'}${formatMoney(Math.abs(diff))})`
  const pct = Math.round((diff / before) * 100)
  if (Math.abs(before) < 10) return ` (${diff > 0 ? '+' : '−'}${Math.abs(diff)})`
  return ` (${pct > 0 ? '↑' : '↓'}${Math.abs(pct)}%)`
}

function percent(part, whole) {
  if (!whole) return '—'
  const value = (part / whole) * 100
  return `${value < 10 ? value.toFixed(1) : Math.round(value)}%`
}

export function periodTitle(p, label) {
  if (p.firstDay === p.lastDay) return `${label} · ${ruDay(p.lastDay)}`
  return `${label} · ${ruDay(p.firstDay, { weekday: false })} — ${ruDay(p.lastDay, { weekday: false })}`
}

export function formatQueue(q) {
  const items = [
    q.unclaimed ? `⚠️ продажи без аккаунта: <b>${q.unclaimed}</b>` : null,
    q.homework ? `ДЗ: <b>${q.homework}</b>` : null,
    q.reviews ? `отзывы: <b>${q.reviews}</b>` : null,
    q.applications ? `заявки: <b>${q.applications}</b>` : null,
    q.support ? `поддержка: <b>${q.support}</b>` : null,
  ].filter(Boolean)
  return items.length ? `📥 Ждут вас: ${items.join(' · ')}` : '📥 Очередь пуста ✨'
}

/**
 * The report itself. `prev` (the period before, same length) adds the change
 * next to each number; `queue` adds what is waiting.
 */
export function formatStats(title, s, { prev = null, queue = null } = {}) {
  const p = prev || {}
  const lines = [
    `📊 <b>${escapeHtml(title)}</b>`,
    '',
    `👀 Посетители: <b>${s.visitors}</b>${delta(s.visitors, p.visitors)} · просмотров ${s.views}`,
    `👤 Регистрации: <b>${s.registrations}</b>${delta(s.registrations, p.registrations)}`,
    `🧾 Открыли оформление: <b>${s.checkoutVisitors}</b>${delta(s.checkoutVisitors, p.checkoutVisitors)}`,
    `🛒 Начали оплату: <b>${s.checkouts}</b>${s.abandoned ? ` · не завершили ${s.abandoned}` : ''}`,
    `💰 Покупки: <b>${s.purchases}</b> · <b>${formatMoney(s.revenue)}</b>${delta(s.revenue, p.revenue, { money: true })}`,
    s.refunds ? `↩️ Возвраты: ${s.refunds} · ${formatMoney(s.refunded)}` : null,
    `📈 Конверсия: визит→регистрация ${percent(s.registrations, s.visitors)} · визит→покупка ${percent(s.purchases, s.visitors)}`,
  ]
  const funnelLines = s.funnel ? formatFunnel(s.funnel) : []
  if (funnelLines.length) lines.push('', ...funnelLines)
  if (s.products.length) {
    lines.push('', '🎓 <b>Продажи</b>')
    for (const item of s.products) {
      lines.push(`• ${escapeHtml(item.title)} — ${item.count} × · ${formatMoney(item.revenue)}`)
    }
  }
  if (s.sources.length) {
    lines.push('', `🌍 <b>Откуда пришли</b>: ${s.sources.map((r) => `${escapeHtml(r.source)} ${r.visitors}`).join(' · ')}`)
  }
  if (s.regSources.length) {
    lines.push(`📍 <b>Регистрации из</b>: ${s.regSources.map((r) => `${escapeHtml(r.source)} ${r.count}`).join(' · ')}`)
  }
  if (s.pages.length) {
    lines.push('', '🔝 <b>Страницы</b>')
    for (const page of s.pages) lines.push(`• ${escapeHtml(page.path)} — ${page.visitors}`)
  }
  if (queue) lines.push('', formatQueue(queue))
  return lines.filter((line) => line !== null).join('\n')
}

export async function recentSales(limit = 10, db = getDb()) {
  const rows = await db.all(
    `SELECT course_title, course_id, amount, currency, email, provider, completed_at FROM payments
     WHERE status = 'completed' AND completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT ?`,
    [limit]
  )
  if (!rows.length) return '🧾 Продаж пока нет.'
  const lines = rows.map((r) => {
    const when = zurichDay(new Date(r.completed_at))
    return `• ${ruDay(when, { weekday: false })} — ${escapeHtml(r.course_title || r.course_id)} · ${formatMoney(r.amount, r.currency)} · ${escapeHtml(r.email || '—')}`
  })
  return [`🧾 <b>Последние ${rows.length} ${plural(rows.length, 'продажа', 'продажи', 'продаж')}</b>`, '', ...lines].join('\n')
}
