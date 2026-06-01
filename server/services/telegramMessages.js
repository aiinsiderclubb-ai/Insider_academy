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
  custom: '📣',
}

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
    default:
      return `${ICONS.custom} <b>${esc(data.title || 'Уведомление')}</b>\n\n${esc(data.text || data.message || '')}`
  }
}

export function getInlineKeyboard(type, data = {}, appUrl) {
  const base = (appUrl || 'https://myinsideracademy.com').replace(/\/$/, '')
  const rows = []

  if (type === 'homework_accepted' && data.hasNextLesson && data.nextTargetPath) {
    rows.push([{ text: '▶️ Следующий урок', url: link(base, data.nextTargetPath) }])
  }

  if (type === 'application_accepted') {
    rows.push([{ text: '🚀 Открыть курс', url: link(base, data.targetPath || '/courses/ai-insider-accelerator') }])
    rows.push([
      { text: '📝 Регистрация', url: data.registerUrl || link(base, '/register') },
      { text: '🔑 Вход', url: data.loginUrl || link(base, '/login') },
    ])
    if (rows.length) return { inline_keyboard: rows }
    return undefined
  }

  const openPath = data.targetPath || data.nextTargetPath || '/cabinet'
  rows.push([{ text: '📚 Открыть в Academy', url: link(base, openPath) }])

  if (rows.length) return { inline_keyboard: rows }
  return undefined
}

function formatHomeworkAccepted(data, base) {
  const lessonNum = lessonNumber(data)
  const lines = [
    `${ICONS.homework_accepted} <b>Домашнее задание принято!</b>`,
    '',
    `📚 <b>Курс:</b> ${esc(data.courseTitle || 'курс')}`,
    `📖 <b>Урок${lessonNum ? ` ${lessonNum}` : ''}:</b> ${esc(data.lessonTitle || '—')}`,
    `🕐 <b>Проверено:</b> ${esc(formatDateTime(data.reviewedAt))}`,
  ]

  if (data.score != null && data.score !== '') {
    lines.push('', `🏆 <b>Оценка:</b> ${esc(String(data.score))}/10 ${scoreEmoji(data.score)}`)
  }

  const comment = mentorComment(data)
  if (comment) {
    lines.push('', '💬 <b>Комментарий ментора:</b>', `<i>${esc(comment)}</i>`)
  }

  if (data.hasNextLesson && data.nextLessonTitle) {
    const nextNum = data.nextLessonIndex != null ? data.nextLessonIndex + 1 : null
    lines.push(
      '',
      '✨ <b>Следующий урок уже доступен!</b>',
      `▶️ ${nextNum ? `Урок ${nextNum}: ` : ''}${esc(data.nextLessonTitle)}`,
      '',
      'Можете продолжать обучение прямо сейчас 👇'
    )
  } else if (data.isLastLesson) {
    lines.push('', '🏁 <b>Это был последний урок курса.</b> Поздравляем с завершением!')
  }

  lines.push('', `<a href="${link(base, data.nextTargetPath || data.targetPath || '/cabinet')}">Перейти на платформу</a>`)
  return lines.join('\n')
}

function formatHomeworkResubmit(data, base) {
  const lessonNum = lessonNumber(data)
  const lines = [
    `${ICONS.homework_resubmit} <b>ДЗ отправлено на доработку</b>`,
    '',
    `📚 <b>Курс:</b> ${esc(data.courseTitle || 'курс')}`,
    `📖 <b>Урок${lessonNum ? ` ${lessonNum}` : ''}:</b> ${esc(data.lessonTitle || '—')}`,
    `🕐 <b>Проверено:</b> ${esc(formatDateTime(data.reviewedAt))}`,
  ]

  const comment = mentorComment(data)
  if (comment) {
    lines.push('', '💬 <b>Что доработать:</b>', `<i>${esc(comment)}</i>`)
  } else {
    lines.push('', 'Посмотрите комментарий ментора на платформе и отправьте обновлённое ДЗ.')
  }

  if (data.score != null && data.score !== '') {
    lines.push('', `📊 <b>Текущая оценка:</b> ${esc(String(data.score))}/10`)
  }

  lines.push('', 'Исправьте работу и отправьте снова — мы быстро проверим 🔄', '', `<a href="${link(base, data.targetPath || '/cabinet')}">Перейти к уроку</a>`)
  return lines.join('\n')
}

