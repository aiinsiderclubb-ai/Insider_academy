/** AI Insider Club — подписка с доступом к курсам Academy, кроме Pro-only программ */

import { MEMBERSHIP_PLANS, CLUB_MEMBERSHIP_IDS, PRO_MEMBERSHIP_IDS, ALL_MEMBERSHIP_IDS } from './memberships.js'
import { COURSE_BUNDLES } from './coursePacks.js'

const clubPlan = MEMBERSHIP_PLANS.find((p) => p.id === 'ai-insider-club')

export const AI_INSIDER_CLUB = {
  id: 'ai-insider-club',
  slug: 'club',
  priceEur: clubPlan?.priceEur ?? 49,
  nameRu: 'AI Insider Club',
  nameEn: 'AI Insider Club',
  taglineRu: 'Все основные курсы Academy в одной подписке',
  taglineEn: 'All core Academy courses in one subscription',
  descRu:
    'AI Insider Club открывает доступ к учебным материалам Academy. Pro-only курсы Agent Engineer и Agency Builder доступны через Pro или пакет.',
  descEn:
    'AI Insider Club unlocks Academy learning materials. Pro-only Agent Engineer and Agency Builder courses are available through Pro or a pack.',
  includesRu: clubPlan?.includesRu ?? [],
  includesEn: clubPlan?.includesEn ?? [],
  rulesRu: [
    '69 €/месяц — доступ ко всем обычным курсам Academy',
    '419 €/год — Club Annual (экономия 409 €)',
    'Agent Engineer и Agency Builder доступны только в Pro или пакете',
    'Только асинхронный формат: видео, текст, файлы, ДЗ',
    'Бесплатные стартовые курсы доступны и без подписки',
  ],
  rulesEn: [
    '€69/month — access to all regular Academy courses',
    '€419/year — Club Annual (save €409)',
    'Agent Engineer and Agency Builder are available only in Pro or a pack',
    'Async only: video, text, files, homework',
    'Free starter courses remain free without a subscription',
  ],
}

export const AI_INSIDER_PRO = {
  id: 'ai-insider-pro',
  slug: 'pro',
  priceEur: 89,
  nameRu: 'AI Insider Pro',
  nameEn: 'AI Insider Pro',
}

/** Курсы Academy, которые открываются подписками */
export const CLUB_PAID_COURSE_IDS = [
  'ai-user-pro',
  'ai-content-creator',
  'no-code-automation',
  'ai-conversational-systems',
  'ai-saas-builder',
  'ai-agent-architect',
  'ai-agency-builder',
]

/** Эти курсы не входят в обычный Club: только Pro, отдельная покупка или пакет */
export const PRO_ONLY_COURSE_IDS = [
  'ai-agent-architect',
  'ai-agency-builder',
]

export const CLUB_INCLUDED_COURSE_IDS = CLUB_PAID_COURSE_IDS.filter(
  (courseId) => !PRO_ONLY_COURSE_IDS.includes(courseId)
)

export function hasClubMembership(purchases = []) {
  return purchases.some((p) => ALL_MEMBERSHIP_IDS.includes(p.id))
}

export function hasProMembership(purchases = []) {
  return purchases.some((p) => PRO_MEMBERSHIP_IDS.includes(p.id))
}

export function courseUnlockedByClub(courseId, purchases = []) {
  if (!courseId || !CLUB_PAID_COURSE_IDS.includes(courseId)) return false
  if (hasProMembership(purchases)) return true
  return hasClubMembership(purchases) && CLUB_INCLUDED_COURSE_IDS.includes(courseId)
}

export function courseUnlockedByPack(courseId, purchases = []) {
  if (!courseId) return false
  const purchasedIds = new Set(purchases.map((p) => p.id))
  return COURSE_BUNDLES.some(
    (bundle) => purchasedIds.has(bundle.id) && bundle.courseIds.includes(courseId)
  )
}

export { CLUB_MEMBERSHIP_IDS, PRO_MEMBERSHIP_IDS, ALL_MEMBERSHIP_IDS }
