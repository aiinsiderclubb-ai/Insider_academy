import { MARKETPLACE_PRODUCTS } from './products.js'
import { purchaseIdsForCourse } from '../courseAliases.js'

const COURSE_PRODUCT_MAP = {
  'ai-automation-engineer': [
    'mp-workflow-whatsapp',
    'mp-workflow-lead-gen',
    'mp-workflow-crm',
    'mp-agent-lead-qual',
  ],
  'first-automation-n8n': ['mp-workflow-lead-gen', 'mp-workflow-content'],
  'ai-agent-engineer': [
    'mp-agent-support',
    'mp-agent-sales',
    'mp-agent-knowledge',
    'mp-saas-voice',
  ],
  'ai-content-creator': [
    'mp-creator-hooks',
    'mp-creator-reels-pack',
    'mp-prompt-marketing-vault',
    'mp-workflow-content',
  ],
  'ai-productivity-master': ['mp-prompt-chatgpt-vault', 'mp-prompt-research-vault'],
  'ai-business-builder': [
    'mp-biz-agency-proposal',
    'mp-biz-sop',
    'mp-saas-leadgen',
    'mp-agent-sales',
  ],
}

function scoreProduct(product, context) {
  let score = 0
  const { purchasedIds, ownedProductIds, courseIds } = context

  if (ownedProductIds.has(product.id)) return -1

  for (const courseId of courseIds) {
    const mapped = COURSE_PRODUCT_MAP[courseId] || []
    if (mapped.includes(product.id)) score += 10
    if (product.recommendsForCourses?.includes(courseId)) score += 6
  }

  if (product.badges?.includes('top-selling')) score += 2
  if (product.badges?.includes('trending')) score += 1.5

  const relatedOwned = product.relatedIds?.some((id) => ownedProductIds.has(id))
  if (relatedOwned) score += 4

  score += (product.rating || 0) * 0.5
  score += Math.min((product.downloads || 0) / 2000, 3)

  if (purchasedIds.has(product.creatorId)) score += 0

  return score
}

/**
 * @param {{ purchases?: {id:string}[], limit?: number }} opts
 */
export function getRecommendedMarketplaceProducts({ purchases = [], limit = 6 } = {}) {
  const purchasedIds = new Set(purchases.map((p) => p.id))
  const ownedProductIds = new Set(
    purchases.map((p) => p.id).filter((id) => id.startsWith('mp-'))
  )

  const courseIds = new Set()
  for (const p of purchases) {
    const ids = purchaseIdsForCourse(p.id)
    ids.forEach((id) => courseIds.add(id))
    if (!p.id.startsWith('mp-') && !p.id.startsWith('vault-') && !p.id.includes('insider')) {
      courseIds.add(p.id)
    }
  }

  const context = { purchasedIds, ownedProductIds, courseIds: [...courseIds] }

  return [...MARKETPLACE_PRODUCTS]
    .map((product) => ({ product, score: scoreProduct(product, context) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.product)
}

export function searchMarketplaceProducts(query, { categoryId, sort, products = MARKETPLACE_PRODUCTS } = {}) {
  const q = String(query || '').trim().toLowerCase()
  let list = [...products]

  if (categoryId && categoryId !== 'all') {
    list = list.filter((p) => p.categoryId === categoryId)
  }

  if (q) {
    list = list.filter((p) => {
      const hay = [
        p.titleRu,
        p.titleEn,
        p.shortRu,
        p.shortEn,
        p.categoryId,
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }

  if (sort === 'price-asc') list.sort((a, b) => a.priceEur - b.priceEur)
  else if (sort === 'price-desc') list.sort((a, b) => b.priceEur - a.priceEur)
  else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating)
  else if (sort === 'downloads') list.sort((a, b) => b.downloads - a.downloads)
  else list.sort((a, b) => (b.badges?.includes('top-selling') ? 1 : 0) - (a.badges?.includes('top-selling') ? 1 : 0))

  return list
}
