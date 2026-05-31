/** Карта обучения AI Insider Academy — асинхронный формат (записанные уроки, self-paced) */

export const ACADEMY_PRINCIPLES = {
  ru: 'Все программы — записанные видеоуроки. Учитесь в своём темпе, без привязки к расписанию. Масштаб на сотни и тысячи учеников.',
  en: 'All programs are pre-recorded video lessons. Learn at your own pace — built to scale to thousands of students.',
}

export const LEARNING_STAGES = [
  {
    id: 'stage-1',
    order: 1,
    title: 'Этап 1. Бесплатное знакомство',
    titleEn: 'Stage 1. Free introduction',
    subtitle: '7 дней · записанные уроки · без расписания',
    subtitleEn: '7 days · recorded · self-paced',
    accent: '#22c55e',
    courseIds: ['ai-start', 'ai-content-machine', 'ai-automation-business'],
  },
  {
    id: 'stage-2',
    order: 2,
    title: 'Этап 2. Бесплатная отборочная программа',
    titleEn: 'Stage 2. Free selection program',
    subtitle: '1 месяц · видео + ДЗ + финальный проект',
    subtitleEn: '1 month · video + homework + capstone',
    accent: '#a855f7',
    courseIds: ['ai-insider-accelerator'],
  },
  {
    id: 'stage-3',
    order: 3,
    title: 'Этап 3. Основная программа обучения',
    titleEn: 'Stage 3. Core programs',
    subtitle: 'Профессиональные треки · от 25€',
    subtitleEn: 'Professional tracks · from €25',
    accent: '#6366f1',
    courseIds: [
      'ai-user-pro',
      'ai-content-creator',
      'no-code-automation',
      'ai-chatbot-developer',
      'ai-voice-developer',
      'ai-agent-architect',
      'ai-agency-builder',
    ],
  },
]

export const STAGE_BY_COURSE = Object.fromEntries(
  LEARNING_STAGES.flatMap((s) => s.courseIds.map((id) => [id, s.id]))
)

export function getStageForCourse(courseId) {
  return LEARNING_STAGES.find((s) => s.courseIds.includes(courseId))
}

export function getCourseOrderInPath(courseId) {
  let n = 0
  for (const stage of LEARNING_STAGES) {
    for (const id of stage.courseIds) {
      n += 1
      if (id === courseId) return n
    }
  }
  return null
}
