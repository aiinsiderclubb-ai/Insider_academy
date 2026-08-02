import crypto from 'crypto'
import { Router } from 'express'
import { getDb, parseJson } from '../db.js'
import { optionalUser, requireAdmin, requireUser } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { getFileUrl, resolveLocalFile, saveUploadedFile } from '../services/storage.js'
import {
  MARKETPLACE_BUNDLES,
  getMarketplaceCatalog,
  getMarketplaceProduct,
  trackMarketplaceEvent,
} from '../services/marketplace.js'
import { createDownloadTicket, verifyDownloadTicket } from '../services/signedDownload.js'

const router = Router()

function marketplaceEnabled() {
  return process.env.FEATURE_MARKETPLACE_COMMERCE === 'true'
}

router.get('/catalog', optionalUser, async (_req, res) => {
  const db = getDb()
  const aggregateRows = await db.all(
    `SELECT product_id, COUNT(*) AS review_count, AVG(rating) AS rating
     FROM marketplace_reviews WHERE status = 'approved' GROUP BY product_id`
  )
  const stats = new Map(aggregateRows.map((row) => [row.product_id, {
    reviewCount: Number(row.review_count), rating: Number(Number(row.rating).toFixed(1)),
  }]))
  res.json({
    enabled: marketplaceEnabled(),
    products: getMarketplaceCatalog().map((product) => ({ ...product, ...(stats.get(product.id) || { reviewCount: 0, rating: null }) })),
    bundles: MARKETPLACE_BUNDLES,
  })
})

router.get('/products/:id', optionalUser, async (req, res) => {
  const product = getMarketplaceProduct(req.params.id)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  const db = getDb()
  const reviews = await db.all(
    `SELECT r.id, r.rating, r.text, r.created_at AS createdAt, u.name AS userName
     FROM marketplace_reviews r LEFT JOIN users u ON u.id = r.user_id
     WHERE r.product_id = ? AND r.status = 'approved' ORDER BY r.created_at DESC LIMIT 50`,
    [product.id]
  )
  const aggregate = await db.get(
    `SELECT COUNT(*) AS review_count, AVG(rating) AS rating
     FROM marketplace_reviews WHERE product_id = ? AND status = 'approved'`,
    [product.id]
  )
  if (req.userId) {
    await trackMarketplaceEvent(db, { userId: req.userId, productId: product.id, eventName: 'product_view' })
  }
  res.json({
    product: {
      ...product,
      reviewCount: Number(aggregate?.review_count || 0),
      rating: aggregate?.rating == null ? null : Number(Number(aggregate.rating).toFixed(1)),
    },
    reviews,
  })
})

router.post('/events', optionalUser, async (req, res) => {
  const allowed = ['product_view', 'checkout_started']
  if (!allowed.includes(req.body.eventName)) return res.status(400).json({ error: 'Unsupported event' })
  await trackMarketplaceEvent(getDb(), {
    userId: req.userId,
    productId: req.body.productId,
    eventName: req.body.eventName,
    metadata: { source: String(req.body.source || 'web').slice(0, 50) },
  })
  res.status(202).json({ accepted: true })
})

router.get('/me/entitlements', requireUser, async (req, res) => {
  const rows = await getDb().all(
    `SELECT e.*, p.slug, p.title, p.metadata
     FROM entitlements e JOIN marketplace_products p ON p.id = e.product_id
     WHERE e.user_id = ? AND e.status = 'active'
     AND (e.expires_at IS NULL OR e.expires_at > ?) ORDER BY e.granted_at DESC`,
    [req.userId, new Date().toISOString()]
  )
  res.json(rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    slug: row.slug,
    title: row.title,
    licenseTier: row.license_tier,
    rights: parseJson(row.legal_snapshot, {}),
    grantedAt: row.granted_at,
  })))
})

router.get('/me/downloads', requireUser, async (req, res) => {
  const rows = await getDb().all(
    `SELECT e.id AS entitlement_id, e.product_id, e.license_tier, p.title,
       v.version, a.id AS asset_id, a.file_name, a.mime_type, a.size_bytes
     FROM entitlements e
     JOIN marketplace_products p ON p.id = e.product_id
     JOIN product_versions v ON v.product_id = e.product_id AND v.status = 'published'
     JOIN product_assets a ON a.product_version_id = v.id
     WHERE e.user_id = ? AND e.status = 'active'
     AND (e.expires_at IS NULL OR e.expires_at > ?) ORDER BY e.granted_at DESC`,
    [req.userId, new Date().toISOString()]
  )
  res.json(rows.map((row) => ({
    entitlementId: row.entitlement_id,
    productId: row.product_id,
    title: row.title,
    licenseTier: row.license_tier,
    version: row.version,
    assetId: row.asset_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
  })))
})

