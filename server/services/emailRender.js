import { config, isPrelaunchMode } from '../config.js'
import { copyFor, MARKETING_TEMPLATES, normalizeLocale } from './emailCopy.js'
import { emailLayout, escapeHtml, featureCard, otpBlock, primaryButton } from './emailTemplates.js'
import { unsubscribeUrl } from './emailUnsub.js'

const P = 'margin:0 0 14px;font:16px/1.6 system-ui,-apple-system,sans-serif;color:#423b34'
const META = 'margin:0 0 8px;font:14px/1.5 system-ui,-apple-system,sans-serif;color:#6a615a'

export function sitePath(locale, path) {
  const loc = normalizeLocale(locale)
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${String(config.appUrl || 'https://myinsideracademy.com').replace(/\/$/, '')}/${loc}${clean}`
}

function paragraph(text) {
  return `<p style="${P}">${escapeHtml(text)}</p>`
}

function kit({ title, kicker = '', preheader, bodyHtml, locale, to, footerNote, marketing }) {
  const copy = copyFor(locale)
  const unsub = marketing && to ? unsubscribeUrl(to) : ''
  return emailLayout({
    title,
    kicker,
    preheader,
    bodyHtml,
    footerNote: footerNote ?? copy.ignore,
    locale: normalizeLocale(locale),
    unsubscribeUrl: unsub,
    unsubscribeLabel: copy.unsubscribe,
    brand: copy.brand,
    siteUrl: String(config.appUrl || 'https://myinsideracademy.com').replace(/\/$/, ''),
  })
}

function textBlock(parts) {
  return parts.filter(Boolean).join('\n\n')
}

export function renderEmail(template, payload = {}) {
  const locale = normalizeLocale(payload.locale)
  const copy = copyFor(locale)
  const name = String(payload.name || '').trim()
  const to = String(payload.to || payload.email || '').trim().toLowerCase()
  const prelaunch = payload.prelaunch ?? isPrelaunchMode()
  const courseTitle = String(payload.courseTitle || payload.course || 'AI Insider Academy')
  const marketing = MARKETING_TEMPLATES.has(template)

  let subject = copy.brand
  let title = copy.brand
  let kicker = ''
  let preheader = ''
  let bodyHtml = ''
  let text = ''
  let href = sitePath(locale, '/app')
  let cta = copy.openSite

  if (template === 'verify_code') {
    const code = String(payload.code || '')
    const returnTo = payload.returnTo || '/onboarding'
    href = sitePath(locale, `/verify-email?email=${encodeURIComponent(to)}&returnTo=${encodeURIComponent(returnTo)}`)
    subject = copy.verify.subject(code)
    title = copy.verify.title
    kicker = 'Academy'
    preheader = copy.verify.lead
    cta = copy.verify.cta
    bodyHtml = `${paragraph(copy.greeting(name))}${paragraph(copy.verify.lead)}${otpBlock(code)}${primaryButton(href, cta)}`
    text = textBlock([copy.greeting(name), copy.verify.lead, code, href])
  } else if (template === 'password_reset') {
    href = sitePath(locale, `/reset-password?token=${encodeURIComponent(payload.token || '')}`)
    subject = copy.reset.subject
    title = copy.reset.title
    preheader = copy.reset.lead
    cta = copy.reset.cta
    bodyHtml = `${paragraph(copy.greeting(name))}${paragraph(copy.reset.lead)}${primaryButton(href, cta)}<p style="${META}">${escapeHtml(href)}</p>`
    text = textBlock([copy.greeting(name), copy.reset.lead, href])
  } else if (template === 'welcome_1') {
    href = sitePath(locale, '/app')
    subject = copy.welcome1.subject
    title = copy.welcome1.title
    kicker = 'Welcome'
    preheader = copy.welcome1.lead
    cta = copy.welcome1.cta
    bodyHtml = `${paragraph(copy.greeting(name))}${paragraph(copy.welcome1.lead)}${primaryButton(href, cta)}`
    text = textBlock([copy.greeting(name), copy.welcome1.lead, href])
  } else if (template === 'welcome_2') {
    href = sitePath(locale, '/learn/ai-start')
    subject = copy.welcome2.subject
    title = copy.welcome2.title
    preheader = copy.welcome2.lead
    cta = copy.welcome2.cta
    bodyHtml = `${paragraph(copy.greeting(name))}${paragraph(copy.welcome2.lead)}${primaryButton(href, cta)}`
    text = textBlock([copy.greeting(name), copy.welcome2.lead, href])
  } else if (template === 'welcome_3') {
    href = sitePath(locale, '/learn')
    subject = copy.welcome3.subject
    title = copy.welcome3.title
    preheader = prelaunch ? copy.welcome3.leadPrelaunch : copy.welcome3.leadLive
    cta = prelaunch ? copy.welcome3.ctaPrelaunch : copy.welcome3.ctaLive
    bodyHtml = `${paragraph(copy.greeting(name))}${paragraph(preheader)}${primaryButton(href, cta)}`
    text = textBlock([copy.greeting(name), preheader, href])
  } else if (template === 'hw_reviewed') {
    const status = payload.status === 'accepted' ? copy.homework.accepted : copy.homework.resubmit
    const lesson = String(payload.lessonTitle || '')
    const comment = String(payload.comment || '').trim()
    href = sitePath(locale, '/app')
    subject = copy.homework.subject(courseTitle)
    title = copy.homework.title
    preheader = `${courseTitle}: ${status}`
    cta = copy.homework.cta
    bodyHtml = `${paragraph(copy.greeting(name))}
      <p style="${META}">${escapeHtml(courseTitle)}${lesson ? ` · ${escapeHtml(lesson)}` : ''}</p>
      <p style="${P}"><strong>${escapeHtml(status)}</strong></p>
      ${comment ? `<p style="margin:16px 0;padding:14px 16px;background:#faf6f2;border:1px solid #e7e2dc;border-radius:12px;font:15px/1.5 system-ui,sans-serif;color:#14120f">${escapeHtml(comment)}</p>` : ''}
      ${primaryButton(href, cta)}`
    text = textBlock([copy.greeting(name), `${courseTitle} ${lesson}`, status, comment, href])
  } else if (template === 'inactive_3d' || template === 'inactive_7d' || template === 'inactive_14d') {
    const pack = template === 'inactive_3d'
      ? copy.inactive3
      : template === 'inactive_7d'
        ? copy.inactive7
        : copy.inactive14
    href = payload.lessonPath ? sitePath(locale, payload.lessonPath) : sitePath(locale, '/app')
    subject = pack.subject
    title = pack.title
    kicker = pack.kicker || ''
    preheader = pack.lead
    cta = pack.cta
    const card = payload.lessonTitle || payload.courseTitle
      ? featureCard(payload.courseTitle || pack.cta, payload.lessonTitle || '')
      : ''
    bodyHtml = `${paragraph(copy.greeting(name))}${paragraph(pack.lead)}${card}${primaryButton(href, cta)}`
    text = textBlock([copy.greeting(name), pack.lead, payload.courseTitle, payload.lessonTitle, href])
  } else if (template === 'access_granted') {
    const slug = payload.courseSlug || payload.courseId || ''
    href = slug ? sitePath(locale, `/learn/${slug}`) : sitePath(locale, '/app')
    subject = copy.access.subject(courseTitle)
    title = copy.access.title
    preheader = prelaunch ? copy.access.leadPrelaunch : copy.access.leadLive
    cta = copy.access.cta
    bodyHtml = `${paragraph(copy.greeting(name))}${paragraph(preheader)}${paragraph(copy.access.sameEmail)}<p style="${META}">${escapeHtml(courseTitle)}</p>${primaryButton(href, cta)}`
    text = textBlock([copy.greeting(name), preheader, copy.access.sameEmail, courseTitle, href])
  } else if (template === 'certificate_ready') {
    href = sitePath(locale, '/app')
    subject = copy.certificate.subject(courseTitle)
    title = copy.certificate.title
    preheader = copy.certificate.lead
    cta = copy.certificate.cta
    bodyHtml = `${paragraph(copy.greeting(name))}${paragraph(copy.certificate.lead)}<p style="${META}">${escapeHtml(courseTitle)}</p>${primaryButton(href, cta)}`
    text = textBlock([copy.greeting(name), copy.certificate.lead, courseTitle, href])
  } else if (template === 'test_email') {
    href = sitePath(locale, '/')
    subject = copy.test.subject
    title = copy.test.title
    preheader = copy.test.lead
    cta = copy.test.cta
    const when = payload.sentAt || new Date().toISOString()
    bodyHtml = `${paragraph(copy.test.lead)}<p style="${META}">${escapeHtml(when)}</p>${primaryButton(href, cta)}`
    text = textBlock([copy.test.lead, when, href])
  } else if (template === 'admin_digest') {
    href = sitePath(locale, '/studio')
    const lines = Array.isArray(payload.lines) ? payload.lines : []
    subject = copy.digest.subject(Number(payload.pendingHw || 0))
    title = copy.digest.title
    preheader = lines[0] || copy.digest.title
    cta = copy.digest.cta
    bodyHtml = `${lines.map((line) => paragraph(line)).join('')}${primaryButton(href, cta)}`
    text = textBlock([...lines, href])
  } else if (template === 'admin_message' || template === 'admin_news') {
    // Written by hand in the Studio: plain text, paragraphs split on blank lines.
    const paragraphs = String(payload.body || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    subject = String(payload.subject || copy.brand).slice(0, 200)
    title = subject
    preheader = paragraphs[0]?.slice(0, 140) || subject
    const greeting = name ? (locale === 'en' ? `Hi ${name},` : locale === 'ukr' ? `Вітаємо, ${name}!` : `Здравствуйте, ${name}!`) : ''
    const ctaUrl = String(payload.ctaUrl || '').trim()
    href = /^https?:\/\//.test(ctaUrl) ? ctaUrl : ctaUrl ? sitePath(locale, ctaUrl) : ''
    cta = String(payload.ctaLabel || '').trim() || copy.openSite
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
    href = sitePath(locale, '/learn')
    subject = locale === 'en' ? `Your personal code: ${discount} off` : locale === 'ukr' ? `Ваш персональний промокод: −${discount}` : `Ваш персональный промокод: −${discount}`
    title = locale === 'en' ? 'A code just for you' : locale === 'ukr' ? 'Промокод лише для вас' : 'Промокод только для вас'
    preheader = subject
    cta = locale === 'en' ? 'Choose a course' : locale === 'ukr' ? 'Обрати курс' : 'Выбрать курс'
    const note = payload.note ? paragraph(String(payload.note)) : ''
    const lead = locale === 'en'
      ? 'It works only in your account — enter it at checkout.'
      : locale === 'ukr' ? 'Він діє лише у вашому акаунті — введіть його під час оплати.' : 'Он работает только в вашем аккаунте — введите его при оплате.'
    const untilLine = until ? `<p style="${META}">${escapeHtml(locale === 'en' ? `Valid until ${until}` : `Действует до ${until}`)}</p>` : ''
    bodyHtml = `${note}${paragraph(lead)}${otpBlock(code)}${untilLine}${primaryButton(href, cta)}`
    text = textBlock([payload.note, lead, code, until, href])
  } else {
    throw new Error(`Unknown email template: ${template}`)
  }

  const html = kit({
    title,
    kicker,
    preheader,
    bodyHtml,
    locale,
    to,
    marketing,
  })

  const headers = marketing && to
    ? {
        'List-Unsubscribe': `<${unsubscribeUrl(to)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      }
    : undefined

  return { subject, html, text, headers, marketing, locale }
}
