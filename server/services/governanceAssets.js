import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from '../config.js'

const sourceDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'governance')
const files = [
  ['policy-template.md', 'text/markdown'],
  ['incident-runbook.md', 'text/markdown'],
  ['eval-dataset.json', 'application/json'],
]

export async function seedGovernanceAssets(db) {
  const productId = 'mp-biz-agent-audit'
  const versionId = 'mpv-governance-1-0-0'
  const targetDir = path.join(config.uploadsDir, 'marketplace', productId, '1.0.0')
  fs.mkdirSync(targetDir, { recursive: true })
  const now = new Date().toISOString()
  await db.run(
    `INSERT INTO product_versions
     (id, product_id, version, changelog, deploy_manifest, status, created_at)
     VALUES (?, ?, '1.0.0', ?, NULL, 'published', ?)
     ON CONFLICT(product_id, version) DO UPDATE SET status = 'published'`,
    [versionId, productId, 'Initial governance policy, incident and evaluation assets', now]
  )
  const storedVersion = await db.get(
    'SELECT id FROM product_versions WHERE product_id = ? AND version = ?',
    [productId, '1.0.0']
  )
  for (const [fileName, mimeType] of files) {
    const source = path.join(sourceDir, fileName)
    const target = path.join(targetDir, fileName)
    fs.copyFileSync(source, target)
    const body = fs.readFileSync(target)
    const key = `marketplace/${productId}/1.0.0/${fileName}`
    await db.run(
      `INSERT INTO product_assets
       (id, product_version_id, file_name, storage_key, storage_driver, mime_type, size_bytes, checksum, created_at)
       VALUES (?, ?, ?, ?, 'local', ?, ?, ?, ?)
       ON CONFLICT(id) DO NOTHING`,
      [
        `mpa-gov-${fileName.replace(/\W/g, '-')}`, storedVersion.id, fileName, key,
        mimeType, body.length, crypto.createHash('sha256').update(body).digest('hex'), now,
      ]
    )
  }
  const dataset = fs.readFileSync(path.join(sourceDir, 'eval-dataset.json'), 'utf8')
  await db.run(
    `INSERT INTO eval_suites
     (id, product_id, version, name, dataset, pass_threshold, active, created_at)
     VALUES ('eval-agent-safety-baseline', ?, '1.0.0', ?, ?, 0.8, 1, ?)
     ON CONFLICT(id) DO NOTHING`,
    [productId, 'Agent deployment safety baseline', dataset, now]
  )
}