router.get('/assets/:assetId/download', requireUser, async (req, res) => {
  const db = getDb()
  const row = await db.get(
    `SELECT a.*, e.id AS entitlement_id
     FROM product_assets a
     JOIN product_versions v ON v.id = a.product_version_id
     JOIN entitlements e ON e.product_id = v.product_id
     WHERE a.id = ? AND e.user_id = ? AND e.status = 'active'
     AND (e.expires_at IS NULL OR e.expires_at > ?) LIMIT 1`,
    [req.params.assetId, req.userId, new Date().toISOString()]
  )
  if (!row) return res.status(403).json({ error: 'Active entitlement required' })
  await db.run(
    `INSERT INTO download_events
     (id, entitlement_id, asset_id, user_id, ip_hash, user_agent, downloaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      `dl-${crypto.randomUUID()}`, row.entitlement_id, row.id, req.userId,
      crypto.createHash('sha256').update(`${req.ip}:${process.env.DOWNLOAD_HASH_SALT || 'local'}`).digest('hex'),
      String(req.headers['user-agent'] || '').slice(0, 250), new Date().toISOString(),
    ]
  )
  await trackMarketplaceEvent(db, { userId: req.userId, productId: null, eventName: 'download', metadata: { assetId: row.id } })
  if (row.storage_driver === 'local') {
    const ticket = createDownloadTicket({ assetId: row.id, userId: req.userId })
    return res.json({ url: `/api/marketplace/assets/${row.id}/file?ticket=${encodeURIComponent(ticket)}`, expiresIn: 300 })
  }
  const url = await getFileUrl(row.storage_key, row.storage_driver)
  if (!url) return res.status(503).json({ error: 'Asset storage unavailable' })
  res.json({ url, expiresIn: 3600 })
})

router.get('/assets/:assetId/file', async (req, res) => {
  const ticket = verifyDownloadTicket(req.query.ticket)
  if (!ticket || ticket.assetId !== req.params.assetId) return res.status(403).json({ error: 'Expired or invalid download URL' })
  const row = await getDb().get(
    `SELECT a.storage_key, a.file_name FROM product_assets a
     JOIN product_versions v ON v.id = a.product_version_id
     JOIN entitlements e ON e.product_id = v.product_id
     WHERE a.id = ? AND e.user_id = ? AND e.status = 'active'
     AND (e.expires_at IS NULL OR e.expires_at > ?) LIMIT 1`,
    [req.params.assetId, ticket.userId, new Date().toISOString()]
  )
  const file = row && resolveLocalFile(row.storage_key)
  if (!file) return res.status(404).json({ error: 'Asset unavailable' })
  res.download(file, row.file_name)
})

router.post('/products/:productId/reviews', requireUser, async (req, res) => {
  const rating = Number(req.body.rating)
  const text = String(req.body.text || '').trim()
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || text.length < 10) {
    return res.status(400).json({ error: 'Rating 1-5 and review text are required' })
  }
  const db = getDb()
  const entitlement = await db.get(
    `SELECT id FROM entitlements WHERE user_id = ? AND product_id = ? AND status = 'active'
     ORDER BY granted_at DESC LIMIT 1`,
    [req.userId, req.params.productId]
  )
  if (!entitlement) return res.status(403).json({ error: 'Verified purchase required' })
  const now = new Date().toISOString()
  try {
    await db.run(
      `INSERT INTO marketplace_reviews
       (id, entitlement_id, product_id, user_id, rating, text, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [`mpr-${crypto.randomUUID()}`, entitlement.id, req.params.productId, req.userId, rating, text, now, now]
    )
  } catch {
    return res.status(409).json({ error: 'A review for this purchase already exists' })
  }
  await trackMarketplaceEvent(db, { userId: req.userId, productId: req.params.productId, eventName: 'review_submitted' })
  res.status(201).json({ status: 'pending' })
})

router.post(
  '/admin/products/:productId/versions',
  requireAdmin('admin', 'editor'),
  upload.single('file'),
  async (req, res) => {
    const product = getMarketplaceProduct(req.params.productId)
    if (!product) return res.status(404).json({ error: 'Product not found' })
    if (!req.file) return res.status(400).json({ error: 'File required' })
    const version = String(req.body.version || '').trim()
    if (!/^\d+\.\d+\.\d+$/.test(version)) return res.status(400).json({ error: 'Semantic version required' })
    const db = getDb()
    const versionId = `mpv-${crypto.randomUUID()}`
    const saved = await saveUploadedFile(req.file, `marketplace/${product.id}/${version}`)
    const assetId = `mpa-${crypto.randomUUID()}`
    const now = new Date().toISOString()
    await db.run(
      `INSERT INTO product_versions
       (id, product_id, version, changelog, deploy_manifest, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        versionId, product.id, version, String(req.body.changelog || '').slice(0, 2000),
        req.body.deployManifest ? String(req.body.deployManifest) : null,
        req.body.publish === 'true' ? 'published' : 'draft', now,
      ]
    )
    await db.run(
      `INSERT INTO product_assets
       (id, product_version_id, file_name, storage_key, storage_driver, mime_type, size_bytes, checksum, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assetId, versionId, saved.fileName, saved.key, saved.storage, saved.fileType,
        req.file.size, crypto.createHash('sha256').update(req.file.buffer).digest('hex'), now,
      ]
    )
    res.status(201).json({ versionId, assetId, storage: saved.storage })
  }
)

router.patch('/admin/reviews/:id', requireAdmin('admin', 'moderator'), async (req, res) => {
  const status = String(req.body.status || '')
  if (!['approved', 'rejected', 'pending'].includes(status)) return res.status(400).json({ error: 'Invalid status' })
  await getDb().run('UPDATE marketplace_reviews SET status = ?, updated_at = ? WHERE id = ?', [status, new Date().toISOString(), req.params.id])
  res.json({ ok: true })
})

router.get('/admin/analytics', requireAdmin('admin', 'editor', 'moderator'), async (_req, res) => {
  const db = getDb()
  const funnel = await db.all(
    'SELECT event_name AS event, COUNT(*) AS count FROM marketplace_events GROUP BY event_name ORDER BY count DESC'
  )
  const creators = await db.all(
    `SELECT p.creator_id AS creatorId, COUNT(DISTINCT e.id) AS sales,
     COUNT(DISTINCT d.id) AS downloads
     FROM marketplace_products p
     LEFT JOIN entitlements e ON e.product_id = p.id AND e.status = 'active'
     LEFT JOIN download_events d ON d.entitlement_id = e.id
     GROUP BY p.creator_id`
  )
  res.json({ funnel, creators })
})

export default router
