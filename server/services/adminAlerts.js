import { getDb } from '../db.js'
import { sendTelegramMessage } from './telegram.js'
import { zurichDayBounds } from './zurichTime.js'

/*
 * Messages for the people who run the academy, not for learners.
 *
 * They go to the chat(s) named in TELEGRAM_ADMIN_CHAT_ID (a comma-separated
 * list, so a group and a personal chat can both receive them) through the
 * same bot that talks to learners. Nothing here may break the thing it reports
 * on: every send is best-effort, never throws, and a missing chat id simply
 * turns the feature off.
 */

export function adminChatIds() {
  return String(process.env.TELEGRAM_ADMIN_CHAT_ID || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

export function isAdminChat(chatId) {
  return adminChatIds().includes(String(chatId))
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function formatMoney(amount, currency = 'EUR') {
  const value = Number(amount) || 0
  const sign = String(currency || 'EUR').toUpperCase() === 'EUR' ? '€' : `${String(currency).toUpperCase()} `
  return `${sign}${value.toFixed(value % 1 ? 2 : 0)}`
}

/**
 * True the first time a key is seen. Webhooks are retried and some events can
 * be reported from more than one place; the alert should arrive once.
 */
async function claimOnce(key) {
  try {
    const result = await getDb().run(
      "INSERT INTO admin_seen (type, item_key) VALUES ('tg_alert', ?) ON CONFLICT DO NOTHING",
      [String(key).slice(0, 200)]
    )
    return Number(result?.changes ?? result?.rowCount ?? 0) > 0
  } catch (err) {
    console.warn('[adminAlerts] dedupe:', err.message)
    return true
  }
}

/** Sends `text` (Telegram HTML) to every admin chat. Never throws. */
export async function notifyAdmin(text, { once } = {}) {
  const chats = adminChatIds()
  if (!chats.length || !text) return false
  try {
    if (once && !(await claimOnce(once))) return false
    const results = await Promise.all(chats.map((chatId) =>
      sendTelegramMessage(chatId, text, { disable_web_page_preview: true }).catch(() => false)
    ))
    return results.some(Boolean)
  } catch (err) {
    console.warn('[adminAlerts]', err.message)
    return false
  }
}

/* ------------------------------- events ---------------------------------- */

const PLAN_LABEL = { self: 'самостоятельно', mentor: 'с ментором' }
const PROVIDER_LABEL = { gumroad: 'Gumroad', paddle: 'Paddle', stripe: 'Stripe', liqpay: 'LiqPay', tribute: 'Tribute' }

async function todaysSales(db) {
  const { from, to } = zurichDayBounds()
  return db.get(
    `SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS revenue FROM payments
     WHERE status = 'completed' AND completed_at >= ? AND completed_at < ?`,
    [from, to]
  )
}

/** Money arrived and access was granted — called once per payment. */
export async function alertPurchase(payment, { marketplace = false, promoCode = null, licenseTier = null } = {}) {
  if (!payment || !adminChatIds().length) return false
  try {
    const db = getDb()
    const earlier = payment.user_id
      ? await db.get(
        "SELECT COUNT(*) AS c FROM payments WHERE user_id = ? AND status = 'completed' AND id != ?",
        [payment.user_id, payment.id]
      )
      : null
    const user = payment.user_id
      ? await db.get('SELECT personal_id, created_at FROM users WHERE id = ?', [payment.user_id])
      : null
    const reg = payment.email
      ? await db.get('SELECT source FROM registrations WHERE lower(email) = lower(?) ORDER BY date LIMIT 1', [payment.email])
      : null
    const today = await todaysSales(db)

    const repeat = Number(earlier?.c || 0)
    const details = [
      payment.plan ? `Тариф: ${PLAN_LABEL[payment.plan] || escapeHtml(payment.plan)}` : null,
      marketplace && licenseTier ? `Лицензия: ${escapeHtml(licenseTier)}` : null,
      promoCode ? `Промокод: <code>${escapeHtml(promoCode)}</code>` : null,
      `Оплата: ${PROVIDER_LABEL[payment.provider] || escapeHtml(payment.provider)}`,
    ].filter(Boolean)
    const buyer = [
      `👤 ${escapeHtml(payment.email || 'без email')}${user?.personal_id ? ` · <code>${escapeHtml(user.personal_id)}</code>` : ''}`,
      repeat ? `🔁 Повторный покупатель (${repeat + 1}-я покупка)` : '🆕 Первая покупка',
      reg?.source ? `📍 Пришёл из: ${escapeHtml(reg.source)}` : null,
    ].filter(Boolean)

    const text = [
      `💰 <b>Покупка · ${formatMoney(payment.amount, payment.currency)}</b>`,
      `${marketplace ? '🛍' : '🎓'} ${escapeHtml(payment.course_title || payment.course_id)}`,
      details.join(' · '),
      '',
      ...buyer,
      '',
      `Сегодня: ${Number(today?.count || 0)} ${plural(Number(today?.count || 0), 'покупка', 'покупки', 'покупок')} · ${formatMoney(today?.revenue)}`,
    ].join('\n')
    return notifyAdmin(text, { once: `purchase:${payment.id}` })
  } catch (err) {
    console.warn('[adminAlerts] purchase:', err.message)
    return false
  }
}

export function alertRegistration({ email, name, provider = 'email', source = null, locale = null }) {
  const how = provider === 'email' ? 'email' : provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : provider
  const text = [
    `👤 <b>Новая регистрация</b>`,
    `${escapeHtml(name && name !== email ? `${name} · ` : '')}${escapeHtml(email)}`,
    [`Через ${escapeHtml(how)}`, locale ? `язык ${escapeHtml(locale)}` : null, source ? `из ${escapeHtml(source)}` : null]
      .filter(Boolean).join(' · '),
    provider === 'email' ? '<i>Email ещё не подтверждён</i>' : null,
  ].filter((line) => line !== null).join('\n')
  return notifyAdmin(text, { once: `register:${String(email).toLowerCase()}` })
}

/** A sale the shop made that no account could be matched to — access waits on a human. */
export function alertUnclaimedSale({ provider, saleId, email, item, reason }) {
  const why = reason === 'unknown_item'
    ? 'Товар не найден в каталоге сайта.'
    : 'Аккаунта с этим email нет — выдайте доступ вручную в Studio, когда покупатель зарегистрируется.'
  const text = [
    `⚠️ <b>Продажа без аккаунта</b> · ${PROVIDER_LABEL[provider] || escapeHtml(provider)}`,
    `Товар: ${escapeHtml(item || '—')}`,
    `Email: ${escapeHtml(email || '—')}`,
    `Sale: <code>${escapeHtml(saleId)}</code>`,
    '',
    why,
  ].join('\n')
  return notifyAdmin(text, { once: `unclaimed:${provider}:${saleId}` })
}

export function alertRefund(payment, reason) {
  if (!payment) return Promise.resolve(false)
  const dispute = /dispute|chargeback/i.test(String(reason))
  const text = [
    `${dispute ? '🚨 <b>Спор по оплате</b>' : '↩️ <b>Возврат</b>'} · ${formatMoney(payment.amount, payment.currency)}`,
    escapeHtml(payment.course_title || payment.course_id),
    `👤 ${escapeHtml(payment.email || '—')}`,
    `Причина: ${escapeHtml(reason)} · доступ закрыт`,
  ].join('\n')
  return notifyAdmin(text, { once: `refund:${payment.id}` })
}

/**
 * A payment provider's webhook failed. One alert per provider and problem an
 * hour (a day for bad signatures): a wrong secret fails every delivery, and
 * one message says it.
 */
export function alertWebhookProblem(provider, problem, detail = '') {
  // A bad signature can also be a stranger poking the endpoint: once a day is
  // enough to notice a wrong secret without being paged by scanners.
  const period = new Date().toISOString().slice(0, problem === 'auth_failed' ? 10 : 13)
  const text = [
    `🔴 <b>Сбой вебхука ${PROVIDER_LABEL[provider] || escapeHtml(provider)}</b>`,
    problem === 'auth_failed'
      ? 'Подпись не сошлась — проверьте секрет вебхука на Render. Оплаты сейчас не доходят до сайта.'
      : `Ошибка обработки: ${escapeHtml(String(detail).slice(0, 300))}`,
  ].join('\n')
  return notifyAdmin(text, { once: `webhook:${provider}:${problem}:${period}` })
}

export function alertApplication({ id, firstName, lastName, email, telegram, country }) {
  const text = [
    '📝 <b>Новая заявка в акселератор</b>',
    `${escapeHtml(`${firstName} ${lastName}`)} · ${escapeHtml(country)}`,
    `${escapeHtml(email)} · ${escapeHtml(telegram)}`,
  ].join('\n')
  return notifyAdmin(text, { once: `application:${id}` })
}

export function alertHomework({ id, email, courseTitle, lessonTitle, resubmit }) {
  const text = [
    `📚 <b>${resubmit ? 'ДЗ пересдано' : 'Новое ДЗ на проверку'}</b>`,
    `${escapeHtml(courseTitle)} — ${escapeHtml(lessonTitle)}`,
    `👤 ${escapeHtml(email)}`,
  ].join('\n')
  return notifyAdmin(text, { once: `homework:${id}:${resubmit ? Date.now() : 'new'}` })
}

export function alertReview({ id, email, courseId, rating, text: body }) {
  const text = [
    `⭐ <b>Отзыв на модерации</b> · ${'★'.repeat(Number(rating) || 0)}${'☆'.repeat(5 - (Number(rating) || 0))}`,
    `Курс: ${escapeHtml(courseId)} · ${escapeHtml(email)}`,
    `«${escapeHtml(String(body || '').slice(0, 300))}»`,
  ].join('\n')
  return notifyAdmin(text, { once: `review:${id}` })
}

export function plural(n, one, few, many) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}
