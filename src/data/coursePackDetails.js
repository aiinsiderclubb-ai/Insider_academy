/** Расширенный контент страниц пакетов курсов */

export const COURSE_PACK_DETAILS = {
  'ai-creator-pack': {
    heroRu: 'Уверенная работа с AI и контент-система под ключ',
    heroEn: 'Confident AI use and a full content system',
    leadRu:
      'Два курса: AI User Pro и AI Content Creator. Подходит, если вы хотите ускорить работу с AI и запустить регулярный контент.',
    leadEn:
      'Two courses: AI User Pro and AI Content Creator. Ideal if you want faster AI workflows and consistent content output.',
    forWhoRu: [
      'Новичкам в AI, которые хотят систему, а не разрозненные советы',
      'SMM, маркетологам и экспертам, которые ведут соцсети',
      'Фрилансерам в контенте и личном бренде',
    ],
    forWhoEn: [
      'AI beginners who want a system, not scattered tips',
      'SMM, marketers and experts running social channels',
      'Freelancers in content and personal branding',
    ],
    outcomesRu: [
      'Освоите ChatGPT, Claude, Gemini и Perplexity',
      'Соберёте личную AI-систему продуктивности',
      'Запустите контент-фабрику: тексты, визуал, Shorts/Reels',
    ],
    outcomesEn: [
      'Master ChatGPT, Claude, Gemini and Perplexity',
      'Build a personal AI productivity system',
      'Launch a content factory: copy, visuals, Shorts/Reels',
    ],
    faqRu: [
      {
        q: 'Можно ли купить курсы по отдельности?',
        a: 'Да. Пакет выгоднее, если нужны оба направления: AI для работы и контент.',
      },
      {
        q: 'Нужна ли подписка Club?',
        a: 'Нет. Пакет даёт доступ к курсам из набора. Club открывает другие программы Academy.',
      },
    ],
    faqEn: [
      {
        q: 'Can I buy the courses separately?',
        a: 'Yes. The pack is better value if you need both AI productivity and content tracks.',
      },
      {
        q: 'Do I need Club membership?',
        a: 'No. The pack grants access to included courses. Club unlocks other Academy programs.',
      },
    ],
  },
  'ai-builder-pack': {
    heroRu: 'Автоматизации, боты и SaaS — практический стек без кода',
    heroEn: 'Automation, bots and SaaS — a practical no-code stack',
    leadRu:
      'Три программы: No-Code Automation, Conversational Systems и AI SaaS Builder. Для тех, кто собирает решения для бизнеса.',
    leadEn:
      'Three programs: No-Code Automation, Conversational Systems and AI SaaS Builder. For building real business solutions.',
    forWhoRu: [
      'No-code специалистам и автоматизаторам',
      'Тем, кто делает ботов, voice agents и интеграции',
      'Предпринимателям с идеей AI SaaS без dev-команды',
    ],
    forWhoEn: [
      'No-code specialists and automation builders',
      'Anyone building bots, voice agents and integrations',
      'Entrepreneurs with an AI SaaS idea and no dev team',
    ],
    outcomesRu: [
      'Соберёте n8n-автоматизации с AI и CRM',
      'Запустите чат-бота и голосового агента',
      'Спроектируете и упакуете MVP AI SaaS',
    ],
    outcomesEn: [
      'Build n8n automations with AI and CRM',
      'Launch a chatbot and voice agent',
      'Design and package an AI SaaS MVP',
    ],
    faqRu: [
      {
        q: 'Входит ли Pro-only контент?',
        a: 'Agent Engineer и Agency Builder не входят — их можно взять в Business Launch Pack.',
      },
      {
        q: 'Что в бонусах пакета?',
        a: 'n8n workflow pack, шаблон ТЗ для клиента и MVP checklist для SaaS.',
      },
    ],
    faqEn: [
      {
        q: 'Is Pro-only content included?',
        a: 'Agent Engineer and Agency Builder are not included — get them in the Business Launch Pack.',
      },
      {
        q: 'What are the pack bonuses?',
        a: 'n8n workflow pack, client brief template and SaaS MVP checklist.',
      },
    ],
  },
  'ai-business-launch-pack': {
    heroRu: 'Полный набор для запуска AI-услуги и агентства',
    heroEn: 'The full stack to launch an AI service or agency',
    leadRu:
      'Пять курсов: автоматизация, conversational, SaaS, Agent Engineer и Agency Builder. Максимум для старта AI-бизнеса.',
    leadEn:
      'Five courses: automation, conversational, SaaS, Agent Engineer and Agency Builder. Maximum value for starting an AI business.',
    forWhoRu: [
      'Тем, кто запускает AI-агентство или фриланс с нуля',
      'Специалистам, готовым продавать автоматизации и агентов',
      'Предпринимателям, которым нужен полный стек без покупки курсов по одному',
    ],
    forWhoEn: [
      'Anyone launching an AI agency or freelance practice',
      'Specialists ready to sell automations and agents',
      'Entrepreneurs who want the full stack without buying courses one by one',
    ],
    outcomesRu: [
      'Автоматизации, боты, SaaS и агентные системы в одном доступе',
      'Упакуете агентство, оффер и процесс продаж',
      'Получите шаблоны outreach, proposal и delivery',
    ],
    outcomesEn: [
      'Automation, bots, SaaS and agent systems in one access',
      'Package your agency, offer and sales process',
      'Get outreach, proposal and delivery templates',
    ],
    faqRu: [
      {
        q: 'Чем отличается от Pro-подписки?',
        a: 'Пакет — разовая покупка конкретных курсов. Pro — ежемесячный доступ ко всем материалам и шаблонам.',
      },
      {
        q: 'Какие бонусы в пакете?',
        a: 'Agency Launch Toolkit, outreach scripts, proposal template и delivery checklist.',
      },
    ],
    faqEn: [
      {
        q: 'How is this different from Pro membership?',
        a: 'The pack is a one-time purchase of specific courses. Pro is monthly access to all materials and templates.',
      },
      {
        q: 'What bonuses are included?',
        a: 'Agency Launch Toolkit, outreach scripts, proposal template and delivery checklist.',
      },
    ],
  },
}

export function getCoursePackDetails(packId) {
  return COURSE_PACK_DETAILS[packId] || null
}
