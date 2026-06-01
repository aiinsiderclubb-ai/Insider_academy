/** Старые ID курсов → объединённый курс */
export const CONVERSATIONAL_COURSE_ID = 'ai-conversational-systems'

export const LEGACY_COURSE_ALIASES = {
  'ai-chatbot-developer': CONVERSATIONAL_COURSE_ID,
  'ai-voice-developer': CONVERSATIONAL_COURSE_ID,
}

export const LEGACY_SLUG_REDIRECTS = {
  'ai-chatbot-developer': 'ai-conversational-systems',
  'ai-voice-developer': 'ai-conversational-systems',
}

export function resolveCourseId(courseId) {
  return LEGACY_COURSE_ALIASES[courseId] || courseId
}

/** ID покупок и пакетов, которые открывают доступ к курсу */
export function purchaseIdsForCourse(courseId) {
  const target = resolveCourseId(courseId)
  const ids = new Set([target, courseId])
  Object.entries(LEGACY_COURSE_ALIASES).forEach(([legacy, merged]) => {
    if (merged === target) ids.add(legacy)
  })
  return [...ids]
}
