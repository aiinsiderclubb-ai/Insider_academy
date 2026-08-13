const PRESENTATION = {
  'prompt-packs': {
    kickerRu: 'Рабочая библиотека промптов с переменными и QA',
    kickerEn: 'Production prompt library with variables and QA',
    audienceRu: 'Маркетологам, sales-командам, консультантам и создателям контента.',
    audienceEn: 'For marketers, sales teams, consultants and content creators.',
    stepsRu: [['Контекст', 'Задача, аудитория, ограничения'], ['Сценарий', 'Переменные и готовый prompt'], ['Результат', 'Варианты, проверка, следующий шаг']],
    stepsEn: [['Context', 'Task, audience and constraints'], ['Scenario', 'Variables and production prompt'], ['Output', 'Options, QA and next action']],
  },
  'n8n-workflows': {
    kickerRu: 'Импортируемый workflow с retry, логами и rollback',
    kickerEn: 'Importable workflow with retries, logs and rollback',
    audienceRu: 'Automation-инженерам, агентствам и внутренним ops-командам.',
    audienceEn: 'For automation engineers, agencies and internal ops teams.',
    stepsRu: [['Триггер', 'Webhook или событие системы'], ['Обработка', 'Валидация, дедупликация, действие'], ['Контроль', 'Retry, журнал и human alert']],
    stepsEn: [['Trigger', 'Webhook or system event'], ['Processing', 'Validation, deduplication and action'], ['Control', 'Retry, audit log and human alert']],
  },
  'ai-agents': {
    kickerRu: 'Агент с tools, guardrails и human handoff',
    kickerEn: 'Agent with tools, guardrails and human handoff',
    audienceRu: 'Продуктовым командам, интеграторам и AI-агентствам.',
    audienceEn: 'For product teams, integrators and AI agencies.',
    stepsRu: [['Намерение', 'Понимание запроса и policy check'], ['Действие', 'Безопасный вызов нужного tool'], ['Контроль', 'Проверка результата или handoff']],
    stepsEn: [['Intent', 'Request understanding and policy check'], ['Action', 'Safe call to required tool'], ['Control', 'Result validation or human handoff']],
  },
  'business-templates': {
    kickerRu: 'Клиентские документы, scope и критерии приёмки',
    kickerEn: 'Client documents, scope and acceptance criteria',
    audienceRu: 'AI-агентствам, консультантам, delivery- и sales-командам.',
    audienceEn: 'For AI agencies, consultants, delivery and sales teams.',
    stepsRu: [['Discovery', 'Цель, процесс и ограничения клиента'], ['Документ', 'Scope, KPI, цена и ответственность'], ['Согласование', 'Acceptance criteria и handoff']],
    stepsEn: [['Discovery', 'Client goal, process and constraints'], ['Document', 'Scope, KPI, price and ownership'], ['Approval', 'Acceptance criteria and handoff']],
  },
  'saas-kits': {
    kickerRu: 'Основа AI-продукта: auth, billing, jobs и deploy',
    kickerEn: 'AI product foundation: auth, billing, jobs and deploy',
    audienceRu: 'Фаундерам, разработчикам и product-командам.',
    audienceEn: 'For founders, developers and product teams.',
    stepsRu: [['Запрос', 'Пользователь, auth и лимиты'], ['AI job', 'Очередь, обработка и проверка'], ['Доступ', 'Storage, billing и audit log']],
    stepsEn: [['Request', 'User, auth and limits'], ['AI job', 'Queue, processing and validation'], ['Access', 'Storage, billing and audit log']],
  },
  'creator-resources': {
    kickerRu: 'Контент-система от идеи до публикации',
    kickerEn: 'Content system from idea to publishing',
    audienceRu: 'Экспертам, creators, SMM- и content-командам.',
    audienceEn: 'For experts, creators, social and content teams.',
    stepsRu: [['Идея', 'Цель, формат и угол подачи'], ['Производство', 'Hook, структура и рабочий пример'], ['Публикация', 'Календарь, CTA и QA']],
    stepsEn: [['Idea', 'Goal, format and content angle'], ['Production', 'Hook, structure and working example'], ['Publishing', 'Calendar, CTA and QA']],
  },
  'mcp-skills': {
    kickerRu: 'Tool-система с permission model и security tests',
    kickerEn: 'Tool system with permission model and security tests',
    audienceRu: 'Agent-инженерам, разработчикам и владельцам внутренних систем.',
    audienceEn: 'For agent engineers, developers and internal system owners.',
    stepsRu: [['Запрос', 'Выбор tool и проверка schema'], ['Политика', 'Права, PII и подтверждение write'], ['Ответ', 'Вызов API, валидация и audit log']],
    stepsEn: [['Request', 'Tool selection and schema validation'], ['Policy', 'Permissions, PII and write approval'], ['Response', 'API call, validation and audit log']],
  },
  'voice-agents': {
    kickerRu: 'Голосовой сценарий с booking, tools и handoff',
    kickerEn: 'Voice flow with booking, tools and handoff',
    audienceRu: 'Клиникам, салонам, недвижимости и сервисному бизнесу.',
    audienceEn: 'For clinics, salons, real estate and service businesses.',
    stepsRu: [['Звонок', 'Намерение, контекст и consent'], ['Действие', 'Слот, CRM или нужный tool'], ['Завершение', 'Подтверждение, SMS и handoff']],
    stepsEn: [['Call', 'Intent, context and consent'], ['Action', 'Slot, CRM or required tool'], ['Completion', 'Confirmation, SMS and handoff']],
  },
}

const FALLBACK = PRESENTATION['ai-agents']

export function getMarketplacePresentation(product, ru) {
  const entry = PRESENTATION[product.categoryId] || FALLBACK
  return {
    kicker: ru ? entry.kickerRu : entry.kickerEn,
    audience: ru ? entry.audienceRu : entry.audienceEn,
    steps: ru ? entry.stepsRu : entry.stepsEn,
  }
}
