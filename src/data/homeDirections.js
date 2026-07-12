/**
 * Направления обучения для секции на главной (паттерн Prometheus «Начни новую карьеру»):
 * таб → что освоите → рекомендуемые курсы → цитата студента.
 */
export const HOME_DIRECTIONS = [
  {
    id: 'automation',
    labelRu: 'Автоматизация',
    labelEn: 'Automation',
    descRu: 'Собирайте рабочие workflow в n8n: триггеры, интеграции, AI-шаги. От первой автоматизации до production-процессов для клиентов.',
    descEn: 'Build working n8n workflows: triggers, integrations, AI steps. From your first automation to production processes for clients.',
    courseIds: ['first-automation-n8n', 'ai-automation-engineer'],
    quote: {
      textRu: 'Наконец подключила n8n к нашей CRM — пошаговые автоматизации сэкономили мне дни проб и ошибок.',
      textEn: 'Finally connected n8n to our CRM — the step-by-step automations saved me days of trial and error.',
      name: 'Anna S.',
      roleRu: 'Ops-менеджер',
      roleEn: 'Ops manager',
    },
  },
  {
    id: 'agents',
    labelRu: 'AI-агенты и чат-боты',
    labelEn: 'AI agents & chatbots',
    descRu: 'Настоящие AI-агенты: RAG, tool calling, память, multi-agent системы и деплой. Самое востребованное направление 2026 года.',
    descEn: 'Real AI agents: RAG, tool calling, memory, multi-agent systems and deployment. The most in-demand track of 2026.',
    courseIds: ['ai-agent-engineer', 'ai-insider-accelerator'],
    quote: {
      textRu: 'Модуль про команды агентов — золото. Собрал research + writer стек для клиентских отчётов.',
      textEn: 'Agent team design module is gold. Built a small research + writer stack for client reports.',
      name: 'Yuki T.',
      roleRu: 'Разработчик',
      roleEn: 'Developer',
    },
  },
  {
    id: 'content',
    labelRu: 'Контент и продуктивность',
    labelEn: 'Content & productivity',
    descRu: 'AI-контент-конвейер: изображения, видео, Shorts/Reels — и персональная система продуктивности на ChatGPT и Claude.',
    descEn: 'An AI content pipeline: images, video, Shorts/Reels — plus a personal productivity system on ChatGPT and Claude.',
    courseIds: ['ai-content-creator', 'ai-productivity-master'],
    quote: {
      textRu: 'От случайных промптов в ChatGPT — к повторяемой недельной системе. Для фрилансеров окупается сразу.',
      textEn: 'Went from random ChatGPT prompts to a repeatable weekly system. Worth it for freelancers.',
      name: 'James R.',
      roleRu: 'Фрилансер',
      roleEn: 'Freelancer',
    },
  },
  {
    id: 'business',
    labelRu: 'AI-бизнес',
    labelEn: 'AI business',
    descRu: 'От ниши и оффера до первых продаж: лендинг, аутрич, discovery calls и delivery. Запустите AI-услугу или продукт.',
    descEn: 'From niche and offer to first sales: landing, outreach, discovery calls and delivery. Launch your AI service or product.',
    courseIds: ['ai-business-builder', 'ai-start'],
    quote: {
      textRu: 'Хорошо выстроенный путь от идеи до оффера. Некоторые уроки стоит пересмотреть дважды — материала много.',
      textEn: 'A well-structured path from idea to offer. Some lessons are worth rewatching — there is a lot of material.',
      name: 'Ірина М.',
      roleRu: 'Фрилансер',
      roleEn: 'Freelancer',
    },
  },
]
