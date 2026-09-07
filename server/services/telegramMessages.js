const ICONS = {
  homework_accepted: '🎉',
  homework_resubmit: '📝',
  promo_new: '🎁',
  course_news: '📚',
  review_approved: '⭐',
  review_rejected: '💬',
  purchase: '💳',
  lesson_reminder: '🔔',
  application_accepted: '🎓',
  application_reviewed: '👀',
  application_rejected: '😔',
  custom: '📣',
}

const SEP = '━━━━━━━━━━━━━━━━'

export function formatNotification(type, data = {}, appUrl) {
  const base = appUrl || 'https://myinsideracademy.com'

  switch (type) {
    case 'homework_accepted':
      return formatHomeworkAccepted(data, base)
    case 'homework_resubmit':
      return formatHomeworkResubmit(data, base)
    case 'promo_new':
      return formatPromo(data, base)
    case 'course_news':
      return formatCourseNews(data, base)
    case 'review_approved':
      return formatReviewApproved(data, base)
    case 'review_rejected':
      return formatReviewRejected(data, base)
    case 'purchase':
      return formatPurchase(data, base)
    case 'lesson_reminder':
      return formatLessonReminder(data, base)
    case 'application_accepted':
      return formatApplicationAccepted(data, base)
    case 'application_reviewed':
      return formatApplicationReviewed(data, base)
    case 'application_rejected':
      return formatApplicationRejected(data, base)
    default:
      return `${ICONS.custom} <b>${esc(data.title || 'Уведомление')}</b>\n\n${esc(data.text || data.message || '')}`
  }
}

export function getInlineKeyboard(type, data = {}, appUrl) {
  const base = (appUrl || 'https://myinsideracademy.com').replace(/\/$/, '')
  const rows = []

  if (type === 'homework_accepted') {
    const path = data.nextTargetPath || data.targetPath || '/cabinet'
    rows.push([{ text: '▶️ Продолжить обучение', url: link(base, path) }])
  }

  if (type === 'homework_resubmit') {
    rows.push([{ text: '📝 Перейти к уроку', url: link(base, data.targetPath || '/cabinet') }])
  }

  if (type === 'application_accepted') {
    rows.push([{ text: '🚀 Открыть курс', url: link(base, data.targetPath || '/courses/ai-insider-accelerator') }])
    rows.push([
      { text: '📝 Регистрация', url: data.registerUrl || link(base, '/register') },
      { text: '🔑 Вход', url: data.loginUrl || link(base, '/login') },
    ])
    return { inline_keyboard: rows }
  }

  if (type === 'application_reviewed' || type === 'application_rejected') {
    rows.push([{ text: '🌐 AI Insider Academy', url: base }])
    return { inline_keyboard: rows }
  }

  if (type === 'purchase') {
    rows.push([{ text: '🔑 Войти в Academy', url: link(base, '/login') }])
    rows.push([{ text: '📚 Открыть курс', url: link(base, data.targetPath || '/learn') }])
    return { inline_keyboard: rows }
  }

  const openPath = data.targetPath || data.nextTargetPath || '/cabinet'
  rows.push([{ text: '📚 Открыть в Academy', url: link(base, openPath) }])

  if (rows.length) return { inline_keyboard: rows }
  return undefined
}

function formatHomeworkAccepted(data, base) {
  const lessonNum = lessonNumber(data)
  const platformUrl = link(base, data.nextTargetPath || data.targetPath || '/cabinet')
  const lines = [
    `${ICONS.homework_accepted} <b>Домашнее задание принято!</b>`,
    '',
    SEP,
    '',
    section('📚 Курс', data.courseTitle || 'курс'),
    section(`📖 Урок${lessonNum ? ` ${lessonNum}` : ''}`, data.lessonTitle || '—'),
    section('🕐 Принято', formatDateTime(data.reviewedAt)),
  ]

  if (data.score != null && data.score !== '') {
    lines.push('', section('🏆 Оценка', `${data.score}/10 ${scoreEmoji(data.score)}`))
  }

  const comment = mentorComment(data)
  if (comment) {
    lines.push('', '💬 <b>Комментарий ментора</b>', blockquote(comment))
  }

  lines.push('', SEP, '')

  if (data.hasNextLesson && data.nextLessonTitle) {
    const nextNum = data.nextLessonIndex != null ? data.nextLessonIndex + 1 : null
    lines.push(
      '✨ <b>Следующий урок уже доступен</b>',
      '',
      section(`▶️ Урок${nextNum ? ` ${nextNum}` : ''}`, data.nextLessonTitle),
      ''
    )
  } else if (data.isLastLesson) {
    lines.push('🏁 <b>Это был последний урок курса.</b> Поздравляем!', '')
  } else {
    lines.push('✅ Можете продолжать обучение на платформе.', '')
  }

  lines.push(
    '👇 <b>Продолжить обучение:</b>',
    `<a href="${platformUrl}">${platformUrl}</a>`
  )

  return lines.join('\n')
}

