import crypto from 'node:crypto'
import { MARKETPLACE_PRODUCTS } from '../../src/data/marketplace/products.js'
import { nowIso } from '../db/time.js'
import { saveUploadedFile } from './storage.js'

export const PRODUCT_STATUSES = new Set(['draft', 'review', 'published', 'archived'])
export const ASSET_STATUSES = new Set(['active', 'superseded', 'archived'])

const LAUNCH_PRODUCTS = [
  {
    id: 'mp-free-agent-brief-canvas', slug: 'agent-brief-canvas', sku: 'LM-AGENT-BRIEF-001',
    categoryId: 'business-templates', titleRu: 'AI Agent Brief Canvas', titleEn: 'AI Agent Brief Canvas',
    shortRu: 'Одностраничный бриф: цель, данные, инструменты, риски и метрики AI-агента.',
    shortEn: 'One-page brief for agent goals, data, tools, risks and metrics.', priceEur: 0, isFree: true,
    coverImage: '/marketplace/knowledge-base-agent.png',
    fileName: 'ai-agent-brief-canvas.md', fileType: 'text/markdown',
    content: '# AI Agent Brief Canvas\n\n## 1. Business outcome\n- Problem:\n- Measurable result:\n- Owner:\n\n## 2. Inputs and data\n- Sources:\n- PII or sensitive data:\n- Retention policy:\n\n## 3. Actions and tools\n- Read tools:\n- Write tools requiring confirmation:\n- Human escalation condition:\n\n## 4. Quality and safety\n- Acceptance metric:\n- Budget cap:\n- Rate limit:\n- Forbidden actions:\n\n## 5. Launch checklist\n- [ ] Test dataset approved\n- [ ] Audit logging enabled\n- [ ] Rollback path tested\n- [ ] Owner accepts launch\n',
  },
  {
    id: 'mp-free-n8n-production-checklist', slug: 'n8n-production-checklist', sku: 'LM-N8N-PROD-001',
    categoryId: 'n8n-workflows', titleRu: 'n8n Production Checklist', titleEn: 'n8n Production Checklist',
    shortRu: 'Чеклист перед запуском workflow: ошибки, retries, secrets, observability и rollback.',
    shortEn: 'Pre-launch workflow checklist for errors, retries, secrets, observability and rollback.', priceEur: 0, isFree: true,
    coverImage: '/marketplace/content-automation-workflow.png',
    fileName: 'n8n-production-checklist.md', fileType: 'text/markdown',
    content: '# n8n Production Checklist\n\n- [ ] Secrets stored in credentials, not nodes\n- [ ] Every external call has timeout and retry policy\n- [ ] Error workflow alerts owner\n- [ ] Webhooks validate signature and replay window\n- [ ] Idempotency key prevents duplicate side effects\n- [ ] Test fixtures cover success, timeout and malformed payload\n- [ ] PII removed from execution logs\n- [ ] Workflow version tagged before release\n- [ ] Rollback version tested\n- [ ] Cost and run-volume alert configured\n',
  },
  {
    id: 'mp-free-prompt-evaluation-starter', slug: 'prompt-evaluation-starter', sku: 'LM-PROMPT-EVAL-001',
    categoryId: 'prompt-packs', titleRu: 'Prompt Evaluation Starter', titleEn: 'Prompt Evaluation Starter',
    shortRu: 'Мини-набор для сравнения промптов по точности, полноте, безопасности и стоимости.',
    shortEn: 'Starter rubric for prompt accuracy, completeness, safety and cost.', priceEur: 0, isFree: true,
    coverImage: '/marketplace/ai-research-prompt-vault.png',
    fileName: 'prompt-evaluation-starter.json', fileType: 'application/json',
    content: JSON.stringify({ version: 1, scale: '0-3', criteria: ['accuracy', 'completeness', 'instruction_following', 'safety', 'cost'], cases: [{ id: 'happy-path', input: '', expected: '' }, { id: 'missing-context', input: '', expected: '' }, { id: 'adversarial', input: '', expected: '' }] }, null, 2),
  },
  {
    id: 'mp-telegram-notify-bot-kit', slug: 'telegram-notify-bot-kit', sku: 'KIT-TG-NOTIFY-001',
    categoryId: 'ai-saas-kits', titleRu: 'Telegram Notify Bot Kit', titleEn: 'Telegram Notify Bot Kit',
    shortRu: 'Production-ready структура бота для уведомлений, deep links и безопасной привязки аккаунта.',
    shortEn: 'Production-ready notification bot structure, deep links and secure account linking.', priceEur: 29,
    coverImage: '/marketplace/customer-support-agent.png',
    fileName: 'telegram-notify-bot-kit.json', fileType: 'application/json',
    content: JSON.stringify({ version: 1, includes: ['webhook contract', 'account-link flow', 'notification templates', 'rate-limit policy', 'deployment checklist'], security: { signedDeepLinks: true, replayWindowSeconds: 300, perUserRateLimit: '10/min' } }, null, 2),
  },
  {
    id: 'mp-salon-reminder-system', slug: 'salon-reminder-system', sku: 'SYS-SALON-REMINDER-001',
    categoryId: 'n8n-workflows', titleRu: 'Salon Reminder System', titleEn: 'Salon Reminder System',
    shortRu: 'Система SMS/DM напоминаний для снижения no-show: сценарий, статусы и метрики.',
    shortEn: 'SMS/DM reminder system for reducing no-shows with workflow, states and metrics.', priceEur: 49,
    coverImage: '/marketplace/appointment-booking-agent.png',
    fileName: 'salon-reminder-system.json', fileType: 'application/json',
    content: JSON.stringify({ version: 1, states: ['scheduled', 'reminder_24h', 'confirmed', 'reminder_2h', 'completed', 'no_show'], rules: [{ at: '-24h', action: 'send_reminder' }, { on: 'confirm', action: 'stop_followups' }, { at: '-2h', action: 'send_short_reminder' }], metrics: ['confirmation_rate', 'no_show_rate', 'recovered_revenue'] }, null, 2),
  },
  {
    id: 'mp-biz-agent-audit', slug: 'agent-audit-kit', sku: 'KIT-AGENT-AUDIT-001',
    categoryId: 'business-templates', titleRu: 'AI Agent Audit Kit', titleEn: 'AI Agent Audit Kit',
    shortRu: 'Чеклисты безопасности, governance, ROI и план исправлений для клиентских AI-агентов.',
    shortEn: 'Security, governance, ROI and remediation checklists for client AI agents.', priceEur: 59,
    coverImage: '/marketplace/agent-audit-kit.svg',
    fileName: 'ai-agent-audit-kit.md', fileType: 'text/markdown',
    content: '# AI Agent Audit Kit\n\n## Access\n- [ ] Least privilege applied\n- [ ] Write actions require confirmation\n- [ ] Credentials rotate and never enter prompts\n\n## Data\n- [ ] PII inventory exists\n- [ ] Retention and deletion tested\n- [ ] Logs mask sensitive fields\n\n## Reliability\n- [ ] Timeout, retry and idempotency defined\n- [ ] Human escalation tested\n- [ ] Budget and rate limits enabled\n\n## Business\n- Baseline cost:\n- Automated volume:\n- Error cost:\n- Monthly value:\n- Recommended remediation owner and deadline:\n',
  },
]

