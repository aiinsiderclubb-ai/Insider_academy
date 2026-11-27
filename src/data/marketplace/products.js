/** AI Insider Marketplace — каталог продуктов */

const FAQ_RU = [
  { q: 'Как получить файлы после оплаты?', a: 'Сразу в личном кабинете → Marketplace → Мои загрузки.' },
  { q: 'Можно ли использовать в коммерческих проектах?', a: 'Да, лицензия на использование в работе с клиентами включена.' },
  { q: 'Есть ли обновления?', a: 'Да, пожизненный доступ к обновлениям в рамках продукта.' },
]
const FAQ_EN = [
  { q: 'How do I get files after payment?', a: 'Instantly in your account → Marketplace → My downloads.' },
  { q: 'Can I use this commercially?', a: 'Yes, client work license is included.' },
  { q: 'Do I get updates?', a: 'Yes, lifetime updates for this product.' },
]

const CATEGORY_CONTENT = {
  'prompt-packs': {
    files: ['JSON', 'PDF'],
    ru: ['Промпты по сценариям', 'Переменные и примеры заполнения', 'Чеклист проверки результата', 'Коммерческая инструкция'],
    en: ['Prompts grouped by scenario', 'Variables and filled examples', 'Output QA checklist', 'Commercial-use guide'],
    integrations: ['ChatGPT', 'Claude', 'Gemini', 'Notion'],
    sampleRu: 'РОЛЬ: эксперт по [задача].\nВХОД: [контекст], [аудитория], [ограничения].\nРЕЗУЛЬТАТ: 3 варианта + таблица рисков + следующий шаг.\nПРОВЕРКА: факты отделить от предположений; не выдумывать источники.',
    sampleEn: 'ROLE: expert in [job].\nINPUT: [context], [audience], [constraints].\nOUTPUT: 3 options + risk table + next action.\nQA: separate facts from assumptions; never invent sources.',
  },
  'n8n-workflows': {
    files: ['ZIP', 'JSON', 'PDF'],
    ru: ['Импортируемый n8n workflow', 'Карта credentials без секретов', 'Error/retry ветки', 'Setup и rollback checklist'],
    en: ['Importable n8n workflow', 'Credential map without secrets', 'Error and retry branches', 'Setup and rollback checklist'],
    integrations: ['n8n', 'Webhook', 'HTTP API', 'Slack'],
    sampleRu: 'Webhook → Validate input → Deduplicate → Main action → Retry (3x) → Dead-letter log → Human alert',
    sampleEn: 'Webhook → Validate input → Deduplicate → Main action → Retry (3x) → Dead-letter log → Human alert',
  },
  'ai-agents': {
    files: ['ZIP', 'JSON', 'PDF'],
    ru: ['System prompt и guardrails', 'Tool schemas', 'Escalation и human handoff', 'Evaluation dataset'],
    en: ['System prompt and guardrails', 'Tool schemas', 'Escalation and human handoff', 'Evaluation dataset'],
    integrations: ['OpenAI', 'Anthropic', 'Webhook', 'n8n'],
    sampleRu: 'INTENT → POLICY CHECK → TOOL CALL → RESULT VALIDATION → ANSWER / HUMAN HANDOFF\nЗапрещено: выполнять действие без подтверждения критических полей.',
    sampleEn: 'INTENT → POLICY CHECK → TOOL CALL → RESULT VALIDATION → ANSWER / HUMAN HANDOFF\nForbidden: execute action before critical fields are confirmed.',
  },
  'saas-kits': {
    files: ['ZIP', 'JSON', 'PDF'],
    ru: ['Архитектура MVP', 'API и webhook contracts', 'Auth/billing checklist', 'Deploy, monitoring и rollback'],
    en: ['MVP architecture', 'API and webhook contracts', 'Auth and billing checklist', 'Deploy, monitoring and rollback'],
    integrations: ['Postgres', 'Stripe', 'OpenAI', 'S3'],
    sampleRu: 'USER → AUTH → API → AI JOB → VERIFIED OUTPUT → STORAGE\nОбязательно: rate limit, idempotency, audit log, revoke access.',
    sampleEn: 'USER → AUTH → API → AI JOB → VERIFIED OUTPUT → STORAGE\nRequired: rate limit, idempotency, audit log, revoke access.',
  },
  'business-templates': {
    files: ['ZIP', 'DOCX', 'PDF'],
    ru: ['Клиентский документ', 'Заполненный пример', 'Discovery checklist', 'Scope и acceptance criteria'],
    en: ['Client-facing document', 'Filled example', 'Discovery checklist', 'Scope and acceptance criteria'],
    integrations: ['Google Docs', 'Notion', 'PDF'],
    sampleRu: 'ЦЕЛЬ → ТЕКУЩИЙ ПРОЦЕСС → РИСК → SCOPE → KPI → ACCEPTANCE → HANDOFF',
    sampleEn: 'GOAL → CURRENT PROCESS → RISK → SCOPE → KPI → ACCEPTANCE → HANDOFF',
  },
  'creator-resources': {
    files: ['ZIP', 'CSV', 'PDF'],
    ru: ['Контент-база', 'Фильтры по формату и цели', 'Рабочие примеры', 'План публикации и QA'],
    en: ['Content database', 'Filters by format and goal', 'Working examples', 'Publishing plan and QA'],
    integrations: ['Notion', 'Canva', 'Google Sheets'],
    sampleRu: 'HOOK: [контраст] + [конкретный результат] + [открытая петля]\nBODY: проблема → механизм → пример → CTA.',
    sampleEn: 'HOOK: [contrast] + [specific outcome] + [open loop]\nBODY: problem → mechanism → example → CTA.',
  },
  'mcp-skills': {
    files: ['ZIP', 'JSON', 'MD'],
    ru: ['MCP/Skill manifest', 'Tool schemas', 'Permission model', 'Setup и security tests'],
    en: ['MCP/Skill manifest', 'Tool schemas', 'Permission model', 'Setup and security tests'],
    integrations: ['Claude', 'MCP', 'OAuth', 'REST API'],
    sampleRu: '{ "tool": "search_records", "input": { "query": "[term]" }, "policy": { "write": false, "pii": "redact" } }',
    sampleEn: '{ "tool": "search_records", "input": { "query": "[term]" }, "policy": { "write": false, "pii": "redact" } }',
  },
  'voice-agents': {
    files: ['ZIP', 'JSON', 'PDF'],
    ru: ['Диалоговые states', 'Voice-provider configs', 'Tools и calendar schema', 'Test calls и handoff rules'],
    en: ['Dialog states', 'Voice provider configs', 'Tools and calendar schema', 'Test calls and handoff rules'],
    integrations: ['Vapi', 'Retell', 'ElevenLabs', 'Google Calendar'],
    sampleRu: 'ПРИВЕТСТВИЕ → ЦЕЛЬ ЗВОНКА → ПРОВЕРКА СЛОТА → ПОДТВЕРЖДЕНИЕ → ЗАПИСЬ → SMS / HANDOFF',
    sampleEn: 'GREETING → CALL GOAL → SLOT CHECK → CONFIRMATION → BOOKING → SMS / HANDOFF',
  },
}

function enrichedContent(base) {
  const content = CATEGORY_CONTENT[base.categoryId] || CATEGORY_CONTENT['ai-agents']
  return {
    version: '1.0.0-preview',
    fileTypes: content.files,
    includedRu: content.ru,
    includedEn: content.en,
    testedIntegrations: content.integrations,
    changelogRu: ['Структура пакета зафиксирована', 'Добавлены security/QA checkpoints', 'Подготовлен preview-фрагмент'],
    changelogEn: ['Package structure defined', 'Security and QA checkpoints added', 'Preview sample prepared'],
    freePreview: {
      type: base.categoryId === 'n8n-workflows' ? 'workflow' : 'prompt',
      titleRu: `Демо-фрагмент: ${base.titleRu}`,
      titleEn: `Demo sample: ${base.titleEn || base.titleRu}`,
      contentRu: content.sampleRu,
      contentEn: content.sampleEn,
    },
  }
}

function product(base) {
  const slug = base.slug
  return {
    ...enrichedContent(base),
    faqRu: FAQ_RU,
    faqEn: FAQ_EN,
    badges: [],
    badge: null,
    relatedIds: [],
    recommendsForCourses: [],
    screenshots: [],
    videoPreview: null,
    coverImage: base.coverImage ?? null,
    ...base,
    badge: base.badge === 'hit' ? null : base.badge,
    badges: (base.badges || []).filter((badge) => !['top-selling', 'most-downloaded'].includes(badge)),
  }
}

