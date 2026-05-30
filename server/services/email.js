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
