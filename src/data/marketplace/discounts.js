import { hasClubMembership, hasProMembership } from '../club.js'
import { PRO_MEMBERSHIP_IDS } from '../memberships.js'

/** Accelerator — выбранные premium-ресурсы включены (id продуктов) */
export const ACCELERATOR_INCLUDED_PRODUCT_IDS = [
  'mp-prompt-chatgpt-vault',
  'mp-workflow-lead-gen',
  'mp-biz-agency-proposal',
]

export function hasAcceleratorAccess(purchases = []) {
  return purchases.some((p) => p.id === 'ai-insider-accelerator' || p.id === 'ai-insider-accelerator-bundle')
}

export function getMarketplaceDiscountPercent(purchases = []) {
  if (hasProMembership(purchases)) return 25
  if (hasClubMembership(purchases)) return 10
  return 0
}

export function getMarketplacePrice(priceEur, purchases = []) {
  const pct = getMarketplaceDiscountPercent(purchases)
  if (!pct) return priceEur
  return Math.max(0, Math.round(priceEur * (1 - pct / 100)))
}

export function isMarketplaceProductIncludedForUser(productId, purchases = []) {
  return hasAcceleratorAccess(purchases) && ACCELERATOR_INCLUDED_PRODUCT_IDS.includes(productId)
}

export function isMarketplaceProductId(id) {
  return String(id || '').startsWith('mp-')
}
