import { TELEGRAM_COMMUNITY } from './siteLinks'

/** @typedef {'active' | 'upcoming' | 'ended'} GiveawayStatus */

/**
 * Розыгрыши AI Insider. Добавляйте новые объекты в массив — страница подхватит автоматически.
 * telegramPostUrl — ссылка на пост-анонс в Telegram (обновите при новом розыгрыше).
 */
export const GIVEAWAYS = [
  {
    id: 'claude-pro',
    slug: 'claude-pro',
    status: 'active',
    brand: 'Claude',
    icon: '🧠',
    accent: '#d97757',
    gradient: 'linear-gradient(135deg, #d97757 0%, #c45c3e 45%, #8b5cf6 100%)',
    prizeRu: 'Claude Pro',
    prizeEn: 'Claude Pro',
    prizeDetailRu: '1 месяц подписки',
    prizeDetailEn: '1 month subscription',
    prizeValue: '$20',
    winnersCount: 1,
    endsAt: '2026-07-25T23:59:59+03:00',
    telegramPostUrl: import.meta.env.VITE_GIVEAWAY_TELEGRAM_URL || TELEGRAM_COMMUNITY,
    tagRu: 'Активный розыгрыш',
    tagEn: 'Active giveaway',
    headlineRu: 'Выиграйте Claude Pro',
    headlineEn: 'Win Claude Pro',
    leadRu:
      'Подписка на Claude Pro — для глубокой работы с AI, длинным контекстом и проектами. Разыгрываем среди подписчиков AI Insider.',
    leadEn:
      'Claude Pro subscription — for deep AI work, long context and projects. We are giving it away to AI Insider community members.',
    stepsRu: [
      { id: 'telegram', label: 'Подпишитесь на Telegram-канал AI Insider', link: TELEGRAM_COMMUNITY, external: true },
      { id: 'register', label: 'Зарегистрируйтесь на Academy (если ещё нет аккаунта)', link: '/register', external: false },
      { id: 'comment', label: 'Оставьте комментарий под постом розыгрыша в Telegram', link: null, useTelegramPost: true },
    ],
    stepsEn: [
      { id: 'telegram', label: 'Subscribe to AI Insider Telegram channel', link: TELEGRAM_COMMUNITY, external: true },
      { id: 'register', label: 'Sign up on Academy (if you do not have an account yet)', link: '/register', external: false },
      { id: 'comment', label: 'Leave a comment under the giveaway post on Telegram', link: null, useTelegramPost: true },
    ],
    rulesRu: [
      'Участие бесплатное. Один аккаунт — одна заявка.',
      'Победитель выбирается случайно среди выполнивших все условия.',
      'Итоги публикуем в Telegram и на этой странице.',
      'Приз — промокод или оплата подписки Claude Pro на 1 месяц (по договорённости с победителем).',
      'Команда AI Insider может отказать участнику при нарушении правил или фейковом аккаунте.',
    ],
    rulesEn: [
      'Participation is free. One account — one entry.',
      'Winner is picked at random among those who completed all steps.',
      'Results are published on Telegram and this page.',
      'Prize is a promo code or Claude Pro subscription for 1 month (arranged with the winner).',
      'AI Insider team may disqualify entries that break rules or use fake accounts.',
    ],
  },
  {
    id: 'chatgpt-plus',
    slug: 'chatgpt-plus',
    status: 'upcoming',
    brand: 'ChatGPT',
    icon: '💬',
    accent: '#10a37f',
    gradient: 'linear-gradient(135deg, #10a37f, #8b5cf6)',
    prizeRu: 'ChatGPT Plus',
    prizeEn: 'ChatGPT Plus',
    prizeDetailRu: 'скоро',
    prizeDetailEn: 'coming soon',
    prizeValue: '$20',
    winnersCount: 1,
    endsAt: null,
    telegramPostUrl: TELEGRAM_COMMUNITY,
    tagRu: 'Скоро',
    tagEn: 'Coming soon',
    headlineRu: 'ChatGPT Plus',
    headlineEn: 'ChatGPT Plus',
    leadRu: 'Следующий розыгрыш в линейке AI Insider Giveaways.',
    leadEn: 'Next giveaway in the AI Insider Giveaways series.',
    stepsRu: [],
    stepsEn: [],
    rulesRu: [],
    rulesEn: [],
  },
  {
    id: 'cursor-pro',
    slug: 'cursor-pro',
    status: 'upcoming',
    brand: 'Cursor',
    icon: '⌨️',
    accent: '#6b7280',
    gradient: 'linear-gradient(135deg, #374151, #8b5cf6)',
    prizeRu: 'Cursor Pro',
    prizeEn: 'Cursor Pro',
    prizeDetailRu: 'скоро',
    prizeDetailEn: 'coming soon',
    prizeValue: '$20',
    winnersCount: 1,
    endsAt: null,
    telegramPostUrl: TELEGRAM_COMMUNITY,
    tagRu: 'Скоро',
    tagEn: 'Coming soon',
    headlineRu: 'Cursor Pro',
    headlineEn: 'Cursor Pro',
    leadRu: 'Розыгрыш подписки для разработчиков — анонс в Telegram.',
    leadEn: 'Developer subscription giveaway — announced on Telegram.',
    stepsRu: [],
    stepsEn: [],
    rulesRu: [],
    rulesEn: [],
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
