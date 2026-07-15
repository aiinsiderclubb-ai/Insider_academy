const COURSE_COVERS = {
  'ai-agent-engineer': '/design/course-ai-agents.webp',
  'ai-automation-engineer': '/design/course-ai-automation.webp',
  'first-automation-n8n': '/design/course-ai-automation.webp',
  'ai-content-creator': '/design/course-ai-content-business.webp',
  'ai-business-builder': '/design/course-ai-content-business.webp',
  'ai-start': '/design/course-ai-data.webp',
  'ai-for-productivity': '/design/course-ai-data.webp',
  'ai-productivity-master': '/design/course-ai-data.webp',
  'ai-insider-accelerator': '/design/course-ai-agents.webp',
}

export function getCourseDesignCover(course) {
  if (!course) return '/design/course-ai-data.webp'
  return COURSE_COVERS[course.id] || COURSE_COVERS[course.slug] || course.image || '/design/course-ai-data.webp'
}

export function getMarketplaceDesignCover(product) {
  if (!product) return '/design/course-ai-automation.webp'
  if (product.coverImage) return product.coverImage
  const slug = product.slug || product.id || ''
  const png = `/marketplace/${slug}.png`
  return png
}

/** Главный арт персонажа — hero главной и запасной вариант */
export const AI_INSIDER_MENTOR_IMAGE = '/design/ai-insider-mentor.webp'

/** Сцены персонажа AI Insider по контексту (см. docs/IMAGE_PROMPTS.md) */
export const MENTOR_IMAGES = {
  founder: '/design/mentor-founder.webp',
  bridge: '/design/mentor-bridge.webp',
  avatar: '/design/mentor-avatar.webp',
  welcome: '/design/mentor-welcome.webp',
  lessonPoster: '/design/mentor-lesson-poster.webp',
  study: '/design/mentor-study.webp',
  giveaway: '/design/mentor-giveaway.webp',
  notFound: '/design/mentor-404.webp',
  membership: '/design/mentor-membership.webp',
  accelerator: '/design/mentor-accelerator.webp',
}
