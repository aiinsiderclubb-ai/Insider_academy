/** Активные розыгрыши (whitelist для API). Синхронизируйте с src/data/giveaways.js */
export const SERVER_GIVEAWAYS = {
  'claude-pro': {
    id: 'claude-pro',
    status: 'active',
    endsAt: process.env.GIVEAWAY_CLAUDE_ENDS_AT || '2026-09-25T23:59:59+03:00',
    telegramChannel: process.env.TELEGRAM_GIVEAWAY_CHANNEL || '@aiinsiderclub',
  },
}

export function getServerGiveaway(slug) {
  return SERVER_GIVEAWAYS[slug] || null
}

export function isGiveawayOpen(meta, now = Date.now()) {
  if (!meta || meta.status !== 'active') return false
  if (!meta.endsAt) return true
  const end = new Date(meta.endsAt).getTime()
  return Number.isFinite(end) && end > now
}

export function publicGiveawayStatus(meta, now = Date.now()) {
  if (!meta) return null
  if (isGiveawayOpen(meta, now)) return 'active'
  if (meta.status === 'draft') return 'draft'
  return 'finished'
}
