/** Расширенный контент страниц пакетов курсов */

export const COURSE_PACK_DETAILS = {
  'ai-creator-pack': {
    heroRu: 'Productivity Master + Content Creator',
    heroEn: 'Productivity Master + Content Creator',
    leadRu:
      'Два курса для уверенной работы с AI и регулярного контента. Экономия против покупки по отдельности.',
    leadEn:
      'Two courses for confident AI work and consistent content. Save vs buying separately.',
    forWhoRu: [
      'Новичкам в AI',
      'Маркетологам и контент-мейкерам',
      'Предпринимателям и фрилансерам',
    ],
    forWhoEn: ['AI beginners', 'Marketers and creators', 'Entrepreneurs and freelancers'],
    outcomesRu: [
      'Экономия времени с AI',
      'Собственные промпты',
      'Контент-конвейер: текст, видео, изображения',
    ],
    outcomesEn: ['Save time with AI', 'Custom prompts', 'Content pipeline: copy, video, images'],
    faqRu: [
      { q: 'Что в бонусах?', a: 'ChatGPT Prompt Vault (80 промптов), контент-календарь на 365 дней, 40 шаблонов Reels и 40 шаблонов Shorts.' },
    ],
    faqEn: [
      { q: 'What bonuses are included?', a: 'ChatGPT Prompt Vault (80 prompts), a 365-day content calendar, 40 Reels and 40 Shorts templates.' },
    ],
  },
  'ai-freelancer-pack': {
    heroRu: 'Productivity + контент + автоматизации',
    heroEn: 'Productivity + content + automations',
    leadRu:
      'Три программы для фрилансеров: AI Productivity Master, Content Creator и Automation Engineer.',
    leadEn:
      'Three programs for freelancers: Productivity Master, Content Creator and Automation Engineer.',
    forWhoRu: ['Фрилансеры', 'Автоматизаторы', 'Агентства на старте'],
    forWhoEn: ['Freelancers', 'Automation specialists', 'Early-stage agencies'],
    outcomesRu: [
      '2 готовые системы n8n: заявки и CRM',
      'Шаблоны предложения и онбординга',
      'CRM на Google Таблице и Telegram',
    ],
    outcomesEn: [
      '2 ready n8n systems: leads and CRM',
      'Proposal and onboarding templates',
      'A CRM on Google Sheets and Telegram',
    ],
    faqEn: [
      { q: 'Is Agent Engineer included?', a: 'No — it is in the Business Pack or Pro subscription.' },
    ],
  },
  'ai-business-pack': {
    heroRu: 'Полный стек до AI Agent Engineer',
    heroEn: 'Full stack through AI Agent Engineer',
    leadRu:
      'Четыре курса: Productivity, Content, Automation и Agent Engineer. Business Builder — отдельно или в Pro.',
    leadEn:
      'Four courses: Productivity, Content, Automation and Agent Engineer. Business Builder is separate or in Pro.',
    forWhoRu: ['Агентства', 'Предприниматели', 'Технические специалисты'],
    forWhoEn: ['Agencies', 'Entrepreneurs', 'Technical specialists'],
    outcomesRu: [
      '5 систем n8n — 23 воркфлоу',
      'Claude Skills Library — 11 скиллов',
      'Скрипты продаж и outreach',
    ],
    outcomesEn: [
      '5 n8n systems — 23 workflows',
      'Claude Skills Library — 11 skills',
      'Sales and outreach scripts',
    ],
    faqEn: [
      { q: 'Why no Business Builder?', a: 'It is included in Pro or sold separately for €79.' },
    ],
  },
}

export function getCoursePackDetails(packId) {
  return COURSE_PACK_DETAILS[packId] || null
}
