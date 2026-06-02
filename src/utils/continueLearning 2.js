import { isMarketplaceProductId } from '../data/marketplace/discounts'
import { isVaultProductId } from '../data/vaultProducts'

export function pickContinueTarget({ purchases = [], courses = [], getPercent, getProgress }) {
  const owned = purchases
    .map((p) => p.id)
    .filter((id) => !isVaultProductId(id) && !isMarketplaceProductId(id))

  let best = null
  let bestScore = -1

  for (const id of owned) {
    const course = courses.find((c) => c.id === id)
    if (!course?.lessons?.length) continue
    const total = course.lessons.length
    const pct = getPercent(id, total)
    if (pct >= 100) continue
    const p = getProgress(id)
    const lastWatched = p.watched?.length ? Math.max(...p.watched) : 0
    const score = pct * 1000 + lastWatched
    if (score > bestScore) {
      bestScore = score
      best = { course, lessonIndex: lastWatched, percent: pct }
    }
  }

  if (best) return best

  const start = courses.find((c) => c.id === 'ai-start')
  if (start) return { course: start, lessonIndex: 0, percent: 0 }

  const firstOwned = owned.map((id) => courses.find((c) => c.id === id)).find(Boolean)
  if (firstOwned) {
    return {
      course: firstOwned,
      lessonIndex: 0,
      percent: getPercent(firstOwned.id, firstOwned.lessons?.length ?? 0),
    }
  }

  return null
}