function scrubMetadata(product) {
  const { rating, reviewCount, downloads, priceEur, ...metadata } = product
  return metadata
}

function parseMetadata(value) {
  try { return JSON.parse(value || '{}') } catch { return {} }
}

export function mapMarketplaceProduct(row) {
  if (!row) return null
  const metadata = parseMetadata(row.metadata)
  return {
    ...metadata,
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    status: row.status,
    productType: row.product_type,
    categoryId: row.category_id,
    titleRu: row.title_ru,
    titleEn: row.title_en || row.title_ru,
    shortRu: row.short_ru || '',
    shortEn: row.short_en || row.short_ru || '',
    descriptionRu: row.description_ru || '',
    descriptionEn: row.description_en || row.description_ru || '',
    priceEur: Number(row.price_eur || 0),
    currency: row.currency,
    isFree: Boolean(Number(row.is_free)),
    creatorEmail: row.creator_email || '',
    coverImage: row.cover_image || metadata.coverImage || null,
    assetCount: Number(row.asset_count || 0),
    downloads: Number(row.download_count || 0),
    rating: row.rating == null ? null : Number(row.rating),
    reviewCount: Number(row.review_count || 0),
    publishedAt: row.published_at || null,
    updatedAt: row.updated_at,
  }
}

const PRODUCT_SELECT = `SELECT p.*,
  (SELECT COUNT(*) FROM product_assets a WHERE a.product_id = p.id AND a.status = 'active') AS asset_count,
  (SELECT COUNT(*) FROM asset_downloads d WHERE d.product_id = p.id) AS download_count,
  (SELECT COUNT(*) FROM reviews r WHERE r.course_id = p.id AND r.status = 'approved') AS review_count,
  (SELECT AVG(r.rating) FROM reviews r WHERE r.course_id = p.id AND r.status = 'approved') AS rating
  FROM marketplace_products p`

