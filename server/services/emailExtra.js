import { config } from '../config.js'
import { copyFor, MARKETING_TEMPLATES, normalizeLocale } from './emailCopy.js'
import { sitePath } from './emailRender.js'
import { COLORS, emailLayout, escapeHtml, primaryButton } from './emailTemplates.js'
import { unsubscribeUrl } from './emailUnsub.js'

/**
 * Letters added after launch: the approval letter, the TODAYFREE gift, letters
 * written in the Studio and a personal promo code.
 *
 * Like emailPurchase.js they live outside `emailRender.js` and
 * `emailTemplates.js`, which the production build rewrites from environment
 * variables — anything added to those two files never reaches the server
 * ("Unknown email template"). Only what both versions export is used here.
 */

export const EXTRA_TEMPLATES = new Set(['application_accepted', 'todayfree_offer', 'admin_message', 'admin_news', 'personal_promo'])

const P = `margin:0 0 14px;font:16px/1.6 system-ui,-apple-system,sans-serif;color:${COLORS.body}`
const META = `margin:0 0 8px;font:14px/1.5 system-ui,-apple-system,sans-serif;color:${COLORS.muted}`
const paragraph = (text) => `<p style="${P}">${escapeHtml(text)}</p>`
const meta = (text) => `<p style="${META}">${escapeHtml(text)}</p>`
const textBlock = (parts) => parts.filter(Boolean).join('\n\n')

