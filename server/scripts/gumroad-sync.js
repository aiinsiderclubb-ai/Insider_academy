#!/usr/bin/env node
/**
 * Keeps the Gumroad catalog in step with ours: one Gumroad product per
 * sellable item, its custom permalink being our item id, priced in EUR. Store
 * products get a "License" variant with one option per license tier.
 *
 *   node scripts/gumroad-sync.js              # create as drafts, update prices
 *   node scripts/gumroad-sync.js --publish    # also publish the products this run creates
 *   node scripts/gumroad-sync.js --publish=vault-prompt,vault-agent   # publish these existing ones
 *   node scripts/gumroad-sync.js --dry-run    # show what would change
 *   node scripts/gumroad-sync.js --only=mp-mcp-motion-studio --publish   # touch only these items
 *
 * With --only the run skips everything else, including the clean-up that
 * takes products we no longer sell off sale — Gumroad's limit of ten new
 * products a day would otherwise make a new listing wait behind the queue.
 *
 * The product itself is a pointer: access opens in the Academy cabinet once
 * the sale reaches the API, so the receipt and the product page send buyers
 * there. Reads GUMROAD_ACCESS_TOKEN from server/.env.
 */
import 'dotenv/config'
import { catalogItems } from './paddle-sync.js'
import { LICENSE_TIERS } from '../services/marketplace.js'
import { courses } from '../../src/data/courses.js'
import { GUMROAD_FREE_COURSES, LICENSE_VARIANT, TIER_NAMES, gumroadProducts, gumroadRequest } from '../services/gumroad.js'

const dry = process.argv.includes('--dry-run')
const publish = process.argv.some((arg) => arg === '--publish' || arg.startsWith('--publish='))
// Products taken off sale by hand (a course still being recorded) stay off: only
// what this run creates, or what is named in --publish=a,b, gets published.
const publishIds = new Set(
  (process.argv.find((arg) => arg.startsWith('--publish='))?.slice('--publish='.length) || '').split(',').filter(Boolean),
)
const only = new Set(
  (process.argv.find((arg) => arg.startsWith('--only='))?.slice('--only='.length) || '').split(',').filter(Boolean),
)
const APP = (process.env.APP_URL || 'https://myinsideracademy.com').replace(/\/$/, '')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const cents = (eur) => Math.round(Number(eur) * 100)

function description(item) {
  if (item.kind === 'free') {
    return [
      `<p>${esc(item.description || item.name)}</p>`,
      `<p><strong>Free.</strong> The course lives on AI Insider Academy: <a href="${item.url}">${esc(item.url.replace(/^https?:\/\//, ''))}</a>. `
        + 'Create a free account there and start the first lesson right away. Lessons are in Russian.</p>',
    ].join('')
  }
  return [
    `<p>${esc(item.description || item.name)}</p>`,
    '<p><strong>How you get it.</strong> Buy with the same email as your AI Insider Academy account. '
      + `Access opens automatically in your cabinet at <a href="${APP}/app">${APP.replace(/^https?:\/\//, '')}/app</a> within a minute of payment. `
      + 'No account yet? Create one with this email and the purchase appears there.</p>',
    '<p>Full refund within 14 days, no questions asked.</p>',
  ].join('')
}

function richContent(item) {
  const text = (t) => ({ type: 'text', text: t })
  if (item.kind === 'free') {
    return [{
      title: 'Start the course',
      description: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [text('The course is free on AI Insider Academy. Open it and create an account with any email:')] },
          { type: 'paragraph', content: [{ type: 'text', text: item.url, marks: [{ type: 'link', attrs: { href: item.url } }] }] },
        ],
      },
    }]
  }
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
  free: 'Free video course on AI Insider Academy, lessons in Russian.',
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

/** The free courses, at 0 €, pointing at their page on the site. */
function freeItems() {
  return GUMROAD_FREE_COURSES.map((id) => {
    const course = courses.find((c) => c.id === id)
    if (!course) throw new Error(`Free course ${id} is not in src/data/courses.js`)
    return {
      id,
      kind: 'free',
      name: `${course.titleEn || course.title} — free course`,
      description: String(course.shortEn || course.descriptionEn || course.short || '').replace(/\s+/g, ' ').slice(0, 1000),
      amount: 0,
      url: `${APP}/learn/${id}`,
    }
  })
}

async function main() {
  const items = [...freeItems(), ...catalogItems()].filter((item) => !only.size || only.has(item.id))
  const unknown = [...only].filter((id) => !items.some((item) => item.id === id))
  if (unknown.length) throw new Error(`Not in the sellable catalog: ${unknown.join(', ')}`)
  const existing = await gumroadProducts({ fresh: true })
  const stats = { created: 0, updated: 0, unchanged: 0, published: 0 }
  for (const item of items) {
    let product = existing.get(item.id)
    const created = !product
    const fields = {
      name: item.name,
      description: description(item),
      price: cents(item.amount),
      price_currency_type: 'eur',
      custom_summary: KIND_SUMMARY[item.kind],
      custom_receipt_text:
        item.kind === 'free'
          ? `Start the course on AI Insider Academy: ${item.url}`
          : `Access opens in your AI Insider Academy cabinet: ${APP}/app — sign in with this email.`,
      custom_view_content_button_text: item.kind === 'free' ? 'Start the course' : 'Open the Academy',
    }
    if (!product) {
      console.log(`+ ${item.id} — ${item.name} €${item.amount}`)
      stats.created++
      if (dry) continue
      const res = await gumroadRequest('POST', '/products', {
        ...fields,
        native_type: 'digital',
        custom_permalink: item.id,
        rich_content: richContent(item),
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
    if (publish && product && !product.published && !dry && (created || publishIds.has(item.id))) {
      try {
        const res = await gumroadRequest('PUT', `/products/${encodeURIComponent(product.id)}/enable`)
        if (res.product?.published) stats.published++
      } catch (err) {
        console.log(`  ! not published: ${err.message}`)
      }
    }
  }
  const wanted = new Set(items.map((i) => i.id))
  for (const [id, product] of only.size ? [] : existing) {
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
