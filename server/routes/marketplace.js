import crypto from 'node:crypto'
import { Router } from 'express'
import { getDb } from '../db.js'
import { requireUser } from '../middleware/auth.js'
import { rateLimitMiddleware } from '../middleware/rateLimit.js'
import { getFileUrl } from '../services/storage.js'
import {
  claimFreeProduct,
  getEntitledAsset,
  getMarketplaceProduct,
  listMarketplaceProducts,
  listUserDownloads,
} from '../services/marketplaceCatalog.js'
import { nowIso } from '../db/time.js'

const router = Router()
const claimLimit = rateLimitMiddleware({ windowMs: 60_000, max: 10, keyFn: (req) => `marketplace-claim:${req.userId || req.ip}` })
const downloadLimit = rateLimitMiddleware({ windowMs: 60_000, max: 30, keyFn: (req) => `marketplace-download:${req.userId || req.ip}` })

router.get('/products', async (req, res) => {
  const products = await listMarketplaceProducts(getDb(), { status: 'published', productType: req.query.type || undefined })
  res.json({ products })
})

router.get('/products/:slug', async (req, res) => {
  const product = await getMarketplaceProduct(getDb(), req.params.slug)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  res.json({ product })
})

router.post('/products/:id/claim', requireUser, claimLimit, async (req, res) => {
  const product = await claimFreeProduct(getDb(), { userId: req.userId, productId: req.params.id })
  res.status(201).json({ ok: true, product })
})

router.get('/downloads', requireUser, async (req, res) => {
  const downloads = await listUserDownloads(getDb(), req.userId)
  res.json({ downloads })
})

router.post('/downloads/:assetId/url', requireUser, downloadLimit, async (req, res) => {
  const db = getDb()
  const asset = await getEntitledAsset(db, { userId: req.userId, assetId: req.params.assetId })
  if (!asset) return res.status(404).json({ error: 'Download unavailable' })
  const url = await getFileUrl(asset.storage_key, asset.file_storage)
  if (!url) return res.status(503).json({ error: 'Storage unavailable' })
  await db.run('INSERT INTO asset_downloads (id, user_id, product_id, asset_id, order_id, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
    crypto.randomUUID(), req.userId, asset.product_id, asset.id, asset.order_id || null, nowIso(),
  ])
  res.json({ url, expiresIn: 900, fileName: asset.file_name })
})

export default router
