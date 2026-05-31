export const SOCIAL_PROOF = {
  students: 127,
  rating: 4.9,
  reviews: 48,
  certificates: 89,
}

export const INSTRUCTOR = {
  name: 'AI Insider Team',
  nameRu: 'Команда AI Insider',
  role: 'Practitioners & mentors',
  roleRu: 'Практики и менторы',
  bio: 'We build real AI products — chatbots, voice agents, content pipelines — and teach what we use in production.',
  bioRu: 'Мы создаём реальные AI-продукты — чат-боты, голосовых агентов, контент-фабрики — и учим тому, что используем в продакшене.',
  avatar: 'https://images.unsplash.com/photo-1522075460491-45098739d10b?w=200&q=80',
}

export const CLUB_PLAN = {
  id: 'ai-insider-club',
  name: 'AI Insider Club',
  nameEn: 'AI Insider Club',
  priceEur: 99,
  periodRu: 'в месяц',
  periodEn: 'per month',
  featuresRu: [
    'Доступ ко всем Pro-курсам Academy',
    'Закрытое Telegram-сообщество',
    'Async-челленджи и peer-review',
    'Без созвонов и эфиров',
  ],
  featuresEn: [
    'Access to all Academy Pro courses',
    'Private Telegram community',
    'Async challenges and peer review',
    'No calls or live sessions',
  ],
}

export const BUY_FAQ = [
  {
    q: 'Как получить доступ после оплаты?',
    qEn: 'How do I get access after payment?',
    a: 'Сразу после оплаты курс появится в личном кабинете. Вы получите email с подтверждением.',
    aEn: 'Right after payment the course appears in your account. You will receive a confirmation email.',
  },
  {
    q: 'Можно ли вернуть деньги?',
    qEn: 'Can I get a refund?',
    a: 'В течение 7 дней — если вы не начали более 20% курса. Напишите в поддержку.',
    aEn: 'Within 7 days if you have not started more than 20% of the course. Contact support.',
  },
  {
    q: 'Выдаётся ли сертификат?',
    qEn: 'Do you issue a certificate?',
    a: 'Да. После прохождения всех уроков и сдачи финального проекта сертификат приходит на email.',
    aEn: 'Yes. After completing all lessons and the final project, a certificate is sent to your email.',
  },
  {
    q: 'На сколько даётся доступ?',
    qEn: 'How long is access valid?',
    a: 'Пожизненно — материалы и обновления курса остаются доступны.',
    aEn: 'Lifetime — materials and course updates remain available.',
  },
]

export const COURSE_FAQ = [
  ...BUY_FAQ,
  {
    q: 'Нужен ли опыт программирования?',
    qEn: 'Do I need programming experience?',
    a: 'Нет. Курсы построены no-code / low-code: n8n, готовые шаблоны, пошаговые видео.',
    aEn: 'No. Courses are no-code / low-code: n8n, ready templates, step-by-step videos.',
  },
]

export function getAudienceList(course, lang) {
  const list = lang === 'en' ? course.forAudienceEn : course.forAudience
  if (list?.length) return list
  return lang === 'ru'
    ? ['фрилансеров', 'маркетологов', 'предпринимателей', 'новичков в AI']
    : ['freelancers', 'marketers', 'entrepreneurs', 'AI beginners']
}
