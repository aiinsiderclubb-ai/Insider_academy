import nodemailer from 'nodemailer'
import { config, isEmailEnabled } from '../config.js'
import { normalizeLocale } from './emailCopy.js'
import { renderEmail } from './emailRender.js'

let transporter = null

function getTransporter() {
  if (!transporter) {
    if (isEmailEnabled()) {
      const secure = config.email.smtp.secure || config.email.smtp.port === 465
      transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure,
        auth: { user: config.email.smtp.user, pass: config.email.smtp.pass },
      })
    } else {
      transporter = nodemailer.createTransport({ jsonTransport: true })
    }
  }
  return transporter
}

export async function sendEmail({ to, subject, html, text, headers }) {
  try {
    const info = await getTransporter().sendMail({
      from: config.email.from,
      to,
      subject,
      html,
      text: text || html?.replace(/<[^>]+>/g, ''),
      headers: headers || undefined,
    })
    if (!isEmailEnabled()) {
      console.log('[email:dev]', { to, subject, preview: text || html?.slice(0, 120) })
    }
    return info
  } catch (err) {
    console.error('[email] send failed:', err.message, err.response || '')
    throw err
  }
}

export async function sendTemplateEmail(to, template, payload = {}) {
  const rendered = renderEmail(template, { ...payload, to, email: to })
  return sendEmail({
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    headers: rendered.headers,
  })
}

export async function sendVerificationEmail(email, token, options = {}) {
  const locale = normalizeLocale(options.locale)
  const link = `${String(config.appUrl).replace(/\/$/, '')}/${locale}/verify-email?token=${encodeURIComponent(token)}`
  return sendEmail({
    to: email,
    subject: 'AI Insider Academy',
    text: link,
    html: `<p><a href="${link}">${link}</a></p>`,
  })
}

export async function sendVerificationCodeEmail(email, code, name = '', returnTo = '/onboarding', locale = 'ru') {
  return sendTemplateEmail(email, 'verify_code', { code, name, returnTo, locale })
}

export async function sendPasswordResetEmail(email, token, options = {}) {
  return sendTemplateEmail(email, 'password_reset', {
    token,
    name: options.name,
    locale: options.locale,
  })
}

export async function sendHomeworkFeedbackEmail({ email, courseTitle, lessonTitle, status, comment, name, locale }) {
  return sendTemplateEmail(email, 'hw_reviewed', {
    courseTitle,
    lessonTitle,
    status,
    comment,
    name,
    locale,
  })
}

export async function notifyUserEmail(email, template, payload = {}) {
  const mail = String(email || '').trim().toLowerCase()
  if (!mail) return null
  try {
    const { getDb } = await import('../db.js')
    const user = await getDb().get('SELECT name, locale FROM users WHERE email = ?', [mail]).catch(() => null)
    return await sendTemplateEmail(mail, template, {
      ...payload,
      name: payload.name || user?.name || '',
      locale: payload.locale || user?.locale || 'ru',
    })
  } catch (err) {
    console.warn('[email] notify failed:', template, err.message)
    return null
  }
}
