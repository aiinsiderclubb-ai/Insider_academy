import {
  MAIN_SITE_COURSES,
  MAIN_SITE_URL,
  TELEGRAM_COMMUNITY,
  TELEGRAM_MANAGER,
} from './siteLinks'

export const SOCIAL_PROOF = {
  students: 6000,
  rating: 4.9,
  reviews: 340,
  certificates: 100,
}

export const INSTRUCTOR = {
  name: 'Vladyslav Archer',
  nameRu: 'Vladyslav Archer',
  role: 'Founder, AI Insider · AI automation practitioner',
  roleRu: 'Основатель AI Insider · практик AI-автоматизации',
  bio: 'Vladyslav builds production AI chatbots, voice agents and n8n automations for businesses. He leads the 6,000+ AI Insider community. Every lesson is based on real client work — the same patterns used in shipped projects.',
  bioRu: 'Vladyslav создаёт чат-ботов, голосовых агентов и n8n-автоматизации для бизнеса. Руководит сообществом AI Insider (6 000+ участников). Уроки построены на реальных клиентских кейсах — тех же шаблонах и инструментах, что в продакшене.',
  avatar: 'https://images.unsplash.com/photo-1522075460491-45098739d10b?w=200&q=80',
  statsRu: ['6 000+ в сообществе', 'Уроки из реальных проектов', 'ChatGPT · n8n · Vapi.ai'],
  statsEn: ['6,000+ community', 'Real client-based lessons', 'ChatGPT · n8n · Vapi.ai'],
  siteUrl: MAIN_SITE_COURSES,
  telegram: TELEGRAM_MANAGER,
}

export const CLUB_PLAN = {
  id: 'ai-insider-club',
  name: 'AI Insider Club',
  nameEn: 'AI Insider Club',
  priceEur: 49,
  periodRu: 'в месяц',
  periodEn: 'per month',
  featuresRu: [
    'Доступ ко всем Pro-курсам Academy',
    'Закрытое Telegram-сообщество',
    'Async-челленджи и peer-review',
    'Без созвонов и эфиров',
    'Подписка не отменяется досрочно — доступ до конца оплаченного месяца',
  ],
  featuresEn: [
    'Access to all Academy Pro courses',
    'Private Telegram community',
    'Async challenges and peer review',
    'No calls or live sessions',
    'Subscription cannot be canceled early — access until the paid month ends',
  ],
}

