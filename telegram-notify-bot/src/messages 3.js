const ICONS = {
  homework_accepted: '✅',
  homework_resubmit: '📝',
  promo_new: '🎁',
  course_news: '📚',
  review_approved: '⭐',
  review_rejected: '💬',
  purchase: '💳',
  lesson_reminder: '🔔',
  custom: '📣',
}

export function formatNotification(type, data = {}, appUrl) {
  const base = appUrl || 'https://insider-academy-vsxg.vercel.app'
  const icon = ICONS[type] || ICONS.custom

  switch (type) {
    case 'homework_accepted':
      return `${icon} <b>Домашнее задание принято</b>\n\nКурс: ${esc(data.courseTitle || 'курс')}\n${data.lessonTitle ? `Урок: ${esc(data.lessonTitle)}\n` : ''}${data.score != null ? `Оценка: ${data.score}/10\n` : ''}<a href="${link(base, data.targetPath || '/cabinet')}">Открыть в Academy</a>`

    case 'homework_resubmit':
      return `${icon} <b>ДЗ на доработку</b>\n\nКурс: ${esc(data.courseTitle || '')}\n${data.message ? `${esc(data.message)}\n` : ''}<a href="${link(base, data.targetPath || '/cabinet')}">Перейти к уроку</a>`

    case 'promo_new':
      return `${icon} <b>Новый промокод</b>\n\nКод: <code>${esc(data.code || '')}</code>\n${data.discount ? `Скидка: ${esc(data.discount)}\n` : ''}<a href="${link(base, '/courses')}">Смотреть курсы</a>`

    case 'course_news':
      return `${icon} <b>${esc(data.title || 'Новинка Academy')}</b>\n\n${esc(data.text || '')}\n<a href="${link(base, data.url || '/courses')}">Подробнее</a>`

    case 'review_approved':
      return `${icon} <b>Отзыв опубликован</b>\n\n${esc(data.courseTitle || '')}\n<a href="${link(base, data.targetPath || '/courses')}">На страницу курса</a>`

    case 'review_rejected':
      return `${icon} <b>Отзыв не опубликован</b>\n\n${esc(data.message || 'Можно отправить новый отзыв.')}`

    case 'purchase':
      return `${icon} <b>Доступ открыт</b>\n\n${esc(data.courseTitle || data.productTitle || '')}\n<a href="${link(base, data.targetPath || '/cabinet')}">Личный кабинет</a>`

    case 'lesson_reminder':
      return `${icon} <b>Напоминание об уроке</b>\n\n${esc(data.courseTitle || '')}\n${data.lessonTitle ? `Урок: ${esc(data.lessonTitle)}\n` : ''}<a href="${link(base, data.targetPath || '/cabinet')}">Продолжить</a>`

    default:
      return `${icon} <b>${esc(data.title || 'Уведомление')}</b>\n\n${esc(data.text || data.message || '')}`
  }
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function link(base, path) {
  const p = path?.startsWith('/') ? path : `/${path || ''}`
  return `${base.replace(/\/$/, '')}${p}`
}