export const MARKETPLACE_PRODUCTS = [
  product({
    id: 'mp-prompt-chatgpt-vault',
    slug: 'chatgpt-prompt-vault',
    categoryId: 'prompt-packs',
    productType: 'prompt-pack',
    titleRu: 'ChatGPT Prompt Vault',
    titleEn: 'ChatGPT Prompt Vault',
    shortRu: '80 рабочих промптов для оффера, сайта, соцсетей, писем, продаж, документов и анализа.',
    shortEn: '80 working prompts for offers, website copy, social, email, sales, documents and analysis. Files are in Russian.',
    fileTypes: ['MD', 'JSON'],
    includedRu: ['80 промптов в 8 разделах', 'Версия для чтения и копирования', 'JSON для загрузки в свои инструменты', 'Инструкция: как подставлять контекст'],
    includedEn: ['80 prompts in 8 sections', 'Readable copy-and-paste version', 'JSON for your own tools', 'Guide to adding context'],
    priceEur: 29,
    coverGradient: 'linear-gradient(135deg, #7c3aed, #ec4899)',
    coverIcon: '✨',
    creatorId: 'creator-insider',
    badges: ['top-selling', 'trending'],
    badge: 'hit',
    freePreview: {
      type: 'prompt',
      titleRu: 'Бесплатный промпт: оффер за 60 секунд',
      titleEn: 'Free prompt: offer in 60 seconds',
      contentRu: `Ты — маркетолог SaaS. Напиши оффер для [продукт] на аудиторию [кто].
Формат:
1) Боль (1 предложение)
2) Обещание результата
3) Доказательство / механизм
4) CTA
Без воды, на русском, максимум 80 слов.`,
      contentEn: `You are a SaaS marketer. Write an offer for [product] targeting [audience].
Format:
1) Pain (1 sentence)
2) Outcome promise
3) Proof / mechanism
4) CTA
No fluff, max 80 words.`,
    },
    recommendsForCourses: ['ai-content-creator', 'ai-productivity-master'],
    relatedIds: ['mp-prompt-seo-vault', 'mp-prompt-sales-vault'],
  }),
  product({
    id: 'mp-prompt-seo-vault',
    slug: 'seo-prompt-vault',
    categoryId: 'prompt-packs',
    productType: 'prompt-pack',
    titleRu: 'SEO Prompt Vault',
    titleEn: 'SEO Prompt Vault',
    shortRu: '50 промптов для SEO: семантика, статьи, страницы услуг, технический и локальный SEO, ссылки.',
    shortEn: '50 SEO prompts: keywords, articles, service pages, technical and local SEO, links. Files are in Russian.',
    fileTypes: ['MD', 'JSON'],
    includedRu: ['50 промптов в 5 разделах', 'Семантика и структура сайта', 'Статьи, страницы услуг и товаров', 'JSON для загрузки в свои инструменты'],
    includedEn: ['50 prompts in 5 sections', 'Keywords and site structure', 'Articles, service and product pages', 'JSON for your own tools'],
    priceEur: 24,
    coverGradient: 'linear-gradient(135deg, #06b6d4, #22c55e)',
    coverIcon: '🔍',
    creatorId: 'creator-insider',
    badges: ['new'],
    recommendsForCourses: ['ai-content-creator'],
    relatedIds: ['mp-prompt-chatgpt-vault'],
  }),
  product({
    id: 'mp-prompt-sales-vault',
    slug: 'sales-prompt-vault',
    categoryId: 'prompt-packs',
    productType: 'prompt-pack',
    titleRu: 'Sales Prompt Vault',
    titleEn: 'Sales Prompt Vault',
    shortRu: '50 промптов для продаж: первое касание, квалификация, предложение, возражения, закрытие.',
    shortEn: '50 sales prompts: first touch, qualification, proposal, objections, closing. Files are in Russian.',
    fileTypes: ['MD', 'JSON'],
    includedRu: ['50 промптов в 5 разделах', 'От первого сообщения до работы с клиентом', 'JSON для загрузки в свои инструменты', 'Инструкция по работе с промптами'],
    includedEn: ['50 prompts in 5 sections', 'From first message to account work', 'JSON for your own tools', 'Usage guide'],
    priceEur: 19,
    coverGradient: 'linear-gradient(135deg, #f97316, #ef4444)',
    coverIcon: '💼',
    creatorId: 'creator-insider',
    badges: ['most-downloaded'],
    relatedIds: ['mp-prompt-chatgpt-vault', 'mp-biz-outreach-pack'],
  }),
  product({
    id: 'mp-prompt-marketing-vault',
    slug: 'marketing-prompt-vault',
    categoryId: 'prompt-packs',
    productType: 'prompt-pack',
    titleRu: 'Marketing Prompt Vault',
    titleEn: 'Marketing Prompt Vault',
    shortRu: '50 промптов для маркетинга: стратегия, реклама, лендинги, email, контент и бренд.',
    shortEn: '50 marketing prompts: strategy, ads, landing pages, email, content and brand. Files are in Russian.',
    fileTypes: ['MD', 'JSON'],
    includedRu: ['50 промптов в 5 разделах', 'Стратегия, аудитория и реклама', 'Лендинги, email и удержание', 'JSON для загрузки в свои инструменты'],
    includedEn: ['50 prompts in 5 sections', 'Strategy, audience and ads', 'Landing pages, email and retention', 'JSON for your own tools'],
    priceEur: 29,
    coverGradient: 'linear-gradient(135deg, #a855f7, #f97316)',
    coverIcon: '📣',
    creatorId: 'creator-insider',
    relatedIds: ['mp-prompt-chatgpt-vault'],
  }),
  product({
    id: 'mp-prompt-research-vault',
    slug: 'ai-research-prompt-vault',
    categoryId: 'prompt-packs',
    productType: 'prompt-pack',
    titleRu: 'AI Research Prompt Vault',
    titleEn: 'AI Research Prompt Vault',
    shortRu: '40 промптов для исследований: рынок, конкуренты, клиенты, проверка источников и выводы.',
    shortEn: '40 research prompts: market, competitors, customers, source checks and conclusions. Files are in Russian.',
    fileTypes: ['MD', 'JSON'],
    includedRu: ['40 промптов в 4 разделах', 'Рынок, спрос и конкуренты', 'Интервью, опросы и синтез', 'JSON для загрузки в свои инструменты'],
    includedEn: ['40 prompts in 4 sections', 'Market, demand and competitors', 'Interviews, surveys and synthesis', 'JSON for your own tools'],
    priceEur: 39,
    coverGradient: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    coverIcon: '🧠',
    creatorId: 'creator-insider',
    badges: ['new'],
    relatedIds: ['mp-prompt-chatgpt-vault'],
  }),
  product({
    id: 'mp-workflow-lead-gen',
    slug: 'lead-generation-workflow',
    categoryId: 'n8n-workflows',
    productType: 'automation-pack',
    titleRu: 'Lead Generation Workflow',
    titleEn: 'Lead Generation Workflow',
    shortRu: 'Заявки со всех форм в одну Google Таблицу: проверка, дубли и спам, оценка моделью, сообщение менеджеру в Telegram, напоминания о заявках без ответа и утренний отчёт. Четыре воркфлоу, проверенные в n8n 2.44.',
    shortEn: 'Leads from every form into one Google Sheet: validation, duplicates and spam, AI scoring, a Telegram alert to the manager, reminders for unanswered leads and a morning report. Four workflows tested in n8n 2.44. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD'],
    includedRu: ['4 воркфлоу n8n: приём, напоминания, отчёт, оповещение о сбоях', 'Tilda, WordPress, Webflow, Google Forms и своя форма', 'Оценка заявок моделью и запасные правила', 'Дубли, двойные клики и спам отсеиваются', 'Готовая HTML-форма и скрипт для Google Forms', '6 инструкций и проверочные запросы'],
    includedEn: ['4 n8n workflows: intake, reminders, report, error alerts', 'Tilda, WordPress, Webflow, Google Forms and your own form', 'AI lead scoring with rule-based fallback', 'Duplicates, double clicks and spam filtered out', 'Ready HTML form and a Google Forms script', '6 guides and test requests'],
    priceEur: 49,
    coverGradient: 'linear-gradient(135deg, #16a34a, #06b6d4)',
    coverIcon: '📈',
    creatorId: 'creator-n8n-lab',
    badges: ['top-selling', 'trending'],
    badge: 'hit',
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: как идёт заявка',
      titleEn: 'Sample: how a lead flows',
      contentRu: `Форма → Lead Intake
  неверный токен → 403
  нет телефона и почты → 422
  ответ форме «Спасибо» — сразу
  тот же человек за 30 дней → обновить его строку
  двойной клик → пропустить
  спам → статус spam, никому не писать
  модель: оценка 1–5, кратко, что уточнить
    не ответила → оценка по правилам
  таблица недоступна → вся заявка в Telegram
  оценка ≥ 4 → горячий чат`,
      contentEn: `Form → Lead Intake
  wrong token → 403
  no phone or email → 422
  answer the form at once
  same person within 30 days → update their row
  double click → skip
  spam → status spam, notify nobody
  model: score 1–5, summary, what to ask
    no answer → score by rules
  sheet down → whole lead to Telegram
  score ≥ 4 → hot chat`,
    },
    recommendsForCourses: ['ai-automation-engineer', 'first-automation-n8n'],
    relatedIds: ['mp-workflow-crm', 'mp-workflow-whatsapp'],
  }),
  product({
    id: 'mp-workflow-whatsapp',
    slug: 'whatsapp-sales-bot',
    categoryId: 'n8n-workflows',
    productType: 'automation-pack',
    titleRu: 'WhatsApp Sales Bot',
    titleEn: 'WhatsApp Sales Bot',
    shortRu: 'Консультант в WhatsApp Business через официальный Cloud API: отвечает по вашему каталогу из Google Таблицы, по ходу разговора узнаёт потребность, бюджет и срок, горячего клиента передаёт менеджерам в Telegram — они отвечают клиенту прямо оттуда. Проверка подписи Meta, отписка, одно напоминание в окне 24 часа, утренний отчёт. Проверено в n8n 2.44.',
    shortEn: 'A WhatsApp Business consultant on the official Cloud API: answers from your catalog in Google Sheets, learns need, budget and timing along the way, and hands a ready client to managers in Telegram, who reply to the client right from there. Meta signature check, opt-out, one follow-up inside the 24-hour window, a morning report. Tested in n8n 2.44. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD'],
    includedRu: ['5 воркфлоу n8n: бот, ответы менеджеров, напоминание, отчёт, оповещение о сбоях', 'Официальный WhatsApp Cloud API и проверка подписи Meta', 'Цены только из вашего каталога, кнопки быстрого ответа', 'Квалификация: потребность, бюджет, срок — в карточке клиента', 'Менеджеры отвечают из Telegram, кнопки «Беру» и «Вернуть боту»', 'Подключение Meta по шагам, шаблоны таблиц и скрипт проверки'],
    includedEn: ['5 n8n workflows: bot, manager replies, follow-up, report, error alerts', 'Official WhatsApp Cloud API with Meta signature check', 'Prices only from your catalog, quick-reply buttons', 'Qualification: need, budget, timing on the client card', 'Managers reply from Telegram, Take and Back-to-bot buttons', 'Step-by-step Meta setup, sheet templates and a test script'],
    priceEur: 79,
    coverGradient: 'linear-gradient(135deg, #22c55e, #84cc16)',
    coverIcon: '💬',
    creatorId: 'creator-n8n-lab',
    badges: ['top-selling'],
    recommendsForCourses: ['ai-automation-engineer'],
    relatedIds: ['mp-workflow-lead-gen', 'mp-agent-sales'],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: передача горячего клиента',
      titleEn: 'Sample: handing over a ready client',
      contentRu: `Горячий клиент в WhatsApp
Клиент: Ира, +380501112233
Причина: клиент готов к следующему шагу
Сообщение: Квартира 60 м², бюджет 9000, начать в ноябре
Что нужно: ремонт 60 м²
Бюджет: 9000 €
Когда: ноябрь
Ответить: ответом на это сообщение — текст уйдёт клиенту в WhatsApp.
[Беру]  [Вернуть боту]`,
      contentEn: `Hot client in WhatsApp
Client: Ira, +380501112233
Reason: ready for the next step
Message: 60 m² flat, budget 9000, start in November
Need: 60 m² renovation
Budget: €9,000
When: November
Reply to this message and the text goes to the client in WhatsApp.
[Take]  [Back to bot]`,
    },
  }),
  product({
    id: 'mp-workflow-support',
    slug: 'ai-support-automation',
    categoryId: 'n8n-workflows',
    productType: 'automation-pack',
    titleRu: 'AI Support Automation',
    titleEn: 'AI Support Automation',
    shortRu: 'Поддержка с сайта, из Telegram и почты в одной Google Таблице: модель отвечает на типовые вопросы строго по вашему FAQ, остальное приходит команде в Telegram с черновиком и кнопкой «Отправить». Напоминания и утренняя сводка. Проверено в n8n 2.44.',
    shortEn: 'Support from your site, Telegram and email in one Google Sheet: the model answers routine questions strictly from your FAQ, everything else reaches the team in Telegram with a draft and a Send button. Reminders and a morning digest. Tested in n8n 2.44. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD'],
    includedRu: ['4 воркфлоу n8n: входящие, напоминания, сводка, оповещение о сбоях', 'Сайт, Telegram и почта в одной очереди', 'Ответы только по FAQ из Google Таблицы', 'Черновики или автоответ с семью условиями', 'Кнопки «Отправить» и ответы команде прямо из Telegram', 'Форма для сайта, стартовый FAQ и 6 инструкций'],
    includedEn: ['4 n8n workflows: inbox, reminders, digest, error alerts', 'Site, Telegram and email in one queue', 'Answers only from an FAQ in Google Sheets', 'Drafts, or auto-replies behind seven conditions', 'Send buttons and team replies right from Telegram', 'Site widget, starter FAQ and 6 guides'],
    priceEur: 59,
    coverGradient: 'linear-gradient(135deg, #6366f1, #22c55e)',
    coverIcon: '🎧',
    creatorId: 'creator-n8n-lab',
    relatedIds: ['mp-agent-support'],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: когда бот отвечает сам',
      titleEn: 'Sample: when the bot answers on its own',
      contentRu: `Автоответ — только если выполнено всё:
  1. в FAQ есть ответ
  2. уверенность модели ≥ 0.8
  3. категория из разрешённых
  4. клиент не недоволен
  5. обращение не срочное
  6. нет тем «возврат», «компенсация», «суд»…
  7. нет вложений
Иначе — черновик команде в Telegram:
  [Отправить]  [Ответим сами]
  и причина: «клиент недоволен; тема «верните»»`,
      contentEn: `Auto-reply only when all hold:
  1. the FAQ has the answer
  2. model confidence ≥ 0.8
  3. an allowed category
  4. the customer is not upset
  5. not urgent
  6. no refund, compensation or legal topics
  7. no attachments
Otherwise a draft goes to the team in Telegram:
  [Send]  [We will answer]
  with the reason it was held`,
    },
  }),
  product({
    id: 'mp-workflow-content',
    slug: 'content-automation-workflow',
    categoryId: 'n8n-workflows',
    productType: 'automation-pack',
    titleRu: 'Content Automation',
    titleEn: 'Content Automation',
    shortRu: 'Контент-план в Google Таблице, который ведёт себя сам: каждую неделю темы под ваши рубрики, черновики в голосе бренда под формат каждого канала, одобрение кнопками в Telegram и публикация по расписанию в Telegram-канал, WordPress или через вебхук (Make, Zapier, Buffer). Без дублей и публикаций задним числом. Проверено в n8n 2.44.',
    shortEn: 'A content plan in Google Sheets that runs itself: weekly topics for your content pillars, drafts in your brand voice for each channel\'s format, approval with Telegram buttons, and scheduled publishing to a Telegram channel, WordPress or any webhook (Make, Zapier, Buffer). No duplicates, no late posts. Tested in n8n 2.44. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD', 'CSV'],
    includedRu: ['5 воркфлоу n8n: план недели, черновики, одобрение, публикация, оповещение о сбоях', 'Темы на неделю по рубрикам и расписанию слотов', 'Черновики в голосе бренда, без выдуманных фактов', 'Кнопки «Опубликовать / Переписать / Пропустить» в Telegram', 'Telegram-канал, WordPress и вебхук для LinkedIn, Instagram и других', 'Шаблон контент-плана, пример Config и 4 инструкции'],
    includedEn: ['5 n8n workflows: weekly plan, drafts, approvals, publisher, error alerts', 'Weekly topics by content pillar and slot schedule', 'Drafts in your brand voice, no invented facts', 'Publish / Rewrite / Skip buttons in Telegram', 'Telegram channel, WordPress, and a webhook for LinkedIn, Instagram and more', 'Content plan template, sample Config and 4 guides'],
    priceEur: 39,
    coverGradient: 'linear-gradient(135deg, #ec4899, #f97316)',
    coverIcon: '📝',
    creatorId: 'creator-n8n-lab',
    recommendsForCourses: ['ai-content-creator'],
    relatedIds: ['mp-creator-reels-pack'],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: путь одной публикации',
      titleEn: 'Sample: the path of one post',
      contentRu: `idea          — тема в таблице
  ↓ за 48 ч до публикации
draft_ready   — черновик в Telegram:
                [Опубликовать] [Переписать] [Пропустить]
  ↓ одобрено
approved      — ждёт своего времени
  ↓ время наступило
publishing    — отмечено до отправки, дубля не будет
  ↓
published     — ссылка в таблице и в чате`,
      contentEn: `idea          — a topic in the sheet
  ↓ 48 h before publishing
draft_ready   — draft in Telegram:
                [Publish] [Rewrite] [Skip]
  ↓ approved
approved      — waits for its time
  ↓ time has come
publishing    — marked before sending, no duplicates
  ↓
published     — link in the sheet and the chat`,
    },
  }),
  product({
    id: 'mp-workflow-crm',
    slug: 'crm-automation-kit',
    categoryId: 'n8n-workflows',
    productType: 'automation-pack',
    titleRu: 'CRM Automation Kit',
    titleEn: 'CRM Automation Kit',
    shortRu: 'Лёгкая CRM на n8n, Google Таблице и Telegram: заявки из Tilda, сайта, Make и других наборов в одну таблицу без дублей, распределение по менеджерам, этапы сделки кнопками в Telegram, напоминания о следующем шаге, тревога по брошенным заявкам и недельный отчёт по воронке. Без AI и без платной CRM. Проверено в n8n 2.44.',
    shortEn: 'A light CRM on n8n, Google Sheets and Telegram: leads from Tilda, your site, Make and other kits land in one sheet without duplicates, are shared fairly between managers, move through stages with Telegram buttons, and come with next-step reminders, alerts for untouched leads and a weekly pipeline report. No AI, no paid CRM. Tested in n8n 2.44. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD', 'CSV'],
    includedRu: ['5 воркфлоу n8n: приём заявок, Telegram, напоминания, отчёт, оповещение о сбоях', 'Один адрес для всех источников, дедупликация по телефону и почте', 'Распределение по нагрузке, повторный клиент — тому же менеджеру', 'Этапы кнопками, заметки, суммы и напоминания ответом в Telegram', 'Эскалация брошенных заявок и отчёт по воронке и менеджерам', 'Подключение Tilda, формы сайта, Make, памятка менеджеру'],
    includedEn: ['5 n8n workflows: intake, Telegram, reminders, report, error alerts', 'One address for every source, de-duplicated by phone and email', 'Load-based assignment, a returning client goes to the same manager', 'Stage buttons, notes, amounts and reminders by reply in Telegram', 'Alerts for untouched leads and a pipeline report by manager', 'Tilda, site form and Make setup, a one-page manager guide'],
    priceEur: 99,
    coverGradient: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    coverIcon: '🗂️',
    creatorId: 'creator-n8n-lab',
    badges: ['new'],
    recommendsForCourses: ['ai-automation-engineer', 'ai-business-builder'],
    relatedIds: ['mp-workflow-lead-gen'],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: карточка сделки в Telegram',
      titleEn: 'Sample: a deal card in Telegram',
      contentRu: `Новая сделка D261026-3
Имя: Ирина
Телефон: +380671234567
Запрос: Нужен сайт для студии
Сумма: 3000
Источник: tilda
Этап: Новая · Олег
Следующий шаг: Позвонить клиенту — 2026-10-26 10:30
[Связались] [Встреча] [КП]
[Выиграна] [Проиграна] [Завтра]
Ответ: «напомнить: завтра 15:00 перезвонить»`,
      contentEn: `New deal D261026-3
Name: Iryna
Phone: +380671234567
Request: A website for a studio
Amount: 3000
Source: tilda
Stage: New · Oleh
Next step: Call the client — 2026-10-26 10:30
[Contacted] [Meeting] [Proposal]
[Won] [Lost] [Tomorrow]
Reply: "remind: tomorrow 15:00 call back"`,
    },
  }),
  product({
    id: 'mp-agent-support',
    slug: 'customer-support-agent',
    categoryId: 'ai-agents',
    productType: 'agent-pack',
    titleRu: 'Customer Support Agent',
    titleEn: 'Customer Support Agent',
    shortRu: 'AI-агент поддержки для n8n: отвечает на сайте и в Telegram строго по вашей базе знаний, показывает статус заказа только владельцу, создаёт обращения и передаёт диалог человеку. Защита на входе и выходе, 30 eval-случаев со скриптом проверки. OpenAI или Claude. Проверено в n8n 2.48.',
    shortEn: 'An AI support agent for n8n: answers on your site and in Telegram strictly from your knowledge base, shows an order\'s status only to its owner, opens tickets and hands the chat to a person. Input and output guards, 30 eval cases with a runner. OpenAI or Claude. Tested in n8n 2.48. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD', 'CSV'],
    includedRu: ['Агент n8n с памятью и 4 инструментами: база знаний, заказ, обращение, передача человеку', 'Системная инструкция с правилами и запретами', 'Схемы инструментов в форматах OpenAI и Anthropic', 'Защита: токен, лимиты, вырезание номеров карт, запрещённые обещания, утечка инструкции', 'Передача человеку в Telegram с пересказом диалога', '30 eval-случаев и скрипт прогона, демо-база на 20 статей, чат-виджет, 8 инструкций'],
    includedEn: ['n8n agent with memory and 4 tools: knowledge base, order, ticket, human handoff', 'System prompt with rules and limits', 'Tool schemas in OpenAI and Anthropic formats', 'Guards: token, rate limits, card-number removal, forbidden promises, prompt leaks', 'Handoff to a person in Telegram with a summary', '30 eval cases and a runner, 20-article demo base, chat widget, 8 guides'],
    testedIntegrations: ['OpenAI', 'Anthropic', 'Webhook', 'n8n', 'Google Sheets', 'Telegram'],
    changelogRu: ['1.0.0 — первый выпуск: агент, 4 инструмента, защита на входе и выходе, 30 eval-случаев'],
    changelogEn: ['1.0.0 — first release: agent, 4 tools, input and output guards, 30 eval cases'],
    priceEur: 79,
    coverGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    coverIcon: '🤖',
    creatorId: 'creator-agent-studio',
    recommendsForCourses: ['ai-agent-engineer'],
    relatedIds: ['mp-workflow-support', 'mp-agent-knowledge'],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: кто отвечает клиенту',
      titleEn: 'Sample: who answers the customer',
      contentRu: `Guard In — до модели:
  нет токена → 401
  номер карты → «[номер карты удалён]»
  «позовите менеджера» → человеку, без модели
  20 сообщений за 10 минут → пауза

AI Agent — инструменты:
  search_knowledge  → только по вашим статьям
  get_order_status  → только при совпадении email
  create_ticket     → номер обращения клиенту
  handoff_to_human  → пересказ в чат команды

Guard Out — после модели:
  «вернём деньги», «дадим скидку» → заменить, сигнал команде
  утечка инструкции → отказ
  пустой ответ → человеку`,
      contentEn: `Guard In — before the model:
  no token → 401
  card number → "[card number removed]"
  "get me a manager" → to a person, no model
  20 messages in 10 minutes → pause

AI Agent — tools:
  search_knowledge  → only your articles
  get_order_status  → only when the email matches
  create_ticket     → ticket number to the customer
  handoff_to_human  → summary to the team chat

Guard Out — after the model:
  "we'll refund you", "we'll give a discount" → replaced, team alerted
  prompt leak → refusal
  empty answer → to a person`,
    },
  }),
  product({
    id: 'mp-agent-sales',
    slug: 'sales-agent-template',
    categoryId: 'ai-agents',
    productType: 'agent-pack',
    titleRu: 'Sales Agent',
    titleEn: 'Sales Agent',
    shortRu: 'AI-консультант по продажам для n8n: продаёт в чате на сайте и в Telegram по вашему каталогу, квалифицирует (задача, бюджет, сроки, кто решает) с баллами в коде, отвечает на возражения только одобренными формулировками, даёт ссылку на оплату, КП или звонок. Follow-up замолчавшим с тихими часами и стоп-листом. OpenAI или Claude. Проверено в n8n 2.48.',
    shortEn: 'An AI sales assistant for n8n: sells in your site chat and Telegram from your catalog, qualifies (need, budget, timeline, decision maker) with code-computed scores, answers objections only with approved wording, sends a payment link, a quote request or a call link. Follow-ups to silent leads with quiet hours and a stop list. OpenAI or Claude. Tested in n8n 2.48. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD', 'CSV'],
    includedRu: ['Агент n8n с памятью и 6 инструментами: каталог, одобренные ответы, лид, оплата или КП, звонок, передача менеджеру', 'Квалификация с баллами 0–100 в коде и карточкой горячего лида в чат продаж', 'Follow-up по расписанию: 3 касания, тихие часы, стоп-лист, Telegram или email', 'Запреты: выдуманные скидки, гарантии, ложная срочность — ответ заменяется', 'Системная инструкция, схемы инструментов OpenAI и Anthropic, защита и журнал', 'Демо-каталог, 10 одобренных ответов, 21 eval-случай со скриптом, чат-виджет, 8 инструкций'],
    includedEn: ['n8n agent with memory and 6 tools: catalog, approved answers, lead, payment or quote, call, handoff', 'Qualification with 0–100 scores in code and a hot-lead card in the sales chat', 'Scheduled follow-ups: 3 touches, quiet hours, stop list, Telegram or email', 'Guards: invented discounts, guarantees and fake urgency are replaced', 'System prompt, OpenAI and Anthropic tool schemas, guards and a log', 'Demo catalog, 10 approved answers, 21 eval cases with a runner, chat widget, 8 guides'],
    testedIntegrations: ['OpenAI', 'Anthropic', 'Webhook', 'n8n', 'Google Sheets', 'Telegram'],
    changelogRu: ['1.0.0 — первый выпуск: агент, 6 инструментов, follow-up, 21 eval-случай'],
    changelogEn: ['1.0.0 — first release: agent, 6 tools, follow-ups, 21 eval cases'],
    priceEur: 99,
    coverGradient: 'linear-gradient(135deg, #f97316, #a855f7)',
    coverIcon: '🎯',
    creatorId: 'creator-agent-studio',
    recommendsForCourses: ['ai-agent-engineer', 'ai-business-builder'],
    relatedIds: ['mp-workflow-whatsapp', 'mp-agent-lead-qual'],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: как агент считает лид',
      titleEn: 'Sample: how the agent scores a lead',
      contentRu: `Клиент: Нужна CRM на 5 человек, бюджет около 2 тыс €, хотим в этом месяце, решаю я
Агент → save_lead
  need      «CRM на 5 человек»        25
  budget    «около 2 тыс €» = 2000    25
  timeline  «в этом месяце»           25
  authority «решаю я»                 25
  = 100 → горячий
Чат продаж: 🔥 Горячий лид: 100/100
Агент → search_catalog → CRM Старт, 49 EUR, оплата онлайн
Агент → send_offer(payment) → ссылка ровно из таблицы

Follow-up: через 24 ч / 72 ч / 7 дней тишины, не ночью, не в выходные, «стоп» — навсегда`,
      contentEn: `Customer: We need a CRM for 5 people, budget about €2k, this month, I decide
Agent → save_lead
  need      "CRM for 5 people"   25
  budget    "about €2k" = 2000   25
  timeline  "this month"         25
  authority "I decide"           25
  = 100 → hot
Sales chat: 🔥 Hot lead: 100/100
Agent → search_catalog → CRM Start, 49 EUR, pay online
Agent → send_offer(payment) → the link exactly as in the sheet

Follow-ups: after 24 h / 72 h / 7 days of silence, not at night or weekends, "stop" is final`,
    },
  }),
  product({
    id: 'mp-agent-lead-qual',
    slug: 'lead-qualification-agent',
    categoryId: 'ai-agents',
    productType: 'agent-pack',
    titleRu: 'Lead Qualification Agent',
    titleEn: 'Lead Qualification Agent',
    shortRu: 'AI-агент квалификации заявок для n8n: принимает лиды с любых форм, находит дубли, изучает сайт компании, ставит баллы 0–100 по вашей рубрике с причинами (суждения — модель, расчёт — код), отсеивает соискателей и спам, распределяет менеджерам по кругу и присылает карточку в Telegram. OpenAI или Claude. Проверено в n8n 2.48.',
    shortEn: 'An AI lead-qualification agent for n8n: takes leads from any form, finds duplicates, reads the company website, scores 0–100 against your rubric with reasons (judgment by the model, maths in code), filters job seekers and spam, routes round-robin to owners and sends a Telegram card. OpenAI or Claude. Tested in n8n 2.48. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD', 'CSV'],
    includedRu: ['Воркфлоу n8n: приём с любых форм, дубли, агент, рубрика, маршрутизация, CRM, уведомления', 'Агент изучает сайт лида (только его домен) и сдаёт оценку значениями из списков', 'Рубрика баллов в Config с причиной у каждого балла, сегменты и распределение по кругу', 'Отсев соискателей, студентов, спама, конкурентов; уточняющее письмо лиду по желанию', 'Инструкция модели, схемы инструментов OpenAI и Anthropic, HTML-форма', '16 тестовых заявок со скриптом прогона, 8 инструкций'],
    includedEn: ['n8n workflow: intake from any form, duplicates, agent, rubric, routing, CRM, notifications', 'The agent reads the lead\'s website (its own domain only) and submits a listed-values assessment', 'Scoring rubric in Config with a reason per point, segments and round-robin routing', 'Filters job seekers, students, spam, competitors; optional clarifying email to the lead', 'Model prompt, OpenAI and Anthropic tool schemas, HTML form', '16 test leads with a runner, 8 guides'],
    testedIntegrations: ['OpenAI', 'Anthropic', 'Webhook', 'n8n', 'Google Sheets', 'Telegram'],
    changelogRu: ['1.0.0 — первый выпуск: приём, дубли, изучение сайта, рубрика, маршрутизация, 16 eval-случаев'],
    changelogEn: ['1.0.0 — first release: intake, duplicates, website research, rubric, routing, 16 eval cases'],
    priceEur: 69,
    coverGradient: 'linear-gradient(135deg, #22c55e, #6366f1)',
    coverIcon: '⚡',
    creatorId: 'creator-agent-studio',
    relatedIds: ['mp-agent-sales', 'mp-workflow-lead-gen'],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: карточка лида менеджеру',
      titleEn: 'Sample: the lead card an owner gets',
      contentRu: `🔥 Ольга · Northwind Trading — 85/100
olga@northwind.example · +380671112233

Суть: оптовая компания на 80 человек, 12 менеджеров теряют заявки между Excel и почтой; запуск до конца месяца.

Баллы:
+30 Подходит под идеального клиента: high
+20 Ясный запрос и намерение купить: high
+15 Размер компании: 51-200
+10 Сроки: now
±0 Бюджет из формы: не указан
+5 Корпоративная почта: northwind.example
+5 Оставил телефон: есть

Спросить на звонке:
• Какую CRM используете сейчас?
• Кто, кроме вас, участвует в выборе?

L-M3K9Q · google · по кругу в сегменте smb`,
      contentEn: `🔥 Olga · Northwind Trading — 85/100
olga@northwind.example · +380671112233

Summary: an 80-person wholesaler, 12 sales reps losing leads between Excel and email; launch by month end.

Score:
+30 Fits the ideal customer: high
+20 Clear request and intent: high
+15 Company size: 51-200
+10 Timeline: now
±0 Budget from the form: not given
+5 Corporate email: northwind.example
+5 Left a phone: yes

Ask on the call:
• Which CRM do you use now?
• Who else is part of the decision?

L-M3K9Q · google · round-robin in segment smb`,
    },
  }),
  product({
    id: 'mp-agent-booking',
    slug: 'appointment-booking-agent',
    categoryId: 'ai-agents',
    productType: 'agent-pack',
    titleRu: 'Appointment Booking Agent',
    titleEn: 'Appointment Booking Agent',
    shortRu: 'AI-агент записи для n8n: записывает клиентов на звонки и встречи в Google Календарь из чата на сайте и в Telegram. Только реально свободное время с буферами и часовыми поясами, запись только после «да» клиента, код для переноса и отмены, приглашение в календарь, напоминания. OpenAI или Claude. Проверено в n8n 2.48.',
    shortEn: 'An AI booking agent for n8n: books calls and meetings into Google Calendar from your site chat and Telegram. Only truly free time with buffers and time zones, a booking only after the customer says yes, a code to reschedule or cancel, calendar invites, reminders. OpenAI or Claude. Tested in n8n 2.48. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD'],
    includedRu: ['Агент n8n с памятью и 7 инструментами: услуги, свободное время, запись, поиск, перенос, отмена, передача человеку', 'Свободное время считает код: рабочие часы, сетка, буфер, выходные, часовые пояса', 'Запись, перенос и отмена — только после «да» клиента, без двойных записей', 'Код записи, приглашение в календарь, ссылка Meet, напоминания в Telegram и на email', 'Системная инструкция, схемы инструментов OpenAI и Anthropic, защита и журнал', '20 eval-случаев со скриптом прогона, чат-виджет, 8 инструкций'],
    includedEn: ['n8n agent with memory and 7 tools: services, free time, booking, lookup, reschedule, cancel, human handoff', 'Free time computed in code: hours, grid, buffers, days off, time zones', 'Booking, rescheduling and cancelling only after the customer says yes, no double bookings', 'Booking code, calendar invite, Meet link, reminders in Telegram and by email', 'System prompt, OpenAI and Anthropic tool schemas, guards and a log', '20 eval cases with a runner, chat widget, 8 guides'],
    testedIntegrations: ['OpenAI', 'Anthropic', 'Webhook', 'n8n', 'Google Calendar', 'Google Sheets', 'Telegram'],
    changelogRu: ['1.0.0 — первый выпуск: агент, 7 инструментов, напоминания, 20 eval-случаев'],
    changelogEn: ['1.0.0 — first release: agent, 7 tools, reminders, 20 eval cases'],
    priceEur: 89,
    coverGradient: 'linear-gradient(135deg, #06b6d4, #a855f7)',
    coverIcon: '📅',
    creatorId: 'creator-agent-studio',
    badges: ['new'],
    relatedIds: ['mp-agent-sales'],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: почему агент не запишет «на словах»',
      titleEn: 'Sample: why the agent cannot book on a whim',
      contentRu: `Клиент: Запишите на консультацию в четверг в 10
Агент → book_appointment
Plan: последнее сообщение — не «да» → not_confirmed
Агент: Консультация, 60 минут, четверг 21 ноября, 10:00 (Киев), Анна, anna@example.com. Подтверждаете?
Клиент: Да
Plan: «да» ✓  Decide: 10:00 свободно? буфер 15 мин? в рабочих часах? ✓
Событие в календаре · приглашение на email · код K7QM2X
Команде: 🗓 Новая запись
Напоминания: за 24 ч и за 2 ч`,
      contentEn: `Customer: Book me a consultation on Thursday at 10
Agent → book_appointment
Plan: the last message is not a yes → not_confirmed
Agent: Consultation, 60 min, Thursday 21 Nov, 10:00 (Kyiv), Anna, anna@example.com. Confirm?
Customer: Yes
Plan: yes ✓  Decide: 10:00 free? 15-min buffer? within hours? ✓
Calendar event · email invite · code K7QM2X
Team: 🗓 New booking
Reminders: 24 h and 2 h before`,
    },
  }),
  product({
    id: 'mp-agent-research',
    slug: 'ai-research-agent',
    categoryId: 'ai-agents',
    productType: 'agent-pack',
    titleRu: 'AI Research Agent',
    titleEn: 'AI Research Agent',
    shortRu: 'Исследовательский AI-агент для n8n: по заданию из Telegram или API ищет в интернете (Tavily), читает страницы и сдаёт отчёт в Markdown со ссылкой на источник у каждого утверждения. Бюджет поисков на задание, правила источников, проверка ссылок, отказ на досье и слежку. OpenAI или Claude. Проверено в n8n 2.48.',
    shortEn: 'A research AI agent for n8n: takes a brief from Telegram or an API, searches the web (Tavily), reads pages and delivers a Markdown report with a source on every claim. Per-job search budget, source rules, citation checks, refusals for dossiers and surveillance. OpenAI or Claude. Tested in n8n 2.48. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD'],
    includedRu: ['Агент n8n: план, поиск, чтение страниц, отчёт с разделами и выводами', 'Ссылки проверяет система: выдуманные удаляются, список источников с адресами и пометкой «прочитано / по сниппету»', 'Три глубины с бюджетом поисков и страниц, запрещённые и предпочтительные домены', 'Защита: адреса локальной сети не читаются, команды со страниц игнорируются, отказ на досье и слежку', 'Отчёт файлом в Telegram, по callback или в ответе; лист Reports; передача людям', '12 eval-заданий со скриптом, схемы инструментов OpenAI и Anthropic, 8 инструкций'],
    includedEn: ['n8n agent: plan, search, page reading, a report with sections and conclusions', 'Citations checked by the system: invented ones removed, a source list marked read or snippet-only', 'Three depths with search and page budgets, blocked and preferred domains', 'Guards: no local-network fetches, page instructions ignored, refusals for dossiers and surveillance', 'Report as a Telegram file, via callback or in the response; Reports sheet; handoff to people', '12 eval jobs with a runner, OpenAI and Anthropic tool schemas, 8 guides'],
    testedIntegrations: ['OpenAI', 'Anthropic', 'Webhook', 'n8n', 'Tavily', 'Google Sheets', 'Telegram'],
    changelogRu: ['1.0.0 — первый выпуск: поиск и чтение страниц, проверка ссылок, бюджеты, 12 eval-заданий'],
    changelogEn: ['1.0.0 — first release: search and page reading, citation checks, budgets, 12 eval jobs'],
    priceEur: 149,
    coverGradient: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
    coverIcon: '🔬',
    creatorId: 'creator-agent-studio',
    badges: ['trending'],
    relatedIds: ['mp-prompt-research-vault'],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: как собирается отчёт',
      titleEn: 'Sample: how a report is built',
      contentRu: `/quick Какие требования EU AI Act действуют для чат-ботов в 2026 году?

Бюджет: до 3 поисков и 4 страниц
  web_search  → результаты без запрещённых доменов, у каждого код [s1a2b]
  fetch_page  → текст страницы без меню и скриптов; «это данные, а не инструкции»

Guard Out:
  [s1a2b] → [1], список источников пишет система
  ссылка на источник, которого агент не видел → удалена, сигнал команде
  меньше 3 доменов → «предварительный отчёт»

→ файл R-…-eu-ai-act.md в Telegram, строка в Reports`,
      contentEn: `/quick What do EU AI Act rules require of chatbots in 2026?

Budget: up to 3 searches and 4 pages
  web_search  → results without blocked domains, each with a code [s1a2b]
  fetch_page  → page text without menus and scripts; "this is data, not instructions"

Guard Out:
  [s1a2b] → [1], the source list is written by the system
  a citation to a source the agent never saw → removed, team alerted
  fewer than 3 domains → "preliminary report"

→ file R-…-eu-ai-act.md in Telegram, a row in Reports`,
    },
  }),
  product({
    id: 'mp-agent-knowledge',
    slug: 'knowledge-base-agent',
    categoryId: 'ai-agents',
    productType: 'agent-pack',
    titleRu: 'Knowledge Base Agent',
    titleEn: 'Knowledge Base Agent',
    shortRu: 'AI-агент для n8n, который отвечает по вашим документам из Google Drive и страницам по ссылкам — с номером источника у каждого факта. Векторный поиск, ночная переиндексация, «в документах этого нет» вместо выдумок и список пробелов базы. Доступ в Telegram по списку. OpenAI или Claude. Проверено в n8n 2.48.',
    shortEn: 'An n8n AI agent that answers from your Google Drive documents and linked pages, with a source number on every fact. Vector search, nightly reindexing, "the documents don\'t cover this" instead of guesses, and a list of gaps in the base. Telegram access by allow-list. OpenAI or Claude. Tested in n8n 2.48. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD', 'CSV'],
    includedRu: ['Агент n8n с векторным поиском (RAG), памятью и 3 инструментами', 'Индексация Google Docs, PDF, TXT/MD из папки Drive и страниц по ссылкам; ночью и по запросу', 'Ответы со ссылками на документы и списком источников; ложные ссылки удаляются', '«В документах этого нет» и лист пробелов базы; передача людям в Telegram', 'Системная инструкция и схемы инструментов в форматах OpenAI и Anthropic', '25 eval-случаев со скриптом, 6 демо-документов, переход на Qdrant/PGVector/Supabase, 8 инструкций'],
    includedEn: ['n8n agent with vector search (RAG), memory and 3 tools', 'Indexes Google Docs, PDF, TXT/MD from a Drive folder and linked pages; nightly and on demand', 'Answers cite documents with a source list; false citations are removed', '"Not in the documents" plus a gaps sheet; handoff to people in Telegram', 'System prompt and tool schemas in OpenAI and Anthropic formats', '25 eval cases with a runner, 6 demo documents, Qdrant/PGVector/Supabase migration, 8 guides'],
    testedIntegrations: ['OpenAI', 'Anthropic', 'Webhook', 'n8n', 'Google Drive', 'Google Sheets', 'Telegram'],
    changelogRu: ['1.0.0 — первый выпуск: векторный поиск, переиндексация, ссылки на источники, 25 eval-случаев'],
    changelogEn: ['1.0.0 — first release: vector search, reindexing, source citations, 25 eval cases'],
    priceEur: 129,
    coverGradient: 'linear-gradient(135deg, #8b5cf6, #22c55e)',
    coverIcon: '📚',
    creatorId: 'creator-agent-studio',
    relatedIds: ['mp-agent-support'],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: ответ со ссылками',
      titleEn: 'Sample: an answer with sources',
      contentRu: `Вопрос: Как оформить отпуск?

Ответ: Заявление подаётся в HR-портале не позднее чем за 14 дней до начала [1]. Перенос согласует руководитель, новое заявление — за 7 дней [1].

Источники:
1. Регламент отпусков — https://drive.google.com/…

— Ссылку на документ, которого поиск не находил, система удаляет.
— Нет близких фрагментов → «В документах этого нет», вопрос — в лист Gaps.
— Ночью индекс пересобирается; если папка не читается, старый индекс остаётся.`,
      contentEn: `Question: How do I book a vacation?

Answer: File the request in the HR portal at least 14 days ahead [1]. Moving it needs your manager's approval and a new request 7 days ahead [1].

Sources:
1. Vacation policy — https://drive.google.com/…

— A citation to a document the search never returned is removed.
— No close passages → "The documents don't cover this", and the question goes to the Gaps sheet.
— The index is rebuilt nightly; if the folder can't be read, the old index stays.`,
    },
  }),
  product({
    id: 'mp-biz-agency-proposal',
    slug: 'agency-proposal-template',
    categoryId: 'business-templates',
    productType: 'business-pack',
    titleRu: 'Agency Proposal Template',
    titleEn: 'Agency Proposal Template',
    shortRu: 'Шаблон предложения для AI-услуг, руководство по ценам, описание работ и калькулятор окупаемости.',
    shortEn: 'A proposal template for AI services, a pricing guide, a scope of work and an ROI calculator. Files are in Russian.',
    fileTypes: ['MD', 'CSV'],
    includedRu: ['Предложение из 11 разделов', 'Руководство по ценам', 'Описание работ с критериями приёмки', 'Бланк запроса на изменение', 'Калькулятор цены и окупаемости'],
    includedEn: ['11-section proposal', 'Pricing guide', 'Scope of work with acceptance criteria', 'Change request form', 'Pricing and ROI calculator'],
    priceEur: 29,
    coverGradient: 'linear-gradient(135deg, #e11d48, #a855f7)',
    coverIcon: '📄',
    creatorId: 'creator-insider',
    badges: ['top-selling'],
    recommendsForCourses: ['ai-business-builder'],
    relatedIds: ['mp-biz-discovery', 'mp-biz-sop'],
  }),
  product({
    id: 'mp-biz-outreach-pack',
    slug: 'outreach-templates-pack',
    categoryId: 'business-templates',
    productType: 'business-pack',
    titleRu: 'Outreach Templates',
    titleEn: 'Outreach Templates',
    shortRu: '49 шаблонов первых сообщений и продолжений для почты, LinkedIn и мессенджеров плюс план касаний на 21 день.',
    shortEn: '49 first-touch and follow-up templates for email, LinkedIn and messengers, plus a 21-day sequence. Files are in Russian.',
    fileTypes: ['MD', 'CSV'],
    includedRu: ['12 холодных писем', '20 шаблонов для LinkedIn', '17 сообщений для мессенджеров', 'Последовательность на 21 день', '30 заготовок первой строки', 'Таблица учёта касаний'],
    includedEn: ['12 cold emails', '20 LinkedIn templates', '17 messenger messages', '21-day sequence', '30 first-line starters', 'Outreach tracker'],
    priceEur: 24,
    coverGradient: 'linear-gradient(135deg, #f97316, #f43f5e)',
    coverIcon: '✉️',
    creatorId: 'creator-insider',
    relatedIds: ['mp-prompt-sales-vault', 'mp-biz-agency-proposal'],
  }),
  product({
    id: 'mp-biz-discovery',
    slug: 'discovery-call-framework',
    categoryId: 'business-templates',
    productType: 'business-pack',
    titleRu: 'Discovery Call Framework',
    titleEn: 'Discovery Call Framework',
    shortRu: 'Сценарий первого звонка на 30 минут, 60 вопросов, ответы на 10 возражений и письма после звонка.',
    shortEn: 'A 30-minute first-call script, 60 questions, answers to 10 objections and follow-up emails. Files are in Russian.',
    fileTypes: ['MD', 'CSV'],
    includedRu: ['Сценарий звонка по минутам', 'Банк из 60 вопросов', '10 возражений и ответы', '6 писем после звонка', 'Бланк заметок с расчётом цены проблемы', 'Оценка клиента по 10 критериям'],
    includedEn: ['Minute-by-minute call script', 'Bank of 60 questions', '10 objections with answers', '6 follow-up emails', 'Notes sheet that prices the problem', '10-point qualification scorecard'],
    priceEur: 19,
    coverGradient: 'linear-gradient(135deg, #6366f1, #f97316)',
    coverIcon: '📞',
    creatorId: 'creator-insider',
    relatedIds: ['mp-biz-agency-proposal'],
  }),
  product({
    id: 'mp-biz-sop',
    slug: 'sop-library-ai-agency',
    categoryId: 'business-templates',
    productType: 'business-pack',
    titleRu: 'SOP Library for AI Agency',
    titleEn: 'SOP Library for AI Agency',
    shortRu: '21 процедура для агентства AI-автоматизации: продажи, старт, сборка и запуск, поддержка, операционная работа.',
    shortEn: '21 procedures for an AI automation agency: sales, onboarding, delivery, support and operations. Files are in Russian.',
    fileTypes: ['MD', 'CSV'],
    includedRu: ['21 SOP в 5 разделах', 'Шаги, критерии готовности и частые ошибки', 'Шаблон для своих SOP', 'Реестр процедур'],
    includedEn: ['21 SOPs in 5 sections', 'Steps, done criteria and common mistakes', 'Template for your own SOPs', 'SOP index'],
    priceEur: 49,
    coverGradient: 'linear-gradient(135deg, #0f172a, #6366f1)',
    coverIcon: '📑',
    creatorId: 'creator-insider',
    badges: ['new'],
    relatedIds: ['mp-biz-agency-proposal'],
  }),
  product({
    id: 'mp-saas-chatbot',
    slug: 'ai-chatbot-saas-kit',
    availability: 'coming_soon',
    categoryId: 'saas-kits',
    productType: 'saas-kit',
    titleRu: 'AI Chatbot SaaS Kit',
    titleEn: 'AI Chatbot SaaS Kit',
    shortRu: 'MVP: UI, API, billing checklist.',
    shortEn: 'MVP: UI, API, billing checklist.',
    priceEur: 199,
    coverGradient: 'linear-gradient(135deg, #a855f7, #06b6d4)',
    coverIcon: '💬',
    creatorId: 'creator-insider',
    badges: ['trending'],
    recommendsForCourses: ['ai-business-builder', 'ai-agent-engineer'],
    relatedIds: ['mp-saas-leadgen'],
  }),
  product({
    id: 'mp-saas-leadgen',
    slug: 'ai-lead-generation-saas',
    availability: 'coming_soon',
    categoryId: 'saas-kits',
    productType: 'saas-kit',
    titleRu: 'AI Lead Generation SaaS',
    titleEn: 'AI Lead Generation SaaS',
    shortRu: 'Архитектура и шаблоны lead-gen SaaS.',
    shortEn: 'Architecture and lead-gen SaaS templates.',
    priceEur: 249,
    coverGradient: 'linear-gradient(135deg, #f97316, #7c3aed)',
    coverIcon: '🚀',
    creatorId: 'creator-insider',
    relatedIds: ['mp-saas-chatbot', 'mp-workflow-lead-gen'],
  }),
  product({
    id: 'mp-saas-content',
    slug: 'ai-content-platform-kit',
    availability: 'coming_soon',
    categoryId: 'saas-kits',
    productType: 'saas-kit',
    titleRu: 'AI Content Platform',
    titleEn: 'AI Content Platform',
    shortRu: 'Контент-платформа: auth, credits, prompts.',
    shortEn: 'Content platform: auth, credits, prompts.',
    priceEur: 299,
    coverGradient: 'linear-gradient(135deg, #ec4899, #6366f1)',
    coverIcon: '🖥️',
    creatorId: 'creator-insider',
    badges: ['new'],
    recommendsForCourses: ['ai-content-creator'],
  }),
  product({
    id: 'mp-saas-voice',
    slug: 'ai-voice-agent-saas',
    availability: 'coming_soon',
    categoryId: 'saas-kits',
    productType: 'saas-kit',
    titleRu: 'AI Voice Agent SaaS',
    titleEn: 'AI Voice Agent SaaS',
    shortRu: 'Voice stack, Twilio guide, pricing model.',
    shortEn: 'Voice stack, Twilio guide, pricing model.',
    priceEur: 279,
    coverGradient: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
    coverIcon: '🎙️',
    creatorId: 'creator-agent-studio',
    relatedIds: ['mp-agent-booking'],
  }),
  product({
    id: 'mp-creator-hooks',
    slug: 'viral-hooks-database',
    categoryId: 'creator-resources',
    productType: 'template',
    titleRu: 'Viral Hooks Database',
    titleEn: 'Viral Hooks Database',
    shortRu: '240 хуков для Reels, Shorts и TikTok в 12 категориях — шаблоны первой фразы под вашу тему.',
    shortEn: '240 hooks for Reels, Shorts and TikTok in 12 categories — first-line templates for your topic. Files are in Russian.',
    fileTypes: ['MD', 'CSV'],
    includedRu: ['240 хуков в 12 категориях', 'Когда какую категорию использовать', 'Таблица для своих версий и результатов', 'Как выбирать и тестировать хуки'],
    includedEn: ['240 hooks in 12 categories', 'When to use each category', 'Spreadsheet for your versions and results', 'How to choose and test hooks'],
    priceEur: 29,
    coverGradient: 'linear-gradient(135deg, #db2777, #f97316)',
    coverIcon: '🔥',
    creatorId: 'creator-insider',
    badges: ['top-selling', 'most-downloaded'],
    recommendsForCourses: ['ai-content-creator'],
    relatedIds: ['mp-creator-reels-pack', 'mp-creator-shorts'],
  }),
  product({
    id: 'mp-creator-reels-pack',
    slug: 'reels-templates-pack',
    categoryId: 'creator-resources',
    productType: 'template',
    titleRu: 'Reels Templates Pack',
    titleEn: 'Reels Templates Pack',
    shortRu: '40 сценариев Reels по 10 структурам: хук, ход ролика по кадрам и призыв.',
    shortEn: '40 Reels scripts across 10 structures: hook, beat-by-beat flow and call to action. Files are in Russian.',
    fileTypes: ['MD', 'CSV'],
    includedRu: ['40 сценариев', '10 структур с раскладкой по секундам', 'План съёмок таблицей', 'Чеклист съёмки и монтажа'],
    includedEn: ['40 scripts', '10 structures with second-by-second timing', 'Shooting plan spreadsheet', 'Shooting and editing checklist'],
    priceEur: 24,
    coverGradient: 'linear-gradient(135deg, #ec4899, #a855f7)',
    coverIcon: '🎬',
    creatorId: 'creator-insider',
    relatedIds: ['mp-creator-hooks', 'mp-creator-shorts'],
  }),
  product({
    id: 'mp-creator-shorts',
    slug: 'shorts-templates-pack',
    categoryId: 'creator-resources',
    productType: 'template',
    titleRu: 'Shorts Templates Pack',
    titleEn: 'Shorts Templates Pack',
    shortRu: '40 сценариев YouTube Shorts для 8 ниш: название, хук, ход ролика и концовка.',
    shortEn: '40 YouTube Shorts scripts for 8 niches: title, hook, flow and ending. Files are in Russian.',
    fileTypes: ['MD', 'CSV'],
    includedRu: ['40 сценариев для 8 ниш', 'Названия до 60 знаков', 'План съёмок таблицей', 'Руководство по формату Shorts'],
    includedEn: ['40 scripts for 8 niches', 'Titles under 60 characters', 'Shooting plan spreadsheet', 'Shorts format guide'],
    priceEur: 24,
    coverGradient: 'linear-gradient(135deg, #f43f5e, #f97316)',
    coverIcon: '▶️',
    creatorId: 'creator-insider',
    relatedIds: ['mp-creator-reels-pack'],
  }),
  product({
    id: 'mp-creator-calendar',
    slug: 'content-calendar-365',
    categoryId: 'creator-resources',
    productType: 'template',
    titleRu: 'Content Calendar 365',
    titleEn: 'Content Calendar 365',
    shortRu: 'Контент-план на год: 52 тематические недели и 365 идей постов с рубрикой и форматом.',
    shortEn: 'A year of content: 52 themed weeks and 365 post ideas, each with a rubric and a format. Files are in Russian.',
    fileTypes: ['CSV', 'MD'],
    includedRu: ['365 идей — по одной на день', '52 тематические недели в 4 кварталах', 'Таблица для Google Таблиц', 'Как писать пост за 15 минут и промпт для AI'],
    includedEn: ['365 ideas, one per day', '52 themed weeks in 4 quarters', 'Spreadsheet for Google Sheets', 'A 15-minute post method and an AI prompt'],
    priceEur: 19,
    coverGradient: 'linear-gradient(135deg, #22c55e, #06b6d4)',
    coverIcon: '📆',
    creatorId: 'creator-insider',
    badges: ['new'],
    relatedIds: ['mp-creator-hooks'],
  }),
  product({
    id: 'mp-creator-canva',
    slug: 'canva-pack-creators',
    categoryId: 'creator-resources',
    productType: 'template',
    titleRu: 'Canva Pack for Creators',
    titleEn: 'Canva Pack for Creators',
    shortRu: '20 макетов для постов, сторис и обложек видео в SVG — открываются в Canva и Figma, цвета меняются.',
    shortEn: '20 SVG layouts for posts, stories and video thumbnails — open in Canva and Figma, recolourable. Files are in Russian.',
    fileTypes: ['SVG', 'MD'],
    includedRu: ['8 макетов постов 4:5', '6 макетов сторис 9:16', '6 обложек видео 16:9', 'Где какой текст: руководство по макетам', '6 палитр и 6 пар шрифтов с кириллицей'],
    includedEn: ['8 post layouts, 4:5', '6 story layouts, 9:16', '6 video thumbnails, 16:9', 'Layout guide: what text goes where', '6 palettes and 6 Cyrillic font pairs'],
    priceEur: 39,
    coverGradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    coverIcon: '🎨',
    creatorId: 'creator-insider',
    relatedIds: ['mp-creator-reels-pack'],
  }),
  product({
    id: 'mp-voice-beauty-salon',
    slug: 'voice-agent-kit-beauty-salon',
    categoryId: 'voice-agents',
    productType: 'agent-pack',
    titleRu: 'Voice Agent Kit: Beauty Salon',
    titleEn: 'Voice Agent Kit: Beauty Salon',
    shortRu: 'Набор для запуска голосового администратора салона красоты: проверенный бэкенд записи на n8n и Google Календаре, промпт, конфигурации Vapi, Retell и ElevenLabs, 30 тестовых звонков и комплект для продажи клиенту.',
    shortEn: 'A kit for launching a voice receptionist for a beauty salon: a tested booking backend on n8n and Google Calendar, the prompt, Vapi, Retell and ElevenLabs configurations, 30 test calls and a client sales kit. Files are in Russian.',
    version: '2.0.0',
    fileTypes: ['ZIP', 'MD', 'JSON', 'CSV'],
    includedRu: ['Воркфлоу n8n: запись, перенос, отмена, обратный звонок', 'Системный промпт на русском и английском', 'Конфигурации Vapi, Retell и ElevenLabs', '30 тестовых звонков и оценочный лист запуска', '9 инструкций: от настройки до эксплуатации', 'Комплект продаж: калькулятор, цены, объём работ, отчёт'],
    includedEn: ['n8n workflows: book, move, cancel, callback', 'System prompt in Russian and English', 'Vapi, Retell and ElevenLabs configurations', '30 test calls and a launch scorecard', '9 guides, from setup to operations', 'Sales kit: calculator, pricing, scope, report'],
    priceEur: 79,
    coverGradient: 'linear-gradient(135deg, #14b8a6, #a855f7)',
    coverIcon: '💇',

    screenshots: [
      '/marketplace/voice-agent-kit-beauty-salon-shot-1.svg',
      '/marketplace/voice-agent-kit-beauty-salon-shot-2.svg',
    ],
    creatorId: 'creator-agent-studio',
    badge: 'trend-2026',
    badges: ['trending', 'new'],
    testedIntegrations: ['Vapi', 'Retell AI', 'ElevenLabs Conversational AI', 'n8n', 'Google Calendar-compatible API'],
    changelogRu: ['v1.1.0: provider-конфиги, workflow, privacy runbook, тестовый набор и sales pack', 'v1.0.0: базовый booking flow и rollback checklist'],
    changelogEn: ['v1.1.0: provider configs, workflows, privacy runbook, test suite and sales pack', 'v1.0.0: core booking flow and rollback checklist'],
    freePreview: {
      type: 'prompt',
      titleRu: 'Фрагмент промпта: чего агент не делает',
      titleEn: 'Prompt excerpt: what the agent never does',
      contentRu: `Не обещаешь результат окрашивания или процедуры:
«получится ли такой цвет» решает мастер.
Не даёшь медицинских советов: аллергия, беременность —
«это обсудит мастер, при необходимости посоветуйтесь с врачом».
Не называешь свободное время по памяти:
только из ответа инструмента check_availability.`,
      contentEn: `Never promise the result of colouring or a treatment:
the stylist decides whether a shade is achievable.
Never give medical advice: allergies, pregnancy —
the stylist will discuss it; consult a doctor if needed.
Never state a free time from memory:
only from the check_availability tool result.`,
    },
    recommendsForCourses: ['ai-agent-engineer'],
    relatedIds: ['mp-voice-clinic-services', 'mp-agent-booking'],
  }),
  product({
    id: 'mp-voice-clinic-services',
    slug: 'voice-agent-kit-clinic-services',
    categoryId: 'voice-agents',
    productType: 'agent-pack',
    titleRu: 'Voice Agent Kit: Clinic & Services',
    titleEn: 'Voice Agent Kit: Clinic & Services',
    shortRu: 'Набор для запуска голосового администратора клиники: проверенный бэкенд записи на n8n и Google Календаре, промпт, конфигурации Vapi, Retell и ElevenLabs, 30 тестовых звонков и комплект для продажи клиенту.',
    shortEn: 'A kit for launching a voice receptionist for a clinic: a tested booking backend on n8n and Google Calendar, the prompt, Vapi, Retell and ElevenLabs configurations, 30 test calls and a client sales kit. Files are in Russian.',
    version: '2.0.0',
    fileTypes: ['ZIP', 'MD', 'JSON', 'CSV'],
    includedRu: ['Воркфлоу n8n: запись, перенос, отмена, обратный звонок', 'Системный промпт на русском и английском', 'Конфигурации Vapi, Retell и ElevenLabs', '30 тестовых звонков и оценочный лист запуска', '9 инструкций: от настройки до эксплуатации', 'Комплект продаж: калькулятор, цены, объём работ, отчёт'],
    includedEn: ['n8n workflows: book, move, cancel, callback', 'System prompt in Russian and English', 'Vapi, Retell and ElevenLabs configurations', '30 test calls and a launch scorecard', '9 guides, from setup to operations', 'Sales kit: calculator, pricing, scope, report'],
    priceEur: 79,
    coverGradient: 'linear-gradient(135deg, #06b6d4, #6366f1)',
    coverIcon: '🏥',

    screenshots: [
      '/marketplace/voice-agent-kit-clinic-services-shot-1.svg',
      '/marketplace/voice-agent-kit-clinic-services-shot-2.svg',
    ],
    creatorId: 'creator-agent-studio',
    badge: 'trend-2026',
    badges: ['trending', 'new'],
    freePreview: {
      type: 'prompt',
      titleRu: 'Фрагмент промпта: неотложные состояния',
      titleEn: 'Prompt excerpt: emergencies',
      contentRu: `Боль в груди, затруднённое дыхание, признаки инсульта,
сильное кровотечение — сразу скажи:
«Это может быть опасно. Немедленно позвоните
в экстренную службу».
Не продолжай запись, пока человек не подтвердит,
что помощь вызвана. Диагнозов и советов не давай.`,
      contentEn: `Chest pain, trouble breathing, signs of a stroke,
heavy bleeding — say at once:
This may be dangerous. Call emergency services immediately.
Do not continue booking until the person confirms
help has been called. Give no diagnosis or advice.`,
    },
    recommendsForCourses: ['ai-agent-engineer'],
    relatedIds: ['mp-voice-beauty-salon', 'mp-agent-booking'],
  }),
  product({
    id: 'mp-voice-auto-service',
    slug: 'voice-agent-kit-auto-service',
    categoryId: 'voice-agents',
    productType: 'agent-pack',
    titleRu: 'Voice Agent Kit: Auto Service',
    titleEn: 'Voice Agent Kit: Auto Service',
    shortRu: 'Набор для запуска голосового администратора автосервиса: проверенный бэкенд записи на n8n и Google Календаре, промпт, конфигурации Vapi, Retell и ElevenLabs, 30 тестовых звонков и комплект для продажи клиенту.',
    shortEn: 'A kit for launching a voice receptionist for an auto repair shop: a tested booking backend on n8n and Google Calendar, the prompt, Vapi, Retell and ElevenLabs configurations, 30 test calls and a client sales kit. Files are in Russian.',
    version: '2.0.0',
    fileTypes: ['ZIP', 'MD', 'JSON', 'CSV'],
    includedRu: ['Воркфлоу n8n: запись, перенос, отмена, обратный звонок', 'Системный промпт на русском и английском', 'Конфигурации Vapi, Retell и ElevenLabs', '30 тестовых звонков и оценочный лист запуска', '9 инструкций: от настройки до эксплуатации', 'Комплект продаж: калькулятор, цены, объём работ, отчёт'],
    includedEn: ['n8n workflows: book, move, cancel, callback', 'System prompt in Russian and English', 'Vapi, Retell and ElevenLabs configurations', '30 test calls and a launch scorecard', '9 guides, from setup to operations', 'Sales kit: calculator, pricing, scope, report'],
    priceEur: 79,
    coverGradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    coverIcon: '🔧',
    creatorId: 'creator-agent-studio',
    badge: 'trend-2026',
    badges: ['trending', 'new'],
    freePreview: {
      type: 'prompt',
      titleRu: 'Фрагмент промпта: опасная неисправность',
      titleEn: 'Prompt excerpt: an unsafe fault',
      contentRu: `Не говоришь, можно ли ездить с неисправностью.
Тормоза, руль, перегрев, запах топлива,
лампа давления масла — отвечай:
«С такой неисправностью ехать небезопасно,
лучше вызвать эвакуатор».
Диагноз по описанию не ставишь: записываешь на диагностику.`,
      contentEn: `Never say whether the car is safe to drive with a fault.
Brakes, steering, overheating, fuel smell,
oil pressure light — answer:
It is not safe to drive with that; better call a tow truck.
Never diagnose from a description: book a diagnostic.`,
    },
    recommendsForCourses: ['ai-agent-engineer'],
    relatedIds: ['mp-voice-beauty-salon', 'mp-voice-clinic-services'],
  }),
  product({
    id: 'mp-voice-real-estate',
    slug: 'voice-agent-kit-real-estate',
    categoryId: 'voice-agents',
    productType: 'agent-pack',
    titleRu: 'Voice Agent Kit: Real Estate',
    titleEn: 'Voice Agent Kit: Real Estate',
    shortRu: 'Набор для запуска голосового администратора агентства недвижимости: проверенный бэкенд записи на n8n и Google Календаре, промпт, конфигурации Vapi, Retell и ElevenLabs, 30 тестовых звонков и комплект для продажи клиенту.',
    shortEn: 'A kit for launching a voice receptionist for a real estate agency: a tested booking backend on n8n and Google Calendar, the prompt, Vapi, Retell and ElevenLabs configurations, 30 test calls and a client sales kit. Files are in Russian.',
    version: '2.0.0',
    fileTypes: ['ZIP', 'MD', 'JSON', 'CSV'],
    includedRu: ['Воркфлоу n8n: запись, перенос, отмена, обратный звонок', 'Системный промпт на русском и английском', 'Конфигурации Vapi, Retell и ElevenLabs', '30 тестовых звонков и оценочный лист запуска', '9 инструкций: от настройки до эксплуатации', 'Комплект продаж: калькулятор, цены, объём работ, отчёт'],
    includedEn: ['n8n workflows: book, move, cancel, callback', 'System prompt in Russian and English', 'Vapi, Retell and ElevenLabs configurations', '30 test calls and a launch scorecard', '9 guides, from setup to operations', 'Sales kit: calculator, pricing, scope, report'],
    priceEur: 79,
    coverGradient: 'linear-gradient(135deg, #10b981, #3b82f6)',
    coverIcon: '🏠',
    creatorId: 'creator-agent-studio',
    badge: 'trend-2026',
    badges: ['trending', 'new'],
    freePreview: {
      type: 'prompt',
      titleRu: 'Фрагмент промпта: что обсуждает только агент',
      titleEn: 'Prompt excerpt: what only the agent discusses',
      contentRu: `Не обсуждаешь торг и не говоришь, уступит ли собственник.
Не подтверждаешь, что объект свободен:
«Актуальность подтвердит агент перед просмотром».
Не называешь точный адрес до подтверждённого просмотра.
Не учитываешь национальность, семейное положение
и другие личные признаки и не передаёшь такие условия.`,
      contentEn: `Never negotiate or say whether the owner will come down.
Never confirm a property is still available:
the agent will confirm it before the viewing.
Never give the exact address before a confirmed viewing.
Never act on nationality, marital status or other
personal characteristics, or relay such conditions.`,
    },
    recommendsForCourses: ['ai-agent-engineer'],
    relatedIds: ['mp-voice-beauty-salon', 'mp-voice-clinic-services'],
  }),
  product({
    id: 'mp-mcp-starter-business',
    slug: 'mcp-starter-pack-business',
    categoryId: 'mcp-skills',
    productType: 'agent-pack',
    titleRu: 'MCP Starter Pack for Business',
    titleEn: 'MCP Starter Pack for Business',
    shortRu: 'Подключение AI-агента к HubSpot, Postgres, Slack и GitHub через поддерживаемые MCP-серверы — без архивных пакетов. Готовые конфиги для Claude Code, Claude Desktop, Cursor и n8n, режим «только чтение» для базы и GitHub, проверка конфигов на токены и устаревшие серверы. Postgres проверен на настоящей базе и в n8n 2.48.',
    shortEn: 'Connect an AI agent to HubSpot, Postgres, Slack and GitHub through maintained MCP servers — no archived packages. Ready configs for Claude Code, Claude Desktop, Cursor and n8n, read-only mode for the database and GitHub, and a check that flags tokens and outdated servers in your configs. Postgres tested on a real database and in n8n 2.48. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD', 'TOML'],
    includedRu: ['Конфиги для Claude Code, Claude Desktop, Cursor и воркфлоу n8n', 'HubSpot и Slack — официальные серверы с OAuth, GitHub — официальный, только чтение', 'Postgres через DBHub: режим «только чтение» и SQL роли без права записи', 'Скрипт проверки конфигов: архивные серверы, токены в файлах, http без шифрования', '24 рабочих запроса к агенту', '7 инструкций: по системе, n8n и чек-лист безопасности'],
    includedEn: ['Configs for Claude Code, Claude Desktop, Cursor and an n8n workflow', 'HubSpot and Slack via their official OAuth servers, GitHub official and read-only', 'Postgres through DBHub: read-only mode plus a SQL role with no write rights', 'Config checker: archived servers, tokens in files, plain-http endpoints', '24 working prompts for the agent', '7 guides: one per system, n8n and a security checklist'],
    testedIntegrations: ['Claude Code', 'Claude Desktop', 'Cursor', 'n8n', 'HubSpot', 'Postgres', 'Slack', 'GitHub'],
    changelogRu: ['1.0.0 — первый выпуск: четыре системы, четыре клиента, проверка конфигов'],
    changelogEn: ['1.0.0 — first release: four systems, four clients, config checker'],
    priceEur: 49,
    coverGradient: 'linear-gradient(135deg, #818cf8, #6366f1)',
    coverIcon: '🔌',
    creatorId: 'creator-agent-studio',
    badge: 'trend-2026',
    badges: ['trending', 'new'],
    recommendsForCourses: ['ai-agent-engineer'],
    relatedIds: ['mp-mcp-claude-skills', 'mp-agent-knowledge'],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: .mcp.json для Claude Code',
      titleEn: 'Sample: .mcp.json for Claude Code',
      contentRu: `{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/readonly",
      "headers": { "Authorization": "Bearer \${GITHUB_PAT}" }
    },
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub@2", "--config", "\${DBHUB_CONFIG}"]
    },
    "slack": {
      "type": "http",
      "url": "https://mcp.slack.com/mcp",
      "oauth": { "clientId": "…", "callbackPort": 3119 }
    }
  }
}`,
      contentEn: `{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/readonly",
      "headers": { "Authorization": "Bearer \${GITHUB_PAT}" }
    },
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub@2", "--config", "\${DBHUB_CONFIG}"]
    },
    "slack": {
      "type": "http",
      "url": "https://mcp.slack.com/mcp",
      "oauth": { "clientId": "…", "callbackPort": 3119 }
    }
  }
}`,
    },
  }),
  product({
    id: 'mp-mcp-claude-skills',
    slug: 'claude-skills-library',
    categoryId: 'mcp-skills',
    productType: 'agent-pack',
    titleRu: 'Claude Skills Library',
    titleEn: 'Claude Skills Library',
    shortRu: '11 скиллов для Claude Code, Cowork и Codex: оффер, аутрич, разбор звонка, предложение, контент, аудит страницы, проверка n8n, отчёт клиенту. Девять из них проверяют свою работу скриптами.',
    shortEn: '11 skills for Claude Code, Cowork and Codex: offer, outreach, call debrief, proposal, content, page audit, n8n review, client report. Nine check their own work with scripts. Files are in Russian.',
    fileTypes: ['ZIP', 'MD', 'PY'],
    includedRu: ['11 скиллов в формате Agent Skills', '9 скриптов на Python без зависимостей', 'Плагин: установка двумя командами', 'Справочные материалы и шаблоны внутри скиллов', 'Каталог с примерами запросов', 'Инструкция для Claude Code, Cowork и Codex'],
    includedEn: ['11 skills in the Agent Skills format', '9 dependency-free Python scripts', 'A plugin that installs with two commands', 'Reference material and templates inside the skills', 'Catalogue with example requests', 'Install guide for Claude Code, Cowork and Codex'],
    priceEur: 39,
    coverGradient: 'linear-gradient(135deg, #d97757, #8b5cf6)',
    coverIcon: '🧠',

    screenshots: [
      '/marketplace/claude-skills-library-shot-1.svg',
      '/marketplace/claude-skills-library-shot-2.svg',
    ],
    creatorId: 'creator-insider',
    badge: 'trend-2026',
    badges: ['trending', 'new'],
    freePreview: {
      type: 'prompt',
      titleRu: 'Фрагмент скилла: отчёт клиенту',
      titleEn: 'Skill excerpt: client report',
      contentRu: `Скилл: weekly-client-report

1. Посчитай изменения скриптом:
   python3 scripts/metrics_delta.py metrics.csv
2. Выбери два-три показателя, важных читателю.
3. Объясни причины — только названные пользователем.
   Не знаешь причину — напиши «причина не установлена».
4. Напиши отчёт на одну страницу. Плохие новости — в начале.
5. Сверь каждое число в тексте с таблицей скрипта.`,
      contentEn: `Skill: weekly-client-report

1. Compute the changes with the script:
   python3 scripts/metrics_delta.py metrics.csv
2. Pick the two or three metrics the reader cares about.
3. Explain causes — only those the user named.
   Unknown cause: write "cause not established".
4. Write a one-page report. Bad news goes first.
5. Check every number in the text against the script's table.`,
    },
    recommendsForCourses: ['ai-agent-engineer', 'ai-content-creator'],
    relatedIds: ['mp-mcp-starter-business', 'mp-prompt-chatgpt-vault'],
  }),
  product({
    id: 'mp-mcp-motion-studio',
    slug: 'claude-motion-studio',
    categoryId: 'mcp-skills',
    productType: 'agent-pack',
    titleRu: 'Claude Motion Studio',
    titleEn: 'Claude Motion Studio',
    shortRu: '8 скиллов для Claude Code, Cowork и Codex и готовый проект Remotion: кинетическая типографика, промо по скриншотам, графики из CSV, субтитры по словам, анимация логотипа, монтаж под музыку. Восемь стилей; агент сам смотрит кадры, прежде чем показать.',
    shortEn: '8 skills for Claude Code, Cowork and Codex plus a ready Remotion project: kinetic typography, promos from screenshots, charts from CSV, word-timed captions, logo stings, beat-synced edits. Eight styles; the agent checks the frames before showing you. Files are in Russian.',
    fileTypes: ['ZIP', 'MD', 'PY', 'TSX'],
    includedRu: ['8 скиллов в формате Agent Skills, плагин для Claude Code', 'Проект Remotion: 7 композиций и 8 стилей со шрифтами с кириллицей', 'Библиотека движений: маски, плашки, счётчики, графики, курсор, субтитры, шторки', '9 скриптов на Python без зависимостей: CSV, субтитры, SVG, доли музыки, рендер, проверка', 'Самопроверка: контактный лист кадров, безопасные зоны Reels, TikTok и Shorts, громкость', 'Инструкция: Node.js, ffmpeg, Claude Code, Cowork, Codex'],
    includedEn: ['8 skills in the Agent Skills format, a Claude Code plugin', 'A Remotion project: 7 compositions and 8 styles with Cyrillic fonts', 'A motion library: masks, markers, counters, charts, cursor, captions, wipes', '9 dependency-free Python scripts: CSV, captions, SVG, music beats, render, review', 'Self-review: frame contact sheets, Reels/TikTok/Shorts safe zones, loudness', 'Install guide: Node.js, ffmpeg, Claude Code, Cowork, Codex'],
    priceEur: 59,
    coverGradient: 'linear-gradient(135deg, #ff7a1a, #0b0a09)',
    coverIcon: '🎬',
    screenshots: ['/marketplace/claude-motion-studio/kinetic-type.mp4', '/marketplace/claude-motion-studio/product-promo.mp4', '/marketplace/claude-motion-studio/data-story.mp4', '/marketplace/claude-motion-studio/captions-explainer.mp4', '/marketplace/claude-motion-studio/logo-sting.mp4', '/marketplace/claude-motion-studio/motion-director.mp4'],
    videoPreview: '/marketplace/claude-motion-studio/showreel.mp4',
    creatorId: 'creator-insider',
    badge: 'trend-2026',
    badges: ['trending', 'new'],
    faqRu: [
      { q: 'Как получить файлы после оплаты?', a: 'Сразу в личном кабинете → Marketplace → Мои загрузки.' },
      { q: 'Можно ли использовать в коммерческих проектах?', a: 'Да, лицензия на использование в работе с клиентами включена.' },
      { q: 'Есть ли обновления?', a: 'Да, пожизненный доступ к обновлениям в рамках продукта.' },
      { q: 'Нужна ли лицензия Remotion?', a: 'Remotion бесплатен для частных лиц, некоммерческих организаций и компаний до трёх человек. Компаниям от четырёх человек нужна лицензия Remotion (remotion.pro) — её покупают у Remotion отдельно, в этот набор она не входит.' },
      { q: 'Что нужно на компьютере?', a: 'Claude Code, Cowork или Codex; Node.js 18+, ffmpeg и Python 3.8+; около 1 ГБ на диске. Рендер идёт на вашем компьютере, при первом запуске нужен интернет для шрифтов. В облачной песочнице без Node.js скиллы напишут раскадровку и код, но видео не отрендерят.' },
      { q: 'Это генерация видео нейросетью?', a: 'Нет. Видео собирается кодом из шрифтов, графики, ваших скриншотов и вашей съёмки. Поэтому текст в кадре точный, цифры совпадают с таблицей, а рендер повторяется кадр в кадр. Речь скиллы не распознают: для субтитров нужна расшифровка в SRT или JSON.' },
    ],
    faqEn: [
      { q: 'How do I get files after payment?', a: 'Instantly in your account → Marketplace → My downloads.' },
      { q: 'Can I use this commercially?', a: 'Yes, client work license is included.' },
      { q: 'Do I get updates?', a: 'Yes, lifetime updates for this product.' },
      { q: 'Do I need a Remotion licence?', a: 'Remotion is free for individuals, non-profits and companies of up to three people. Companies of four or more need a Remotion company licence (remotion.pro), bought from Remotion separately; it is not part of this pack.' },
      { q: 'What do I need on my computer?', a: 'Claude Code, Cowork or Codex; Node.js 18+, ffmpeg and Python 3.8+; about 1 GB of disk. Rendering runs on your machine and needs internet the first time, for fonts. In a cloud sandbox without Node.js the skills write the storyboard and code but cannot render.' },
      { q: 'Is this AI video generation?', a: 'No. Videos are built in code from type, graphics, your screenshots and your footage, so on-screen text is exact, numbers match the table and every render is identical. The skills do not transcribe speech: captions need a transcript as SRT or JSON.' },
    ],
    freePreview: {
      type: 'prompt',
      titleRu: 'Фрагмент скилла: история в цифрах',
      titleEn: 'Skill excerpt: data story',
      contentRu: `Скилл: data-story

1. Проверь таблицу и посчитай изменение скриптом:
   python3 scripts/csv_to_chart.py data.csv --highlight last --delta first:last
2. Ячейку, которая не число, покажи пользователю — не исправляй молча.
3. Цифру для заголовка бери из facts, не считай в уме.
4. Столбцы — всегда от нуля; акцент — на одном столбце.
5. Перед рендером сверь каждую цифру в кадре с facts.`,
      contentEn: `Skill: data-story

1. Check the table and compute the change with the script:
   python3 scripts/csv_to_chart.py data.csv --highlight last --delta first:last
2. Show the user any cell that is not a number — never fix it silently.
3. Take the headline number from facts, not from mental arithmetic.
4. Bars always start at zero; one bar carries the accent.
5. Before rendering, check every number on screen against facts.`,
    },
    recommendsForCourses: ['ai-content-creator', 'ai-agent-engineer'],
    relatedIds: ['mp-mcp-claude-skills', 'mp-creator-reels-pack', 'mp-creator-hooks'],
  }),
  product({
    id: 'mp-mcp-cinematic-studio',
    slug: 'claude-cinematic-studio',
    categoryId: 'mcp-skills',
    productType: 'agent-pack',
    titleRu: 'Claude Cinematic Studio',
    titleEn: 'Claude Cinematic Studio',
    shortRu: '9 скиллов для Claude Code, Cowork и Codex, которые превращают агента в студию моушн-дизайна, монтажа и VFX: объёмная 3D-типографика в одном пространстве с объектами, кинокамера с глубиной резкости, свет, стекло и хром, частицы и световые следы, композитинг видео с масками и трекингом, Blender, монтаж в долю, настоящий motion blur и цвет.',
    shortEn: '9 skills for Claude Code, Cowork and Codex that turn the agent into a motion design, editing and VFX studio: extruded 3D type sharing space with objects, a film camera with depth of field, light, glass and chrome, particles and light trails, footage compositing with mattes and tracking, Blender, beat-synced cuts, real motion blur and colour. Files are in Russian.',
    fileTypes: ['ZIP', 'MD', 'PY', 'TSX'],
    includedRu: ['9 скиллов в формате Agent Skills, плагин для Claude Code', 'Проект Remotion + three.js: 5 роликов-образцов и 5 стилей (Keynote, Chrome, Kinetic, Neon Tech, Editorial)', '3D-библиотека: объёмный текст по буквам, текст по кольцу, камеры, стекло, хром, зеркальный пол, кольца, частицы, световые следы, HUD, модели .glb', 'Композитинг: кадры из видео, маски человека и объекта, трекинг, текст за объектом, speed ramp', 'Blender: фотореалистичный продукт и логотип из SVG секвенцией с альфой', 'Монтаж и звук: доли и склейки в ритм, поиск match cut, синтез whoosh, ударов и райзеров', 'Финал: motion blur из 4× рендера, 6 LUT, ореол, зерно, −14 LUFS, кропы под площадки', 'Контроль качества: отчёт по ролику и чек-лист «не AI-вида»'],
    includedEn: ['9 skills in the Agent Skills format, a Claude Code plugin', 'A Remotion + three.js project: 5 example films and 5 looks (Keynote, Chrome, Kinetic, Neon Tech, Editorial)', 'A 3D library: per-letter extruded type, ring type, cameras, glass, chrome, mirror floor, rings, particles, light trails, HUD, .glb models', 'Compositing: frames from video, person and object mattes, tracking, type behind the subject, speed ramps', 'Blender: photoreal products and SVG logos rendered as sequences with alpha', 'Editing and sound: beats and on-beat cuts, match-cut finder, synthesized whooshes, hits and risers', 'Finishing: motion blur from a 4× render, 6 LUTs, halation, grain, −14 LUFS, platform crops', 'QC: a report on the film and a checklist against the AI-video look'],
    priceEur: 79,
    coverGradient: 'linear-gradient(135deg, #38f0ff, #05060a)',
    coverIcon: '🎥',
    screenshots: ['/marketplace/claude-cinematic-studio/hero-title.mp4', '/marketplace/claude-cinematic-studio/orbit-type.mp4', '/marketplace/claude-cinematic-studio/tech-film.mp4', '/marketplace/claude-cinematic-studio/kinetic-spot.mp4', '/marketplace/claude-cinematic-studio/footage-fx.mp4'],
    videoPreview: '/marketplace/claude-cinematic-studio/showreel.mp4',
    creatorId: 'creator-insider',
    badge: 'trend-2026',
    badges: ['trending', 'new'],
    faqRu: [
      { q: 'Как получить файлы после оплаты?', a: 'Сразу в личном кабинете → Marketplace → Мои загрузки.' },
      { q: 'Можно ли использовать в коммерческих проектах?', a: 'Да, лицензия на использование в работе с клиентами включена. Сделанные ролики — ваши, их можно продавать.' },
      { q: 'Есть ли обновления?', a: 'Да, пожизненный доступ к обновлениям в рамках продукта.' },
      { q: 'Это генерация видео нейросетью?', a: 'Нет. Ролик собирается кодом: настоящая 3D-сцена в three.js — геометрия букв, свет, материалы, камера, глубина резкости — плюс ваш футаж, ваша модель и рендеры Blender. Текст в кадре точный, кириллица ровная, а рендер повторяется кадр в кадр.' },
      { q: 'Чем отличается от Claude Motion Studio?', a: 'Motion Studio — плоский моушн-дизайн: типографика, графики, субтитры, промо по скриншотам. Cinematic Studio — объём и кино: 3D-текст в одном пространстве с объектами, движения камеры, свет и отражения, VFX, композитинг реального видео с масками и трекингом, Blender, настоящий motion blur и цвет. Наборы не пересекаются и работают вместе.' },
      { q: 'Что нужно на компьютере?', a: 'Claude Code, Cowork или Codex; Node.js 18+, ffmpeg, Python 3.9+; около 1 ГБ на диске; компьютер с графикой — любой Mac на Apple Silicon или ПК с нормальной видеокартой. Для масок и трекинга — OpenCV и MediaPipe (одна команда), для фотореалистичного 3D — бесплатный Blender 4.x. В облачной песочнице без графики скиллы напишут концепцию, раскадровку и код, но 3D не отрендерят.' },
      { q: 'Нужна ли лицензия Remotion?', a: 'Remotion бесплатен для частных лиц, некоммерческих организаций и компаний до трёх человек. Компаниям от четырёх человек нужна лицензия Remotion (remotion.pro) — её покупают у Remotion отдельно, в этот набор она не входит. three.js, Blender и шрифты — свободные лицензии.' },
    ],
    faqEn: [
      { q: 'How do I get files after payment?', a: 'Instantly in your account → Marketplace → My downloads.' },
      { q: 'Can I use this commercially?', a: 'Yes, client work license is included. The films you make are yours to sell.' },
      { q: 'Do I get updates?', a: 'Yes, lifetime updates for this product.' },
      { q: 'Is this AI video generation?', a: 'No. Films are built in code: a real three.js scene — letter geometry, light, materials, camera, depth of field — plus your footage, your model and Blender renders. On-screen text is exact, Cyrillic is clean, and every render is identical.' },
      { q: 'How is it different from Claude Motion Studio?', a: 'Motion Studio is flat motion design: typography, charts, captions, promos from screenshots. Cinematic Studio is depth and cinema: 3D type in the same space as objects, camera moves, light and reflections, VFX, compositing real footage with mattes and tracking, Blender, real motion blur and colour. They don\'t overlap and work together.' },
      { q: 'What do I need on my computer?', a: 'Claude Code, Cowork or Codex; Node.js 18+, ffmpeg, Python 3.9+; about 1 GB of disk; a computer with graphics — any Apple Silicon Mac or a PC with a decent GPU. Mattes and tracking need OpenCV and MediaPipe (one command); photoreal 3D needs free Blender 4.x. In a cloud sandbox without graphics the skills write the concept, storyboard and code but cannot render 3D.' },
      { q: 'Do I need a Remotion licence?', a: 'Remotion is free for individuals, non-profits and companies of up to three people. Companies of four or more need a Remotion company licence (remotion.pro), bought from Remotion separately; it is not part of this pack. three.js, Blender and the fonts are free licences.' },
    ],
    freePreview: {
      type: 'prompt',
      titleRu: 'Фрагмент скилла: режиссёр',
      titleEn: 'Skill excerpt: the director',
      contentRu: 'Скилл: cinematic-director\n\n1. Идея одной фразой: «продукт появляется из света», а не «красивое видео о продукте».\n2. Один стиль, один визуальный мотив, который связывает первый и последний шот.\n3. Каждый шот: что зритель должен почувствовать, движение камеры и объектив, минимум два плана по глубине, один главный эффект.\n4. Проверь раскадровку: python3 scripts/storyboard.py storyboard.json\n5. Стайлфреймы до анимации: если неподвижный кадр не выглядит дорого, анимация не спасёт.\n6. «Готово» — только после контактного листа и cinema-review.',
      contentEn: 'Skill: cinematic-director\n\n1. The idea in one line: "the product emerges from light", not "a nice video about the product".\n2. One look, one visual motif that ties the first and last shots.\n3. Each shot: what the viewer must feel, camera move and lens, at least two depth planes, one hero effect.\n4. Check the storyboard: python3 scripts/storyboard.py storyboard.json\n5. Style frames before animation: if a still frame doesn\'t look expensive, motion won\'t save it.\n6. "Done" only after the contact sheet and cinema-review.',
    },
    recommendsForCourses: ['ai-content-creator', 'ai-agent-engineer'],
    relatedIds: ['mp-mcp-motion-studio', 'mp-mcp-claude-skills', 'mp-creator-reels-pack'],
  }),
  product({
    id: 'mp-agent-multi-ops',
    slug: 'multi-agent-ops-team',
    categoryId: 'ai-agents',
    productType: 'agent-pack',
    titleRu: 'Multi-Agent Ops Team',
    titleEn: 'Multi-Agent Ops Team',
    shortRu: 'Команда AI-агентов для n8n: оркестратор и четыре агента — разбор почты, лиды, поддержка, отчёты. Сайт, Telegram, почта и утренний отчёт; у каждого агента свои инструкции, инструменты и дневной лимит, каждое действие — в журнале. OpenAI или Claude. Проверено в n8n 2.48.',
    shortEn: 'An AI agent team for n8n: an orchestrator and four agents — email triage, leads, support, reports. Site, Telegram, email and a morning report; each agent has its own prompt, tools and daily budget, every action is logged. OpenAI or Claude. Tested in n8n 2.48. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD', 'CSV', 'SVG'],
    includedRu: ['Оркестратор и 4 агента на нативных узлах n8n AI Agent Tool', 'Почта: категория, срочность, черновик ответа; лиды: балл по видимым правилам', 'Ежедневный отчёт в Telegram: цифры считает код, не модель', 'Лимит шагов и дневной бюджет у каждого агента, доступ по каналам', 'Трасса «какой агент — какая задача» в журнале, передача человеку', 'Два файла (OpenAI и Claude), схема, 5 инструкций агентов, 16 eval-случаев, 8 руководств'],
    includedEn: ['Orchestrator and 4 agents on native n8n AI Agent Tool nodes', 'Email: category, urgency, draft reply; leads: score by visible rules', 'Daily report in Telegram: numbers computed by code, not the model', 'Step limit and daily budget per agent, access by channel', 'Agent-by-agent trace in the log, handoff to a person', 'Two files (OpenAI and Claude), diagram, 5 agent prompts, 16 eval cases, 8 guides'],
    testedIntegrations: ['OpenAI', 'Anthropic', 'Webhook', 'n8n', 'Google Sheets', 'Telegram', 'IMAP'],
    changelogRu: ['1.0.0 — первый выпуск: оркестратор, 4 агента, лимиты, трасса, утренний отчёт, 16 eval-случаев'],
    changelogEn: ['1.0.0 — first release: orchestrator, 4 agents, budgets, trace, morning report, 16 eval cases'],
    priceEur: 129,
    coverGradient: 'linear-gradient(135deg, #6366f1, #22c55e)',
    coverIcon: '👥',
    creatorId: 'creator-agent-studio',
    badge: 'trend-2026',
    badges: ['trending', 'new'],
    recommendsForCourses: ['ai-agent-engineer', 'ai-automation-engineer'],
    relatedIds: ['mp-agent-support', 'mp-agent-sales', 'mp-workflow-lead-gen'],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: кто что делает',
      titleEn: 'Sample: who does what',
      contentRu: `Канал        → кого можно звать
сайт, Telegram → leads_agent, support_agent
почта        → email_triage_agent → leads_agent
команда      → все четыре
09:00        → reports_agent → отчёт в Telegram

Лимит на сутки: почта 300 · лиды 300 · поддержка 500 · отчёты 20
Исчерпан → агент получает заглушку и не работает

Журнал: leads_agent ← «клиника, бот, 3000 €, сейчас»
        → L-7Q2 · 100/100 · 🔥 в чат команды`,
      contentEn: `Channel        → who may be called
site, Telegram → leads_agent, support_agent
email          → email_triage_agent → leads_agent
team           → all four
09:00          → reports_agent → report to Telegram

Daily budget: email 300 · leads 300 · support 500 · reports 20
Spent → the agent gets a stub prompt and does nothing

Log: leads_agent ← "clinic, bot, €3000, now"
     → L-7Q2 · 100/100 · 🔥 to the team chat`,
    },
  }),
  product({
    id: 'mp-biz-agent-audit',
    slug: 'agent-audit-kit',
    categoryId: 'business-templates',
    productType: 'business-pack',
    titleRu: 'Agent Audit Kit',
    titleEn: 'Agent Audit Kit',
    shortRu: 'Набор для аудита AI-агентов: модель управления, чеклист из 48 пунктов, три политики, оценка рисков и калькулятор окупаемости.',
    shortEn: 'An AI agent audit kit: governance model, 48-point checklist, three policies, risk assessment and ROI calculator. Files are in Russian.',
    fileTypes: ['MD', 'CSV'],
    includedRu: ['Модель управления агентами', 'Чеклист безопасности — 48 пунктов', 'Шаблоны трёх политик', 'Реестр агентов и оценка рисков', 'Калькулятор окупаемости', 'Шаблон отчёта для клиента'],
    includedEn: ['Agent governance model', '48-point security checklist', 'Three policy templates', 'Agent register and risk assessment', 'ROI calculator', 'Client report template'],
    priceEur: 59,
    coverGradient: 'linear-gradient(135deg, #0f172a, #f43f5e)',
    coverIcon: '🛡️',

    screenshots: [
      '/marketplace/agent-audit-kit-shot-1.svg',
      '/marketplace/agent-audit-kit-shot-2.svg',
    ],
    creatorId: 'creator-insider',
    badge: 'trend-2026',
    badges: ['trending', 'new'],
    freePreview: {
      type: 'prompt',
      titleRu: 'Бесплатный чеклист: безопасность агента',
      titleEn: 'Free checklist: agent security',
      contentRu: `□ Логи запросов включены, PII маскируется
□ Есть human escalation при confidence < 0.6
□ Инструменты с write-доступом требуют подтверждения
□ Rate limit и budget cap на API
□ Политика «что агент НЕ делает» задокументирована
□ Тестовый сценарий jailbreak пройден`,
      contentEn: `□ Request logs on, PII masked
□ Human escalation if confidence < 0.6
□ Write tools require confirmation
□ API rate limit and budget cap
□ Documented “what the agent must NOT do”
□ Jailbreak test scenario passed`,
    },
    recommendsForCourses: ['ai-business-builder', 'ai-agent-engineer'],
    relatedIds: ['mp-biz-agency-proposal', 'mp-biz-sop'],
  }),
  product({
    id: 'mp-income-agency-os',
    slug: 'ai-automation-agency-os',
    categoryId: 'business-templates',
    productType: 'business-system',
    releaseStatus: 'preview',
    titleRu: 'AI Automation Agency OS',
    titleEn: 'AI Automation Agency OS',
    shortRu: 'Система работы с клиентом для AI-агентства: аудит, оффер, смета, предложение, договор, старт, внедрение и поддержка на 90 дней.',
    shortEn: 'A client operating system for an AI agency: audit, offer, pricing, proposal, contract, onboarding, delivery and a 90-day retainer. Files are in Russian.',
    fileTypes: ['MD', 'CSV'],
    includedRu: ['AI-аудит бизнеса с картой процессов', 'Конструктор оффера и три пакета', 'Калькулятор цены и окупаемости', 'Предложение и шаблон договора', 'Старт и план внедрения на 15 дней', 'Поддержка: план на 90 дней', 'Воронка сделок'],
    includedEn: ['Business audit with a process map', 'Offer builder and three packages', 'Pricing and ROI calculator', 'Proposal and agreement template', 'Onboarding and a 15-day delivery plan', '90-day retainer plan', 'Pipeline tracker'],
    priceEur: 119,
    coverGradient: 'linear-gradient(135deg, #6d28d9 0%, #f97316 100%)',
    coverImage: '/marketplace/ai-automation-agency-os-mockup.webp',
    creatorId: 'creator-insider',
    badge: 'trend-2026',
    badges: ['new', 'trending'],
    testedIntegrations: ['Notion', 'Make', 'Zapier', 'Google Docs', 'Slack', 'Stripe'],
    recommendsForCourses: ['ai-business-builder', 'ai-automation-engineer'],
    relatedIds: ['mp-biz-agency-proposal', 'mp-biz-agent-audit', 'mp-workflow-lead-gen'],
  }),
  product({
    id: 'mp-income-zapier-migration',
    slug: 'zapier-to-n8n-migration-system',
    categoryId: 'n8n-workflows',
    productType: 'workflow-system',
    titleRu: 'Zapier → n8n Migration System',
    titleEn: 'Zapier → n8n Migration System',
    shortRu: 'Система для фрилансеров и агентств, которые переносят клиентов с Zapier и Make на n8n: методика из 7 этапов, Python-инструмент аудита (читает экспорт Make и Zapier → опись, карта сервисов и доступов, волны и оценка в часах и деньгах), сверка параллельного прогона и монитор n8n как воркфлоу, шаблоны предложения, ТЗ, пакетов и поддержки. Проверено в n8n 2.44.',
    shortEn: 'A system for freelancers and agencies moving clients from Zapier and Make to n8n: a 7-stage method, a Python audit tool (reads Make and Zapier exports → inventory, app and access map, waves and an estimate in hours and money), a parallel-run check and an n8n monitor as workflows, plus proposal, SOW, package and support templates. Tested in n8n 2.44. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD', 'CSV', 'PY'],
    includedRu: ['Методика переноса: 7 этапов от звонка до поддержки', 'Инструмент аудита на Python: опись, карта сервисов, волны, оценка', 'Таблица соответствий ~100 сервисов и модулей Zapier/Make → n8n', 'Воркфлоу сверки параллельного прогона и монитор n8n', 'Коммерческое предложение, ТЗ, пакеты, договор поддержки', 'Чек-лист доступов, runbook переключения и отката'],
    includedEn: ['Migration method: 7 stages from first call to support', 'Python audit tool: inventory, app map, waves, estimate', 'A map of ~100 Zapier/Make apps and modules → n8n', 'Parallel-run check and n8n monitor workflows', 'Proposal, SOW, packages, support agreement', 'Access checklist, cutover and rollback runbook'],
    priceEur: 89,
    coverGradient: 'linear-gradient(135deg, #7c3aed 0%, #fb923c 100%)',
    creatorId: 'creator-automation-lab',
    badge: 'trend-2026',
    badges: ['new', 'trending'],
    recommendsForCourses: ['ai-automation-engineer', 'first-automation-n8n'],
    relatedIds: ['mp-workflow-crm', 'mp-biz-agent-audit'],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: что выдаёт аудит',
      titleEn: 'Sample: what the audit gives you',
      contentRu: `$ python3 migration_audit.py экспорт-клиента --rate 50
8 автоматизаций, 57.5 ч, 2 875 EUR

| Волна | Автоматизация        | Сложность | Часы |
| 1     | Оплата Stripe → счёт | простая   | 4    |
| 2     | Typeform → Pipedrive | средняя   | 4.5  |
| 3     | Заказы Shopify       | сложная   | 10.5 |
Риски: Email by Zapier, Storage, Make Data store
Доступы: Google Sheets, Slack, HubSpot, Stripe…`,
      contentEn: `$ python3 migration_audit.py client-export --rate 50
8 automations, 57.5 h, 2,875 EUR

| Wave | Automation              | Complexity | Hours |
| 1    | Stripe payment → invoice | simple     | 4     |
| 2    | Typeform → Pipedrive     | medium     | 4.5   |
| 3    | Shopify orders           | complex    | 10.5  |
Risks: Email by Zapier, Storage, Make Data store
Access: Google Sheets, Slack, HubSpot, Stripe…`,
    },
  }),
  product({
    id: 'mp-income-real-estate',
    slug: 'real-estate-lead-to-viewing',
    categoryId: 'ai-agents',
    productType: 'vertical-system',
    titleRu: 'Real Estate Lead → Viewing',
    titleEn: 'Real Estate Lead → Viewing',
    shortRu: 'AI-агент для агентства недвижимости в n8n: квалифицирует клиента, подбирает объекты только из вашей базы и объясняет выбор, записывает на просмотр в Google Календарь нужного риелтора после явного «да». Карточки лидов с баллом, follow-up, спецификация KPI-дашборда. OpenAI или Claude. Проверено в n8n 2.48.',
    shortEn: 'An AI agent for a real estate agency in n8n: qualifies the client, matches listings only from your base and explains why, books a viewing in the right realtor\'s Google Calendar after an explicit yes. Lead cards with scores, follow-up, KPI dashboard spec. OpenAI or Claude. Tested in n8n 2.48. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD', 'CSV'],
    includedRu: ['Агент квалификации: бюджет, район, комнаты, сроки, ипотека — балл по правилам', 'Назначение риелтора по району и типу сделки, сигнал о горячем лиде', 'Подбор из листа объектов с причинами; выдуманный объект не уйдёт клиенту', 'Запись на просмотр в календарь риелтора: окна с зазором, только после «да», без дублей', 'Follow-up: напоминания клиентам, список звонков и просмотров на завтра', 'KPI-дашборд: формулы Google Таблиц и Looker Studio; 16 eval-случаев, 9 руководств'],
    includedEn: ['Qualification agent: budget, area, rooms, timing, mortgage — rule-based score', 'Realtor routing by area and deal type, hot lead alert', 'Listing matching with reasons; an invented listing never reaches the client', 'Viewing booking in the realtor\'s calendar: buffered slots, only after a yes, no duplicates', 'Follow-up: client reminders, call list and tomorrow\'s viewings', 'KPI dashboard: Google Sheets formulas and Looker Studio; 16 eval cases, 9 guides'],
    testedIntegrations: ['OpenAI', 'Anthropic', 'Webhook', 'n8n', 'Google Sheets', 'Google Calendar', 'Telegram'],
    changelogRu: ['1.0.0 — первый выпуск: квалификация, подбор, запись на просмотр, follow-up, KPI-дашборд'],
    changelogEn: ['1.0.0 — first release: qualification, matching, viewing booking, follow-up, KPI dashboard'],
    priceEur: 149,
    coverGradient: 'linear-gradient(135deg, #4c1d95 0%, #f97316 100%)',
    creatorId: 'creator-agent-studio',
    badge: 'trend-2026',
    badges: ['new', 'trending'],
    recommendsForCourses: ['ai-agent-engineer', 'ai-business-builder'],
    relatedIds: ['mp-agent-lead-qual', 'mp-agent-booking', 'mp-workflow-crm'],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: подбор и запись',
      titleEn: 'Sample: matching and booking',
      contentRu: `search_listings(buy, Печерский, 2 комн., до 150 000 $)
  KV-101 · 148 000 USD
    ✓ в бюджете · ✓ комнат: 2 · ✓ район: Печерский
  KV-107 — продан, не показывается
  KV-102 — 215 000, дороже бюджета больше чем на 10%

check_viewing_slots(KV-101, пятница)
  у Марии встреча 10:00–12:00 + зазор 30 мин → 12:30, 13:30, 14:30

«Давайте в 12:30»   → не записываю: это выбор, не «да»
«Да, записывайте»   → событие в календаре Марии, 📅 ей в Telegram
«Да, записывайте»   → та же запись, без дубля`,
      contentEn: `search_listings(buy, Pechersk, 2 rooms, up to $150,000)
  KV-101 · 148,000 USD
    ✓ in budget · ✓ rooms: 2 · ✓ area: Pechersk
  KV-107 — sold, not shown
  KV-102 — 215,000, more than 10% over budget

check_viewing_slots(KV-101, Friday)
  Maria has a meeting 10:00–12:00 + 30 min buffer → 12:30, 13:30, 14:30

"Let's do 12:30"   → not booked: a choice, not a yes
"Yes, book it"     → event in Maria's calendar, 📅 to her Telegram
"Yes, book it"     → same booking, no duplicate`,
    },
  }),
  product({
    id: 'mp-income-ecommerce-retention',
    slug: 'ecommerce-support-retention-engine',
    categoryId: 'ai-agents',
    productType: 'vertical-system',
    titleRu: 'E-commerce Support & Retention Engine',
    titleEn: 'E-commerce Support & Retention Engine',
    shortRu: 'Система для интернет-магазина на n8n: AI-ассистент отвечает о заказах только владельцу и проверяет возвраты по вашим правилам (деньги не возвращает — заявку решает менеджер), плюс письма о брошенных корзинах по согласию и просьбы об отзывах. Shopify, WooCommerce или Google Таблица. OpenAI или Claude. Проверено в n8n 2.48.',
    shortEn: 'An n8n system for online stores: an AI assistant answers about orders only to their owners and checks returns against your rules (it never refunds — a manager decides), plus consent-based abandoned-cart emails and review requests. Shopify, WooCommerce or Google Sheets. OpenAI or Claude. Tested in n8n 2.48. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD', 'CSV'],
    includedRu: ['Ассистент магазина: статус заказа владельцу, правила магазина, передача человеку', 'Возвраты по правилам из Config: срок, распродажа, невозвратные товары, брак — менеджеру; заявки в таблицу и Telegram', 'Брошенные корзины: 2 письма по согласию, тихие часы, отписка по подписанной ссылке', 'Просьбы об отзывах после доставки, один раз на заказ', 'Shopify Admin GraphQL, WooCommerce REST или Google Таблица; вебхук событий корзины', 'Плейбук удержания, 30 eval-случаев со скриптом, демо-данные, чат-виджет, 8 инструкций'],
    includedEn: ['Store assistant: order status for the owner, store policies, handoff to a person', 'Returns by rules in Config: window, final sale, non-returnable items, defects to a manager; requests to Sheets and Telegram', 'Abandoned carts: 2 consent-based emails, quiet hours, signed unsubscribe links', 'Review requests after delivery, once per order', 'Shopify Admin GraphQL, WooCommerce REST or Google Sheets; cart-event webhook', 'Retention playbook, 30 eval cases with a runner, demo data, chat widget, 8 guides'],
    testedIntegrations: ['OpenAI', 'Anthropic', 'Webhook', 'n8n', 'Shopify', 'WooCommerce', 'Google Sheets', 'Telegram', 'SMTP'],
    changelogRu: ['1.0.0 — первый выпуск: ассистент, возвраты по правилам, брошенные корзины, отзывы, плейбук'],
    changelogEn: ['1.0.0 — first release: assistant, rule-based returns, abandoned carts, reviews, playbook'],
    priceEur: 139,
    coverGradient: 'linear-gradient(135deg, #581c87 0%, #ea580c 100%)',
    creatorId: 'creator-agent-studio',
    badge: 'trend-2026',
    badges: ['new', 'trending'],
    recommendsForCourses: ['ai-agent-engineer', 'ai-automation-engineer'],
    relatedIds: ['mp-agent-support', 'mp-agent-sales', 'mp-workflow-support'],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: кто решает о возврате',
      titleEn: 'Sample: who decides on a return',
      contentRu: `check_return — решает код, не модель:
  чужой email          → ничего не сообщаем
  заказ отменён        → не подходит
  брак, не тот товар   → менеджеру, даже после срока
  > 14 дней с доставки → не подходит
  финальная распродажа → не подходит
  был в использовании  → не подходит
  заказ > 10 000       → менеджеру
  иначе                → подходит, до 2026-12-03

create_return_request — проверяет заново:
  заявка R-… в Returns + сообщение команде
  «Деньги автоматически не возвращаются»`,
      contentEn: `check_return — code decides, not the model:
  someone else's email → tell nothing
  order cancelled      → not eligible
  defect, wrong item   → to a manager, even after the window
  > 14 days delivered  → not eligible
  final sale           → not eligible
  used                 → not eligible
  order > 10,000       → to a manager
  otherwise            → eligible until 2026-12-03

create_return_request — checks again:
  request R-… in Returns + team message
  "Money is never refunded automatically"`,
    },
  }),
  product({
    id: 'mp-income-revenue-recovery',
    slug: 'revenue-recovery-agent',
    categoryId: 'ai-agents',
    productType: 'agent-pack',
    titleRu: 'Revenue Recovery Agent',
    titleEn: 'Revenue Recovery Agent',
    shortRu: 'AI-агент дебиторки для n8n: каждое утро находит просроченные счета, оценивает риск правилами и моделью и готовит вежливое напоминание с нарастающим тоном. Письмо уходит только по кнопке «Отправить» в Telegram, без угроз и с повторной проверкой оплаты. Команды /paid, /promise, /dispute, отчёт по понедельникам. Проверено в n8n 2.48.',
    shortEn: 'An n8n accounts-receivable agent: every morning it finds overdue invoices, scores risk with rules and a model, and drafts a polite reminder with escalating tone. Nothing is sent until you press Send in Telegram — no threats, payment re-checked first. /paid, /promise, /dispute commands and a Monday report. Tested in n8n 2.48. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD', 'CSV'],
    includedRu: ['Ежедневный мониторинг просроченных счетов из Google Таблицы', 'Последовательность из 4 писем: дружеское → деловое → настойчивое → последнее', 'Риск по правилам и по оценке модели — с причинами; модель может только повысить', 'Одобрение в Telegram: Отправить, Изменить, Пропустить; повторная проверка оплаты', 'Стоп-правила и команды: оплачен, обещание, спор, пауза', 'Отчёт по понедельникам, 20 eval-случаев со скриптом, источники: Stripe, QuickBooks, Xero, 7 инструкций'],
    includedEn: ['Daily monitoring of overdue invoices from Google Sheets', 'A 4-letter sequence: friendly → firm → escalating → final', 'Risk from rules and from the model, with reasons; the model can only raise it', 'Approval in Telegram: Send, Edit, Skip; payment re-checked before sending', 'Stop rules and commands: paid, promise, dispute, pause', 'Monday report, 20 eval cases with a runner, sources: Stripe, QuickBooks, Xero, 7 guides'],
    testedIntegrations: ['OpenAI', 'Anthropic', 'Webhook', 'n8n', 'Google Sheets', 'Telegram', 'SMTP'],
    changelogRu: ['1.0.0 — первый выпуск: мониторинг, риск, черновики с проверкой, одобрение в Telegram, отчёт'],
    changelogEn: ['1.0.0 — first release: monitoring, risk, checked drafts, Telegram approval, report'],
    priceEur: 99,
    coverGradient: 'linear-gradient(135deg, #6d28d9 0%, #f59e0b 100%)',
    creatorId: 'creator-automation-lab',
    badge: 'trend-2026',
    badges: ['new'],
    recommendsForCourses: ['ai-automation-engineer', 'ai-business-builder'],
    relatedIds: ['mp-workflow-crm', 'mp-agent-sales'],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: что не уйдёт клиенту',
      titleEn: 'Sample: what never reaches the client',
      contentRu: `Черновик модели заменяется шаблоном, если в нём:
  нет номера счёта или точной суммы
  суд, иск, коллекторы, пени, штрафы
  «вы игнорируете», «вы нарушили»
  скидка, рассрочка, ссылка

Письмо не уходит, даже после «Отправить», если:
  счёт оплачен, оспорен, на паузе
  клиент обещал оплатить к будущей дате

Риск: правила (просрочка, сумма, история, обещания)
  + модель (заметки менеджера) — только вверх`,
      contentEn: `The model's draft is replaced by a template if it:
  lacks the invoice number or the exact amount
  mentions court, lawsuits, collectors, penalties
  says "you ignore", "you breached"
  offers a discount, instalments or a link

Nothing is sent, even after Send, if:
  the invoice is paid, disputed or paused
  the client promised to pay by a future date

Risk: rules (age, amount, history, promises)
  + model (manager's notes) — upwards only`,
    },
  }),
  product({
    id: 'mp-income-content-service',
    slug: 'content-repurposing-service-system',
    categoryId: 'creator-resources',
    productType: 'workflow-system',
    releaseStatus: 'preview',
    titleRu: 'Content Repurposing Service System',
    titleEn: 'Content Repurposing Service System',
    shortRu: 'Готовая услуга: из одного длинного видео — 5 коротких видео, 3 поста, письмо, статья и план публикаций. С промптами, анкетой и согласованием.',
    shortEn: 'A ready service: one long video becomes 5 short videos, 3 posts, an email, an article and a publishing plan. With prompts, intake and approvals. Files are in Russian.',
    fileTypes: ['MD', 'JSON', 'CSV'],
    includedRu: ['Описание услуги и порядок работы', 'Цепочка из 7 промптов', 'Анкета клиента и карточка голоса', 'Порядок согласования с готовыми сообщениями', 'Проверка качества', 'Три пакета с расчётом дохода за час', 'Таблица производства'],
    includedEn: ['Service overview and workflow', 'Chain of 7 prompts', 'Client intake and voice card', 'Approval flow with ready messages', 'Quality checklist', 'Three packages with hourly income', 'Production tracker'],
    priceEur: 79,
    coverGradient: 'linear-gradient(135deg, #7e22ce 0%, #fb923c 100%)',
    creatorId: 'creator-insider',
    badge: 'trend-2026',
    badges: ['new'],
    recommendsForCourses: ['ai-content-creator', 'ai-business-builder'],
    relatedIds: ['mp-workflow-content', 'mp-creator-reels-pack', 'mp-creator-calendar'],
  }),
  product({
    id: 'mp-mcp-telegram',
    slug: 'mcp-telegram-inbox',
    categoryId: 'mcp-skills',
    productType: 'agent-pack',
    titleRu: 'MCP: Telegram Inbox',
    titleEn: 'MCP: Telegram Inbox',
    shortRu: 'MCP-сервер: агент читает рабочий Telegram-чат и заводит лиды в CRM только с контактом, который есть в сообщении. Жалобы, возвраты и срочное — менеджеру. Без дублей и с лимитом. Claude, Cursor, n8n. Проверено в n8n 2.48.',
    shortEn: 'An MCP server: the agent reads a work Telegram chat and opens CRM leads only with a contact that is actually in the message. Complaints, refunds and urgent requests go to a manager. No duplicates, with a rate limit. Claude, Cursor, n8n. Tested in n8n 2.48. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'PY', 'JSON', 'MD'],
    includedRu: ['MCP-сервер на Python без пакетов: 5 инструментов, stdio и HTTP', 'Конфиги для Claude Code, Claude Desktop, Cursor и воркфлоу n8n каждые 15 минут', 'Правила эскалации и как их настраивать', 'Запрос агенту и тестовые сообщения'],
    includedEn: ['Dependency-free Python MCP server: 5 tools, stdio and HTTP', 'Configs for Claude Code, Claude Desktop, Cursor and an n8n workflow every 15 minutes', 'Escalation rules and how to tune them', 'Agent request and test messages'],
    testedIntegrations: ['Telegram', 'n8n', 'Claude', 'Cursor', 'MCP', 'Webhook'],
    changelogRu: ['1.0.0 — первый выпуск'],
    changelogEn: ['1.0.0 — first release'],
    priceEur: 39,
    licenses: [
      {
        id: 'personal',
        priceEur: 39,
        rights: 'personal',
        clientLimit: 1,
      },
    ],
    coverGradient: 'linear-gradient(135deg, #38bdf8, #6366f1)',
    coverIcon: '✉️',
    creatorId: 'creator-agent-studio',
    badge: 'new',
    badges: ['new'],
    recommendsForCourses: ['ai-agent-engineer'],
    relatedIds: ['mp-mcp-starter-business'],
    outcomeRu: 'Ни один клиент из рабочего чата не теряется, а спорное сразу у менеджера.',
    outcomeEn: 'No client from the work chat gets lost, and anything contentious goes straight to a manager.',
    setupTime: '30–40 минут',
    priceModel: 'Настройка 300–800€',
    faqRu: [
      {
        q: 'Нужен ли свой бот?',
        a: 'Да, токен бота кладётся в переменную окружения. В файле его нет.',
      },
    ],
    faqEn: [
      {
        q: 'Do I need my own bot?',
        a: 'Yes. The bot token goes in an environment variable. It is not in the file.',
      },
    ],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: что сервер не доверяет модели',
      titleEn: 'Sample: what the server does not leave to the model',
      contentRu: `create_lead(message_ids, phone, need)
  ✓ сообщения есть в хранилище — id не придумать
  ✓ телефон или email есть в тексте этих сообщений
  ✓ по этим сообщениям лида ещё нет
  ✓ не больше 5 лидов за 10 минут
  ✓ CRM ответила успехом — иначе сообщение остаётся new

escalation_hints: «жалоба или возврат», «срочно», «крупный клиент»
  → escalate: менеджеру, с пересказом и ссылкой, один раз`,
      contentEn: `create_lead(message_ids, phone, need)
  ✓ the messages exist in storage — ids cannot be invented
  ✓ the phone or email is in the text of those messages
  ✓ no lead exists for them yet
  ✓ at most 5 leads per 10 minutes
  ✓ the CRM answered success — otherwise the message stays new

escalation_hints: "complaint or refund", "urgent", "large client"
  → escalate: to a manager, with a summary and a link, once`,
    },
  }),
  product({
    id: 'mp-mcp-notion',
    slug: 'mcp-notion-workspace',
    categoryId: 'mcp-skills',
    productType: 'agent-pack',
    titleRu: 'MCP: Notion Workspace',
    titleEn: 'MCP: Notion Workspace',
    shortRu: 'MCP-сервер: агент ищет ответы только в разрешённых базах Notion и пишет строку только в одну таблицу — в разрешённые колонки, с проверкой вариантов и без дублей. Ничего не удаляет и не меняет. Claude, Cursor, n8n.',
    shortEn: 'An MCP server: the agent searches only the Notion databases you allow and writes a row to one agreed table — allowed columns only, options checked, no duplicates. It deletes and edits nothing. Claude, Cursor, n8n. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'PY', 'JSON', 'MD'],
    includedRu: ['MCP-сервер на Python без пакетов, API Notion 2026-03-11', 'Конфиг: базы знаний и одна таблица для записи', 'Шаблон списка разрешённых баз', '14 проверочных вопросов', 'Конфиги для Claude Code, Claude Desktop, Cursor; подключение к n8n'],
    includedEn: ['Dependency-free Python MCP server, Notion API 2026-03-11', 'Config: knowledge bases and one table to write to', 'Allowed-databases register template', '14 test questions', 'Configs for Claude Code, Claude Desktop, Cursor; n8n setup'],
    testedIntegrations: ['Notion', 'MCP', 'Claude', 'Cursor', 'n8n'],
    changelogRu: ['1.0.0 — первый выпуск'],
    changelogEn: ['1.0.0 — first release'],
    priceEur: 39,
    licenses: [
      {
        id: 'personal',
        priceEur: 39,
        rights: 'personal',
        clientLimit: 1,
      },
    ],
    coverGradient: 'linear-gradient(135deg, #818cf8, #0f172a)',
    coverIcon: '📓',
    creatorId: 'creator-agent-studio',
    badge: 'new',
    badges: ['new'],
    recommendsForCourses: ['ai-agent-engineer'],
    relatedIds: ['mp-mcp-claude-skills'],
    outcomeRu: 'Ответы агента только из вашей базы, запись — только туда, куда договорились.',
    outcomeEn: 'The agent answers from your workspace only and writes only where agreed.',
    setupTime: 'около часа',
    priceModel: 'Настройка 400–900€',
    faqRu: [
      {
        q: 'Агент видит весь Notion?',
        a: 'Нет. В инструкции перечислены только те базы, которые вы открыли.',
      },
    ],
    faqEn: [
      {
        q: 'Can the agent see all of Notion?',
        a: 'No. The guide lists only the databases you open.',
      },
    ],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: что разрешено агенту',
      titleEn: 'Sample: what the agent may do',
      contentRu: `search_knowledge  → только базы из knowledge, found=false вместо догадок
read_page         → только статьи из этих баз
describe_target   → колонки таблицы, варианты Select
append_row        → одна таблица:
   ✓ только колонки из настроек
   ✓ Select — только существующий вариант
   ✓ Статус = «Новая» ставит сервер
   ✓ без дублей по колонке «Название»

Нет инструментов: изменить, удалить, искать по всему Notion`,
      contentEn: `search_knowledge  → only the allowed bases, found=false instead of guessing
read_page         → only articles from those bases
describe_target   → table columns, Select options
append_row        → one table:
   ✓ configured columns only
   ✓ Select — existing options only
   ✓ Status = "New" is set by the server
   ✓ no duplicates by the Name column

No tools to edit, delete or search all of Notion`,
    },
  }),
  product({
    id: 'mp-mcp-calendar',
    slug: 'mcp-google-calendar',
    categoryId: 'mcp-skills',
    productType: 'agent-pack',
    titleRu: 'MCP: Google Calendar',
    titleEn: 'MCP: Google Calendar',
    shortRu: 'MCP-сервер: свободные слоты с учётом рабочих часов и перерывов, а событие — только после явного «да» клиента на конкретный вопрос. Повторная проверка слота перед записью, без дублей, без удаления. Claude, Cursor, n8n.',
    shortEn: 'An MCP server: free slots that respect working hours and buffers, and an event only after the client\'s explicit yes to a specific question. The slot is re-checked before writing, no duplicates, no deletes. Claude, Cursor, n8n. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'PY', 'JSON', 'MD'],
    includedRu: ['MCP-сервер на Python без пакетов: слоты, подготовка, подтверждение', 'Скрипт получения доступа к календарю через браузер', 'Правило подтверждения: что считается «да»', 'Тестовый диалог на 15 шагов', 'Конфиги для Claude Code, Claude Desktop, Cursor; подключение к n8n'],
    includedEn: ['Dependency-free Python MCP server: slots, proposal, confirmation', 'Browser script to grant calendar access', 'Confirmation rule: what counts as a yes', '15-step test dialogue', 'Configs for Claude Code, Claude Desktop, Cursor; n8n setup'],
    testedIntegrations: ['Google Calendar', 'MCP', 'Claude', 'Cursor', 'n8n'],
    changelogRu: ['1.0.0 — первый выпуск'],
    changelogEn: ['1.0.0 — first release'],
    priceEur: 39,
    licenses: [
      {
        id: 'personal',
        priceEur: 39,
        rights: 'personal',
        clientLimit: 1,
      },
    ],
    coverGradient: 'linear-gradient(135deg, #34d399, #6366f1)',
    coverIcon: '📅',
    creatorId: 'creator-agent-studio',
    badge: 'new',
    badges: ['new'],
    recommendsForCourses: ['ai-agent-engineer'],
    relatedIds: ['mp-agent-booking'],
    outcomeRu: 'Запись в календарь без двойных слотов и без сюрпризов.',
    outcomeEn: 'Calendar booking without double slots or surprises.',
    setupTime: 'около часа',
    priceModel: 'Настройка 300–700€',
    faqRu: [
      {
        q: 'Агент сам ставит встречи?',
        a: 'Только после фразы подтверждения. Черновик без «да» в календарь не пишется.',
      },
    ],
    faqEn: [
      {
        q: 'Does the agent book on its own?',
        a: 'Only after a confirmation. A draft without a yes is not written to the calendar.',
      },
    ],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: запись в два шага',
      titleEn: 'Sample: booking in two steps',
      contentRu: `propose_event(чт 11:00, Анна, anna@example.com)
  → календарь не меняется
  → «Записываю: «Встреча: Анна», чт 27.11 11:00–11:30 (Europe/Kyiv),
     приглашение придёт на anna@example.com. Подтверждаете?»

confirm_event(id, «Да, записывайте»)   → событие + приглашение
confirm_event(id, «Да, но лучше в 12») → отказ, ничего не записано
confirm_event(id, «Да») второй раз     → «уже создано», без дубля
слот заняли, пока клиент думал        → отказ, предложить другое`,
      contentEn: `propose_event(Thu 11:00, Anna, anna@example.com)
  → the calendar is not touched
  → "Booking: 'Meeting: Anna', Thu 27.11 11:00–11:30 (Europe/Kyiv),
     invite to anna@example.com. Confirm?"

confirm_event(id, "Yes, go ahead")      → event + invite
confirm_event(id, "Yes, but 12 is better") → refused, nothing written
confirm_event(id, "Yes") again         → "already created", no duplicate
slot taken while the client was thinking → refused, offer another`,
    },
  }),
  product({
    id: 'mp-voice-restaurant',
    slug: 'voice-agent-kit-restaurant',
    categoryId: 'voice-agents',
    productType: 'voice-kit',
    titleRu: 'Voice Agent Kit: Ресторан',
    titleEn: 'Voice Agent Kit: Restaurant',
    shortRu: 'Голосовой администратор ресторана для Vapi, Retell или ElevenLabs: бронирует столы в Google Календаре с учётом числа гостей и зоны, переносит и отменяет брони, банкеты и большие компании передаёт менеджеру. О скидках не говорит. Бэкенд n8n проверен в n8n 2.48.',
    shortEn: 'A voice host for restaurants on Vapi, Retell or ElevenLabs: books tables in Google Calendar by party size and area, moves and cancels bookings, passes banquets and large parties to the manager. Never talks discounts. n8n backend tested in n8n 2.48. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD', 'CSV'],
    includedRu: ['Бэкенд бронирования в n8n: стол по числу гостей, время по вместимости, без двойных броней', 'Сценарий звонка: системный промпт на русском и английском', 'Карта интентов: шесть инструментов и коды ответов', 'Фразы передачи человеку на трёх языках', 'Конфигурации Vapi, Retell и ElevenLabs', '30 тестовых звонков и комплект для продажи'],
    includedEn: ['n8n booking backend: table by party size, time by capacity, no double bookings', 'Call script: system prompt in Russian and English', 'Intent map: six tools and their result codes', 'Handoff lines in three languages', 'Vapi, Retell and ElevenLabs configs', '30 test calls and a sales kit'],
    testedIntegrations: ['Vapi', 'Retell', 'ElevenLabs', 'n8n', 'Google Calendar', 'Telegram'],
    changelogRu: ['1.0.0 — первый выпуск: брони по числу гостей и зонам, 16 тестов бэкенда, запуск в n8n 2.48'],
    changelogEn: ['1.0.0 — first release: bookings by party size and area, 16 backend tests, run in n8n 2.48'],
    priceEur: 79,
    licenses: [
      {
        id: 'personal',
        priceEur: 79,
        rights: 'personal',
        clientLimit: 1,
      },
    ],
    coverGradient: 'linear-gradient(135deg, #14b8a6, #f59e0b)',
    coverIcon: '🍽',
    creatorId: 'creator-agent-studio',
    badge: 'new',
    badges: ['new'],
    recommendsForCourses: ['voice-agents'],
    relatedIds: ['mp-voice-beauty-salon'],
    outcomeRu: 'Администратор не снимает трубку на каждую бронь.',
    outcomeEn: 'The host does not pick up every booking call.',
    setupTime: '1 день',
    priceModel: 'Setup + retainer',
    faqRu: [
      {
        q: 'Можно поставить на свой номер?',
        a: 'Да. В комплекте сценарий и интенты, номер подключаете вы.',
      },
    ],
    faqEn: [
      {
        q: 'Can I use my own number?',
        a: 'Yes. The kit has the script and intents. You connect the number.',
      },
    ],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: как выбирается стол',
      titleEn: 'Sample: how a table is chosen',
      contentRu: `гостей: 4, пятница, 19:00
  держим стол: до 2 гостей — 90 мин, до 4 — 120, до 8 — 150
  подходят: мест ≥ 4, «не меньше 5 гостей» — мимо
  по порядку: стол на четверых → у камина → терраса
  свободен 19:00–21:00 + 15 мин на уборку → бронь

гостей: 12 → party_too_large → менеджеру
«дадите скидку на день рождения?» → не обсуждаем, к брони`,
      contentEn: `guests: 4, Friday, 19:00
  table held: up to 2 guests — 90 min, up to 4 — 120, up to 8 — 150
  fits: seats ≥ 4, "5 guests minimum" — skipped
  in order: table for four → by the fireplace → terrace
  free 19:00–21:00 + 15 min to reset → booked

guests: 12 → party_too_large → to the manager
"a birthday discount?" → not discussed, back to the booking`,
    },
  }),
  product({
    id: 'mp-voice-delivery',
    slug: 'voice-agent-kit-delivery',
    categoryId: 'voice-agents',
    productType: 'voice-kit',
    titleRu: 'Voice Agent Kit: Доставка',
    titleEn: 'Voice Agent Kit: Delivery',
    shortRu: 'Голосовой помощник службы доставки для Vapi, Retell или ElevenLabs: накануне сам звонит клиентам, подтверждает адрес и интервал, исправляет адрес и переносит доставку на свободный интервал в Google Таблице заказов. Состав заказа не меняет — это, отмену и оплату передаёт оператору. Проверено в n8n 2.48.',
    shortEn: 'A voice assistant for delivery services on Vapi, Retell or ElevenLabs: calls customers the day before, confirms address and window, corrects the address and moves the delivery to a free window in a Google Sheet of orders. Never changes the order itself — that, cancellations and payment go to an operator. Tested in n8n 2.48. Files are in Russian.',
    version: '1.0.0',
    fileTypes: ['ZIP', 'JSON', 'MD', 'CSV'],
    includedRu: ['Бэкенд заказов в n8n: подтверждение, адрес в зоне доставки, интервалы с вместимостью', 'Исходящие звонки накануне через Vapi или Retell, не больше двух попыток', 'Сценарий звонка для входящих и исходящих: промпт на русском и английском', 'Интенты: адрес, интервал, оператор; стоп-фразы на изменение состава', 'Конфигурации Vapi, Retell и ElevenLabs, шаблон таблицы заказов', '30 тестовых звонков и комплект для продажи'],
    includedEn: ['n8n order backend: confirmation, address within the delivery area, windows with capacity', 'Day-before outbound calls via Vapi or Retell, at most two attempts', 'Call script for inbound and outbound: prompt in Russian and English', 'Intents: address, window, operator; stop phrases for order changes', 'Vapi, Retell and ElevenLabs configs, order sheet template', '30 test calls and a sales kit'],
    testedIntegrations: ['Vapi', 'Retell', 'ElevenLabs', 'n8n', 'Google Sheets', 'Telegram'],
    changelogRu: ['1.0.0 — первый выпуск: подтверждение, адрес, интервалы, исходящие звонки; 18 тестов, запуск в n8n 2.48'],
    changelogEn: ['1.0.0 — first release: confirmation, address, windows, outbound calls; 18 tests, run in n8n 2.48'],
    priceEur: 79,
    licenses: [
      {
        id: 'personal',
        priceEur: 79,
        rights: 'personal',
        clientLimit: 1,
      },
    ],
    coverGradient: 'linear-gradient(135deg, #22c55e, #14b8a6)',
    coverIcon: '📦',
    creatorId: 'creator-agent-studio',
    badge: 'new',
    badges: ['new'],
    recommendsForCourses: ['voice-agents'],
    relatedIds: ['mp-voice-clinic'],
    outcomeRu: 'Курьер не едет по старому адресу.',
    outcomeEn: 'The courier does not drive to the old address.',
    setupTime: '1 день',
    priceModel: 'Setup + retainer',
    faqRu: [
      {
        q: 'Можно отменить заказ голосом?',
        a: 'Нет. Отмена и изменение состава уходят оператору.',
      },
    ],
    faqEn: [
      {
        q: 'Can a caller cancel by voice?',
        a: 'No. Cancellation and item changes go to an operator.',
      },
    ],
    freePreview: {
      type: 'workflow',
      titleRu: 'Фрагмент: что агент может и чего не может',
      titleEn: 'Sample: what the agent can and cannot do',
      contentRu: `find_order       → только заказы номера, с которого звонят
confirm_delivery → «да» → confirmed = да, строка в history
update_address   → город из зоны; заказ у курьера — только домофон
check_windows    → интервалы с местом, не позже чем за 3 ч
change_window    → заполненный интервал — отказ, старый сохранён
request_callback → состав, отмена, оплата, жалоба — оператору

«добавьте ещё пачку» → такого инструмента нет → оператору`,
      contentEn: `find_order       → only orders of the calling number
confirm_delivery → "yes" → confirmed = yes, a line in history
update_address   → a city in the area; with the courier — intercom only
check_windows    → windows with room, no later than 3 h before
change_window    → a full window is refused, the old one kept
request_callback → items, cancellation, payment, complaint — to an operator

"add another pack" → no such tool → to an operator`,
    },
  }),
]

