/** Контент страниц «Подробнее» для Club и Pro */

export const PLAN_COMPARISON_ROWS = {
  ru: [
    ['Все обычные видеоуроки Academy', true, true],
    ['Pro-only курсы: Agent Engineer и Agency Builder', false, true],
    ['Учебные материалы доступных курсов', true, true],
    ['Домашние задания и сертификаты', true, true],
    ['Новые базовые курсы внутри Academy', true, true],
    ['Промпт-библиотека и чек-листы', false, true],
    ['Готовые n8n workflow', false, true],
    ['Шаблоны AI-агентов, ботов и voice agents', false, true],
    ['Скрипты продаж и outreach для клиентов', false, true],
    ['Премиальные кейсы и ресурсы для AI-бизнеса', false, true],
  ],
  en: [
    ['All regular Academy video lessons', true, true],
    ['Pro-only courses: Agent Engineer and Agency Builder', false, true],
    ['Learning materials for available courses', true, true],
    ['Homework and certificates', true, true],
    ['Future core Academy courses', true, true],
    ['Prompt library and checklists', false, true],
    ['Ready-to-use n8n workflows', false, true],
    ['AI agent, chatbot and voice agent templates', false, true],
    ['Sales scripts and client outreach', false, true],
    ['Premium case studies and AI business resources', false, true],
  ],
}

export const MEMBERSHIP_TIER_DETAILS = {
  club: {
    slug: 'club',
    nameRu: 'AI Insider Club',
    nameEn: 'AI Insider Club',
    badgeRu: 'Для обучения',
    badgeEn: 'For learning',
    heroRu: 'Все основные курсы Academy в одной подписке',
    heroEn: 'All core Academy courses in one subscription',
    leadRu:
      'Club открывает видеоуроки, материалы, домашние задания и сертификаты по обычным курсам. Agent Engineer и Agency Builder доступны в Pro или в пакете курсов.',
    leadEn:
      'Club unlocks video lessons, materials, homework and certificates for regular courses. Agent Engineer and Agency Builder are available in Pro or a course pack.',
    forWhoRu: [
      'Новичкам, которые хотят пройти Academy без покупки каждого курса отдельно',
      'Специалистам, которым нужен доступ к обучению, а не к Pro-шаблонам',
      'Тем, кто планирует освоить автоматизации, контент, conversational и SaaS-треки',
    ],
    forWhoEn: [
      'Beginners who want Academy access without buying each course separately',
      'Specialists who need learning access, not Pro client templates',
      'Anyone planning to complete automation, content, conversational and SaaS tracks',
    ],
    notIncludedRu: [
      'AI Agent Engineer',
      'AI Agency Builder',
      'Готовые workflow, outreach и sales-шаблоны Pro',
    ],
    notIncludedEn: [
      'AI Agent Engineer',
      'AI Agency Builder',
      'Pro workflows, outreach and sales templates',
    ],
    faqRu: [
      {
        q: 'Можно ли купить Pro-only курсы отдельно?',
        a: 'Да. Agent Engineer и Agency Builder можно купить поштучно или взять AI Business Launch Pack.',
      },
      {
        q: 'Что даёт годовой Club?',
        a: '12 месяцев доступа по цене ниже, чем 12 месяцев подписки. Все обновления материалов включены.',
      },
    ],
    faqEn: [
      {
        q: 'Can I buy Pro-only courses separately?',
        a: 'Yes. Agent Engineer and Agency Builder can be purchased individually or via the Business Launch pack.',
      },
      {
        q: 'What does Club Annual include?',
        a: '12 months of access at a lower total price than paying monthly. Material updates are included.',
      },
    ],
  },
  pro: {
    slug: 'pro',
    nameRu: 'AI Insider Pro',
    nameEn: 'AI Insider Pro',
    badgeRu: 'Лучший выбор для заработка',
    badgeEn: 'Best for monetization',
    heroRu: 'Обучение + Pro-курсы + шаблоны для клиентов',
    heroEn: 'Learning + Pro courses + client-ready templates',
    leadRu:
      'Pro включает всё из Club, плюс Agent Engineer, Agency Builder, n8n workflow, шаблоны агентов, ботов, voice agents и материалы для продаж услуг.',
    leadEn:
      'Pro includes everything in Club, plus Agent Engineer, Agency Builder, n8n workflows, agent templates, bots, voice agents and sales resources.',
    forWhoRu: [
      'Фрилансерам и агентствам, которые внедряют AI для клиентов',
      'Тем, кто хочет продавать автоматизации, ботов и агентные системы',
      'Специалистам, которым нужны готовые workflow и скрипты, а не только уроки',
    ],
    forWhoEn: [
      'Freelancers and agencies implementing AI for clients',
      'Anyone selling automations, bots and agent systems',
      'Specialists who need ready workflows and scripts, not lessons only',
    ],
    notIncludedRu: [],
    notIncludedEn: [],
    faqRu: [
      {
        q: 'Нужен ли Club перед Pro?',
        a: 'Нет. Pro уже включает все возможности Club.',
      },
      {
        q: 'Что в бонусе Pro Annual?',
        a: 'Agency Toolkit, Premium Automation Pack, Premium AI Agents Pack и ресурсы для роста AI-бизнеса.',
      },
    ],
    faqEn: [
      {
        q: 'Do I need Club before Pro?',
        a: 'No. Pro already includes everything in Club.',
      },
      {
        q: 'What is included in Pro Annual bonus?',
        a: 'Agency Toolkit, Premium Automation Pack, Premium AI Agents Pack and business growth resources.',
      },
    ],
  },
}

export const VALID_MEMBERSHIP_TIERS = Object.keys(MEMBERSHIP_TIER_DETAILS)
