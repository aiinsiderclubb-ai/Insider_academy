export const COURSE_LEVEL_PACKS = [
  {
    id: 'creator',
    titleRu: 'Creator',
    titleEn: 'Creator',
    descRu: 'Productivity + контент для уверенной работы с AI.',
    descEn: 'Productivity + content for confident AI work.',
    courses: [
      { title: 'AI Productivity Master', courseId: 'ai-productivity-master', priceEur: 29 },
      { title: 'AI Content Creator', courseId: 'ai-content-creator', priceEur: 39 },
    ],
  },
  {
    id: 'freelancer',
    titleRu: 'Freelancer',
    titleEn: 'Freelancer',
    descRu: 'Контент, продуктивность и автоматизации для фриланса.',
    descEn: 'Content, productivity and automations for freelancers.',
    courses: [
      { title: 'AI Productivity Master', courseId: 'ai-productivity-master', priceEur: 29 },
      { title: 'AI Content Creator', courseId: 'ai-content-creator', priceEur: 39 },
      { title: 'AI Automation Engineer', courseId: 'ai-automation-engineer', priceEur: 59 },
    ],
  },
  {
    id: 'business',
    titleRu: 'Business',
    titleEn: 'Business',
    descRu: 'Полный стек до AI Agent Engineer для агентств и бизнеса.',
    descEn: 'Full stack through AI Agent Engineer for agencies and business.',
    courses: [
      { title: 'AI Productivity Master', courseId: 'ai-productivity-master', priceEur: 29 },
      { title: 'AI Content Creator', courseId: 'ai-content-creator', priceEur: 39 },
      { title: 'AI Automation Engineer', courseId: 'ai-automation-engineer', priceEur: 59 },
      { title: 'AI Agent Engineer', courseId: 'ai-agent-engineer', priceEur: 79 },
    ],
  },
]

export function getCourseBundle(id) {
  return COURSE_BUNDLES.find((b) => b.id === id) || null
}

export const COURSE_BUNDLES = [
  {
    id: 'ai-creator-pack',
    title: 'Creator Pack',
    descRu: 'AI Productivity Master + AI Content Creator для работы и контента.',
    descEn: 'AI Productivity Master + AI Content Creator for work and content.',
    courseIds: ['ai-productivity-master', 'ai-content-creator'],
    includes: ['Productivity Master', 'Content Creator'],
    bonusRu: [
      'Prompt Library (500+ промптов)',
      'Контент-план на 90 дней',
      '100 идей Reels',
      '100 идей Shorts',
    ],
    bonusEn: [
      'Prompt Library (500+ prompts)',
      '90-day content plan',
      '100 Reels ideas',
      '100 Shorts ideas',
    ],
    priceEur: 69,
    oldPriceEur: 97,
  },
  {
    id: 'ai-freelancer-pack',
    title: 'Freelancer Pack',
    descRu: 'Продуктивность, контент и автоматизации для фрилансеров.',
    descEn: 'Productivity, content and automations for freelancers.',
    courseIds: ['ai-productivity-master', 'ai-content-creator', 'ai-automation-engineer'],
    includes: ['Productivity Master', 'Content Creator', 'Automation Engineer'],
    bonusRu: [
      '10 готовых n8n Workflow',
      'Proposal Template',
      'Client Onboarding Pack',
      'CRM Template',
    ],
    bonusEn: [
      '10 ready n8n workflows',
      'Proposal template',
      'Client onboarding pack',
      'CRM template',
    ],
    priceEur: 119,
    oldPriceEur: 127,
    featured: true,
  },
  {
    id: 'ai-business-pack',
    title: 'Business Pack',
    descRu: 'Productivity, контент, автоматизации и AI Agent Engineer.',
    descEn: 'Productivity, content, automations and AI Agent Engineer.',
    courseIds: [
      'ai-productivity-master',
      'ai-content-creator',
      'ai-automation-engineer',
      'ai-agent-engineer',
    ],
    includes: ['Productivity Master', 'Content Creator', 'Automation Engineer', 'Agent Engineer'],
    includesEn: ['Productivity Master', 'Content Creator', 'Automation Engineer', 'Agent Engineer'],
    bonusRu: [
      '25 n8n Workflow',
      '10 AI Agent Templates',
      'Sales Scripts',
      'Discovery Call Framework',
      'Outreach Scripts',
    ],
    bonusEn: [
      '25 n8n workflows',
      '10 AI agent templates',
      'Sales scripts',
      'Discovery call framework',
      'Outreach scripts',
    ],
    priceEur: 179,
    oldPriceEur: 206,
  },
]
