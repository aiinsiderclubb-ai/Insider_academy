import { Router } from 'express'
import { getDb } from '../db.js'
import { requireUser } from '../middleware/auth.js'
import { config, isStripeEnabled, isLiqPayEnabled, isTributeEnabled, isPaddleEnabled, isGumroadEnabled, isPrelaunchMode } from '../config.js'
import { prelaunchBlocked } from '../middleware/prelaunch.js'
import { createCheckoutSession } from '../services/stripe.js'
import { createPaddleTransaction } from '../services/paddle.js'
import { createGumroadCheckout } from '../services/gumroad.js'
import { bestPrice } from '../services/rewards.js'
import { createPaymentPayload } from '../services/liqpay.js'
import {
  createShopOrder,
  getDigitalProduct,
  getProductIdForCourse,
} from '../services/tribute.js'
import { quoteMarketplaceItem, trackMarketplaceEvent } from '../services/marketplace.js'
import { courses as courseCatalog } from '../../src/data/courses.js'
import { VAULT_PRODUCTS } from '../../src/data/vaultProducts.js'
import { COURSE_BUNDLES } from '../../src/data/coursePacks.js'
import { LEGAL_ENTITY } from '../../src/data/legalEntity.js'

const router = Router()
const LOCALES = new Set(['ru', 'ukr', 'en'])
const PAID_CATALOG = [...courseCatalog, ...VAULT_PRODUCTS, ...COURSE_BUNDLES]

async function checkoutAvailability(req, res, next) {
  if (!isPrelaunchMode()) return next()
  return prelaunchBlocked(req, res, next)
}

async function resolveCheckoutItem(db, courseId, _email) {
  const item = PAID_CATALOG.find((entry) => entry.id === courseId)
  const baseAmount = Number(item?.priceEur ?? item?.price)
  if (!item || !Number.isFinite(baseAmount) || baseAmount <= 0) {
    throw Object.assign(new Error('Unknown or non-payable catalog item'), { status: 400 })
  }
  // Discounts (promo, friend referral) are applied by the checkout through
  // services/rewards.js; this is the list price.
  const amount = baseAmount
  return {
    kind: VAULT_PRODUCTS.some((entry) => entry.id === courseId)
      ? 'vault'
      : COURSE_BUNDLES.some((entry) => entry.id === courseId) ? 'pack' : 'course',
    amount,
    title: item.title || item.titleRu || item.name || courseId,
    slug: item.slug || courseId,
    currency: 'EUR',
  }
}

function checkoutPaths(item, provider) {
  if (item.kind === 'pack') return {
    success: `/app/learning?paid=1&provider=${provider}`,
    cancel: `/learn/bundles/${item.slug}?cancel=1`,
  }
  if (item.kind === 'vault') return {
    success: `/store/${item.slug}?tab=vault&paid=1&provider=${provider}`,
    cancel: `/store/${item.slug}/buy?cancel=1`,
  }
  return {
    success: `/learn/${item.slug}?paid=1&provider=${provider}`,
    cancel: `/learn/${item.slug}/buy?cancel=1`,
  }
}

function publicUrl(locale, path) {
  const safeLocale = LOCALES.has(locale) ? locale : 'ru'
  return `${config.appUrl.replace(/\/$/, '')}/${safeLocale}${path.startsWith('/') ? path : `/${path}`}`
}

function requireMarketplaceCommerce(req, res, next) {
  if (process.env.FEATURE_MARKETPLACE_COMMERCE !== 'true' || LEGAL_ENTITY.draft) {
    return res.status(404).json({ error: 'Not found' })
  }
  next()
}

router.get('/tribute/status', (_req, res) => {
  if (isPrelaunchMode()) {
    return res.json({ enabled: false, prelaunch: true, productMap: {} })
  }
  res.json({
    enabled: isTributeEnabled(),
    shopId: config.tribute.shopId,
    currency: config.tribute.currency,
    productMap: config.tribute.productMap,
  })
})

