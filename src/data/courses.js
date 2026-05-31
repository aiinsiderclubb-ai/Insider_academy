// Каталог AI Insider Academy — асинхронные программы (learning path)
export { academyCourses as courses, freeTrialCourses } from './academyProgram.js'
export { ACADEMY_GRADING_STANDARD, getHomework, mergeHomeworkIntoWeeks, getHomeworkForLesson } from './courseHomework.js'
export { LEARNING_STAGES, getStageForCourse, getCourseOrderInPath, ACADEMY_PRINCIPLES } from './learningMap.js'

import { academyCourses as courses } from './academyProgram.js'

export function getCourseBySlug(slug) {
  return courses.find((c) => c.slug === slug) || null
}

export function getCourseById(id) {
  return courses.find((c) => c.id === id) || null
}

export function getCourseField(course, field, lang = 'ru') {
  if (!course) return ''
  const enField = field + 'En'
  if (lang === 'en' && course[enField] !== undefined) {
    return Array.isArray(course[enField]) ? course[enField] : course[enField]
  }
  return Array.isArray(course[field]) ? course[field] : (course[field] ?? '')
}

/** Описание для карточки каталога */
export function getCourseDescription(course, lang = 'ru') {
  if (!course) return ''
  const short = getCourseField(course, 'shortDescription', lang)
  const full = getCourseField(course, 'fullDescription', lang)
  const idea = getCourseField(course, 'courseIdea', lang)
  return short || full || idea || ''
}

/** Длительность для карточек — без «· N недель» */
export function formatCourseDuration(course, lang = 'ru') {
  const raw = getCourseField(course, 'duration', lang)
  if (typeof raw !== 'string') return raw
  return raw
    .replace(/\s*·\s*\d+\s+недел[ьяи]/gi, '')
    .replace(/\s*·\s*\d+\s+weeks?/gi, '')
    .trim()
}

export function getLessonDisplayTitle(lesson, lang = 'ru') {
  if (!lesson) return ''
  const raw = lang === 'en' && lesson.titleEn ? lesson.titleEn : lesson.title
  if (typeof raw !== 'string') return raw
  return raw.replace(/^(Видео|Video)\s+\d+\.\s*/i, '').trim() || raw
}

export function getWeekDisplayTitle(week, lang = 'ru') {
  if (!week) return ''
  const raw = lang === 'en' && week.titleEn ? week.titleEn : week.title
  if (typeof raw !== 'string') return raw
  const n = week.number
  return raw
    .replace(new RegExp(`^Неделя\\s+${n}\\s*[:—-]\\s*`, 'i'), '')
    .replace(new RegExp(`^Week\\s+${n}\\s*[:—-]\\s*`, 'i'), '')
    .trim() || raw
}
