/** Промо-видео (заполните URL позже) */
export const PROMO_VIDEOS = {
  accelerator: '',
  club: '',
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
}