async function createMarketplacePayment(db, {
  provider, req, quote, externalId = null,
}) {
  const id = `mp-${provider}-${Date.now()}`
  await db.run(
    `INSERT INTO payments
     (id, user_id, email, course_id, course_title, amount, currency, provider, external_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'EUR', ?, ?, 'pending', ?)`,
    [
      id, req.userId, req.userEmail, quote.productId, quote.title, quote.amountEur,
      provider, externalId, new Date().toISOString(),
    ]
  )
  await db.run(
    `INSERT INTO checkout_contexts
     (payment_id, product_id, license_tier, quoted_amount_eur, legal_snapshot, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id, quote.productId, quote.licenseTier, quote.amountEur,
      JSON.stringify(quote.legalSnapshot), new Date().toISOString(),
    ]
  )
  await trackMarketplaceEvent(db, {
    userId: req.userId,
    productId: quote.productId,
    eventName: 'checkout_started',
    metadata: { provider, licenseTier: quote.licenseTier, paymentId: id },
  })
  return id
}

router.post('/stripe/marketplace', requireUser, requireMarketplaceCommerce, async (req, res) => {
  if (!isStripeEnabled()) return res.status(503).json({ error: 'Stripe not configured' })
  try {
    const quote = quoteMarketplaceItem(req.body)
    const db = getDb()
    const paymentId = await createMarketplacePayment(db, { provider: 'stripe', req, quote })
    const session = await createCheckoutSession({
      userId: req.userId,
      email: req.userEmail,
      courseId: quote.productId,
      courseTitle: quote.title,
      amountEur: quote.amountEur,
      metadata: {
        commerceType: 'marketplace',
        productId: quote.productId,
        licenseTier: quote.licenseTier,
        paymentId,
      },
      successUrl: `${config.appUrl}/cabinet?section=downloads&paid=1&provider=stripe`,
      cancelUrl: `${config.appUrl}/marketplace/${req.body.productId}?cancel=1`,
    })
    await db.run('UPDATE payments SET external_id = ? WHERE id = ?', [session.id, paymentId])
    res.json({ url: session.url, sessionId: session.id, quote })
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message })
  }
})

router.post('/tribute/marketplace', requireUser, requireMarketplaceCommerce, async (req, res) => {
  if (!isTributeEnabled() || !config.tribute.shopId) {
    return res.status(503).json({ error: 'Tribute Shop is not configured' })
  }
  try {
    const quote = quoteMarketplaceItem(req.body)
    const db = getDb()
    const order = await createShopOrder({
      shopId: config.tribute.shopId,
      amountCents: quote.amountEur * 100,
      currency: 'eur',
      title: quote.title,
      description: `Marketplace ${quote.licenseTier} license`,
      email: req.userEmail,
      customerId: String(req.userId),
      successUrl: `${config.appUrl}/cabinet?section=downloads&paid=1&provider=tribute`,
      failUrl: `${config.appUrl}/marketplace/${req.body.productId}?cancel=1`,
      comment: JSON.stringify({
        commerceType: 'marketplace',
        productId: quote.productId,
        licenseTier: quote.licenseTier,
      }),
    })
    const paymentId = await createMarketplacePayment(db, {
      provider: 'tribute', req, quote, externalId: order.uuid,
    })
    res.json({ url: order.paymentUrl || order.webappPaymentUrl, orderUuid: order.uuid, paymentId, quote })
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message })
  }
})

router.post('/liqpay/marketplace', requireUser, requireMarketplaceCommerce, async (req, res) => {
  if (!isLiqPayEnabled()) return res.status(503).json({ error: 'LiqPay not configured' })
  try {
    const quote = quoteMarketplaceItem(req.body)
    const db = getDb()
    const paymentId = await createMarketplacePayment(db, { provider: 'liqpay', req, quote })
    await db.run('UPDATE payments SET external_id = ? WHERE id = ?', [paymentId, paymentId])
    const payload = createPaymentPayload({
      amount: quote.amountEur,
      currency: 'EUR',
      description: `${quote.title} — ${quote.licenseTier}`,
      orderId: paymentId,
      resultUrl: `${config.appUrl}/cabinet?section=downloads&paid=1&provider=liqpay`,
      serverUrl: `${process.env.API_PUBLIC_URL || config.appUrl.replace('5173', '3001')}/api/webhooks/liqpay`,
    })
    res.json({ ...payload, paymentId, quote })
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message })
  }
})

/* --------------------------------- Paddle --------------------------------- */

router.get('/paddle/status', (_req, res) => {
  if (isPrelaunchMode()) return res.json({ enabled: false, prelaunch: true })
  res.json({ enabled: isPaddleEnabled(), environment: config.paddle.env })
})

async function openPaddleTransaction(db, { paymentId, req, itemId, title, amount, licenseTier }) {
  const transaction = await createPaddleTransaction({
    paymentId,
    userId: req.userId,
    itemId,
    title,
    amountEur: amount,
    licenseTier,
  })
  await db.run('UPDATE payments SET external_id = ? WHERE id = ?', [transaction.id, paymentId])
  return transaction
}

/** Courses and vaults: the price we show, less a referral discount or a promo. */
router.post('/paddle/checkout', requireUser, checkoutAvailability, async (req, res) => {
  if (!isPaddleEnabled()) return res.status(503).json({ error: 'Paddle not configured' })
  const db = getDb()
  const { courseId, promoCode, referralCode } = req.body
  if (!courseId) return res.status(400).json({ error: 'courseId required' })
  try {
    const item = await resolveCheckoutItem(db, courseId, req.userEmail)
    const price = await bestPrice(db, { userId: req.userId, email: req.userEmail, itemId: courseId, amountEur: item.amount, promoCode, referralCode })
    if (promoCode && price.promoError && price.kind !== 'promo') {
      return res.status(400).json({ error: price.promoError, errorRu: 'Промокод не подошёл.' })
    }
    const amount = price.finalEur
    const appliedPromo = price.kind === 'promo' ? price.code : null
    if (!(amount > 0)) return res.status(400).json({ error: 'Nothing to pay' })
    const paymentId = `pdl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    await db.run(
      `INSERT INTO payments (id, user_id, email, course_id, course_title, amount, currency, provider, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'EUR', 'paddle', 'pending', ?)`,
      [paymentId, req.userId, req.userEmail, courseId, item.title, amount, new Date().toISOString()]
    )
    if (appliedPromo) {
      const { rememberPromoForPayment } = await import('../services/reviewReward.js')
      await rememberPromoForPayment(db, paymentId, appliedPromo)
    }
    const transaction = await openPaddleTransaction(db, { paymentId, req, itemId: courseId, title: item.title, amount })
    const paths = checkoutPaths(item, 'paddle')
    res.json({
      transactionId: transaction.id,
      amount,
      baseAmount: price.baseEur,
      discount: price.kind ? { kind: price.kind, eur: price.discountEur, percent: price.percent ?? null } : null,
      currency: 'EUR',
      promo: appliedPromo,
      successUrl: publicUrl(req.body.locale, paths.success),
    })
  } catch (err) {
    console.error('[paddle checkout]', err.message)
    res.status(err.status || 502).json({ error: err.message })
  }
})

