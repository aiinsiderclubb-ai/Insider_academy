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
      { q: 'Что в бонусах?', a: 'Prompt Library (500+), контент-план на 90 дней, 100 идей Reels и Shorts.' },
    ],
    faqEn: [
      { q: 'What bonuses are included?', a: 'Prompt Library (500+), 90-day content plan, 100 Reels and Shorts ideas.' },
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
      '10 готовых n8n workflow',
      'Шаблоны proposal и onboarding',
      'CRM template',
    ],
    outcomesEn: ['10 n8n workflows', 'Proposal and onboarding templates', 'CRM template'],
    faqRu: [
      { q: 'Входит ли Agent Engineer?', a: 'Нет — он в Business Pack или Pro подписке.' },
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
      '25 n8n workflow',
      '10 AI Agent Templates',
      'Sales и outreach scripts',
    ],
    outcomesEn: ['25 n8n workflows', '10 AI agent templates', 'Sales and outreach scripts'],
    faqRu: [
      { q: 'Почему нет Business Builder?', a: 'Он входит в Pro подписку или покупается отдельно за 79€.' },
    ],
    faqEn: [
      { q: 'Why no Business Builder?', a: 'It is included in Pro or sold separately for €79.' },
    ],
  },
}

export function getCoursePackDetails(packId) {
  return COURSE_PACK_DETAILS[packId] || null
}
