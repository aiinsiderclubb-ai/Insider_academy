/** AI Insider Memberships — Club & Pro, monthly & annual */

export const MEMBERSHIPS_TITLE = {
  ru: 'Подписка AI Insider',
  en: 'AI Insider Memberships',
}

export const MEMBERSHIP_PLANS = [
  {
    id: 'ai-insider-club',
    name: 'AI Insider Club',
    nameEn: 'AI Insider Club',
    priceEur: 59,
    periodRu: '/ месяц',
    periodEn: '/ month',
    billing: 'monthly',
    tier: 'club',
    badge: { ru: 'Самый популярный', en: 'Most Popular' },
    featured: true,
    ctaRu: 'Вступить в Club',
    ctaEn: 'Join Club',
    includesRu: [
      'AI Productivity Master',
      'AI Content Creator',
      'Все бесплатные программы',
      'Новые уроки каждый месяц',
      'Закрытый Telegram',
      'Prompt Library',
      'Не входят: Automation Engineer, Agent Engineer, Business Builder',
    ],
    includesEn: [
      'AI Productivity Master',
      'AI Content Creator',
      'All free programs',
      'New lessons every month',
      'Private Telegram',
      'Prompt Library',
      'Not included: Automation, Agent and Business Builder',
    ],
    bonusRu: [],
    bonusEn: [],
    saveLabelRu: null,
    saveLabelEn: null,
  },
  {
    id: 'ai-insider-pro',
    name: 'AI Insider Pro',
    nameEn: 'AI Insider Pro',
    priceEur: 99,
    periodRu: '/ месяц',
    periodEn: '/ month',
    billing: 'monthly',
    tier: 'pro',
    badge: null,
    featured: false,
    ctaRu: 'Вступить в Pro',
    ctaEn: 'Join Pro',
    includesRu: [
      'Все курсы Academy',
      'Все шаблоны и Workflow',
      'Все AI Agent Templates',
      'Все новые курсы',
      'Закрытое сообщество',
      'Ежемесячные разборы кейсов',
      'Premium материалы',
    ],
    includesEn: [
      'All Academy courses',
      'All templates and workflows',
      'All AI agent templates',
      'All new courses',
      'Private community',
      'Monthly case reviews',
      'Premium materials',
    ],
    bonusRu: [],
    bonusEn: [],
    saveLabelRu: null,
    saveLabelEn: null,
  },
  {
    id: 'ai-insider-club-annual',
    name: 'AI Insider Club Annual',
    nameEn: 'AI Insider Club Annual',
    priceEur: 419,
    periodRu: '/ год',
    periodEn: '/ year',
    billing: 'annual',
    tier: 'club',
    badge: null,
    featured: false,
    ctaRu: 'Вступить в Club',
    ctaEn: 'Join Club',
    includesRu: [
      'Всё из AI Insider Club',
      'Не входят: AI Agent Engineer и AI Agency Builder',
      '12 месяцев доступа по специальной цене',
      'Все новые учебные материалы в течение года',
    ],
    includesEn: [
      'Everything from Club',
      'Not included: AI Agent Engineer and AI Agency Builder',
      '12 months of access at a special annual price',
      'All new learning materials during the year',
    ],
    bonusRu: [],
    bonusEn: [],
    saveLabelRu: 'Экономия 409€',
    saveLabelEn: 'Save €409',
  },
  {
    id: 'ai-insider-pro-annual',
    name: 'AI Insider Pro Annual',
    nameEn: 'AI Insider Pro Annual',
    priceEur: 659,
    periodRu: '/ год',
    periodEn: '/ year',
    billing: 'annual',
    tier: 'pro',
    badge: null,
    featured: false,
    ctaRu: 'Вступить в Pro',
    ctaEn: 'Join Pro',
    includesRu: [
      'Всё из AI Insider Pro',
      '12 месяцев Pro-доступа по специальной цене',
      'Максимальный набор шаблонов для клиентов',
    ],
    includesEn: [
      'Everything from Pro',
      '12 months of Pro access at a special annual price',
      'Maximum template pack for client work',
    ],
    bonusRu: [
      'Agency Toolkit для запуска услуг',
      'Premium Automation Pack',
      'Premium AI Agents Pack',
      'Ресурсы для роста AI-бизнеса',
    ],
    bonusEn: [
      'Agency Toolkit',
      'Premium Automation Pack',
      'Premium AI Agents Pack',
      'Business Growth Resources',
    ],
    saveLabelRu: 'Экономия 649€',
    saveLabelEn: 'Save €649',
  },
]

export const CLUB_MEMBERSHIP_IDS = ['ai-insider-club', 'ai-insider-club-annual']
export const PRO_MEMBERSHIP_IDS = ['ai-insider-pro', 'ai-insider-pro-annual']
export const ALL_MEMBERSHIP_IDS = [...CLUB_MEMBERSHIP_IDS, ...PRO_MEMBERSHIP_IDS]

export function getMembershipPlan(id) {
  return MEMBERSHIP_PLANS.find((p) => p.id === id) || null
}

/** Строки «не входят» в списке includes — показываем с крестиком, не с галочкой */
export function isMembershipExcludedLine(text) {
  const t = String(text || '').trim()
  return t.startsWith('Не входят') || t.startsWith('Not included')
}
