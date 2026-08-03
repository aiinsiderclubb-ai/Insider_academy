const OUTCOMES_BY_CATEGORY = {
  'business-templates': {
    ru: [
      'Стандартизируете delivery и документооборот для клиентских AI-проектов',
      'Снижаете риски до запуска агента в production',
      'Быстрее согласуете scope, бюджет и ответственность с заказчиком',
    ],
    en: [
      'Standardize delivery and documentation for client AI projects',
      'Reduce risk before agents go to production',
      'Align scope, budget and ownership with clients faster',
    ],
  },
  'n8n-workflows': {
    ru: [
      'Запускаете automation без сборки с нуля',
      'Получаете проверенную структуру ошибок, retries и observability',
      'Экономите часы на типовых интеграциях и webhook-логике',
    ],
    en: [
      'Launch automations without building from scratch',
      'Get a proven structure for errors, retries and observability',
      'Save hours on common integrations and webhook logic',
    ],
  },
  'prompt-packs': {
    ru: [
      'Сразу используете промпты в ChatGPT, Claude и Gemini',
      'Ускоряете маркетинг, продажи и операционные задачи',
      'Масштабируете качество ответов через готовые шаблоны',
    ],
    en: [
      'Use prompts instantly in ChatGPT, Claude and Gemini',
      'Speed up marketing, sales and ops workflows',
      'Scale output quality with ready-made templates',
    ],
  },
  'ai-agents': {
    ru: [
      'Разворачиваете агента под конкретный сценарий бизнеса',
      'Получаете routing, tools и escalation из коробки',
      'Быстрее выводите MVP в staging и production',
    ],
    en: [
      'Deploy an agent for a concrete business scenario',
      'Get routing, tools and escalation patterns out of the box',
      'Ship MVP to staging and production faster',
    ],
  },
  'ai-saas-kits': {
    ru: [
      'Собираете production-ready основу AI-продукта',
      'Закрываете security, webhooks и account linking заранее',
      'Сокращаете time-to-market для SaaS и internal tools',
    ],
    en: [
      'Assemble a production-ready AI product foundation',
      'Cover security, webhooks and account linking upfront',
      'Shorten time-to-market for SaaS and internal tools',
    ],
  },
  'saas-kits': {
    ru: [
      'Собираете production-ready основу AI-продукта',
      'Закрываете security, webhooks и account linking заранее',
      'Сокращаете time-to-market для SaaS и internal tools',
    ],
    en: [
      'Assemble a production-ready AI product foundation',
      'Cover security, webhooks and account linking upfront',
      'Shorten time-to-market for SaaS and internal tools',
    ],
  },
  'voice-agents': {
    ru: [
      'Запускаете голосовой сценарий для записи или поддержки',
      'Получаете скрипты, states и метрики звонков',
      'Быстрее тестируете voice flow на реальной аудитории',
    ],
    en: [
      'Launch voice flows for booking or support',
      'Get scripts, states and call metrics',
      'Test voice journeys on real users faster',
    ],
  },
  'mcp-skills': {
    ru: [
      'Подключаете AI к вашим системам через MCP и Skills',
      'Ускоряете интеграцию с CRM, базами и internal API',
      'Делаете stack воспроизводимым для команды',
    ],
    en: [
      'Connect AI to your stack through MCP and Skills',
      'Speed up CRM, database and internal API integration',
      'Make the stack reproducible for your team',
    ],
  },
  'creator-resources': {
    ru: [
      'Ускоряете производство контента и hooks',
      'Получаете repeatable форматы для соцсетей',
      'Меньше blank page — больше опубликованных единиц',
    ],
    en: [
      'Speed up content and hook production',
      'Get repeatable formats for social channels',
      'Less blank page, more published output',
    ],
  },
}

