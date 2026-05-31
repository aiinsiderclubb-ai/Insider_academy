/** AI Insider Club — подписка с доступом ко всем Pro-курсам */

import { MEMBERSHIP_PLANS, CLUB_MEMBERSHIP_IDS, PRO_MEMBERSHIP_IDS, ALL_MEMBERSHIP_IDS } from './memberships.js'

const clubPlan = MEMBERSHIP_PLANS.find((p) => p.id === 'ai-insider-club')

export const AI_INSIDER_CLUB = {
  id: 'ai-insider-club',
  slug: 'club',
  priceEur: clubPlan?.priceEur ?? 49,
  nameRu: 'AI Insider Club',
  nameEn: 'AI Insider Club',
  taglineRu: 'Все курсы Academy в одной подписке',
  taglineEn: 'All Academy courses in one subscription',
  descRu:
    'AI Insider Club открывает полный доступ ко всем курсам Academy, сертификаты, prompt library, AI-ресурсы и закрытое сообщество.',
  descEn:
    'AI Insider Club unlocks every Academy course, certificates, prompt library, AI resources and the private community.',
  includesRu: clubPlan?.includesRu ?? [],
  includesEn: clubPlan?.includesEn ?? [],
  rulesRu: [
    '49 €/месяц — доступ ко всем курсам',
    '490 €/год — Club Annual (экономия 98 €)',
    'Только асинхронный формат: видео, текст, файлы, ДЗ',
    'Бесплатные стартовые курсы доступны и без подписки',
  ],
  rulesEn: [
    '€49/month — access to all courses',
    '€490/year — Club Annual (save €98)',
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

/** Pro-курсы, которые открывает Club / Pro */
export const CLUB_PAID_COURSE_IDS = [
  'ai-user-pro',
  'ai-content-creator',
  'no-code-automation',
  'ai-chatbot-developer',
  'ai-voice-developer',
  'ai-saas-builder',
  'ai-agent-architect',
  'ai-agency-builder',
]

export function hasClubMembership(purchases = []) {
  return purchases.some((p) => ALL_MEMBERSHIP_IDS.includes(p.id))
}

export function hasProMembership(purchases = []) {
  return purchases.some((p) => PRO_MEMBERSHIP_IDS.includes(p.id))
}

export function courseUnlockedByClub(courseId, purchases = []) {
  return hasClubMembership(purchases) && CLUB_PAID_COURSE_IDS.includes(courseId)
}

export { CLUB_MEMBERSHIP_IDS, PRO_MEMBERSHIP_IDS, ALL_MEMBERSHIP_IDS }
