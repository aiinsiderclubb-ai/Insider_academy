/** Категории курсов для каталога и главной */

export const ACCELERATOR_ID = 'ai-insider-accelerator'

export function isAcceleratorCourse(course) {
  return course?.id === ACCELERATOR_ID
}

export function isFreeStarterCourse(course) {
  return Boolean(course?.isFreeTrial) && (course?.priceEur ?? 0) === 0 && !isAcceleratorCourse(course)
}

export function isPaidCourse(course) {
  return (course?.priceEur ?? 0) > 0 && !course?.isFreeTrial
}

export function splitCourses(courses = []) {
  const list = Array.isArray(courses) ? courses : []
  return {
    freeCourses: list.filter(isFreeStarterCourse),
    paidCourses: list.filter(isPaidCourse),
    acceleratorCourse: list.find(isAcceleratorCourse) || null,
  }
}
