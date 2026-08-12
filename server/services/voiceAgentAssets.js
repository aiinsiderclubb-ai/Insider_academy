import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { saveUploadedFile } from './storage.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const sourceDir = path.join(root, 'marketplace-products', 'voice-agent-beauty-salon')
const assets = [
  ['voice-agent-beauty-salon-v1.0.0.zip', 'application/zip'],
  ['voice-agent-beauty-salon-preview.pdf', 'application/pdf'],
  ['agent-config.json', 'application/json'],
  ['tools.json', 'application/json'],
]

export async function seedVoiceAgentAssets(db) {
  const productId = 'mp-voice-beauty-salon'
  const version = '1.0.0'
  const versionId = 'mpv-voice-beauty-salon-1-0-0'
  const now = new Date().toISOString()
  await db.run(
    `INSERT INTO product_versions (id, product_id, version, changelog, deploy_manifest, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'published', ?)
     ON CONFLICT(product_id, version) DO UPDATE SET status = 'published', changelog = excluded.changelog`,
    [versionId, productId, version, 'Initial tested booking kit with privacy defaults, calendar tools and rollback checklist', JSON.stringify({ providers: ['vapi', 'retell', 'elevenlabs'], restoreProcedure: 'deployment-checklist.md' }), now]
  )
  const stored = await db.get('SELECT id FROM product_versions WHERE product_id = ? AND version = ?', [productId, version])
  for (const [fileName, mimetype] of assets) {
    const current = await db.get('SELECT id FROM commerce_assets WHERE id = ? LIMIT 1', [`mpa-voice-${fileName}`])
    if (current) continue
    const filePath = path.join(sourceDir, fileName)
    if (!fs.existsSync(filePath)) throw new Error(`Voice Agent release asset missing: ${fileName}`)
    const buffer = fs.readFileSync(filePath)
    const saved = await saveUploadedFile({ buffer, mimetype, originalname: fileName }, `marketplace/${productId}/${version}`)
    await db.run(
      `INSERT INTO commerce_assets
       (id, product_version_id, file_name, storage_key, storage_driver, mime_type, size_bytes, checksum, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [`mpa-voice-${fileName}`, stored.id, fileName, saved.key, saved.storage, mimetype, buffer.length, crypto.createHash('sha256').update(buffer).digest('hex'), now]
    )
  }
}
