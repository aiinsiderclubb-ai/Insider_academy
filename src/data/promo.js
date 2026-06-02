/** Промо-видео: YouTube/Vimeo URL или путь из public/, например /videos/foo.mp4 */
export const PROMO_VIDEOS = {
  accelerator: '',
  club: '',
  'ai-content-creator': '/videos/ai-content-creator-promo.mp4',
}

export function getCoursePromoVideo(courseId) {
  if (!courseId) return ''
  return PROMO_VIDEOS[courseId] || ''
}

/**
 * Google Form — анкета и тест для набора Accelerator.
 * Задайте VITE_ACCELERATOR_APPLICATION_URL в .env или замените DEFAULT ниже.
 */
const ACCELERATOR_APPLICATION_DEFAULT = ''

export const ACCELERATOR_APPLICATION_URL =
  import.meta.env.VITE_ACCELERATOR_APPLICATION_URL?.trim() || ACCELERATOR_APPLICATION_DEFAULT

export function getAcceleratorApplicationUrl() {
  return ACCELERATOR_APPLICATION_URL
}

export const ACCELERATOR_OFFER = {
  badgeRu: '🔥 Горящее предложение',
  badgeEn: '🔥 Hot offer',
  tagRu: 'Набор · отборная программа',
  tagEn: 'Bundle · selection program',
  selectionRu:
    'В эту группу идёт отбор менторами AI Insider Academy. Оцениваем мотивацию, базовые навыки и готовность учиться. Места ограничены — не каждая заявка принимается.',
  selectionEn:
    'This cohort is selected by AI Insider Academy mentors. We review motivation, baseline skills, and commitment. Spots are limited — not every application is accepted.',
  perksRu: [
    'Анкета, тест и мотивационное письмо',
    'Все направления AI → выбор специализации',
    'Практика и ДЗ с проверкой куратором',
    '100% асинхронно — без созвонов',
  ],
  perksEn: [
    'Application, test, and motivation letter',
    'All AI tracks → then choose your path',
    'Practice and homework with curator review',
    '100% async — no live calls',
  ],
  statsRu: [
    { value: '12', label: 'уроков' },
    { value: '1', label: 'месяц' },
    { value: '0 €', label: 'набор' },
    { value: '100%', label: 'асинхронно' },
  ],
  statsEn: [
    { value: '12', label: 'lessons' },
    { value: '1', label: 'month' },
    { value: '€0', label: 'intake' },
    { value: '100%', label: 'async' },
  ],
  tracksRu: ['Контент', 'Автоматизации', 'Чат-боты', 'Voice AI', 'AI-агенты', 'Монетизация'],
  tracksEn: ['Content', 'Automation', 'Chatbots', 'Voice AI', 'AI agents', 'Monetization'],
  stepsRu: [
    { title: 'Заявка', text: 'Анкета и мотивация' },
    { title: 'Отбор', text: 'Проверка ментором' },
    { title: 'Старт', text: '12 уроков и тест' },
    { title: 'Путь', text: 'Выбор специализации' },
  ],
  stepsEn: [
    { title: 'Apply', text: 'Form and motivation' },
    { title: 'Review', text: 'Mentor selection' },
    { title: 'Start', text: '12 lessons and test' },
    { title: 'Path', text: 'Pick your track' },
  ],
}
