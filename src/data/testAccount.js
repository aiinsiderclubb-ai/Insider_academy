import { courses } from './courses.js'
import { AI_INSIDER_CLUB } from './club.js'

/** Тестовый аккаунт — все курсы + Club для QA */
export const TEST_ACCOUNT_EMAIL = 'test@ai-insider.academy'
export const TEST_ACCOUNT_PASSWORD = 'TestAll2026!'
export const TEST_ACCOUNT_NAME = 'Test User (All Access)'

export const TEST_ACCOUNT_PURCHASE_IDS = [
  ...courses.map((c) => c.id),
  AI_INSIDER_CLUB.id,
]

export function normalizeAccountEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function isTestAccountEmail(email) {
  return normalizeAccountEmail(email) === TEST_ACCOUNT_EMAIL
}

export function getTestAccountPurchases() {
  const now = new Date().toISOString()
  return TEST_ACCOUNT_PURCHASE_IDS.map((id) => ({ id, purchasedAt: now }))
}

/** Прямая покупка курса (не через Club) — для отзывов */
export function hasPurchasedCourseDirect(courseId, purchases = []) {
  if (!courseId) return false
  return purchases.some((p) => p.id === courseId)
}

export function canLeaveCourseReview(courseId, purchases = []) {
  return hasPurchasedCourseDirect(courseId, purchases)
}