/** Store products: price × license multiplier, from the same quote as the other providers. */
router.post('/paddle/marketplace', requireUser, requireMarketplaceCommerce, async (req, res) => {
  if (!isPaddleEnabled()) return res.status(503).json({ error: 'Paddle not configured' })
  try {
    const listed = quoteMarketplaceItem(req.body)
    const db = getDb()
    const { promoCode, referralCode } = req.body
    const price = await bestPrice(db, { userId: req.userId, email: req.userEmail, itemId: listed.productId, amountEur: listed.amountEur, promoCode, referralCode })
    if (promoCode && price.promoError && price.kind !== 'promo') {
      return res.status(400).json({ error: price.promoError, errorRu: 'Промокод не подошёл.' })
    }
    const quote = { ...listed, amountEur: price.finalEur }
    const paymentId = await createMarketplacePayment(db, { provider: 'paddle', req, quote })
    if (price.kind === 'promo') {
      const { rememberPromoForPayment } = await import('../services/reviewReward.js')
      await rememberPromoForPayment(db, paymentId, price.code)
    }
    const transaction = await openPaddleTransaction(db, {
      paymentId, req, itemId: quote.productId, title: quote.title, amount: quote.amountEur, licenseTier: quote.licenseTier,
    })
    res.json({
      transactionId: transaction.id,
      quote,
      baseAmount: price.baseEur,
      discount: price.kind ? { kind: price.kind, eur: price.discountEur, percent: price.percent ?? null } : null,
      successUrl: publicUrl(req.body.locale, '/app/library?paid=1&provider=paddle'),
    })
  } catch (err) {
    console.error('[paddle marketplace]', err.message)
    res.status(err.status || 400).json({ error: err.message })
  }
})

