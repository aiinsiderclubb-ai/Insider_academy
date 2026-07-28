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

const router = Router()
const LOCALES = new Set(['ru', 'ukr', 'en'])

function publicUrl(locale, path) {
  const safeLocale = LOCALES.has(locale) ? locale : 'ru'
  return `${config.appUrl.replace(/\/$/, '')}/${safeLocale}${path.startsWith('/') ? path : `/${path}`}`
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

router.post('/tribute/checkout', requireUser, prelaunchBlocked, async (req, res) => {
  if (!isTributeEnabled()) {
    return res.status(503).json({ error: 'Tribute not configured. Set TRIBUTE_API_KEY in server/.env' })
  }

  const db = getDb()
  const { courseId, courseTitle, amount, slug, locale } = req.body
  if (!courseId) return res.status(400).json({ error: 'courseId required' })

  const paymentId = `trib-${Date.now()}`
  const successUrl = publicUrl(locale, `/courses/${slug || courseId}?paid=1&provider=tribute`)
  const failUrl = publicUrl(locale, `/courses/${slug || courseId}/buy?cancel=1`)
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
        `INSERT INTO payments (id, user_id, email, course_id, course_title, amount, provider, external_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'tribute', ?, 'pending', ?)`,
        [paymentId, req.userId, req.userEmail, courseId, courseTitle, amount, order.uuid, new Date().toISOString()]
      )

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
      `INSERT INTO payments (id, user_id, email, course_id, course_title, amount, provider, external_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'tribute', ?, 'pending', ?)`,
      [paymentId, req.userId, req.userEmail, courseId, courseTitle, amount, String(productId), new Date().toISOString()]
    )

    return res.json({ url: payUrl, mode: 'product', productId })
  } catch (err) {
    console.error('[tribute checkout]', err.message)
    res.status(502).json({ error: err.message })
  }
})

router.post('/stripe/checkout', requireUser, prelaunchBlocked, async (req, res) => {
  if (!isStripeEnabled()) return res.status(503).json({ error: 'Stripe not configured' })
  const db = getDb()
  const { courseId, amount, courseTitle } = req.body
  const paymentId = `pay-${Date.now()}`
  await db.run(
    `INSERT INTO payments (id, user_id, email, course_id, course_title, amount, provider, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'stripe', 'pending', ?)`,
    [paymentId, req.userId, req.userEmail, courseId, courseTitle, amount, new Date().toISOString()]
  )
  const session = await createCheckoutSession({
    userId: req.userId,
    email: req.userEmail,
    courseId,
    courseTitle,
    amountEur: amount,
    successUrl: publicUrl(req.body.locale, `/courses/${req.body.slug || courseId}?paid=1`),
    cancelUrl: publicUrl(req.body.locale, `/courses/${req.body.slug || courseId}/buy?cancel=1`),
  })
  await db.run('UPDATE payments SET external_id = ? WHERE id = ?', [session.id, paymentId])
  res.json({ url: session.url, sessionId: session.id })
})

router.post('/liqpay/create', requireUser, prelaunchBlocked, async (req, res) => {
  if (!isLiqPayEnabled()) return res.status(503).json({ error: 'LiqPay not configured' })
  const db = getDb()
  const { courseId, amount, courseTitle, slug, locale } = req.body
  const orderId = `lp-${Date.now()}`
  await db.run(
    `INSERT INTO payments (id, user_id, email, course_id, course_title, amount, provider, external_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'liqpay', ?, 'pending', ?)`,
    [orderId, req.userId, req.userEmail, courseId, courseTitle, amount, orderId, new Date().toISOString()]
  )
  const payload = createPaymentPayload({
    amount,
    description: courseTitle,
    orderId,
    resultUrl: publicUrl(locale, `/courses/${slug || courseId}?paid=1`),
    serverUrl: `${(process.env.API_PUBLIC_URL || config.appUrl.replace('5173', '3001'))}/api/webhooks/liqpay`,
  })
  res.json(payload)
})

router.post('/demo', requireUser, prelaunchBlocked, async (req, res) => {
  // Демо-оплата бесплатно выдаёт курс — в проде только по явному флагу.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_PURCHASE !== '1') {
    return res.status(403).json({
      error: 'Demo purchase disabled in production',
      errorRu: 'Тестовая оплата отключена. Выберите другой способ оплаты.',
    })
  }
  const db = getDb()
  const { courseId, courseTitle, amount, promoCode } = req.body
  let finalAmount = Number(amount) || 0
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