export const AI_INCOME_COLLECTION = [
  {
    productId: 'mp-income-agency-os',
    outcomeRu: 'Запустить AI-агентство и закрывать клиентов на внедрение + retainer',
    outcomeEn: 'Launch an AI agency and close implementation + retainer clients',
    launchRu: '1–2 дня',
    launchEn: '1–2 days',
    serviceRu: 'Услуга 1 500–10 000€',
    serviceEn: '€1,500–€10,000 service',
  },
  {
    productId: 'mp-income-zapier-migration',
    outcomeRu: 'Продавать миграцию и поддержку n8n как продуктовую услугу',
    outcomeEn: 'Sell n8n migration and maintenance as a productized service',
    launchRu: '4–8 часов',
    launchEn: '4–8 hours',
    serviceRu: 'Проект 800–4 500€',
    serviceEn: '€800–€4,500 project',
  },
  {
    productId: 'mp-voice-beauty-salon',
    outcomeRu: 'Внедрять запись и обработку звонков для локального бизнеса',
    outcomeEn: 'Deploy call handling and booking for local businesses',
    launchRu: '1 день',
    launchEn: '1 day',
    serviceRu: 'Setup + monthly retainer',
    serviceEn: 'Setup + monthly retainer',
  },
  {
    productId: 'mp-income-real-estate',
    outcomeRu: 'Автоматизировать путь от лида до просмотра недвижимости',
    outcomeEn: 'Automate the path from lead to property viewing',
    launchRu: '1–3 дня',
    launchEn: '1–3 days',
    serviceRu: 'Вертикальное внедрение',
    serviceEn: 'Vertical implementation',
  },
  {
    productId: 'mp-income-ecommerce-retention',
    outcomeRu: 'Снизить нагрузку поддержки и возвращать потерянную выручку',
    outcomeEn: 'Reduce support load and recover lost revenue',
    launchRu: '1–2 дня',
    launchEn: '1–2 days',
    serviceRu: 'Setup + usage',
    serviceEn: 'Setup + usage',
  },
  {
    productId: 'mp-income-revenue-recovery',
    outcomeRu: 'Автоматизировать возврат просроченной выручки',
    outcomeEn: 'Automate overdue revenue recovery',
    launchRu: '4–6 часов',
    launchEn: '4–6 hours',
    serviceRu: 'Fee + outcome bonus',
    serviceEn: 'Fee + outcome bonus',
  },
  {
    productId: 'mp-income-content-service',
    outcomeRu: 'Продавать контент-систему брендам и экспертам по подписке',
    outcomeEn: 'Sell a subscription content system to brands and experts',
    launchRu: '3–6 часов',
    launchEn: '3–6 hours',
    serviceRu: '500–2 500€/месяц',
    serviceEn: '€500–€2,500/month',
  },
  {
    productId: 'mp-biz-agent-audit',
    outcomeRu: 'Продавать аудит безопасности и ROI AI-систем',
    outcomeEn: 'Sell AI system security and ROI audits',
    launchRu: '2–4 часа',
    launchEn: '2–4 hours',
    serviceRu: 'Аудит 750–2 500€',
    serviceEn: '€750–€2,500 audit',
  },
]

export const FEATURED_SECTIONS = [
  { id: 'top-selling', titleRu: 'Топ продаж', titleEn: 'Top selling', badge: 'top-selling' },
  { id: 'new', titleRu: 'Новинки', titleEn: 'New releases', badge: 'new' },
  { id: 'most-downloaded', titleRu: 'Чаще всего скачивают', titleEn: 'Most downloaded', badge: 'most-downloaded' },
  { id: 'trending', titleRu: 'В тренде на этой неделе', titleEn: 'Trending this week', badge: 'trending' },
]

export function getMarketplaceProduct(idOrSlug) {
  return MARKETPLACE_PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null
}

export function getProductsByCategory(categoryId) {
  return MARKETPLACE_PRODUCTS.filter((p) => p.categoryId === categoryId)
}

export function getProductsByCreator(creatorId) {
  return MARKETPLACE_PRODUCTS.filter((p) => p.creatorId === creatorId)
}

export function getProductsByBadge(badge) {
  return MARKETPLACE_PRODUCTS.filter((p) => p.badges?.includes(badge))
}

export function getRelatedProducts(product) {
  if (!product?.relatedIds?.length) return []
  return product.relatedIds.map((id) => getMarketplaceProduct(id)).filter(Boolean)
}
