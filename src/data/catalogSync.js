import { courses as defaultCourses } from './courses.js'
import { CATALOG_VERSION } from './catalogVersion.js'

export { CATALOG_VERSION }

export function hasPlaceholderLessons(lessons) {
  return (lessons || []).some((l) =>
    /— день \d+|— day \d+|^Неделя \d+/i.test(l?.title || '')
  )
}

function lessonsNeedSync(storedLessons, defaultLessons) {
  if ((storedLessons?.length || 0) !== (defaultLessons?.length || 0)) return true
  if (hasPlaceholderLessons(storedLessons)) return true
  if (!storedLessons?.length || !defaultLessons?.length) return false
  const storedFirst = storedLessons[0]?.title || ''
  const defaultFirst = defaultLessons[0]?.title || ''
  return storedFirst !== defaultFirst
}

export function mergeStoredVideoUrls(defaults, stored) {
  if (!Array.isArray(stored)) return defaults
  const byId = Object.fromEntries(stored.map((c) => [c.id, c]))
  return defaults.map((def) => {
    const old = byId[def.id]
    if (!old?.lessons?.length) return def
    if (lessonsNeedSync(old.lessons, def.lessons)) {
      const urls = Object.fromEntries(
        old.lessons.filter((l) => l.videoUrl).map((l) => [l.id, l.videoUrl])
      )
      if (!Object.keys(urls).length) return def
      return {
        ...def,
        lessons: def.lessons.map((l) => (urls[l.id] ? { ...l, videoUrl: urls[l.id] } : l)),
      }
    }
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
  const storedVersion = storedList.__catalogVersion
  if (storedVersion != null && Number(storedVersion) < CATALOG_VERSION) return true

  for (const def of defaultCourses) {
    const stored = storedList.find((c) => c.id === def.id)
    if (!stored) return true
    if (lessonsNeedSync(stored.lessons, def.lessons)) return true
    if (Number(stored.priceEur ?? 0) !== Number(def.priceEur ?? 0)) return true
    if ((stored.oldPriceEur ?? null) !== (def.oldPriceEur ?? null)) return true
    if ((stored.badge ?? null) !== (def.badge ?? null)) return true
    if ((stored.level ?? 'Basic') !== (def.level ?? 'Basic')) return true
    if ((stored.image || '') !== (def.image || '')) return true
    if (Boolean(def.hasHomework) !== Boolean(stored.hasHomework)) return true
    if (def.weeks?.length && (stored.weeks?.length || 0) !== def.weeks.length) return true
    const defIdea = def.courseIdea || def.fullDescription || ''
    const storedIdea = stored.courseIdea || stored.fullDescription || ''
    if (defIdea && storedIdea && defIdea.slice(0, 40) !== storedIdea.slice(0, 40)) return true
  }
  return false
}

export function syncCoursesWithDefaults(storedList) {
  return mergeStoredVideoUrls(defaultCourses, storedList)
}
