import crypto from 'crypto'
import { MARKETPLACE_PRODUCTS } from '../../src/data/marketplace/products.js'

export const LICENSE_TIERS = {
  personal: {
    multiplier: 1,
    rights: ['Use for your own business and personal projects'],
    clientLimit: 0,
  },
  client: {
    multiplier: 1.75,
    rights: ['Personal rights', 'Use in work delivered to up to 5 clients'],
    clientLimit: 5,
  },
  agency: {
    multiplier: 3,
    rights: ['Personal rights', 'Unlimited client projects', 'Internal agency team use'],
    clientLimit: null,
  },
}

export const MARKETPLACE_BUNDLES = [
  {
    id: 'vault-prompt',
    slug: 'prompt-vault',
    title: 'Prompt Vault',
    priceEur: 29,
    productIds: ['mp-prompt-chatgpt-vault', 'mp-prompt-seo-vault', 'mp-prompt-sales-vault', 'mp-prompt-marketing-vault', 'mp-prompt-research-vault'],
    vertical: 'vault',
  },
  {
    id: 'vault-automation',
    slug: 'automation-vault',
    title: 'Automation Vault',
    priceEur: 49,
    productIds: ['mp-workflow-lead-gen', 'mp-workflow-whatsapp', 'mp-workflow-support', 'mp-workflow-content', 'mp-workflow-crm'],
    vertical: 'vault',
  },
  {
    id: 'vault-agency',
    slug: 'ai-agency-vault',
    title: 'AI Agency Vault',
    priceEur: 49,
    productIds: ['mp-biz-agency-proposal', 'mp-biz-outreach-pack', 'mp-biz-discovery', 'mp-biz-sop', 'mp-biz-agent-audit'],
    vertical: 'vault',
  },
  {
    id: 'vault-agent',
    slug: 'ai-agent-vault',
    title: 'AI Agent Vault',
    priceEur: 49,
    productIds: ['mp-agent-support', 'mp-agent-sales', 'mp-agent-lead-qual', 'mp-agent-booking', 'mp-agent-knowledge'],
    vertical: 'vault',
  },
  {
    id: 'vault-creator',
    slug: 'creator-vault',
    title: 'Creator Vault',
    priceEur: 39,
    productIds: ['mp-creator-hooks', 'mp-creator-reels-pack', 'mp-creator-shorts', 'mp-creator-calendar', 'mp-creator-canva'],
    vertical: 'vault',
  },
  {
    id: 'vault-complete-bundle',
    slug: 'complete-vault',
    title: 'Complete Vault Bundle',
    priceEur: 149,
    productIds: [
      'mp-prompt-chatgpt-vault', 'mp-prompt-seo-vault', 'mp-prompt-sales-vault',
      'mp-workflow-lead-gen', 'mp-workflow-support', 'mp-workflow-crm',
      'mp-biz-agency-proposal', 'mp-biz-outreach-pack', 'mp-biz-agent-audit',
      'mp-agent-support', 'mp-agent-sales', 'mp-agent-booking',
      'mp-creator-hooks', 'mp-creator-reels-pack', 'mp-creator-calendar',
    ],
    vertical: 'vault',
  },
  {
    id: 'bundle-salon',
    slug: 'salon-ai-operations',
    title: 'Salon AI Operations Bundle',
    priceEur: 179,
    productIds: ['mp-voice-beauty-salon', 'mp-workflow-lead-gen', 'mp-biz-agent-audit'],
    vertical: 'salon',
  },
  {
    id: 'bundle-clinic',
    slug: 'clinic-ai-operations',
    title: 'Clinic AI Operations Bundle',
    priceEur: 229,
    productIds: ['mp-voice-clinic-services', 'mp-workflow-support', 'mp-biz-agent-audit'],
    vertical: 'clinic',
  },
]

function publicProduct(product) {
  const { rating, reviewCount, downloads, ...safe } = product
  return {
    ...safe,
    licenses: Object.entries(LICENSE_TIERS).map(([id, license]) => ({
      id,
      priceEur: Math.round(product.priceEur * license.multiplier),
      rights: license.rights,
      clientLimit: license.clientLimit,
    })),
  }
}

export function getMarketplaceProduct(idOrSlug) {
  const product = MARKETPLACE_PRODUCTS.find((item) => item.id === idOrSlug || item.slug === idOrSlug)
  return product ? publicProduct(product) : null
}

export function getMarketplaceCatalog() {
  return MARKETPLACE_PRODUCTS.map(publicProduct)
}

export function getBundle(idOrSlug) {
  return MARKETPLACE_BUNDLES.find((item) => item.id === idOrSlug || item.slug === idOrSlug) || null
}