function codeBlock(code, label) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0">
      <tr>
        <td align="center" style="background:${COLORS.codeBg || '#fff7ef'};border:1px dashed ${COLORS.orange};border-radius:18px;padding:24px 16px">
          ${label ? `<p style="margin:0 0 10px;font:700 11px/1 system-ui,sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.muted}">${escapeHtml(label)}</p>` : ''}
          <p style="margin:0;font:800 28px/1.1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:3px;color:${COLORS.ink}">${escapeHtml(code)}</p>
        </td>
      </tr>
    </table>
  `
}

const pick = (locale, ru, en, ukr) => (locale === 'en' ? en : locale === 'ukr' ? (ukr ?? ru) : ru)

export function renderExtraEmail(template, payload = {}) {
  const locale = normalizeLocale(payload.locale)
  const copy = copyFor(locale)
  const name = String(payload.name || '').trim()
  const to = String(payload.to || payload.email || '').trim().toLowerCase()
  const marketing = MARKETING_TEMPLATES.has(template)
  const greeting = name ? pick(locale, `Здравствуйте, ${name}!`, `Hi ${name},`, `Вітаємо, ${name}!`) : ''
  let subject, title, preheader, bodyHtml, text

  if (template === 'application_accepted') {
    const href = sitePath(locale, '/app/learning')
    const cta = pick(locale, 'Начать обучение', 'Start learning', 'Почати навчання')
    subject = pick(locale, 'Ваша заявка одобрена — можно учиться', 'Your application is approved — you can start learning', 'Вашу заявку схвалено — можна вчитися')
    title = pick(locale, 'Вы приняты', 'You are in', 'Вас прийнято')
    preheader = subject
    const lines = [
      pick(locale, 'Ваша заявка в AI Insider Academy одобрена.', 'Your application to AI Insider Academy has been approved.', 'Вашу заявку до AI Insider Academy схвалено.'),
      pick(
        locale,
        'Программа «Найди своё в AI» уже открыта в вашем кабинете — войдите с этой почтой и начните с первого урока.',
        '«Find Your Path in AI» is already open in your account — sign in with this email and start with the first lesson.',
        'Програма «Знайди своє в AI» вже відкрита у вашому кабінеті — увійдіть з цією поштою і почніть з першого уроку.',
      ),
    ]
    bodyHtml = `${greeting ? paragraph(greeting) : ''}${lines.map(paragraph).join('')}${primaryButton(href, cta)}`
    text = textBlock([greeting, ...lines, href])
  } else if (template === 'todayfree_offer') {
    const href = sitePath(locale, '/learn')
    const code = String(payload.code || 'TODAYFREE')
    subject = pick(locale, 'Первый платный курс — бесплатно, 24 часа', 'Your first paid course is on us — 24 hours', 'Перший платний курс — безкоштовно, 24 години')
    title = pick(locale, 'Подарок за поступление', 'A gift for getting in', 'Подарунок за вступ')
    preheader = subject
    const lead = pick(
      locale,
      'Выберите любой платный курс и введите этот промокод при оформлении — курс ваш бесплатно.',
      'Pick any paid course and enter this code at checkout — the course is yours for free.',
      'Оберіть будь-який платний курс і введіть цей промокод під час оформлення — курс ваш безкоштовно.',
    )
    const how = pick(
      locale,
      'Войдите в кабинет, откройте курс, выберите тариф и примените код: кнопка сменится на «Начать бесплатно». Код действует 24 часа и на один курс.',
      'Sign in, open the course, choose the plan and apply the code: the button turns into “Start for free”. The code works for 24 hours and for one course.',
      'Увійдіть у кабінет, відкрийте курс, оберіть тариф і застосуйте код: кнопка зміниться на «Почати безкоштовно». Код діє 24 години і на один курс.',
    )
    bodyHtml = `${greeting ? paragraph(greeting) : ''}${paragraph(lead)}${codeBlock(code, pick(locale, 'Ваш промокод', 'Your code', 'Ваш промокод'))}${paragraph(how)}${primaryButton(href, pick(locale, 'Выбрать курс', 'Choose a course', 'Обрати курс'))}`
    text = textBlock([greeting, lead, code, how, href])
  } else if (template === 'admin_message' || template === 'admin_news') {
    const paragraphs = String(payload.body || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    subject = String(payload.subject || copy.brand).slice(0, 200)
    title = subject
    preheader = paragraphs[0]?.slice(0, 140) || subject
    const ctaUrl = String(payload.ctaUrl || '').trim()
    const href = /^https?:\/\//.test(ctaUrl) ? ctaUrl : ctaUrl ? sitePath(locale, ctaUrl) : ''
    const cta = String(payload.ctaLabel || '').trim() || copy.openSite
    bodyHtml = [
      greeting ? paragraph(greeting) : '',
      ...paragraphs.map((p) => `<p style="${P};white-space:pre-line">${escapeHtml(p)}</p>`),
      href ? primaryButton(href, cta) : '',
    ].join('')
    text = textBlock([greeting, ...paragraphs, href])
  } else if (template === 'personal_promo') {
    const code = String(payload.code || '')
    const discount = String(payload.discount || '')
    const until = payload.validUntil ? new Date(payload.validUntil).toLocaleDateString(locale === 'en' ? 'en-GB' : 'ru-RU') : ''
    const href = sitePath(locale, '/learn')
    subject = pick(locale, `Ваш персональный промокод: −${discount}`, `Your personal code: ${discount} off`, `Ваш персональний промокод: −${discount}`)
    title = pick(locale, 'Промокод только для вас', 'A code just for you', 'Промокод лише для вас')
    preheader = subject
    const lead = pick(locale, 'Он работает только в вашем аккаунте — введите его при оплате.', 'It works only in your account — enter it at checkout.', 'Він діє лише у вашому акаунті — введіть його під час оплати.')
    const untilLine = until ? pick(locale, `Действует до ${until}`, `Valid until ${until}`, `Діє до ${until}`) : ''
    bodyHtml = `${payload.note ? paragraph(String(payload.note)) : ''}${paragraph(lead)}${codeBlock(code)}${untilLine ? meta(untilLine) : ''}${primaryButton(href, pick(locale, 'Выбрать курс', 'Choose a course', 'Обрати курс'))}`
    text = textBlock([payload.note, lead, code, untilLine, href])
  } else {
    throw new Error(`Unknown email template: ${template}`)
  }

  const unsub = marketing && to ? unsubscribeUrl(to) : ''
  const html = emailLayout({
    title,
    kicker: '',
    preheader,
    bodyHtml,
    footerNote: marketing ? copy.ignore : '',
    locale,
    unsubscribeUrl: unsub,
    unsubscribeLabel: copy.unsubscribe,
    brand: copy.brand,
    siteUrl: String(config.appUrl || 'https://myinsideracademy.com').replace(/\/$/, ''),
  })
  const headers = unsub ? { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } : undefined
  return { subject, html, text, headers, marketing, locale }
}
