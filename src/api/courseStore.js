// Единый источник курсов: localStorage или дефолт из data/courses
import { courses as defaultCourses } from '../data/courses'

const KEY = 'lms_courses'

export function getCourses() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : defaultCourses
    }
  } catch (_) {}
  return defaultCourses
}

export function setCourses(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('lms-courses-updated'))
  } catch (_) {}
}
