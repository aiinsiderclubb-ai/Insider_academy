export const COURSE_LEVEL_PACKS = [
  {
    id: 'beginner',
    titleRu: 'Beginner',
    titleEn: 'Beginner',
    descRu: 'База для уверенного использования AI и создания контента.',
    descEn: 'Foundation for confident AI use and content creation.',
    courses: [
      { title: 'AI User Pro', courseId: 'ai-user-pro', priceEur: 19 },
      { title: 'AI Content Creator', courseId: 'ai-content-creator', priceEur: 19 },
    ],
  },
  {
    id: 'professional',
    titleRu: 'Professional',
    titleEn: 'Professional',
    descRu: 'Практические навыки для автоматизаций, разговорных систем и SaaS.',
    descEn: 'Practical skills for automations, conversational systems and SaaS.',
    courses: [
      { title: 'Automation Engineer', courseId: 'no-code-automation', priceEur: 39 },
      { title: 'Conversational Systems', courseId: 'ai-chatbot-developer', priceEur: 49 },
      { title: 'SaaS Builder', courseId: 'ai-saas-builder', priceEur: 49 },
    ],
  },
  {
    id: 'expert',
    titleRu: 'Expert',
    titleEn: 'Expert',
    descRu: 'Продвинутые программы для агентных систем и AI-агентства.',
    descEn: 'Advanced programs for agent systems and AI agency building.',
    courses: [
      { title: 'Agent Engineer', courseId: 'ai-agent-architect', priceEur: 59 },
      { title: 'Agency Builder', courseId: 'ai-agency-builder', priceEur: 59 },
    ],
  },
]

export const COURSE_BUNDLES = [
  {
    id: 'ai-creator-pack',
    title: 'AI Creator Pack',
    descRu: 'Для тех, кто хочет уверенно пользоваться AI и создавать контент.',
    descEn: 'For confident AI use and content creation.',
    courseIds: ['ai-user-pro', 'ai-content-creator'],
    includes: ['User Pro', 'Content Creator'],
    priceEur: 34,
    oldPriceEur: 38,
  },
  {
    id: 'ai-builder-pack',
    title: 'AI Builder Pack',
    descRu: 'Автоматизации, conversational-системы и SaaS-продукт в одном пакете.',
    descEn: 'Automation, conversational systems and SaaS product in one pack.',
    courseIds: ['no-code-automation', 'ai-chatbot-developer', 'ai-saas-builder'],
    includes: ['Automation', 'Conversational', 'SaaS'],
    priceEur: 119,
    oldPriceEur: 137,
  },
  {
    id: 'ai-expert-pack',
    title: 'AI Expert Pack',
    descRu: 'Все 7 ключевых программ: от AI-навыков до агентства.',
    descEn: 'All 7 core programs: from AI skills to agency building.',
    courseIds: [
      'ai-user-pro',
      'ai-content-creator',
      'no-code-automation',
      'ai-chatbot-developer',
      'ai-saas-builder',
      'ai-agent-architect',
      'ai-agency-builder',
    ],
    includes: ['Все 7 курсов'],
    includesEn: ['All 7 courses'],
    priceEur: 199,
    oldPriceEur: 293,
    featured: true,
  },
]