/* -------------------------------- Gumroad --------------------------------- */

router.get('/gumroad/status', (_req, res) => {
  if (isPrelaunchMode()) return res.json({ enabled: false, prelaunch: true })
  res.json({ enabled: isGumroadEnabled() })
})

async function rememberGumroadCode(db, paymentId, code) {
  if (!code) return
  await db.run(
    'INSERT INTO analytics (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [`gumroad-code:${paymentId}`, code]
  )
}

/** Courses, vaults and packs: a link to Gumroad's checkout at our price. */
router.post('/gumroad/checkout', requireUser, checkoutAvailability, async (req, res) => {
  if (!isGumroadEnabled()) return res.status(503).json({ error: 'Gumroad not configured' })
  const db = getDb()
  const { courseId, promoCode, referralCode } = req.body
  if (!courseId) return res.status(400).json({ error: 'courseId required' })
  try {
    const item = await resolveCheckoutItem(db, courseId, req.userEmail)
    const price = await bestPrice(db, { userId: req.userId, email: req.userEmail, itemId: courseId, amountEur: item.amount, promoCode, referralCode })
    if (promoCode && price.promoError && price.kind !== 'promo') {
      return res.status(400).json({ error: price.promoError, errorRu: 'Промокод не подошёл.' })
    }
    const amount = price.finalEur
    const appliedPromo = price.kind === 'promo' ? price.code : null
    if (!(amount > 0)) return res.status(400).json({ error: 'Nothing to pay' })
    const paymentId = `gr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    await db.run(
      `INSERT INTO payments (id, user_id, email, course_id, course_title, amount, currency, provider, external_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'EUR', 'gumroad', ?, 'pending', ?)`,
      [paymentId, req.userId, req.userEmail, courseId, item.title, amount, paymentId, new Date().toISOString()]
    )
    if (appliedPromo) {
      const { rememberPromoForPayment } = await import('../services/reviewReward.js')
      await rememberPromoForPayment(db, paymentId, appliedPromo)
    }
    const checkout = await createGumroadCheckout({ paymentId, itemId: courseId, listEur: item.amount, amountEur: amount, email: req.userEmail })
    await rememberGumroadCode(db, paymentId, checkout.offerCode)
    res.json({
      checkoutUrl: checkout.url,
      paymentId,
      amount,
      baseAmount: price.baseEur,
      discount: price.kind ? { kind: price.kind, eur: price.discountEur, percent: price.percent ?? null } : null,
      currency: 'EUR',
      promo: appliedPromo,
      successUrl: publicUrl(req.body.locale, checkoutPaths(item, 'gumroad').success),
    })
  } catch (err) {
    console.error('[gumroad checkout]', err.message)
    res.status(err.status || 502).json({ error: err.message })
  }
})

/** Store products: the license is a variant of the Gumroad product. */
router.post('/gumroad/marketplace', requireUser, requireMarketplaceCommerce, async (req, res) => {
  if (!isGumroadEnabled()) return res.status(503).json({ error: 'Gumroad not configured' })
  try {
    const listed = quoteMarketplaceItem(req.body)
    const db = getDb()
    const { promoCode, referralCode } = req.body
    const price = await bestPrice(db, { userId: req.userId, email: req.userEmail, itemId: listed.productId, amountEur: listed.amountEur, promoCode, referralCode })
    if (promoCode && price.promoError && price.kind !== 'promo') {
      return res.status(400).json({ error: price.promoError, errorRu: 'Промокод не подошёл.' })
    }
    const quote = { ...listed, amountEur: price.finalEur }
    const paymentId = await createMarketplacePayment(db, { provider: 'gumroad', req, quote })
    await db.run('UPDATE payments SET external_id = ? WHERE id = ?', [paymentId, paymentId])
    if (price.kind === 'promo') {
      const { rememberPromoForPayment } = await import('../services/reviewReward.js')
      await rememberPromoForPayment(db, paymentId, price.code)
    }
    const checkout = await createGumroadCheckout({
      paymentId, itemId: quote.productId, listEur: listed.amountEur, amountEur: quote.amountEur, licenseTier: quote.licenseTier, email: req.userEmail,
    })
    await rememberGumroadCode(db, paymentId, checkout.offerCode)
    res.json({
      checkoutUrl: checkout.url,
      paymentId,
      quote,
      baseAmount: price.baseEur,
      discount: price.kind ? { kind: price.kind, eur: price.discountEur, percent: price.percent ?? null } : null,
      successUrl: publicUrl(req.body.locale, '/app/library?paid=1&provider=gumroad'),
    })
  } catch (err) {
    console.error('[gumroad marketplace]', err.message)
    res.status(err.status || 400).json({ error: err.message })
  }
})

router.post('/tribute/checkout', requireUser, checkoutAvailability, async (req, res) => {
  if (!isTributeEnabled()) {
    return res.status(503).json({ error: 'Tribute not configured. Set TRIBUTE_API_KEY in server/.env' })
  }

  const db = getDb()
  const { courseId, slug, locale, promoCode } = req.body
  if (!courseId) return res.status(400).json({ error: 'courseId required' })
  const item = await resolveCheckoutItem(db, courseId, req.userEmail)
  const courseTitle = item.title
  let amount = item.amount
  const paths = checkoutPaths(item, 'tribute')

  // A promo changes what is charged, which only a Shop order can do: a fixed
  // Tribute product has its price set on Tribute's side. Rather than take the
  // full amount from someone who was shown a discount, the checkout stops.
  let appliedPromo = null
  if (promoCode) {
    const { validatePromoCode } = await import('../services/promoCodes.js')
    const promo = await validatePromoCode({ code: promoCode, courseId, amountEur: amount })
    if (!promo.valid) {
      return res.status(400).json({ error: promo.error, errorRu: 'Промокод не подошёл.' })
    }
    if (!config.tribute.shopId) {
      return res.status(409).json({
        error: 'Promo codes need Tribute Shop checkout (TRIBUTE_SHOP_ID)',
        errorRu: 'Промокод пока нельзя применить к онлайн-оплате. Напишите менеджеру — применим скидку вручную.',
      })
    }
    amount = promo.finalEur
    appliedPromo = promo.code
  }

  const paymentId = `trib-${Date.now()}`
  const successUrl = publicUrl(locale, paths.success)
  const failUrl = publicUrl(locale, paths.cancel)
  const amountCents = Math.round(Number(amount) * 100)
  const productId = getProductIdForCourse(courseId)

  try {
    if (config.tribute.shopId) {
      const order = await createShopOrder({
        shopId: config.tribute.shopId,
        amountCents,
        currency: config.tribute.currency,
        title: courseTitle || courseId,
        description: `Course: ${courseTitle || courseId}`,
        email: req.userEmail,
        customerId: String(req.userId),
        successUrl,
        failUrl,
        comment: JSON.stringify({ courseId, userId: req.userId }),
      })

      await db.run(
        `INSERT INTO payments (id, user_id, email, course_id, course_title, amount, currency, provider, external_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'tribute', ?, 'pending', ?)`,
        [paymentId, req.userId, req.userEmail, courseId, courseTitle, amount, item.currency, order.uuid, new Date().toISOString()]
      )
      if (appliedPromo) {
        const { rememberPromoForPayment } = await import('../services/reviewReward.js')
        await rememberPromoForPayment(db, paymentId, appliedPromo)
      }

      return res.json({
        url: order.paymentUrl || order.webappPaymentUrl,
        webappUrl: order.webappPaymentUrl,
        orderUuid: order.uuid,
        mode: 'shop',
      })
    }

    if (!productId) {
      return res.status(503).json({
        error: 'Set TRIBUTE_DEFAULT_PRODUCT_ID or TRIBUTE_PRODUCT_MAP in server/.env',
      })
    }

    const product = await getDigitalProduct(productId)
    const payUrl = product.webLink || product.link

    await db.run(
      `INSERT INTO payments (id, user_id, email, course_id, course_title, amount, currency, provider, external_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'tribute', ?, 'pending', ?)`,
      [paymentId, req.userId, req.userEmail, courseId, courseTitle, amount, item.currency, String(productId), new Date().toISOString()]
    )

    return res.json({ url: payUrl, mode: 'product', productId })
  } catch (err) {
    console.error('[tribute checkout]', err.message)
    res.status(502).json({ error: err.message })
  }
})

router.post('/stripe/checkout', requireUser, checkoutAvailability, async (req, res) => {
  if (!isStripeEnabled()) return res.status(503).json({ error: 'Stripe not configured' })
  const db = getDb()
  const { courseId } = req.body
  const item = await resolveCheckoutItem(db, courseId, req.userEmail)
  const amount = item.amount
  const courseTitle = item.title
  const paymentId = `pay-${Date.now()}`
  await db.run(
    `INSERT INTO payments (id, user_id, email, course_id, course_title, amount, currency, provider, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'stripe', 'pending', ?)`,
    [paymentId, req.userId, req.userEmail, courseId, courseTitle, amount, item.currency, new Date().toISOString()]
  )
  const paths = checkoutPaths(item, 'stripe')
  const session = await createCheckoutSession({
    userId: req.userId,
    email: req.userEmail,
    courseId,
    courseTitle,
    amountEur: amount,
    successUrl: publicUrl(req.body.locale, paths.success),
    cancelUrl: publicUrl(req.body.locale, paths.cancel),
  })
  await db.run('UPDATE payments SET external_id = ? WHERE id = ?', [session.id, paymentId])
  res.json({ url: session.url, sessionId: session.id })
})

router.post('/liqpay/create', requireUser, checkoutAvailability, async (req, res) => {
  if (!isLiqPayEnabled()) return res.status(503).json({ error: 'LiqPay not configured' })
  const db = getDb()
  const { courseId, slug, locale } = req.body
  const item = await resolveCheckoutItem(db, courseId, req.userEmail)
  const amount = item.amount
  const courseTitle = item.title
  const orderId = `lp-${Date.now()}`
  await db.run(
    `INSERT INTO payments (id, user_id, email, course_id, course_title, amount, currency, provider, external_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'liqpay', ?, 'pending', ?)`,
    [orderId, req.userId, req.userEmail, courseId, courseTitle, amount, item.currency, orderId, new Date().toISOString()]
  )
  const paths = checkoutPaths(item, 'liqpay')
  const payload = createPaymentPayload({
    amount,
    description: courseTitle,
    orderId,
    resultUrl: publicUrl(locale, paths.success),
    serverUrl: `${(process.env.API_PUBLIC_URL || config.appUrl.replace('5173', '3001'))}/api/webhooks/liqpay`,
  })
  res.json(payload)
})

router.post('/demo', requireUser, checkoutAvailability, async (req, res) => {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_PURCHASES !== 'true') {
    return res.status(404).json({ error: 'Not found' })
  }
  const db = getDb()
  const { courseId, promoCode } = req.body
  if (!courseId) return res.status(400).json({ error: 'courseId required' })
  const item = await resolveCheckoutItem(db, courseId, req.userEmail)
  const courseTitle = item.title
  let finalAmount = item.amount
  if (promoCode) {
    try {
      const { validatePromoCode, consumePromoCode } = await import('../services/promoCodes.js')
      const promo = await validatePromoCode({ code: promoCode, courseId, amountEur: finalAmount })
      if (promo.valid) {
        finalAmount = promo.finalEur
        await consumePromoCode(promoCode)
      }
    } catch (err) {
      console.warn('[payments/demo] promo ignored:', err.message)
    }
  }
  const exists = await db.get('SELECT id FROM purchases WHERE user_id = ? AND course_id = ?', [req.userId, courseId])
  if (!exists) {
    await db.run('INSERT INTO purchases (user_id, course_id, payment_provider) VALUES (?, ?, ?)', [req.userId, courseId, 'demo'])
    await db.run(
      'INSERT INTO purchase_log (id, email, course_id, course_title, amount, date) VALUES (?, ?, ?, ?, ?, ?)',
      [`purchase-${Date.now()}`, req.userEmail, courseId, courseTitle, finalAmount, new Date().toISOString()]
    )
  }
  const purchases = await db.all(
    'SELECT course_id AS id, purchased_at AS purchasedAt FROM purchases WHERE user_id = ?', [req.userId]
  )
  res.json({ purchases })
})

export default router