function formatHomeworkResubmit(data, base) {
  const lessonNum = lessonNumber(data)
  const platformUrl = link(base, data.targetPath || '/cabinet')
  const lines = [
    `${ICONS.homework_resubmit} <b>ДЗ отправлено на доработку</b>`,
    '',
    SEP,
    '',
    section('📚 Курс', data.courseTitle || 'курс'),
    section(`📖 Урок${lessonNum ? ` ${lessonNum}` : ''}`, data.lessonTitle || '—'),
    section('🕐 Проверено', formatDateTime(data.reviewedAt)),
  ]

  const comment = mentorComment(data)
  if (comment) {
    lines.push('', '💬 <b>Что доработать</b>', blockquote(comment))
  }

  if (data.score != null && data.score !== '') {
    lines.push('', section('📊 Текущая оценка', `${data.score}/10`))
  }

  lines.push(
    '',
    SEP,
    '',
    '🔄 Исправьте работу и отправьте снова — мы быстро проверим.',
    '',
    '👇 <b>Перейти к уроку:</b>',
    `<a href="${platformUrl}">${platformUrl}</a>`
  )

  return lines.join('\n')
}

function formatApplicationReviewed(data, base) {
  const lines = [
    `${ICONS.application_reviewed} <b>Заявка просмотрена</b>`,
    '',
    SEP,
    '',
    section('🎓 Курс', data.courseTitle || 'AI Insider Accelerator'),
    section('📧 Email', data.email || '—'),
    section('🕐 Статус', formatDateTime(data.reviewedAt || data.date)),
  ]

  const note = String(data.message || data.adminNote || '').trim()
  if (note && !note.startsWith('Заявка на')) {
    lines.push('', '💬 <b>Сообщение от команды</b>', blockquote(note))
  } else if (note) {
    lines.push('', blockquote(note))
  }

  lines.push(
    '',
    SEP,
    '',
    '⏳ Мы свяжемся с вами, когда будет решение по заявке.',
    '',
    '👇 <b>Платформа Academy:</b>',
    `<a href="${base}">${base}</a>`
  )

  return lines.join('\n')
}

function formatApplicationRejected(data, base) {
  const lines = [
    `${ICONS.application_rejected} <b>Заявка не одобрена</b>`,
    '',
    SEP,
    '',
    section('🎓 Курс', data.courseTitle || 'AI Insider Accelerator'),
    section('🕐 Решение', formatDateTime(data.reviewedAt || data.date)),
  ]

  const note = String(data.message || data.adminNote || '').trim()
  if (note) {
    lines.push('', '💬 <b>Комментарий</b>', blockquote(note))
  }

  lines.push(
    '',
    SEP,
    '',
    'Вы можете подать заявку снова или выбрать другой курс на платформе.',
    '',
    `<a href="${link(base, '/courses')}">Смотреть курсы на Academy</a>`
  )

  return lines.join('\n')
}

function formatPromo(data, base) {
  return [
    `${ICONS.promo_new} <b>Новый промокод для вас!</b>`,
    '',
    SEP,
    '',
    section('🎟 Код', `<code>${esc(data.code || '')}</code>`),
    data.discount ? section('💰 Скидка', data.discount) : null,
    '',
    `<a href="${link(base, '/courses')}">Смотреть курсы</a>`,
  ].filter(Boolean).join('\n')
}

function formatCourseNews(data, base) {
  const body = data.text || data.message || ''
  return [
    `${ICONS.course_news} <b>${esc(data.title || data.courseTitle || 'AI Insider Academy')}</b>`,
    '',
    body ? blockquote(body) : '',
    '',
    `<a href="${link(base, data.url || data.targetPath || '/courses')}">Подробнее на сайте</a>`,
  ].filter(Boolean).join('\n')
}

function formatReviewApproved(data, base) {
  return [
    `${ICONS.review_approved} <b>Отзыв опубликован!</b>`,
    '',
    section('📚 Курс', data.courseTitle || ''),
    '',
    blockquote('Спасибо, что делитесь опытом — это помогает другим студентам.'),
    '',
    `<a href="${link(base, data.targetPath || '/courses')}">Посмотреть на странице курса</a>`,
  ].join('\n')
}

