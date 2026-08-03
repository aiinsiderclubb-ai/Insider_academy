import crypto from 'node:crypto'
import { Router } from 'express'
import { getDb } from '../db.js'
import { upload } from '../middleware/upload.js'
import { saveUploadedFile } from '../services/storage.js'
import {
  ASSET_STATUSES,
  PRODUCT_STATUSES,
  getMarketplaceProduct,
  getProductAssets,
  listMarketplaceProducts,
} from '../services/marketplaceCatalog.js'
import { nowIso } from '../db/time.js'
import { logAudit } from '../services/auditLog.js'

const router = Router()

function cleanText(value, max = 300) {
  return String(value || '').trim().slice(0, max)
}

function assertProductPayload(body, { partial = false } = {}) {
  if (!partial && (!cleanText(body.slug) || !cleanText(body.sku) || !cleanText(body.titleRu))) {
    throw Object.assign(new Error('slug, sku and titleRu required'), { status: 400 })
  }
  if (body.status != null && !PRODUCT_STATUSES.has(body.status)) throw Object.assign(new Error('Invalid product status'), { status: 400 })
  if (body.productType != null && !['marketplace', 'vault'].includes(body.productType)) throw Object.assign(new Error('Invalid product type'), { status: 400 })
  if (body.priceEur != null && (!Number.isFinite(Number(body.priceEur)) || Number(body.priceEur) < 0)) throw Object.assign(new Error('Invalid price'), { status: 400 })
}

router.get('/marketplace/products', async (req, res) => {
  const db = getDb()
  const products = await listMarketplaceProducts(db, { status: req.query.status || 'all', productType: req.query.type || undefined })
  const enriched = await Promise.all(products.map(async (product) => ({
    ...product,
    assets: await getProductAssets(db, product.id, { includeInactive: true }),
  })))
  const statusCounts = Object.fromEntries((await db.all('SELECT status, COUNT(*) AS count FROM marketplace_products GROUP BY status')).map((r) => [r.status, Number(r.count)]))
  res.json({ products: enriched, statusCounts })
})

