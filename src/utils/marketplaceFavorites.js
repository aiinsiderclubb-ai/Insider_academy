const KEY = 'ai-insider-marketplace-favorites'

export function getMarketplaceFavorites() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function isMarketplaceFavorite(productId) {
  return getMarketplaceFavorites().includes(productId)
}

export function toggleMarketplaceFavorite(productId) {
  const list = getMarketplaceFavorites()
  const next = list.includes(productId)
    ? list.filter((id) => id !== productId)
    : [...list, productId]
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch (_) {}
  return next
}