export async function listMarketplaceProducts(db, { status = 'published', productType } = {}) {
  const where = []
  const params = []
  if (status && status !== 'all') { where.push('p.status = ?'); params.push(status) }
  if (productType) { where.push('p.product_type = ?'); params.push(productType) }
  const rows = await db.all(`${PRODUCT_SELECT}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY p.updated_at DESC`, params)
  return rows.map(mapMarketplaceProduct)
}

export async function getMarketplaceProduct(db, idOrSlug, { includeUnpublished = false } = {}) {
  const row = await db.get(`${PRODUCT_SELECT} WHERE (p.id = ? OR p.slug = ?)${includeUnpublished ? '' : " AND p.status = 'published'"} LIMIT 1`, [idOrSlug, idOrSlug])
  return mapMarketplaceProduct(row)
}

export async function getProductAssets(db, productId, { includeInactive = false } = {}) {
  return db.all(`SELECT * FROM product_assets WHERE product_id = ?${includeInactive ? '' : " AND status = 'active'"} ORDER BY version DESC`, [productId])
}

export async function seedMarketplaceCatalog(db) {
  const createdAt = nowIso()
  for (const product of MARKETPLACE_PRODUCTS) {
    await db.run(`INSERT INTO marketplace_products (
      id, slug, sku, status, product_type, category_id, title_ru, title_en, short_ru, short_en,
      price_eur, currency, is_free, creator_email, cover_image, metadata, created_at, updated_at
    ) VALUES (?, ?, ?, 'draft', 'marketplace', ?, ?, ?, ?, ?, ?, 'EUR', ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING`, [
      product.id, product.slug, `LEGACY-${product.id.toUpperCase()}`, product.categoryId || null,
      product.titleRu, product.titleEn || product.titleRu, product.shortRu || '', product.shortEn || product.shortRu || '',
      Number(product.priceEur || 0), Number(product.priceEur || 0) === 0 ? 1 : 0,
      product.creatorEmail || 'marketplace@insiderai.it.com', product.coverImage || null,
      JSON.stringify(scrubMetadata(product)), createdAt, createdAt,
    ])
  }

  for (const item of LAUNCH_PRODUCTS) {
    const legacy = MARKETPLACE_PRODUCTS.find((p) => p.id === item.id)
    const metadata = scrubMetadata({ ...(legacy || {}), badges: legacy?.badges || ['new'], fileTypes: [item.fileName.split('.').pop().toUpperCase()] })
    await db.run(`INSERT INTO marketplace_products (
      id, slug, sku, status, product_type, category_id, title_ru, title_en, short_ru, short_en,
      price_eur, currency, is_free, creator_email, cover_image, metadata, published_at, created_at, updated_at
    ) VALUES (?, ?, ?, 'published', 'marketplace', ?, ?, ?, ?, ?, ?, 'EUR', ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET slug = ?, sku = ?, status = 'published', category_id = ?, title_ru = ?, title_en = ?,
      short_ru = ?, short_en = ?, price_eur = ?, is_free = ?, cover_image = ?, metadata = ?,
      published_at = COALESCE(marketplace_products.published_at, ?), updated_at = ?`, [
      item.id, item.slug, item.sku, item.categoryId, item.titleRu, item.titleEn, item.shortRu, item.shortEn,
      item.priceEur, item.isFree ? 1 : 0, 'marketplace@insiderai.it.com', item.coverImage || legacy?.coverImage || null,
      JSON.stringify(metadata), createdAt, createdAt, createdAt,
      item.slug, item.sku, item.categoryId, item.titleRu, item.titleEn, item.shortRu, item.shortEn,
      item.priceEur, item.isFree ? 1 : 0, item.coverImage || legacy?.coverImage || null,
      JSON.stringify(metadata), createdAt, createdAt,
    ])

    const existingAsset = await db.get("SELECT id FROM product_assets WHERE product_id = ? AND status = 'active' LIMIT 1", [item.id])
    if (!existingAsset) {
      const buffer = Buffer.from(item.content, 'utf8')
      const saved = await saveUploadedFile({ buffer, mimetype: item.fileType, originalname: item.fileName }, 'marketplace')
      await db.run(`INSERT INTO product_assets (
        id, product_id, version, label, file_name, file_type, file_size, storage_key, file_storage,
        status, changelog, created_by, created_at
      ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`, [
        crypto.randomUUID(), item.id, 'Initial release', saved.fileName, saved.fileType, buffer.length,
        saved.key, saved.storage, 'Initial verified asset', 'system:seed', createdAt,
      ])
    }
  }
}

