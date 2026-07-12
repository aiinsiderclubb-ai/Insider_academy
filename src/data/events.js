/** События комьюнити (не розыгрыши). Добавляйте новые в массив. */
export const COMMUNITY_EVENTS = [
  {
    id: 'ama-july',
    slug: 'ama-july',
    status: 'upcoming',
    icon: 'messagesSquare',
    accent: '#8b5cf6',
    titleRu: 'AMA с основателем',
    titleEn: 'Founder AMA',
    dateRu: 'Дата уточняется — анонс в Telegram',
    dateEn: 'Date TBC — announced on Telegram',
    descRu: 'Ответы на вопросы про AI-агентства, автоматизацию и обучение в Academy.',
    descEn: 'Q&A on AI agencies, automation and learning in Academy.',
    link: null,
  },
  {
    id: 'workshop-n8n',
    slug: 'workshop-n8n',
    status: 'upcoming',
    icon: 'settings',
    accent: '#10b981',
    titleRu: 'Live-воркшоп n8n',
    titleEn: 'Live n8n workshop',
    dateRu: 'Скоро',
    dateEn: 'Coming soon',
    descRu: 'Собираем workflow из Marketplace в прямом эфире.',
    descEn: 'Building a Marketplace workflow live.',
    link: null,
  },
]

export function getUpcomingEvents() {
  return COMMUNITY_EVENTS.filter((e) => e.status === 'upcoming' || e.status === 'active')
}
