import test from 'node:test'
import assert from 'node:assert/strict'

test('the store sells the allowlist by default and every finished product with MARKETPLACE_SALE=all', async () => {
  const { quoteMarketplaceItem, isReleasedForSale, MARKETPLACE_BUNDLES } = await import('../services/marketplace.js')
  const { MARKETPLACE_PRODUCTS } = await import('../../src/data/marketplace/products.js')
  const finished = MARKETPLACE_PRODUCTS.find((p) => p.availability !== 'coming_soon' && p.id !== 'mp-voice-beauty-salon')
  const soon = MARKETPLACE_PRODUCTS.find((p) => p.availability === 'coming_soon')

  delete process.env.MARKETPLACE_SALE
  assert.equal(quoteMarketplaceItem({ productId: 'mp-voice-beauty-salon' }).productId, 'mp-voice-beauty-salon')
  assert.throws(() => quoteMarketplaceItem({ productId: finished.id }), /not released/)

  process.env.MARKETPLACE_SALE = 'all'
  try {
    assert.equal(quoteMarketplaceItem({ productId: finished.id }).productId, finished.id)
    assert.throws(() => quoteMarketplaceItem({ productId: soon.id }), /not released/)
    for (const bundle of MARKETPLACE_BUNDLES) {
      const allFinished = bundle.productIds.every((id) => MARKETPLACE_PRODUCTS.find((p) => p.id === id)?.availability !== 'coming_soon')
      assert.equal(isReleasedForSale(bundle), allFinished, bundle.id)
    }
    // a paid order is always handed over, released or not
    assert.equal(quoteMarketplaceItem({ productId: soon.id, enforceRelease: false }).productId, soon.id)
  } finally {
    delete process.env.MARKETPLACE_SALE
  }
})
