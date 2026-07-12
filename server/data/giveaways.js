/** Активные розыгрыши (whitelist для API). Синхронизируйте с src/data/giveaways.js */
export const SERVER_GIVEAWAYS = {
  'claude-pro': {
    id: 'claude-pro',
    status: 'active',
    endsAt: '2026-07-25T23:59:59+03:00',
    telegramChannel: process.env.TELEGRAM_GIVEAWAY_CHANNEL || '@aiinsiderclub',
  },
}

export function getServerGiveaway(slug) {
  return SERVER_GIVEAWAYS[slug] || null
}