const BODY_BY_CATEGORY = {
  'business-templates': {
    ru: 'Набор создан для агентств, консультантов и in-house команд, которые продают или внедряют AI-агентов. Документы можно сразу отправлять клиенту, использовать на pre-sale аудите и как основу для SOP в delivery.',
    en: 'Built for agencies, consultants and in-house teams selling or deploying AI agents. Use the docs in client deliverables, pre-sale audits and as the backbone for delivery SOPs.',
  },
  'n8n-workflows': {
    ru: 'Workflow собран под production: с понятной структурой узлов, обработкой ошибок и чеклистом перед запуском. Подходит, если вы уже используете n8n и хотите сократить время до первого рабочего сценария.',
    en: 'The workflow is production-oriented: clear node structure, error handling and a pre-launch checklist. Ideal if you already run n8n and want a faster path to a working scenario.',
  },
  'prompt-packs': {
    ru: 'Коллекция промптов организована по задачам и сценариям — без необходимости собирать библиотеку с нуля. Можно копировать в рабочие чаты, Notion или автоматизации.',
    en: 'Prompts are grouped by jobs and scenarios so you do not rebuild a library from scratch. Copy them into chats, Notion or automations.',
  },
  'ai-agents': {
    ru: 'Agent pack включает логику маршрутизации, tools и сценарии escalation — как стартовую точку, которую можно адаптировать под ваш стек и политики безопасности.',
    en: 'The agent pack includes routing logic, tools and escalation scenarios as a starting point you can adapt to your stack and security policies.',
  },
  'ai-saas-kits': {
    ru: 'Kit закрывает типовую инфраструктуру AI-продукта: контракты webhooks, безопасную привязку аккаунта, шаблоны уведомлений и deployment checklist.',
    en: 'The kit covers typical AI product infrastructure: webhook contracts, secure account linking, notification templates and a deployment checklist.',
  },
  'saas-kits': {
    ru: 'Kit закрывает типовую инфраструктуру AI-продукта: контракты webhooks, безопасную привязку аккаунта, шаблоны уведомлений и deployment checklist.',
    en: 'The kit covers typical AI product infrastructure: webhook contracts, secure account linking, notification templates and a deployment checklist.',
  },
}

const DEFAULT_OUTCOMES = {
  ru: [
    'Получаете готовые материалы сразу после покупки',
    'Используете продукт в коммерческих проектах',
    'Обновления входят в доступ без доплат',
  ],
  en: [
    'Get ready-made materials right after purchase',
    'Use the product in commercial client work',
    'Updates are included with your access',
  ],
}

function splitParagraphs(text) {
  return String(text || '')
    .trim()
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function getMarketplaceProductAbout(product, { lang, category } = {}) {
  const ru = lang === 'ru'
  const locale = ru ? 'ru' : 'en'
  const description = ru ? product.descriptionRu : product.descriptionEn
  const lead = ru ? product.shortRu : product.shortEn
  const categoryId = product.categoryId || category?.id

  const bodyFromDb = splitParagraphs(description)
  const bodyFallback = BODY_BY_CATEGORY[categoryId]?.[locale]
  const body = bodyFromDb.length > 0
    ? bodyFromDb
    : bodyFallback
      ? [bodyFallback]
      : category
        ? [ru ? category.descRu : category.descEn].filter(Boolean)
        : []

  const outcomes = OUTCOMES_BY_CATEGORY[categoryId]?.[locale] || DEFAULT_OUTCOMES[locale]

  const moduleCount = (ru ? product.includedRu : product.includedEn)?.length
    || product.includedRu?.length
    || product.includedEn?.length
    || 0

  const facts = [
    category && {
      id: 'category',
      label: ru ? 'Категория' : 'Category',
      value: ru ? category.titleRu : category.titleEn,
      accent: category.accent,
    },
    {
      id: 'version',
      label: ru ? 'Версия' : 'Version',
      value: product.version || (moduleCount > 0 ? `${moduleCount} modules` : '1.0'),
    },
    {
      id: 'license',
      label: ru ? 'Лицензия' : 'License',
      value: product.licenseType === 'commercial-client'
        ? (ru ? 'Для клиентских проектов' : 'Commercial client work')
        : (ru ? 'Коммерческая' : 'Commercial'),
    },
    {
      id: 'install',
      label: ru ? 'Запуск' : 'Setup',
      value: product.installationTime || (ru ? 'Мгновенный доступ' : 'Instant access'),
    },
  ].filter(Boolean)

  return { lead, body, outcomes, facts }
}
