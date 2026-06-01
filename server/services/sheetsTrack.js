import { appendSheetRow, appendAudit } from './googleSheets.js'

export async function trackUserRegistered({ personalId, userId, email, name }) {
  const now = new Date().toISOString()
  await appendSheetRow('users', [now, personalId, userId, email, name, 'нет', '', '', 'регистрация', 'новый аккаунт'])
  await appendSheetRow('registrations', [now, personalId, email, name, 'регистрация'])
  await appendAudit('register', email, personalId, `Регистрация: ${name}`)
}

export async function trackLogin({ email, personalId, userId }) {
  const now = new Date().toISOString()
  await appendSheetRow('logins', [now, email, personalId || '', userId || '', 'вход', ''])
  await appendAudit('login', email, personalId, 'Вход в аккаунт')
}

export async function trackPurchase({ email, personalId, courseId, courseTitle, amount, source = 'site' }) {
  const now = new Date().toISOString()
  await appendSheetRow('purchases', [now, email, personalId || '', courseId, courseTitle, amount ?? '', source, 'покупка'])
  await appendAudit('purchase', email, personalId, `Покупка: ${courseTitle}`, { courseId, amount })
}

export async function trackHomeworkEvent({
  email, personalId, courseTitle, lessonIndex, lessonTitle, status, score, adminComment, action, recordId,
}) {
  const now = new Date().toISOString()
  await appendSheetRow('homework', [
    now, email, personalId || '', courseTitle, lessonIndex, lessonTitle,
    status || '', score ?? '', adminComment || '', action, recordId || '',
  ])
  await appendAudit('homework', email, personalId, `${action}: ${courseTitle} / ${lessonTitle}`, { status })
}

export async function trackReviewEvent({
  email, personalId, courseId, rating, status, text, action, reviewId,
}) {
  const now = new Date().toISOString()
  await appendSheetRow('reviews', [
    now, email, personalId || '', courseId, rating, status, (text || '').slice(0, 500), action, reviewId || '',
  ])
  await appendAudit('review', email, personalId, `${action}: курс ${courseId}`, { status, rating })
}

export async function trackCertificate({ email, personalId, courseId, courseTitle, score, action = 'выдан' }) {
  const now = new Date().toISOString()
  await appendSheetRow('certificates', [now, email, personalId || '', courseId, courseTitle, score ?? '', action, ''])
  await appendAudit('certificate', email, personalId, `Сертификат: ${courseTitle}`)
}

export async function trackApplication({ email, firstName, lastName, telegram, status, adminNote, action, applicationId, accessGranted }) {
  const now = new Date().toISOString()
  await appendSheetRow('applications', [
    now, email, firstName, lastName, telegram, status, adminNote || '', accessGranted ? 'да' : 'нет', action, applicationId || '',
  ])
  await appendAudit('application', email, '', `${action}: ${firstName} ${lastName}`, { status, accessGranted })
}

export async function trackReferral({ referrerEmail, referredEmail, purchased, action = 'реферал' }) {
  const now = new Date().toISOString()
  await appendSheetRow('referrals', [now, referrerEmail, referredEmail, purchased ? 'да' : 'нет', action])
  await appendAudit('referral', referrerEmail, '', `Приглашён: ${referredEmail}`)
}

export async function trackPasswordChange({ email, personalId, action = 'смена пароля' }) {
  const now = new Date().toISOString()
  await appendSheetRow('users', [now, personalId || '', '', email, '', '', now, '', action, ''])
  await appendAudit('password', email, personalId, action)
}

export async function trackUserDeleted({ email, personalId, name, userId }) {
  const now = new Date().toISOString()
  await appendSheetRow('users', [
    now, personalId || '', userId || '', email || '', name || '', '', '', '', 'удаление аккаунта', 'admin',
  ])
  await appendAudit('user_delete', email, personalId, `Удалён аккаунт: ${email}`, { userId })
}
