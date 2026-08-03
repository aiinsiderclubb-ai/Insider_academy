import { Router } from 'express'
import { getDb } from '../db.js'
import { requireUser } from '../middleware/auth.js'
import { config, isStripeEnabled, isLiqPayEnabled, isTributeEnabled, isPrelaunchMode } from '../config.js'
import { prelaunchBlocked } from '../middleware/prelaunch.js'
import { createCheckoutSession } from '../services/stripe.js'
import { createPaymentPayload } from '../services/liqpay.js'
import {
  createShopOrder,
  getDigitalProduct,
  getProductIdForCourse,
} from '../services/tribute.js'
import { quoteMarketplaceItem, trackMarketplaceEvent } from '../services/marketplace.js'

const router = Router()
const LOCALES = new Set(['ru', 'ukr', 'en'])
const PAID_CATALOG = [...courseCatalog, ...VAULT_PRODUCTS]

async function checkoutAvailability(req, res, next) {
  if (!isPrelaunchMode()) return next()
  if (process.env.MARKETPLACE_LIVE !== '1') return prelaunchBlocked(req, res, next)
  const product = await getMarketplaceProduct(getDb(), req.body?.courseId)
  if (!product) return prelaunchBlocked(req, res, next)
  next()
}

async function resolveCheckoutItem(db, courseId, email) {
  const marketplaceProduct = await getMarketplaceProduct(db, courseId)
  if (marketplaceProduct) {
    if (marketplaceProduct.productType !== 'marketplace' || marketplaceProduct.isFree || marketplaceProduct.assetCount < 1 || marketplaceProduct.priceEur <= 0) {
      throw Object.assign(new Error('Marketplace product unavailable for checkout'), { status: 400 })
    }
    return {
      kind: 'marketplace',
      product: marketplaceProduct,
      amount: marketplaceProduct.priceEur,
      title: marketplaceProduct.titleRu,
      slug: marketplaceProduct.slug,
      currency: marketplaceProduct.currency,
    }
  }
  const item = PAID_CATALOG.find((entry) => entry.id === courseId)
  const baseAmount = Number(item?.priceEur ?? item?.price)
  if (!item || !Number.isFinite(baseAmount) || baseAmount <= 0) {
    throw Object.assign(new Error('Unknown or non-payable catalog item'), { status: 400 })
  }
  const discount = await db.get('SELECT percent FROM referral_discounts WHERE email = ?', [email])
  const percent = Math.max(0, Math.min(50, Number(discount?.percent || 0)))
  const amount = percent > 0
    ? Math.max(0, baseAmount - Math.round((baseAmount * percent) / 100))
    : baseAmount
  return {
    kind: VAULT_PRODUCTS.some((entry) => entry.id === courseId) ? 'vault' : 'course',
    amount,
    title: item.title || item.titleRu || item.name || courseId,
    slug: item.slug || courseId,
    currency: 'EUR',
  }
}

function checkoutPaths(item, provider) {
  if (item.kind === 'marketplace') return {
    success: `/marketplace/${item.slug}?paid=1&provider=${provider}`,
    cancel: `/marketplace/${item.slug}/buy?cancel=1`,
  }
  if (item.kind === 'vault') return {
    success: `/marketplace/${item.slug}?tab=vault&paid=1&provider=${provider}`,
    cancel: `/marketplace/${item.slug}/buy?tab=vault&cancel=1`,
  }
  return {
    success: `/courses/${item.slug}?paid=1&provider=${provider}`,
    cancel: `/courses/${item.slug}/buy?cancel=1`,
  }
}

function publicUrl(locale, path) {
  const safeLocale = LOCALES.has(locale) ? locale : 'ru'
  return `${config.appUrl.replace(/\/$/, '')}/${safeLocale}${path.startsWith('/') ? path : `/${path}`}`
}

function requireMarketplaceCommerce(req, res, next) {
  if (process.env.FEATURE_MARKETPLACE_COMMERCE !== 'true') {
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

router.post('/tribute/checkout', requireUser, async (req, res) => {
  if (!isTributeEnabled()) {
    return res.status(503).json({ error: 'Tribute not configured. Set TRIBUTE_API_KEY in server/.env' })
  }

  const db = getDb()
  const { courseId, slug, locale } = req.body
  if (!courseId) return res.status(400).json({ error: 'courseId required' })
  const item = await resolveCheckoutItem(db, courseId, req.userEmail)
  const courseTitle = item.title
  const amount = item.amount
  const paths = checkoutPaths(item, 'tribute')

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
      if (item.kind === 'marketplace') await createMarketplaceOrder(db, { userId: req.userId, product: item.product, paymentId, provider: 'tribute', externalId: order.uuid, amount, currency: item.currency })

      return res.json({
        url: order.paymentUrl || order.webappPaymentUrl,
        webappUrl: order.webappPaymentUrl,
        orderUuid: order.uuid,
        mode: 'shop',
      })
    }

    if (item.kind === 'marketplace') {
      return res.status(503).json({ error: 'Tribute Shop API is required for marketplace pricing' })
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
    if (item.kind === 'marketplace') await createMarketplaceOrder(db, { userId: req.userId, product: item.product, paymentId, provider: 'tribute', externalId: String(productId), amount, currency: item.currency })

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
  if (item.kind === 'marketplace') await createMarketplaceOrder(db, { userId: req.userId, product: item.product, paymentId, provider: 'stripe', externalId: session.id, amount, currency: item.currency })
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
  if (item.kind === 'marketplace') await createMarketplaceOrder(db, { userId: req.userId, product: item.product, paymentId: orderId, provider: 'liqpay', externalId: orderId, amount, currency: item.currency })
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

router.post('/demo', requireUser, async (req, res) => {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_PURCHASES !== 'true') {
    return res.status(404).json({ error: 'Not found' })
  }
  const db = getDb()
  const { courseId, promoCode } = req.body
  if (!courseId) return res.status(400).json({ error: 'courseId required' })
  const item = await resolveCheckoutItem(db, courseId, req.userEmail)
  if (item.kind === 'marketplace') {
    return res.status(403).json({ error: 'Demo checkout is not available for Marketplace products' })
  }
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
