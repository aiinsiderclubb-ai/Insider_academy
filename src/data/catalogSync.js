import { courses as defaultCourses } from './courses.js'
import { CATALOG_VERSION } from './catalogVersion.js'

export { CATALOG_VERSION }

export function mergeStoredVideoUrls(defaults, stored) {
  if (!Array.isArray(stored)) return defaults
  const byId = Object.fromEntries(stored.map((c) => [c.id, c]))
  return defaults.map((def) => {
    const old = byId[def.id]
    if (!old?.lessons?.length) return def
    const urls = Object.fromEntries(
      old.lessons.filter((l) => l.videoUrl).map((l) => [l.id, l.videoUrl])
    )
    if (!Object.keys(urls).length) return def
    return {
      ...def,
      lessons: def.lessons.map((l) => (urls[l.id] ? { ...l, videoUrl: urls[l.id] } : l)),
    }
  })
}

export function isCatalogStale(storedList) {
  if (!Array.isArray(storedList)) return true
  for (const def of defaultCourses) {
    const stored = storedList.find((c) => c.id === def.id)
    if (!stored) return true
    if ((stored.lessons?.length || 0) !== (def.lessons?.length || 0)) return true
    if (Boolean(def.hasHomework) !== Boolean(stored.hasHomework)) return true
    if (def.weeks?.length && (stored.weeks?.length || 0) !== def.weeks.length) return true
  }
  return false
}

export function syncCoursesWithDefaults(storedList) {
  return mergeStoredVideoUrls(defaultCourses, storedList)
}
