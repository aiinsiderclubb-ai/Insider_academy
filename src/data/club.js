/** AI Insider Club — подписка с доступом ко всем Pro-курсам, без созвонов */

export const AI_INSIDER_CLUB = {
  id: 'ai-insider-club',
  slug: 'club',
  priceEur: 99,
  nameRu: 'AI Insider Club',
  nameEn: 'AI Insider Club',
  taglineRu: 'Все Pro-курсы Academy в одной подписке',
  taglineEn: 'All Academy Pro courses in one subscription',
  descRu:
    'Единая подписка открывает полный доступ ко всем платным программам AI Insider Academy. Учитесь асинхронно — без созвонов и обязательных эфиров.',
  descEn:
    'One subscription unlocks every paid AI Insider Academy program. Learn fully async — no calls or mandatory live sessions.',
  includesRu: [
    'Полный доступ ко всем Pro-курсам Academy (8 программ)',
    'Все новые Pro-курсы автоматически входят в подписку',
    'Закрытый Telegram-канал: кейсы, шаблоны, тренды',
    'Еженедельные async-челленджи (сдача работ текстом/файлом)',
    'Peer-review в тредах — без звонков',
    'Проверка домашних заданий по стандартам Academy',
  ],
  includesEn: [
    'Full access to all Academy Pro courses (8 programs)',
    'All new Pro courses included automatically',
    'Private Telegram: cases, templates, trends',
    'Weekly async challenges (text/file submissions)',
    'Peer review in threads — no calls',
    'Homework review under Academy standards',
  ],
  rulesRu: [
    '99 €/месяц — доступ ко всем платным курсам',
    'Только асинхронный формат: видео, текст, файлы, ДЗ',
    'Без созвонов, эфиров, групповых звонков и office hours',
    'Отмена в любой момент; доступ до конца оплаченного месяца',
    'Бесплатные стартовые курсы доступны и без клуба',
  ],
  rulesEn: [
    '€99/month — access to all paid courses',
    'Async only: video, text, files, homework',
    'No calls, live streams, group calls, or office hours',
    'Cancel anytime; access until the paid month ends',
    'Free starter courses remain free without the club',
  ],
}

/** Pro-курсы, которые открывает клуб */
export const CLUB_PAID_COURSE_IDS = [
  'ai-user-pro',
  'ai-content-creator',
  'no-code-automation',
  'ai-chatbot-developer',
  'ai-voice-developer',
  'ai-saas-builder',
  'ai-agent-architect',
  'ai-agency-builder',
]

export function hasClubMembership(purchases = []) {
  return purchases.some((p) => p.id === AI_INSIDER_CLUB.id)
}

export function courseUnlockedByClub(courseId, purchases = []) {
  return hasClubMembership(purchases) && CLUB_PAID_COURSE_IDS.includes(courseId)
}
