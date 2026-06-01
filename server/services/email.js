import nodemailer from 'nodemailer'
import { config, isEmailEnabled } from '../config.js'

let transporter = null

function getTransporter() {
  if (!transporter) {
    if (isEmailEnabled()) {
      transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.port === 465,
        auth: { user: config.email.smtp.user, pass: config.email.smtp.pass },
      })
    } else {
      transporter = nodemailer.createTransport({ jsonTransport: true })
    }
  }
  return transporter
}

export async function sendEmail({ to, subject, html, text }) {
  const info = await getTransporter().sendMail({
    from: config.email.from,
    to,
    subject,
    html,
    text: text || html?.replace(/<[^>]+>/g, ''),
  })
  if (!isEmailEnabled()) {
    console.log('[email:dev]', { to, subject, preview: text || html?.slice(0, 120) })
  }
  return info
}

export async function sendVerificationEmail(email, token) {
  const link = `${config.appUrl}/verify-email?token=${token}`
  return sendEmail({
    to: email,
    subject: 'Подтвердите email — AI Insider Academy',
    html: `<p>Здравствуйте!</p><p>Подтвердите email: <a href="${link}">${link}</a></p>`,
    text: `Подтвердите email: ${link}`,
  })
}

export async function sendVerificationCodeEmail(email, code, name = '') {
  const greeting = name ? `Здравствуйте, ${name}!` : 'Здравствуйте!'
  const verifyUrl = `${config.appUrl.replace(/\/$/, '')}/verify-email?email=${encodeURIComponent(email)}`
  return sendEmail({
    to: email,
    subject: `${code} — код подтверждения AI Insider Academy`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
        <p>${greeting}</p>
        <p>Спасибо за регистрацию в <strong>AI Insider Academy</strong>.</p>
        <p>Ваш код подтверждения email:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0;color:#7c3aed">${code}</p>
        <p style="color:#666;font-size:14px">Код действует <strong>15 минут</strong>.</p>
        <p style="margin-top:24px"><a href="${verifyUrl}" style="color:#7c3aed">Ввести код на сайте</a></p>
        <p style="color:#999;font-size:12px;margin-top:32px">Если вы не регистрировались — просто проигнорируйте это письмо.</p>
      </div>
    `,
    text: `${greeting}\n\nКод подтверждения AI Insider Academy: ${code}\nДействует 15 минут.\n\nВвести на сайте: ${verifyUrl}`,
  })
}

export async function sendPasswordResetEmail(email, token) {
  const link = `${config.appUrl}/reset-password?token=${token}`
  return sendEmail({
    to: email,
    subject: 'Сброс пароля — AI Insider Academy',
    html: `<p>Ссылка для сброса пароля (действует 1 час): <a href="${link}">${link}</a></p>`,
    text: `Сброс пароля: ${link}`,
  })
}

export async function sendHomeworkFeedbackEmail({ email, courseTitle, lessonTitle, status, comment }) {
  const statusRu = status === 'accepted' ? 'принято' : 'на доработку'
  return sendEmail({
    to: email,
    subject: `Ответ по ДЗ: ${courseTitle}`,
    html: `<p>Урок: <strong>${lessonTitle}</strong></p><p>Статус: ${statusRu}</p>${comment ? `<p>Комментарий: ${comment}</p>` : ''}`,
  })
}