function formatPromo(data, base) {
  return [
    `${ICONS.promo_new} <b>Новый промокод для вас!</b>`,
    '',
    `🎟 <b>Код:</b> <code>${esc(data.code || '')}</code>`,
    data.discount ? `💰 <b>Скидка:</b> ${esc(data.discount)}` : null,
    '',
    'Примените код при оплате курса на платформе.',
    `<a href="${link(base, '/courses')}">Смотреть курсы</a>`,
  ].filter(Boolean).join('\n')
}

function formatCourseNews(data, base) {
  return [
    `${ICONS.course_news} <b>${esc(data.title || 'Новость Academy')}</b>`,
    '',
    esc(data.text || data.message || ''),
    '',
    `<a href="${link(base, data.url || '/courses')}">Подробнее на сайте</a>`,
  ].join('\n')
}

function formatReviewApproved(data, base) {
  return [
    `${ICONS.review_approved} <b>Отзыв опубликован!</b>`,
    '',
    `📚 <b>Курс:</b> ${esc(data.courseTitle || '')}`,
    '🙏 Спасибо, что делитесь опытом — это помогает другим студентам.',
    '',
    `<a href="${link(base, data.targetPath || '/courses')}">Посмотреть на странице курса</a>`,
  ].join('\n')
}

function formatReviewRejected(data, base) {
  return [
    `${ICONS.review_rejected} <b>Отзыв пока не опубликован</b>`,
    '',
    `📚 <b>Курс:</b> ${esc(data.courseTitle || '')}`,
    '',
    esc(data.message || 'Можно отправить новый отзыв с платформы.'),
    '',
    `<a href="${link(base, data.targetPath || '/courses')}">Вернуться к курсу</a>`,
  ].join('\n')
}

function formatPurchase(data, base) {
  return [
    `${ICONS.purchase} <b>Доступ к курсу открыт!</b>`,
    '',
    `📚 ${esc(data.courseTitle || data.productTitle || 'Курс Academy')}`,
    '',
    'Материалы уже доступны в личном кабинете. Приятного обучения 🚀',
    '',
    `<a href="${link(base, data.targetPath || '/cabinet')}">Открыть личный кабинет</a>`,
  ].join('\n')
}

function formatLessonReminder(data, base) {
  const lessonNum = lessonNumber(data)
  return [
    `${ICONS.lesson_reminder} <b>Напоминание об уроке</b>`,
    '',
    `📚 <b>Курс:</b> ${esc(data.courseTitle || '')}`,
    `📖 <b>Урок${lessonNum ? ` ${lessonNum}` : ''}:</b> ${esc(data.lessonTitle || '—')}`,
    '',
    'Вы начали этот урок — самое время продолжить 💪',
    '',
    `<a href="${link(base, data.targetPath || '/cabinet')}">Продолжить обучение</a>`,
  ].join('\n')
}

function formatApplicationAccepted(data, base) {
  const name = [data.firstName, data.lastName].filter(Boolean).join(' ').trim()
  const greeting = name ? `${esc(name)}, поздравляем!` : 'Поздравляем!'
  const lines = [
    `${ICONS.application_accepted} <b>Вы приняты на курс!</b>`,
    '',
    `${greeting}`,
    '',
    `🎓 <b>Курс:</b> ${esc(data.courseTitle || 'AI Insider Accelerator')}`,
    `📧 <b>Email для входа:</b> <code>${esc(data.email || '')}</code>`,
    `🕐 <b>Решение:</b> ${esc(formatDateTime(data.acceptedAt))}`,
  ]

  if (data.adminNote) {
    lines.push('', '💬 <b>Сообщение от команды:</b>', `<i>${esc(data.adminNote)}</i>`)
  }

  lines.push(
    '',
    '✅ <b>Доступ к курсу уже открыт</b> на платформе AI Insider Academy.',
    '',
    data.userCreated
      ? '🔐 <b>Первый вход:</b> зарегистрируйтесь с этим email или восстановите пароль, если аккаунт уже создан.'
      : '🔐 <b>Вход:</b> используйте ваш email на платформе.',
    '',
    `<a href="${data.registerUrl || link(base, '/register')}">Регистрация</a> · <a href="${data.loginUrl || link(base, '/login')}">Вход</a>`,
    `<a href="${data.courseUrl || link(base, data.targetPath || '/courses/ai-insider-accelerator')}">Перейти к курсу</a>`,
    '',
    'До встречи на обучении! 🚀'
  )

  return lines.join('\n')
}

function mentorComment(data) {
  const raw = String(data.comment || data.adminComment || '').trim()
  if (!raw) return ''
  const defaults = ['ДЗ принято', 'ДЗ отправлено на доработку', 'Обновление по домашнему заданию']
  if (defaults.includes(raw)) return ''
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
