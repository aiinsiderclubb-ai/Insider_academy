import { config } from '../config.js'
import { copyFor, normalizeLocale } from './emailCopy.js'
import { renderEmail, sitePath } from './emailRender.js'
import { COLORS, emailLayout, escapeHtml, featureCard, primaryButton } from './emailTemplates.js'

/**
 * The two emails around a purchase: the thank-you with the review offer, and
 * the promo code that the review earns.
 *
 * They live in their own module rather than as two more branches of
 * `renderEmail` because the production service rewrites `emailRender.js` and
 * `emailTemplates.js` at build time from environment variables (see the build
 * command in the Render dashboard). Anything added to those two files is
 * silently dropped on deploy. Everything here uses only what both the
 * repository's and the overlaid versions of those files export.
 */

const P = `margin:0 0 14px;font:16px/1.6 system-ui,-apple-system,sans-serif;color:${COLORS.body}`
const META = `margin:0 0 8px;font:14px/1.5 system-ui,-apple-system,sans-serif;color:${COLORS.muted}`

const paragraph = (text) => `<p style="${P}">${escapeHtml(text)}</p>`
const meta = (text) => `<p style="${META}">${escapeHtml(text)}</p>`
const textBlock = (parts) => parts.filter(Boolean).join('\n\n')

/** One bordered card with its own button, so the receipt above it still reads as a receipt. */
function offerCard({ kicker, title, text, note, href, cta }) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 8px">
      <tr>
        <td style="background:${COLORS.violetSoft};border:1px solid ${COLORS.line};border-radius:18px;padding:22px 22px 24px">
          <p style="margin:0 0 10px;font:700 11px/1 system-ui,sans-serif;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.orange}">${escapeHtml(kicker)}</p>
          <p style="margin:0 0 8px;font:800 19px/1.3 system-ui,-apple-system,sans-serif;color:${COLORS.ink}">${escapeHtml(title)}</p>
          <p style="margin:0 0 6px;font:15px/1.6 system-ui,-apple-system,sans-serif;color:${COLORS.body}">${escapeHtml(text)}</p>
          <p style="margin:0;font:13px/1.5 system-ui,sans-serif;color:${COLORS.muted}">${escapeHtml(note)}</p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:18px 0 0">
            <tr>
              <td align="left" bgcolor="${COLORS.ink}" style="border-radius:999px;background:${COLORS.ink}">
                <a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 24px;border-radius:999px;font:700 14px/1 system-ui,-apple-system,sans-serif;text-decoration:none;color:#ffffff">${escapeHtml(cta)}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

/** A promo code set large enough to copy by eye. Letters and digits, so no wide spacing. */
function promoBlock(code, label) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0">
      <tr>
        <td align="center" style="background:${COLORS.codeBg};border:1px dashed ${COLORS.orange};border-radius:18px;padding:24px 16px">
          <p style="margin:0 0 10px;font:700 11px/1 system-ui,sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.muted}">${escapeHtml(label)}</p>
          <p style="margin:0;font:800 28px/1.1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:3px;color:${COLORS.ink}">${escapeHtml(code)}</p>
        </td>
      </tr>
    </table>
  `
}

const OWN_TEMPLATES = new Set(['purchase_thanks', 'review_reward'])

function renderPurchaseEmail(template, payload = {}) {
  const locale = normalizeLocale(payload.locale)
  const copy = copyFor(locale)
  const name = String(payload.name || '').trim()
  let subject
  let title
  let preheader
  let bodyHtml
  let text

  if (template === 'purchase_thanks') {
    const item = String(payload.itemTitle || payload.courseTitle || copy.brand)
    const slug = String(payload.itemSlug || payload.itemId || '')
    const isProduct = payload.itemKind === 'product'
    const href = slug ? sitePath(locale, isProduct ? `/store/${slug}` : `/learn/${slug}`) : sitePath(locale, '/app')
    const reviewHref = sitePath(locale, `/review?item=${encodeURIComponent(payload.itemId || slug)}`)
    subject = copy.purchase.subject(item)
    title = copy.purchase.title
    preheader = copy.purchase.offer
    bodyHtml = `${paragraph(copy.greeting(name))}${paragraph(copy.purchase.lead)}${featureCard(item, copy.purchase.sameEmail)}${primaryButton(href, copy.purchase.cta)}${offerCard({
      kicker: copy.purchase.offerKicker,
      title: copy.purchase.offerTitle,
      text: copy.purchase.offer,
      note: copy.purchase.offerHonest,
      href: reviewHref,
      cta: copy.purchase.offerCta,
    })}`
    text = textBlock([
      copy.greeting(name),
      copy.purchase.lead,
      item,
      href,
      `${copy.purchase.offerKicker}. ${copy.purchase.offer} ${copy.purchase.offerHonest}`,
      reviewHref,
    ])
  } else {
    const code = String(payload.code || '')
    const until = payload.validUntil ? new Date(payload.validUntil) : null
    const dateLocale = locale === 'en' ? 'en-GB' : locale === 'ukr' ? 'uk-UA' : 'ru-RU'
    const untilText = until && !Number.isNaN(until.getTime())
      ? copy.reviewReward.until(until.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' }))
      : ''
    const href = sitePath(locale, '/learn')
    subject = copy.reviewReward.subject
    title = copy.reviewReward.title
    preheader = copy.reviewReward.lead
    bodyHtml = `${paragraph(copy.greeting(name))}${paragraph(copy.reviewReward.lead)}${promoBlock(code, copy.reviewReward.codeLabel)}${untilText ? meta(untilText) : ''}${meta(copy.reviewReward.how)}${primaryButton(href, copy.reviewReward.cta)}`
    text = textBlock([copy.greeting(name), copy.reviewReward.lead, code, untilText, copy.reviewReward.how, href])
  }

  const html = emailLayout({
    title,
    kicker: '',
    preheader,
    bodyHtml,
    // "Ignore this if you did not ask for it" suits a login code, not a receipt.
    footerNote: copy.purchase.footer,
    locale,
    unsubscribeUrl: '',
    unsubscribeLabel: copy.unsubscribe,
    brand: copy.brand,
    siteUrl: String(config.appUrl || 'https://myinsideracademy.com').replace(/\/$/, ''),
  })
  return { subject, html, text, headers: undefined, marketing: false, locale }
}

/** Renders any template: the two that live here, or everything `renderEmail` knows. */
export function renderTemplate(template, payload = {}) {
  return OWN_TEMPLATES.has(template) ? renderPurchaseEmail(template, payload) : renderEmail(template, payload)
}
