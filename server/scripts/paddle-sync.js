#!/usr/bin/env node
/**
 * Keeps the Paddle catalog in step with ours: one Paddle product per sellable
 * item (tagged custom_data.item_id) with one base price in EUR, tax included.
 * Checkouts charge a one-off price on that product (services/paddle.js), but
 * the catalog is what Paddle's reviewers compare with the prices on the site.
 *
 *   node scripts/paddle-sync.js            # create and update
 *   node scripts/paddle-sync.js --dry-run  # show what would change
 *
 * Reads PADDLE_ENV and PADDLE_API_KEY from server/.env. Items that leave our
 * catalog are archived in Paddle, never deleted.
 */
import 'dotenv/config'
import { courses } from '../../src/data/courses.js'
import { VAULT_PRODUCTS } from '../../src/data/vaultProducts.js'
import { MARKETPLACE_PRODUCTS } from '../../src/data/marketplace/products.js'
import { config } from '../config.js'
import { paddleList, paddleRequest, toMinor } from '../services/paddle.js'

const dry = process.argv.includes('--dry-run')

function price(item) {
  return Number(item.priceEur ?? item.price)
}

export function catalogItems() {
  const items = []
  for (const c of courses) {
    if (price(c) > 0) items.push({ id: c.id, kind: 'course', name: c.titleEn || c.title || c.titleRu, description: c.shortEn || c.descriptionEn || c.short || c.description || '', amount: price(c) })
  }
  for (const v of VAULT_PRODUCTS) {
    if (price(v) > 0 && v.availability !== 'coming_soon') items.push({ id: v.id, kind: 'vault', name: v.titleEn || v.title || v.titleRu, description: v.shortEn || v.descriptionEn || v.short || '', amount: price(v) })
  }
  for (const p of MARKETPLACE_PRODUCTS) {
    if (price(p) > 0 && p.availability !== 'coming_soon') items.push({ id: p.id, kind: 'store', name: p.titleEn || p.titleRu, description: p.shortEn || p.shortRu || '', amount: price(p) })
  }
  return items.map((i) => ({ ...i, name: String(i.name).slice(0, 200), description: String(i.description).replace(/\s+/g, ' ').slice(0, 1000) }))
}

async function main() {
  console.log(`Paddle ${config.paddle.env}${dry ? ' (dry run)' : ''}`)
  const items = catalogItems()
  const products = await paddleList('/products?status=active')
  const byItem = new Map(products.filter((p) => p.custom_data?.item_id).map((p) => [p.custom_data.item_id, p]))
  const prices = await paddleList('/prices?status=active')
  const baseByProduct = new Map(prices.filter((p) => p.custom_data?.kind === 'base').map((p) => [p.product_id, p]))
  const stats = { created: 0, updated: 0, priced: 0, archived: 0, unchanged: 0 }

  for (const item of items) {
    let product = byItem.get(item.id)
    if (!product) {
      console.log(`+ product ${item.id} — ${item.name}`)
      stats.created++
      if (dry) continue
      product = (await paddleRequest('POST', '/products', {
        name: item.name,
        description: item.description || undefined,
        tax_category: 'standard',
        custom_data: { item_id: item.id, kind: item.kind },
      })).data
    } else if (product.name !== item.name || (product.description || '') !== item.description) {
      console.log(`~ product ${item.id}`)
      stats.updated++
      if (!dry) await paddleRequest('PATCH', `/products/${product.id}`, { name: item.name, description: item.description || null })
    } else {
      stats.unchanged++
    }

    const base = baseByProduct.get(product.id)
    const amount = toMinor(item.amount)
    if (base && base.unit_price.amount === amount && base.unit_price.currency_code === 'EUR') continue
    console.log(`$ price ${item.id} → €${item.amount}${base ? ` (was ${Number(base.unit_price.amount) / 100})` : ''}`)
    stats.priced++
    if (dry) continue
    if (base) await paddleRequest('PATCH', `/prices/${base.id}`, { status: 'archived' })
    await paddleRequest('POST', '/prices', {
      product_id: product.id,
      description: `${item.name} — base price`,
      unit_price: { amount, currency_code: 'EUR' },
      tax_mode: 'internal',
      quantity: { minimum: 1, maximum: 1 },
      custom_data: { item_id: item.id, kind: 'base' },
    })
  }

  const wanted = new Set(items.map((i) => i.id))
  for (const [itemId, product] of byItem) {
    if (wanted.has(itemId)) continue
    console.log(`- archive ${itemId}`)
    stats.archived++
    if (!dry) await paddleRequest('PATCH', `/products/${product.id}`, { status: 'archived' })
  }
  console.log(stats)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
}