export function quoteMarketplaceItem({ productId, licenseTier = 'personal' }) {
  const license = LICENSE_TIERS[licenseTier]
  if (!license) throw Object.assign(new Error('Invalid license tier'), { status: 400 })
  const product = getMarketplaceProduct(productId)
  const bundle = getBundle(productId)
  if (!product && !bundle) throw Object.assign(new Error('Unknown or inactive marketplace product'), { status: 404 })
  const basePrice = product?.priceEur ?? bundle.priceEur
  return {
    productId: product?.id ?? bundle.id,
    title: product?.titleEn ?? product?.titleRu ?? bundle.title,
    itemType: product ? 'product' : 'bundle',
    licenseTier,
    amountEur: Math.round(basePrice * license.multiplier),
    legalSnapshot: {
      version: '2026-08-02',
      tier: licenseTier,
      rights: license.rights,
      clientLimit: license.clientLimit,
      productId: product?.id ?? bundle.id,
    },
  }
}

export async function seedMarketplaceCatalog(db) {
  const now = new Date().toISOString()
  for (const product of MARKETPLACE_PRODUCTS) {
    await db.run(
      `INSERT INTO marketplace_products
       (id, slug, title, category, creator_id, base_price_eur, active, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, title = excluded.title,
       category = excluded.category, creator_id = excluded.creator_id,
       base_price_eur = excluded.base_price_eur, metadata = excluded.metadata, updated_at = excluded.updated_at`,
      [
        product.id, product.slug, product.titleEn || product.titleRu, product.categoryId,
        product.creatorId, product.priceEur,
        JSON.stringify({ productType: product.productType, titleRu: product.titleRu, titleEn: product.titleEn }),
        now, now,
      ]
    )
  }
  for (const bundle of MARKETPLACE_BUNDLES) {
    await db.run(
      `INSERT INTO marketplace_bundles (id, slug, title, base_price_eur, active, metadata, created_at)
       VALUES (?, ?, ?, ?, 1, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title,
       base_price_eur = excluded.base_price_eur, metadata = excluded.metadata`,
      [bundle.id, bundle.slug, bundle.title, bundle.priceEur, JSON.stringify({ vertical: bundle.vertical }), now]
    )
    for (const productId of bundle.productIds) {
      await db.run(
        'INSERT INTO bundle_items (bundle_id, product_id) VALUES (?, ?) ON CONFLICT(bundle_id, product_id) DO NOTHING',
        [bundle.id, productId]
      )
    }
  }
}

export async function grantMarketplaceEntitlement(db, {
  userId, productId, licenseTier = 'personal', sourceType, sourceId,
}) {
  if (!userId || !['webhook', 'admin', 'bundle'].includes(sourceType)) {
    throw Object.assign(new Error('Entitlements require a verified grant source'), { status: 403 })
  }
  const quote = quoteMarketplaceItem({ productId, licenseTier })
  const products = quote.itemType === 'bundle' ? getBundle(productId).productIds : [quote.productId]
  const granted = []
  for (const id of products) {
    const entitlementId = `ent-${crypto.randomUUID()}`
    await db.run(
      `INSERT INTO entitlements
       (id, user_id, product_id, license_tier, source_type, source_id, legal_snapshot, status, granted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
       ON CONFLICT(user_id, product_id, source_type, source_id) DO NOTHING`,
      [
        entitlementId, userId, id, licenseTier,
        quote.itemType === 'bundle' ? 'bundle' : sourceType,
        quote.itemType === 'bundle' ? `${productId}:${sourceId}` : sourceId,
        JSON.stringify(quote.legalSnapshot), new Date().toISOString(),
      ]
    )
    granted.push(id)
  }
  return { granted, licenseTier, legalSnapshot: quote.legalSnapshot }
}

export async function trackMarketplaceEvent(db, { userId, productId, eventName, metadata = {} }) {
  await db.run(
    'INSERT INTO marketplace_events (id, user_id, product_id, event_name, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [`mpe-${crypto.randomUUID()}`, userId || null, productId || null, eventName, JSON.stringify(metadata), new Date().toISOString()]
  )
}

export async function backfillMarketplacePurchases(db) {
  const knownIds = new Set([
    ...MARKETPLACE_PRODUCTS.map((product) => product.id),
    ...MARKETPLACE_BUNDLES.map((bundle) => bundle.id),
  ])
  const purchases = await db.all('SELECT id, user_id, course_id FROM purchases')
  for (const purchase of purchases) {
    if (!knownIds.has(purchase.course_id)) continue
    await grantMarketplaceEntitlement(db, {
      userId: purchase.user_id,
      productId: purchase.course_id,
      licenseTier: 'personal',
      sourceType: 'admin',
      sourceId: `legacy-purchase:${purchase.id}`,
    })
  }
}