function formatReviewRejected(data, base) {
  return [
    `${ICONS.review_rejected} <b>Отзыв пока не опубликован</b>`,
    '',
    section('📚 Курс', data.courseTitle || ''),
    '',
    data.message ? blockquote(data.message) : blockquote('Можно отправить новый отзыв с платформы.'),
    '',
    `<a href="${link(base, data.targetPath || '/courses')}">Вернуться к курсу</a>`,
  ].join('\n')
}

function formatPurchase(data, base) {
  const hint = data.message || 'Зайдите в Academy под той же почтой, с которой оплачивали.'
  return [
    `${ICONS.purchase} <b>Доступ к курсу открыт!</b>`,
    '',
    section('📚 Курс', data.courseTitle || data.productTitle || 'Курс Academy'),
    '',
    blockquote(hint),
    '',
    `<a href="${link(base, data.targetPath || '/learn')}">Открыть курс в Academy</a>`,
  ].join('\n')
}

function formatLessonReminder(data, base) {
  const lessonNum = lessonNumber(data)
  return [
    `${ICONS.lesson_reminder} <b>Напоминание об уроке</b>`,
    '',
    section('📚 Курс', data.courseTitle || ''),
    section(`📖 Урок${lessonNum ? ` ${lessonNum}` : ''}`, data.lessonTitle || '—'),
    '',
    blockquote('Вы начали этот урок — самое время продолжить.'),
    '',
    `<a href="${link(base, data.targetPath || '/cabinet')}">Продолжить обучение</a>`,
  ].join('\n')
}

function formatApplicationAccepted(data, base) {
  const name = [data.firstName, data.lastName].filter(Boolean).join(' ').trim()
  const lines = [
    `${ICONS.application_accepted} <b>Вы приняты на курс!</b>`,
    '',
    name ? `${esc(name)}, поздравляем! 🎉` : 'Поздравляем! 🎉',
    '',
    SEP,
    '',
    section('🎓 Курс', data.courseTitle || 'AI Insider Accelerator'),
    section('📧 Email для входа', `<code>${esc(data.email || '')}</code>`),
    section('🕐 Решение', formatDateTime(data.acceptedAt)),
  ]

  if (data.adminNote) {
    lines.push('', '💬 <b>Сообщение от команды</b>', blockquote(data.adminNote))
  }

  lines.push(
    '',
    SEP,
    '',
    blockquote('Доступ к курсу уже открыт на платформе AI Insider Academy.'),
    '',
    data.userCreated
      ? '🔐 Зарегистрируйтесь с этим email или восстановите пароль.'
      : '🔐 Войдите на платформу с вашим email.',
    '',
    `<a href="${data.courseUrl || link(base, data.targetPath || '/courses/ai-insider-accelerator')}">Перейти к курсу</a>`,
    `<a href="${base}">${base}</a>`
  )

  return lines.join('\n')
}

function section(label, value) {
  return `<b>${esc(label)}</b>\n${typeof value === 'string' && value.includes('<') ? value : esc(String(value ?? '—'))}`
}

function blockquote(text) {
  return `<blockquote>${esc(String(text || '').trim())}</blockquote>`
}

function mentorComment(data) {
  const raw = String(data.comment || data.adminComment || data.message || '').trim()
  if (!raw) return ''
  const defaults = [
    'ДЗ принято',
    'ДЗ отправлено на доработку',
    'Обновление по домашнему заданию',
    'Заявка на AI Accelerator просмотрена',
    'Поздравляем! Заявка на AI Accelerator одобрена',
    'Заявка на AI Accelerator отклонена',
  ]
  if (defaults.some((d) => raw === d || raw.startsWith(d + '.'))) return ''
  return raw
}

function lessonNumber(data) {
  if (data.lessonNumber != null) return data.lessonNumber
  if (data.lessonIndex != null && Number.isInteger(Number(data.lessonIndex))) {
    return Number(data.lessonIndex) + 1
  }
  return null
}

function scoreEmoji(score) {
  const n = Number(score)
  if (Number.isNaN(n)) return ''
  if (n >= 9) return '🌟'
  if (n >= 7) return '👍'
  return '💪'
}

function formatDateTime(iso) {
  if (!iso) return 'только что'
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Kyiv',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return new Date(iso).toLocaleString('ru-RU')
  }
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function link(base, path) {
  const p = path?.startsWith('/') ? path : `/${path || ''}`
  return `${base.replace(/\/$/, '')}${p}`
}
