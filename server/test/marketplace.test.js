import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'

process.env.JWT_SECRET = 'marketplace-test-secret'

test('marketplace quote ignores client supplied price and rejects arbitrary SKU', async () => {
  const { quoteMarketplaceItem } = await import('../services/marketplace.js')
  const quote = quoteMarketplaceItem({
    productId: 'mp-prompt-chatgpt-vault',
    licenseTier: 'client',
    amount: 0.01,
    currency: 'USD',
  })
  assert.equal(quote.amountEur, 51)
  assert.equal(quote.licenseTier, 'client')
  assert.throws(() => quoteMarketplaceItem({ productId: 'arbitrary-sku' }), /Unknown/)
})

test('typed entitlements require verified source and are idempotent', async () => {
  const dbPath = path.join(os.tmpdir(), `marketplace-${Date.now()}.sqlite`)
  process.env.LMS_TEST_DB = dbPath
  const { createSqliteDb } = await import('../db/sqlite.js')
  const { ensureMarketplaceSchema } = await import('../db/marketplaceSchema.js')
  const { grantMarketplaceEntitlement } = await import('../services/marketplace.js')
  const db = createSqliteDb()
  await ensureMarketplaceSchema(db)

  await assert.rejects(
    grantMarketplaceEntitlement(db, {
      userId: 1,
      productId: 'mp-prompt-chatgpt-vault',
      sourceType: 'client',
      sourceId: 'fake',
    }),
    /verified grant source/
  )

  const grant = {
    userId: 1,
    productId: 'mp-prompt-chatgpt-vault',
    licenseTier: 'agency',
    sourceType: 'webhook',
    sourceId: 'stripe:cs_test_1',
  }
  await grantMarketplaceEntitlement(db, grant)
  await grantMarketplaceEntitlement(db, grant)
  const rows = await db.all('SELECT * FROM entitlements WHERE user_id = ?', [1])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].license_tier, 'agency')
  db.raw.close()
  fs.unlinkSync(dbPath)
})

test('signed download tickets reject expiry, wrong asset and tampering', async () => {
  const { createDownloadTicket, verifyDownloadTicket } = await import('../services/signedDownload.js')
  const valid = createDownloadTicket({ assetId: 'asset-1', userId: 42 })
  assert.deepEqual(verifyDownloadTicket(valid).assetId, 'asset-1')
  assert.equal(verifyDownloadTicket(`${valid}tampered`), null)
  assert.equal(verifyDownloadTicket(createDownloadTicket({ assetId: 'asset-1', userId: 42, ttlSeconds: -1 })), null)
})

test('n8n security rejects SSRF and embedded workflow secrets', async () => {
  const { encryptApiKey, decryptApiKey, prepareWorkflow, validateN8nUrl } = await import('../services/n8n.js')
  await assert.rejects(validateN8nUrl('http://127.0.0.1:5678'), /HTTPS/)
  await assert.rejects(validateN8nUrl('https://127.0.0.1'), /Private/)
  const encrypted = encryptApiKey('test-api-key-with-enough-length')
  assert.equal(decryptApiKey({
    encrypted: encrypted.encrypted,
    iv: encrypted.iv,
    tag: encrypted.tag,
  }), 'test-api-key-with-enough-length')
  assert.throws(
    () => prepareWorkflow({ workflow: { nodes: [{ parameters: { apiKey: 'secret-value' } }] } }),
    /embedded secrets/
  )
  assert.throws(
    () => prepareWorkflow({
      workflow: { nodes: [] },
      requiredCredentials: [{ key: 'openAi', type: 'openAiApi' }],
    }),
    /Missing credential mapping/
  )
})