router.post('/marketplace/products', async (req, res) => {
  assertProductPayload(req.body || {})
  const body = req.body || {}
  const status = body.status || 'draft'
  if (status === 'published') return res.status(409).json({ error: 'Upload an asset before publishing' })
  const id = cleanText(body.id || `mp-${crypto.randomUUID()}`, 100)
  const now = nowIso()
  await getDb().run(`INSERT INTO marketplace_products (
    id, slug, sku, status, product_type, category_id, title_ru, title_en, short_ru, short_en,
    description_ru, description_en, price_eur, currency, is_free, creator_email, cover_image, metadata, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    id, cleanText(body.slug, 120), cleanText(body.sku, 120).toUpperCase(), status, body.productType || 'marketplace',
    cleanText(body.categoryId, 100) || null, cleanText(body.titleRu, 200), cleanText(body.titleEn, 200) || cleanText(body.titleRu, 200),
    cleanText(body.shortRu, 500), cleanText(body.shortEn, 500), cleanText(body.descriptionRu, 5000), cleanText(body.descriptionEn, 5000),
    Number(body.priceEur || 0), cleanText(body.currency || 'EUR', 3).toUpperCase(), Number(body.priceEur || 0) === 0 ? 1 : 0,
    cleanText(body.creatorEmail, 200), cleanText(body.coverImage, 500) || null, JSON.stringify(body.metadata || {}), now, now,
  ])
  await logAudit({ actorEmail: `admin:${req.adminRole}`, action: 'marketplace.create', targetType: 'product', targetId: id, meta: { status } })
  res.status(201).json({ product: await getMarketplaceProduct(getDb(), id, { includeUnpublished: true }) })
})

router.patch('/marketplace/products/:id', async (req, res) => {
  assertProductPayload(req.body || {}, { partial: true })
  const db = getDb()
  const current = await getMarketplaceProduct(db, req.params.id, { includeUnpublished: true })
  if (!current) return res.status(404).json({ error: 'Product not found' })
  const body = req.body || {}
  const nextStatus = body.status ?? current.status
  if (['published', 'archived'].includes(nextStatus) && req.adminRole !== 'admin') return res.status(403).json({ error: 'Admin role required for publication changes' })
  if (nextStatus === 'published') {
    const asset = await db.get("SELECT id FROM product_assets WHERE product_id = ? AND status = 'active' LIMIT 1", [current.id])
    if (!asset) return res.status(409).json({ error: 'Active product asset required before publishing' })
  }
  const now = nowIso()
  await db.run(`UPDATE marketplace_products SET slug = ?, sku = ?, status = ?, product_type = ?, category_id = ?,
    title_ru = ?, title_en = ?, short_ru = ?, short_en = ?, description_ru = ?, description_en = ?, price_eur = ?,
    currency = ?, is_free = ?, creator_email = ?, cover_image = ?, metadata = ?,
    published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, ?) ELSE published_at END, updated_at = ? WHERE id = ?`, [
    cleanText(body.slug ?? current.slug, 120), cleanText(body.sku ?? current.sku, 120).toUpperCase(), nextStatus,
    body.productType ?? current.productType, cleanText(body.categoryId ?? current.categoryId, 100) || null,
    cleanText(body.titleRu ?? current.titleRu, 200), cleanText(body.titleEn ?? current.titleEn, 200),
    cleanText(body.shortRu ?? current.shortRu, 500), cleanText(body.shortEn ?? current.shortEn, 500),
    cleanText(body.descriptionRu ?? current.descriptionRu, 5000), cleanText(body.descriptionEn ?? current.descriptionEn, 5000),
    Number(body.priceEur ?? current.priceEur), cleanText(body.currency ?? current.currency, 3).toUpperCase(),
    Number(body.priceEur ?? current.priceEur) === 0 ? 1 : 0, cleanText(body.creatorEmail ?? current.creatorEmail, 200),
    cleanText(body.coverImage ?? current.coverImage, 500) || null, JSON.stringify(body.metadata ?? parseMetadataForAdmin(current)),
    nextStatus, now, now, current.id,
  ])
  await logAudit({ actorEmail: `admin:${req.adminRole}`, action: 'marketplace.update', targetType: 'product', targetId: current.id, meta: { fields: Object.keys(body), status: nextStatus } })
  res.json({ product: await getMarketplaceProduct(db, current.id, { includeUnpublished: true }) })
})

router.post('/marketplace/products/:id/assets', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File required' })
  const db = getDb()
  const product = await getMarketplaceProduct(db, req.params.id, { includeUnpublished: true })
  if (!product) return res.status(404).json({ error: 'Product not found' })
  const version = Number((await db.get('SELECT MAX(version) AS version FROM product_assets WHERE product_id = ?', [product.id]))?.version || 0) + 1
  const saved = await saveUploadedFile(req.file, 'marketplace')
  await db.run("UPDATE product_assets SET status = 'superseded' WHERE product_id = ? AND status = 'active'", [product.id])
  const id = crypto.randomUUID()
  await db.run(`INSERT INTO product_assets (id, product_id, version, label, file_name, file_type, file_size, storage_key, file_storage, status, changelog, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`, [
    id, product.id, version, cleanText(req.body.label || `Version ${version}`, 200), saved.fileName, saved.fileType,
    Number(req.file.size || req.file.buffer?.length || 0), saved.key, saved.storage, cleanText(req.body.changelog, 1000), `admin:${req.adminRole}`, nowIso(),
  ])
  await logAudit({ actorEmail: `admin:${req.adminRole}`, action: 'marketplace.asset.upload', targetType: 'product_asset', targetId: id, meta: { productId: product.id, version, fileName: saved.fileName } })
  res.status(201).json({ asset: (await getProductAssets(db, product.id, { includeInactive: true })).find((asset) => asset.id === id) })
})

router.patch('/marketplace/products/:productId/assets/:assetId', async (req, res) => {
  const status = req.body?.status
  if (!ASSET_STATUSES.has(status)) return res.status(400).json({ error: 'Invalid asset status' })
  if (status === 'archived' && req.adminRole !== 'admin') return res.status(403).json({ error: 'Admin role required' })
  const db = getDb()
  const asset = await db.get('SELECT * FROM product_assets WHERE id = ? AND product_id = ? LIMIT 1', [req.params.assetId, req.params.productId])
  if (!asset) return res.status(404).json({ error: 'Asset not found' })
  if (status === 'active') await db.run("UPDATE product_assets SET status = 'superseded' WHERE product_id = ? AND id != ? AND status = 'active'", [req.params.productId, req.params.assetId])
  await db.run('UPDATE product_assets SET status = ? WHERE id = ?', [status, req.params.assetId])
  res.json({ ok: true })
})

function parseMetadataForAdmin(product) {
  const excluded = new Set(['id', 'slug', 'sku', 'status', 'productType', 'categoryId', 'titleRu', 'titleEn', 'shortRu', 'shortEn', 'descriptionRu', 'descriptionEn', 'priceEur', 'currency', 'isFree', 'creatorEmail', 'coverImage', 'assetCount', 'downloads', 'rating', 'reviewCount', 'publishedAt', 'updatedAt'])
  return Object.fromEntries(Object.entries(product).filter(([key]) => !excluded.has(key)))
}

export default router
