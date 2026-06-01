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
    bonusRu: [
      'Prompt Pack для контента',
      'Контент-план на 30 дней',
      'Шаблоны Reels / Shorts',
    ],
    bonusEn: [
      'Content Prompt Pack',
      '30-day content plan',
      'Reels / Shorts templates',
    ],
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
    bonusRu: [
      'n8n workflow pack',
      'Шаблон ТЗ для клиента',
      'MVP checklist для SaaS',
    ],
    bonusEn: [
      'n8n workflow pack',
      'Client brief template',
      'SaaS MVP checklist',
    ],
    priceEur: 119,
    oldPriceEur: 137,
  },
  {
    id: 'ai-business-launch-pack',
    title: 'AI Business Launch Pack',
    descRu: 'Пакет для запуска AI-услуги: автоматизация, бот, SaaS-идея, агенты и упаковка предложения.',
    descEn: 'Launch an AI service: automation, bot, SaaS idea, agents and offer packaging.',
    courseIds: [
      'no-code-automation',
      'ai-chatbot-developer',
      'ai-saas-builder',
      'ai-agent-architect',
      'ai-agency-builder',
    ],
    includes: ['Automation', 'Chatbot', 'SaaS MVP', 'Agent System', 'Agency Launch Kit'],
    includesEn: ['Automation', 'Chatbot', 'SaaS MVP', 'Agent System', 'Agency Launch Kit'],
    bonusRu: [
      'Agency Launch Toolkit',
      'Outreach scripts',
      'Proposal template',
      'Delivery checklist',
    ],
    bonusEn: [
      'Agency Launch Toolkit',
      'Outreach scripts',
      'Proposal template',
      'Delivery checklist',
    ],
    priceEur: 199,
    oldPriceEur: 255,
    featured: true,
  },
]