export const BUY_FAQ = [
  {
    q: 'Как получить доступ после оплаты?',
    qEn: 'How do I get access after payment?',
    a: 'Сразу после оплаты курс появляется в личном кабинете Academy. Доступ открывается автоматически — письмо с подтверждением придёт на email. Если покупали на insiderai.it.com — используйте тот же email для входа на платформу.',
    aEn: 'Right after payment the course appears in your Academy dashboard. Access opens automatically and a confirmation email is sent. If you purchased on insiderai.it.com, sign in with the same email here.',
  },
  {
    q: 'Можно ли вернуть деньги?',
    qEn: 'Can I get a refund?',
    a: 'Да — в течение 7 дней с момента покупки, если вы ещё не начали пользоваться курсом (не открывали уроки и не начинали обучение). Напишите менеджеру в Telegram @vladyslavarcher или в поддержку Academy.',
    aEn: 'Yes — within 7 days of purchase if you have not started the course (no lessons opened, no learning activity). Contact @vladyslavarcher on Telegram or Academy support.',
  },
  {
    q: 'Выдаётся ли сертификат?',
    qEn: 'Do you issue a certificate?',
    a: 'Да. Сертификат выдаётся после прохождения всех уроков и проверки финального проекта / домашнего задания. Его можно добавить в LinkedIn и резюме — как на программах AI Insider на insiderai.it.com.',
    aEn: 'Yes. A certificate is issued after completing all lessons and passing the final project/homework review. You can add it to LinkedIn and your CV — same as AI Insider programs on insiderai.it.com.',
  },
  {
    q: 'На сколько даётся доступ к курсу?',
    qEn: 'How long is course access valid?',
    a: 'К отдельно купленному курсу — пожизненный доступ, включая обновления материалов.',
    aEn: 'Individually purchased courses include lifetime access, including material updates.',
  },
  {
    q: 'Можно ли отменить клубную подписку?',
    qEn: 'Can I cancel the Club subscription?',
    a: 'Клубная подписка AI Insider Club не отменяется досрочно и не возвращается. Доступ ко всем Pro-курсам действует до конца уже оплаченного месяца.',
    aEn: 'The AI Insider Club subscription cannot be canceled early and is non-refundable. Access to all Pro courses remains until the end of the paid month.',
  },
  {
    q: 'Кто основатель и владелец AI Insider?',
    qEn: 'Who is the founder and owner of AI Insider?',
    a: 'Основатель — Vladyslav Archer (Vladyslav Bezbashenui). Практик AI-автоматизации: чат-боты, голосовые агенты, n8n. Руководит сообществом 6 000+ специалистов. Подробнее о программах — на insiderai.it.com/courses.',
    aEn: 'The founder is Vladyslav Archer (Vladyslav Bezbashenui) — AI automation practitioner: chatbots, voice agents, n8n. He leads a 6,000+ member community. See programs at insiderai.it.com/courses.',
  },
  {
    q: 'Чем Academy отличается от сайта insiderai.it.com?',
    qEn: 'How is Academy different from insiderai.it.com?',
    a: `Сайт ${MAIN_SITE_URL}/courses — витрина программ (Chat-Bot Development, Voice Agent, VIP-менторство) и сообщество. AI Insider Academy — платформа обучения: видео, ДЗ, прогресс, сертификаты, личный кабинет. Это одна экосистема: оплата на любом ресурсе → обучение здесь.`,
    aEn: `${MAIN_SITE_URL}/courses is the program showcase (Chat-Bot, Voice Agent, VIP mentorship) and community hub. AI Insider Academy is the LMS: video lessons, homework, progress, certificates, dashboard. One ecosystem — pay anywhere, learn here.`,
  },
  {
    q: 'Что входит в обучение?',
    qEn: 'What is included?',
    a: 'Экспертные уроки, пожизненный доступ к материалам, закрытое Telegram-сообщество (6 000+), сертификат, практические проекты и шаблоны. На отдельных программах — API-ключи и playbook по монетизации (см. insiderai.it.com/courses).',
    aEn: 'Expert lessons, lifetime material access, private Telegram community (6,000+), certificate, practical projects and templates. Some programs include API keys and monetization playbooks — see insiderai.it.com/courses.',
  },
]

export const COURSE_FAQ = [
  ...BUY_FAQ,
  {
    q: 'Нужен ли опыт программирования?',
    qEn: 'Do I need programming experience?',
    a: 'Нет. Курсы построены на no-code / low-code: n8n, ChatGPT, Vapi.ai, готовые шаблоны и пошаговые видео — как в программах AI Insider на insiderai.it.com.',
    aEn: 'No. Courses are no-code / low-code: n8n, ChatGPT, Vapi.ai, ready templates and step-by-step video — same approach as AI Insider programs on insiderai.it.com.',
  },
  {
    q: 'Как связаться с менеджером?',
    qEn: 'How do I contact the manager?',
    a: `Telegram: @vladyslavarcher · Сообщество: ${TELEGRAM_COMMUNITY.replace('https://t.me/', '@')} · Email: hello@aiinsider.com`,
    aEn: `Telegram: @vladyslavarcher · Community: ${TELEGRAM_COMMUNITY.replace('https://t.me/', '@')} · Email: hello@aiinsider.com`,
  },
]

export function getAudienceList(course, lang) {
  const list = lang === 'en' ? course.forAudienceEn : course.forAudience
  if (list?.length) return list
  return lang === 'ru'
    ? ['фрилансеров', 'маркетологов', 'предпринимателей', 'новичков в AI']
    : ['freelancers', 'marketers', 'entrepreneurs', 'AI beginners']
}
