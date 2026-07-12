import { TELEGRAM_COMMUNITY, TELEGRAM_GIVEAWAY_CLAUDE } from './siteLinks'

/** @typedef {'active' | 'upcoming' | 'ended'} GiveawayStatus */

/**
 * Розыгрыши AI Insider.
 * telegramInviteUrl — ссылка «вступить в канал» для этого розыгрыша.
 * telegramPostUrl — только ссылка на КОНКРЕТНЫЙ пост (t.me/channel/123). Канал без поста не эмбедится.
 */
export const GIVEAWAYS = [
  {
    id: 'claude-pro',
    slug: 'claude-pro',
    status: 'active',
    brand: 'Claude',
    icon: 'brain',
    logoText: 'Claude',
    accent: '#d97757',
    gradient: 'linear-gradient(145deg, #2a1a14 0%, #d97757 45%, #8b5cf6 100%)',
    prizeRu: 'Claude Pro',
    prizeEn: 'Claude Pro',
    prizeDetailRu: '× 1 месяц',
    prizeDetailEn: '× 1 month',
    winnersCount: 1,
    startsAt: '2026-07-10T00:00:00+03:00',
    endsAt: '2026-07-25T23:59:59+03:00',
    telegramChannel: 'aiinsiderclub',
    telegramInviteUrl: TELEGRAM_GIVEAWAY_CLAUDE,
    telegramPostUrl: import.meta.env.VITE_GIVEAWAY_TELEGRAM_URL || '',
    tagRu: 'Активный розыгрыш',
    tagEn: 'Active giveaway',
    headlineRu: 'Выиграйте Claude Pro',
    headlineEn: 'Win Claude Pro',
    leadRu:
      'Подписка на Claude Pro — для глубокой работы с AI, длинным контекстом и проектами. Разыгрываем среди подписчиков AI Insider.',
    leadEn:
      'Claude Pro subscription — for deep AI work, long context and projects. We are giving it away to AI Insider community members.',
    rulesRu: [
      { title: 'Бесплатное участие', text: 'Участие бесплатное. Базовое участие даёт 1 шанс.' },
      { title: 'Дополнительные шансы', text: 'Подписка на Telegram (+1), приглашение друга (+3), шаринг страницы (+2).' },
      { title: 'Как выбираем победителя', text: 'Победитель выбирается случайно с учётом шансов участников.' },
      { title: 'Публикация итогов', text: 'Итоги публикуем в Telegram и на этой странице.' },
      { title: 'Что получит победитель', text: 'Приз — промокод или оплата подписки Claude Pro на 1 месяц.' },
      { title: 'Честная игра', text: 'Команда AI Insider может отказать участнику при нарушении правил или фейковом аккаунте.' },
    ],
    rulesEn: [
      { title: 'Free to enter', text: 'Participation is free. Base entry gives 1 chance.' },
      { title: 'Bonus chances', text: 'Telegram subscribe (+1), invite a friend (+3), share the page (+2).' },
      { title: 'How we pick a winner', text: 'Winner is picked at random weighted by chances.' },
      { title: 'Results', text: 'Results are published on Telegram and this page.' },
      { title: 'What you win', text: 'Prize is a promo code or Claude Pro subscription for 1 month.' },
      { title: 'Fair play', text: 'AI Insider team may disqualify entries that break rules or use fake accounts.' },
    ],
    faqRu: [
      {
        q: 'Как выбирается победитель?',
        a: 'Случайным образом среди участников с учётом шансов: больше шансов — выше вероятность. Итоги публикуем в Telegram и на странице розыгрыша.',
      },
      {
        q: 'Как я получу приз?',
        a: 'Мы свяжемся с победителем в Telegram / по email аккаунта Academy и передадим промокод или оплатим подписку Claude Pro на 1 месяц.',
      },
      {
        q: 'Можно ли участвовать без Telegram?',
        a: 'Для базового участия и проверки подписки нужен Telegram-бот AI Insider и канал AI Insider. Без этого сервер не примет заявку.',
      },
      {
        q: 'Когда итоги?',
        a: 'Сразу после окончания таймера. Анонс — в Telegram-канале AI Insider и на этой странице.',
      },
    ],
    faqEn: [
      {
        q: 'How is the winner chosen?',
        a: 'At random among participants, weighted by chances. Results go live on Telegram and this page.',
      },
      {
        q: 'How do I receive the prize?',
        a: 'We contact the winner via Telegram / Academy email and send a promo code or pay for 1 month of Claude Pro.',
      },
      {
        q: 'Can I enter without Telegram?',
        a: 'Base entry requires the AI Insider Telegram bot and AI Insider channel so we can verify participation.',
      },
      {
        q: 'When are results announced?',
        a: 'Right after the timer ends — on the AI Insider Telegram channel and this page.',
      },
    ],
  },
]

export function getGiveaway(slug) {
  return GIVEAWAYS.find((g) => g.slug === slug) || null
}

export function getActiveGiveaways() {
  return GIVEAWAYS.filter((g) => g.status === 'active')
}

export function getUpcomingGiveaways() {
  return GIVEAWAYS.filter((g) => g.status === 'upcoming')
}

export function getEndedGiveaways() {
  return GIVEAWAYS.filter((g) => g.status === 'ended')
}

/** Активные или анонсированные с датой — без пустых «скоро» */
export function isGiveawayListedOnEvents(giveaway) {
  if (giveaway.status === 'active') return true
  if (giveaway.status === 'ended') return true
  if (giveaway.status !== 'upcoming') return false
  return Boolean(giveaway.announcedAt || giveaway.startsAt)
}

export function getListedGiveaways() {
  return GIVEAWAYS.filter(isGiveawayListedOnEvents)
}

export function getAnnouncedUpcomingGiveaways() {
  return GIVEAWAYS.filter((g) => g.status === 'upcoming' && isGiveawayListedOnEvents(g))
}

export { TELEGRAM_COMMUNITY }
