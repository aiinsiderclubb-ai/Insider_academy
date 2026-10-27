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
      'ChatGPT Prompt Vault — 80 промптов',
      'Контент-календарь на 365 дней',
      '40 шаблонов Reels',
      '40 шаблонов Shorts',
    ],
    bonusEn: [
      'ChatGPT Prompt Vault — 80 prompts',
      '365-day content calendar',
      '40 Reels templates',
      '40 Shorts templates',
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
      'Lead Generation Workflow для n8n',
      'CRM Automation Kit для n8n',
      'Шаблон коммерческого предложения',
      'AI Automation Agency OS: старт работы с клиентом',
    ],
    bonusEn: [
      'Lead Generation Workflow for n8n',
      'CRM Automation Kit for n8n',
      'Proposal template',
      'AI Automation Agency OS: client onboarding',
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
      '5 систем n8n: заявки, WhatsApp, поддержка, контент, CRM',
      'Claude Skills Library — 11 скиллов',
      'Sales Prompt Vault — 50 промптов',
      'Discovery Call Framework',
      'Outreach Templates Pack',
    ],
    bonusEn: [
      '5 n8n systems: leads, WhatsApp, support, content, CRM',
      'Claude Skills Library — 11 skills',
      'Sales Prompt Vault — 50 prompts',
      'Discovery call framework',
      'Outreach templates pack',
    ],
    priceEur: 179,
    oldPriceEur: 206,
  },
]
