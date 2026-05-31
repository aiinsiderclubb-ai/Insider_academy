import { courses as defaultCourses } from '../data/courses'
import { CATALOG_VERSION, isCatalogStale, syncCoursesWithDefaults } from '../data/catalogSync'

const KEY = 'lms_courses'
const VERSION_KEY = 'lms_courses_version'

function readStoredRaw() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch (_) {
    return null
  }
}

export function getCourses() {
  const storedVersion = Number(localStorage.getItem(VERSION_KEY) || 0)
  const stored = readStoredRaw()

  if (stored && storedVersion >= CATALOG_VERSION && !isCatalogStale(stored)) {
    return stored
  }

  const synced = stored ? syncCoursesWithDefaults(stored) : defaultCourses
  setCourses(synced)
  return synced
}

export function setCourses(list) {
  try {
    const serialized = JSON.stringify(list)
    const version = String(CATALOG_VERSION)
    if (localStorage.getItem(KEY) === serialized && localStorage.getItem(VERSION_KEY) === version) {
      return
    }
    localStorage.setItem(KEY, serialized)
    localStorage.setItem(VERSION_KEY, version)
    window.dispatchEvent(new CustomEvent('lms-courses-updated'))
  } catch (_) {}
}

export function clearCoursesCache() {
  try {
    localStorage.removeItem(KEY)
    localStorage.removeItem(VERSION_KEY)
    window.dispatchEvent(new CustomEvent('lms-courses-updated'))
  } catch (_) {}
}
