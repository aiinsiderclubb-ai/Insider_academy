import { getActiveGiveaways } from './giveaways'
import { MARKETPLACE_PRODUCTS } from './marketplace/products'
import { getCurrentChallenge } from './challenges'

/** Детерминированное «живое» число на сегодня (без фейковых тысяч) */
export function daySeedCount(seed, min, max) {
  const day = new Date().toISOString().slice(0, 10)
  let h = 0
  const s = `${day}:${seed}`
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return min + (h % (max - min + 1))
}

/**
 * Лента активности комьюнити-лайт.
 * @param {{ giveawayCounts?: Record<string, number>, lang?: string }} opts
 */
export function buildCommunityFeed({ giveawayCounts = {}, lang = 'ru' } = {}) {
  const ru = lang === 'ru'
  const items = []
  const now = Date.now()

  const lessonsOpened = daySeedCount('lessons', 8, 24)
  items.push({
    id: 'live-lessons',
    icon: 'bookOpen',
    tone: 'live',
    textRu: `Сегодня ${lessonsOpened} человек открыли урок`,
    textEn: `${lessonsOpened} people opened a lesson today`,
    at: now - 5 * 60000,
  })

  const active = getActiveGiveaways()
  for (const g of active) {
    const count = giveawayCounts[g.slug]
    const n = count != null ? count : daySeedCount(`gw-${g.slug}`, 12, 96)
    items.push({
      id: `giveaway-${g.slug}`,
      icon: 'gift',
      tone: 'giveaway',
      textRu: `Розыгрыш ${g.prizeRu}: ${n} участников`,
      textEn: `${g.prizeEn} giveaway: ${n} participants`,
      href: `/giveaway/${g.slug}`,
      at: now - 20 * 60000,
    })
  }

  const challenge = getCurrentChallenge()
  if (challenge) {
    items.push({
      id: `challenge-${challenge.id}`,
      icon: 'flag',
      tone: 'challenge',
      textRu: `Челлендж недели: ${challenge.titleRu}`,
      textEn: `Weekly challenge: ${challenge.titleEn}`,
      href: '/cabinet#challenge',
      at: now - 40 * 60000,
    })
  }

  const newProducts = MARKETPLACE_PRODUCTS.filter((p) => p.badge === 'trend-2026').slice(0, 3)
  newProducts.forEach((p, i) => {
    const cat = p.categoryId === 'voice-agents'
      ? (ru ? 'Voice Agents' : 'Voice Agents')
      : p.categoryId === 'mcp-skills'
        ? 'MCP & Skills'
        : (ru ? 'Marketplace' : 'Marketplace')
    items.push({
      id: `product-${p.id}`,
      icon: 'sparkles',
      tone: 'product',
      textRu: `Новый продукт в ${cat}: ${p.titleRu}`,
      textEn: `New in ${cat}: ${p.titleEn}`,
      href: `/marketplace/${p.slug}`,
      at: now - (60 + i * 30) * 60000,
    })
  })

  const cabinetOpens = daySeedCount('cabinet', 15, 40)
  items.push({
    id: 'live-cabinet',
    icon: 'layoutDashboard',
    tone: 'live',
    textRu: `За сутки ${cabinetOpens} входов в кабинет`,
    textEn: `${cabinetOpens} dashboard visits in the last day`,
    at: now - 90 * 60000,
  })

  return items.sort((a, b) => b.at - a.at)
}
