/** AI Insider Club — подписка с доступом к курсам Academy */

import { MEMBERSHIP_PLANS, CLUB_MEMBERSHIP_IDS, PRO_MEMBERSHIP_IDS, ALL_MEMBERSHIP_IDS } from './memberships.js'
import { COURSE_BUNDLES } from './coursePacks.js'
import { purchaseIdsForCourse, resolveCourseId } from './courseAliases.js'
import {
  CLUB_INCLUDED_PAID_IDS,
  PRO_ONLY_COURSE_IDS,
  FREE_COURSE_IDS,
} from './productStructure.js'

const clubPlan = MEMBERSHIP_PLANS.find((p) => p.id === 'ai-insider-club')

export const AI_INSIDER_CLUB = {
  id: 'ai-insider-club',
  slug: 'club',
  priceEur: clubPlan?.priceEur ?? 59,
  nameRu: 'AI Insider Club',
  nameEn: 'AI Insider Club',
  taglineRu: 'Productivity, контент и бесплатные программы в подписке',
  taglineEn: 'Productivity, content and free programs in one subscription',
  descRu:
    'Club открывает AI Productivity Master, AI Content Creator и все бесплатные курсы. Automation, Agent и Business Builder — в Pro или пакетах.',
  descEn:
    'Club unlocks AI Productivity Master, AI Content Creator and all free courses. Automation, Agent and Business Builder are in Pro or packs.',
  includesRu: clubPlan?.includesRu ?? [],
  includesEn: clubPlan?.includesEn ?? [],
  rulesRu: [
    '59 €/месяц — Productivity Master, Content Creator и бесплатные программы',
    'Новые уроки каждый месяц, закрытый Telegram, Prompt Library',
    'Automation Engineer, Agent Engineer и Business Builder — только Pro или пакет',
    'Только асинхронный формат: видео, текст, файлы, ДЗ',
  ],
  rulesEn: [
    '€59/month — Productivity Master, Content Creator and free programs',
    'New lessons monthly, private Telegram, Prompt Library',
    'Automation, Agent and Business Builder — Pro or packs only',
    'Async only: video, text, files, homework',
  ],
}

export const AI_INSIDER_PRO = {
  id: 'ai-insider-pro',
  slug: 'pro',
  priceEur: 99,
  nameRu: 'AI Insider Pro',
  nameEn: 'AI Insider Pro',
}

export const CLUB_PAID_COURSE_IDS = [...CLUB_INCLUDED_PAID_IDS, ...PRO_ONLY_COURSE_IDS]

export { PRO_ONLY_COURSE_IDS }

export const CLUB_INCLUDED_COURSE_IDS = [
  ...FREE_COURSE_IDS,
  ...CLUB_INCLUDED_PAID_IDS,
]

export function hasClubMembership(purchases = []) {
  return purchases.some((p) => ALL_MEMBERSHIP_IDS.includes(p.id))
}

export function hasProMembership(purchases = []) {
  return purchases.some((p) => PRO_MEMBERSHIP_IDS.includes(p.id))
}

export function courseUnlockedByClub(courseId, purchases = []) {
  const ids = purchaseIdsForCourse(courseId)
  const inClubCatalog = CLUB_PAID_COURSE_IDS.some((id) => ids.includes(id))
  if (!inClubCatalog) return false
  if (hasProMembership(purchases)) return true
  return hasClubMembership(purchases) && CLUB_INCLUDED_COURSE_IDS.some((id) => ids.includes(id))
}

export function courseUnlockedByPack(courseId, purchases = []) {
  if (!courseId) return false
  const target = resolveCourseId(courseId)
  const purchasedIds = new Set(purchases.map((p) => p.id))
  return COURSE_BUNDLES.some(
    (bundle) => purchasedIds.has(bundle.id) && bundle.courseIds.includes(target)
  )
}

export { CLUB_MEMBERSHIP_IDS, PRO_MEMBERSHIP_IDS, ALL_MEMBERSHIP_IDS }