export async function createMarketplaceOrder(db, { userId, product, paymentId, provider, externalId = null, amount, currency = 'EUR' }) {
  if (!product || product.status !== 'published' || product.isFree) throw Object.assign(new Error('Product unavailable for paid order'), { status: 400 })
  if (Number(amount) !== Number(product.priceEur) || String(currency).toUpperCase() !== String(product.currency).toUpperCase()) {
    throw Object.assign(new Error('Order amount or currency mismatch'), { status: 400 })
  }
  const id = crypto.randomUUID()
  await db.run(`INSERT INTO marketplace_orders (id, user_id, product_id, sku, payment_id, provider, external_id, amount, currency, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`, [id, userId, product.id, product.sku, paymentId, provider, externalId, amount, String(currency).toUpperCase(), nowIso()])
  return db.get('SELECT * FROM marketplace_orders WHERE id = ? LIMIT 1', [id])
}

export async function fulfillMarketplaceOrder(db, { paymentId, userId, productId, amount, currency, provider, externalId = null }) {
  const execute = async (tx) => {
    const order = await tx.get('SELECT * FROM marketplace_orders WHERE payment_id = ? LIMIT 1', [paymentId])
    if (!order) return { handled: false }
    if (Number(order.user_id) !== Number(userId) || order.product_id !== productId || order.provider !== provider
      || Number(order.amount) !== Number(amount) || String(order.currency).toUpperCase() !== String(currency).toUpperCase()) {
      throw Object.assign(new Error('Payment/order reconciliation mismatch'), { status: 409 })
    }
    if (order.external_id && externalId && order.external_id !== externalId) throw Object.assign(new Error('External payment id mismatch'), { status: 409 })
    if (order.status === 'completed') return { handled: true, idempotent: true, order }
    if (order.status !== 'pending') throw Object.assign(new Error('Order is not pending'), { status: 409 })

    const grantedAt = nowIso()
    const update = await tx.run("UPDATE marketplace_orders SET status = 'completed', external_id = COALESCE(external_id, ?), completed_at = ? WHERE id = ? AND status = 'pending'", [externalId, grantedAt, order.id])
    if (Number(update?.changes ?? update?.rowCount ?? 0) !== 1) throw Object.assign(new Error('Order changed during reconciliation'), { status: 409 })
    await tx.run(`INSERT INTO asset_entitlements (id, user_id, product_id, order_id, source, status, granted_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?)
      ON CONFLICT(user_id, product_id) DO UPDATE SET order_id = excluded.order_id, source = excluded.source, status = 'active', granted_at = excluded.granted_at, expires_at = NULL`, [
      crypto.randomUUID(), userId, productId, order.id, provider, grantedAt,
    ])
    return { handled: true, idempotent: false, order: { ...order, status: 'completed', completed_at: grantedAt } }
  }
  return db.transaction ? db.transaction(execute) : execute(db)
}

export async function claimFreeProduct(db, { userId, productId }) {
  const product = await getMarketplaceProduct(db, productId)
  if (!product || !product.isFree || product.assetCount < 1) throw Object.assign(new Error('Free product unavailable'), { status: 404 })
  const grantedAt = nowIso()
  await db.run(`INSERT INTO asset_entitlements (id, user_id, product_id, source, status, granted_at)
    VALUES (?, ?, ?, 'free_claim', 'active', ?)
    ON CONFLICT(user_id, product_id) DO UPDATE SET source = 'free_claim', status = 'active', granted_at = excluded.granted_at, expires_at = NULL`, [
    crypto.randomUUID(), userId, product.id, grantedAt,
  ])
  return product
}

export async function listUserDownloads(db, userId) {
  const rows = await db.all(`SELECT e.id AS entitlement_id, e.source, e.granted_at, e.expires_at,
    p.id AS product_id, p.slug, p.sku, p.title_ru, p.title_en, p.cover_image,
    a.id AS asset_id, a.version, a.label, a.file_name, a.file_type, a.file_size, a.created_at AS asset_created_at
    FROM asset_entitlements e
    JOIN marketplace_products p ON p.id = e.product_id
    JOIN product_assets a ON a.product_id = p.id AND a.status = 'active'
    WHERE e.user_id = ? AND e.status = 'active' AND (e.expires_at IS NULL OR e.expires_at > ?)
    ORDER BY e.granted_at DESC, a.version DESC`, [userId, nowIso()])
  return rows
}

export async function getEntitledAsset(db, { userId, assetId }) {
  return db.get(`SELECT a.*, e.order_id, p.slug, p.title_ru, p.title_en
    FROM product_assets a
    JOIN marketplace_products p ON p.id = a.product_id
    JOIN asset_entitlements e ON e.product_id = p.id AND e.user_id = ? AND e.status = 'active'
    WHERE a.id = ? AND a.status = 'active' AND (e.expires_at IS NULL OR e.expires_at > ?) LIMIT 1`, [userId, assetId, nowIso()])
}
