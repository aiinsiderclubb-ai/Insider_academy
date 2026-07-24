import nodemailer from 'nodemailer'
import { config, isEmailEnabled } from '../config.js'
import { emailLayout, primaryButton } from './emailTemplates.js'

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

export async function sendEmail({ to, subject, html, text }) {
  try {
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
  } catch (err) {
    console.error('[email] send failed:', err.message, err.response || '')
    throw err
  }
}

export async function sendVerificationEmail(email, token) {
  const link = `${config.appUrl}/verify-email?token=${token}`
  return sendEmail({
    to: email,
    subject: 'Подтвердите email — AI Insider Academy',
    html: emailLayout({
      title: 'Подтвердите email',
      bodyHtml: `<p>Нажмите кнопку, чтобы подтвердить адрес почты.</p>${primaryButton(link, 'Подтвердить email')}`,
    }),
    text: `Подтвердите email: ${link}`,
  })
}

export async function sendVerificationCodeEmail(email, code, name = '', returnTo = '/onboarding') {
  const greeting = name ? `Здравствуйте, ${name}!` : 'Здравствуйте!'
  const verifyUrl = `${config.appUrl.replace(/\/$/, '')}/verify-email?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`
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
  const link = `${config.appUrl.replace(/\/$/, '')}/reset-password?token=${token}`
  return sendEmail({
    to: email,
    subject: 'Сброс пароля — AI Insider Academy',
    html: emailLayout({
      title: 'Сброс пароля',
      bodyHtml: `
        <p>Вы запросили сброс пароля для аккаунта на <strong>AI Insider Academy</strong>.</p>
        <p style="color:#aaa;font-size:14px">Ссылка действует <strong>1 час</strong>.</p>
        ${primaryButton(link, 'Создать новый пароль')}
        <p style="font-size:12px;color:#888;word-break:break-all">${link}</p>
      `,
    }),
    text: `Сброс пароля (1 час): ${link}`,
  })
}

export async function sendHomeworkFeedbackEmail({ email, courseTitle, lessonTitle, status, comment }) {
  const statusRu = status === 'accepted' ? 'принято' : 'на доработку'
  const cabinet = `${config.appUrl.replace(/\/$/, '')}/cabinet`
  return sendEmail({
    to: email,
    subject: `Ответ по ДЗ: ${courseTitle}`,
    html: emailLayout({
      title: 'Проверка домашнего задания',
      bodyHtml: `
        <p>Курс: <strong>${courseTitle}</strong></p>
        <p>Урок: <strong>${lessonTitle}</strong></p>
        <p>Статус: <strong>${statusRu}</strong></p>
        ${comment ? `<p style="margin-top:12px;padding:12px;background:#1a1a24;border-radius:8px">${comment}</p>` : ''}
        ${primaryButton(cabinet, 'Открыть личный кабинет')}
      `,
      footerNote: 'Уведомление от AI Insider Academy.',
    }),
    text: `ДЗ «${lessonTitle}» (${courseTitle}): ${statusRu}. ${comment || ''} Кабинет: ${cabinet}`,
  })
}
