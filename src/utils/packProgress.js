import { COURSE_BUNDLES } from '../data/coursePacks'

export function getPackProgressForUser(purchases, getPercent, courses) {
  const owned = new Set(purchases.map((p) => p.id))

  return COURSE_BUNDLES.map((pack) => {
    const courseIds = pack.courseIds || []
    const ownedInPack = courseIds.filter((id) => owned.has(id))
    if (ownedInPack.length === 0) return null

    const percents = ownedInPack.map((id) => {
      const c = courses.find((x) => x.id === id)
      return getPercent(id, c?.lessons?.length ?? 0)
    })
    const avg = percents.length
      ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length)
      : 0

    return {
      packId: pack.id,
      titleRu: pack.title,
      titleEn: pack.title,
      completed: ownedInPack.length,
      total: courseIds.length,
      percent: avg,
    }
  }).filter(Boolean)
}
