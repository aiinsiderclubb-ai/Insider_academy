/** Старые ID курсов → актуальный курс в каталоге 2026 */

export const CONVERSATIONAL_COURSE_ID = 'ai-conversational-systems'

export const LEGACY_COURSE_ALIASES = {
  'ai-chatbot-developer': CONVERSATIONAL_COURSE_ID,
  'ai-voice-developer': CONVERSATIONAL_COURSE_ID,
  'ai-user-pro': 'ai-productivity-master',
  'no-code-automation': 'ai-automation-engineer',
  'ai-agent-architect': 'ai-agent-engineer',
  'ai-agency-builder': 'ai-business-builder',
}

export const LEGACY_PACK_REDIRECTS = {
  'ai-builder-pack': 'ai-freelancer-pack',
  'ai-business-launch-pack': 'ai-business-pack',
}

export const LEGACY_SLUG_REDIRECTS = {
  'ai-chatbot-developer': 'ai-conversational-systems',
  'ai-voice-developer': 'ai-conversational-systems',
  'ai-user-pro': 'ai-productivity-master',
  'no-code-automation': 'ai-automation-engineer',
  'ai-agent-architect': 'ai-agent-engineer',
  'ai-agency-builder': 'ai-business-builder',
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
