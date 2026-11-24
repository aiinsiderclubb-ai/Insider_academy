#!/usr/bin/env node
/**
 * Keeps the Gumroad catalog in step with ours: one Gumroad product per
 * sellable item, its custom permalink being our item id, priced in EUR. Store
 * products get a "License" variant with one option per license tier.
 *
 *   node scripts/gumroad-sync.js              # create as drafts, update prices
 *   node scripts/gumroad-sync.js --publish    # also publish every product
 *   node scripts/gumroad-sync.js --dry-run    # show what would change
 *
 * The product itself is a pointer: access opens in the Academy cabinet once
 * the sale reaches the API, so the receipt and the product page send buyers
 * there. Reads GUMROAD_ACCESS_TOKEN from server/.env.
 */
import 'dotenv/config'
import { catalogItems } from './paddle-sync.js'
import { LICENSE_TIERS } from '../services/marketplace.js'
import { LICENSE_VARIANT, TIER_NAMES, gumroadProducts, gumroadRequest } from '../services/gumroad.js'

const dry = process.argv.includes('--dry-run')
const publish = process.argv.includes('--publish')
const APP = (process.env.APP_URL || 'https://myinsideracademy.com').replace(/\/$/, '')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const cents = (eur) => Math.round(Number(eur) * 100)

function description(item) {
  return [
    `<p>${esc(item.description || item.name)}</p>`,
    '<p><strong>How you get it.</strong> Buy with the same email as your AI Insider Academy account. '
      + `Access opens automatically in your cabinet at <a href="${APP}/app">${APP.replace(/^https?:\/\//, '')}/app</a> within a minute of payment. `
      + 'No account yet? Create one with this email and the purchase appears there.</p>',
    '<p>Full refund within 14 days, no questions asked.</p>',
  ].join('')
}

function richContent() {
  const text = (t) => ({ type: 'text', text: t })
  return [{
    title: 'Open your purchase',
    description: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [text('Your purchase lives in your AI Insider Academy cabinet:')] },
        { type: 'paragraph', content: [{ type: 'text', text: `${APP}/app`, marks: [{ type: 'link', attrs: { href: `${APP}/app` } }] }] },
        { type: 'paragraph', content: [text('Sign in with the email you used here. If you have no account yet, register with that email — the purchase is waiting for you.')] },
      ],
    },
  }]
}

const KIND_SUMMARY = {
  course: 'Video course with lessons, materials and homework in your Academy cabinet.',
  pack: 'Several courses plus bonus kits, opened together in your Academy cabinet.',
  vault: 'A set of ready-to-use kits in your Academy library.',
  store: 'Downloadable kit in your Academy library, updates included.',
}

async function ensureLicenseVariants(product, item) {
  const { variant_categories: categories = [] } = await gumroadRequest('GET', `/products/${encodeURIComponent(product.id)}/variant_categories`)
  let category = categories.find((c) => c.title === LICENSE_VARIANT)
  if (!category) {
    if (dry) return console.log(`  + variants ${item.id}`)
    category = (await gumroadRequest('POST', `/products/${encodeURIComponent(product.id)}/variant_categories`, { title: LICENSE_VARIANT })).variant_category
  }
  const base = `/products/${encodeURIComponent(product.id)}/variant_categories/${encodeURIComponent(category.id)}/variants`
  const { variants = [] } = await gumroadRequest('GET', base)
  for (const [tier, license] of Object.entries(LICENSE_TIERS)) {
    const name = TIER_NAMES[tier]
    const diff = cents(Math.round(item.amount * license.multiplier)) - cents(item.amount)
    const existing = variants.find((v) => v.name === name)
    if (existing && Number(existing.price_difference_cents) === diff) continue
    console.log(`  ${existing ? '~' : '+'} ${item.id} ${name} +${diff / 100}`)
    if (dry) continue
    if (existing) await gumroadRequest('PUT', `${base}/${encodeURIComponent(existing.id)}`, { price_difference_cents: diff })
    else await gumroadRequest('POST', base, { name, price_difference_cents: diff })
  }
}

async function main() {
  const items = catalogItems()
  const existing = await gumroadProducts({ fresh: true })
  const stats = { created: 0, updated: 0, unchanged: 0, published: 0 }
  for (const item of items) {
    let product = existing.get(item.id)
    const fields = {
      name: item.name,
      description: description(item),
      price: cents(item.amount),
      price_currency_type: 'eur',
      custom_summary: KIND_SUMMARY[item.kind],
      custom_receipt_text: `Access opens in your AI Insider Academy cabinet: ${APP}/app — sign in with this email.`,
      custom_view_content_button_text: 'Open the Academy',
    }
    if (!product) {
      console.log(`+ ${item.id} — ${item.name} €${item.amount}`)
      stats.created++
      if (dry) continue
      const res = await gumroadRequest('POST', '/products', {
        ...fields,
        native_type: 'digital',
        custom_permalink: item.id,
        rich_content: richContent(),
        draft: !publish,
      })
      product = res.product
      if (res.warning) console.log(`  ! ${res.warning}`)
    } else if (product.name !== item.name || Number(product.price) !== cents(item.amount) || String(product.currency).toLowerCase() !== 'eur') {
      console.log(`~ ${item.id} €${item.amount}`)
      stats.updated++
      if (!dry) product = (await gumroadRequest('PUT', `/products/${encodeURIComponent(product.id)}`, fields)).product
    } else {
      stats.unchanged++
    }
    if (item.kind === 'store' && product) await ensureLicenseVariants(product, item)
    if (publish && product && !product.published && !dry) {
      try {
        const res = await gumroadRequest('PUT', `/products/${encodeURIComponent(product.id)}/enable`)
        if (res.product?.published) stats.published++
      } catch (err) {
        console.log(`  ! not published: ${err.message}`)
      }
    }
  }
  const wanted = new Set(items.map((i) => i.id))
  for (const [id, product] of existing) {
    if (wanted.has(id) || !product.published) continue
    console.log(`- unpublish ${id}`)
    if (!dry) await gumroadRequest('PUT', `/products/${encodeURIComponent(product.id)}/disable`)
  }
  console.log(stats)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
