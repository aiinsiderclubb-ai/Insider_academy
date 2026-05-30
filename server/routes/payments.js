import { Router } from 'express'
import { getDb, parseJson } from '../db.js'
import { requireUser } from '../middleware/auth.js'
import { config, isStripeEnabled, isLiqPayEnabled } from '../config.js'
import { createCheckoutSession } from '../services/stripe.js'
import { createPaymentPayload } from '../services/liqpay.js'

const router = Router()

router.post('/stripe/checkout', requireUser, async (req, res) => {
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
    successUrl: `${config.appUrl}/courses/${req.body.slug || courseId}?paid=1`,
    cancelUrl: `${config.appUrl}/courses/${req.body.slug || courseId}/buy?cancel=1`,
  })
  await db.run('UPDATE payments SET external_id = ? WHERE id = ?', [session.id, paymentId])
  res.json({ url: session.url, sessionId: session.id })
})

router.post('/liqpay/create', requireUser, async (req, res) => {
  if (!isLiqPayEnabled()) return res.status(503).json({ error: 'LiqPay not configured' })
  const db = getDb()
  const { courseId, amount, courseTitle, slug } = req.body
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
    resultUrl: `${config.appUrl}/courses/${slug || courseId}?paid=1`,
    serverUrl: `${config.appUrl.replace('5173', '3001')}/api/webhooks/liqpay`,
  })
  res.json(payload)
})

router.post('/demo', requireUser, async (req, res) => {
  const db = getDb()
  const { courseId, courseTitle, amount } = req.body
  const exists = await db.get('SELECT id FROM purchases WHERE user_id = ? AND course_id = ?', [req.userId, courseId])
  if (!exists) {
    await db.run('INSERT INTO purchases (user_id, course_id, payment_provider) VALUES (?, ?, ?)', [req.userId, courseId, 'demo'])
    await db.run(
      'INSERT INTO purchase_log (id, email, course_id, course_title, amount, date) VALUES (?, ?, ?, ?, ?, ?)',
      [`purchase-${Date.now()}`, req.userEmail, courseId, courseTitle, amount, new Date().toISOString()]
    )
  }
  const purchases = await db.all(
    'SELECT course_id AS id, purchased_at AS purchasedAt FROM purchases WHERE user_id = ?', [req.userId]
  )
  res.json({ purchases })
})

export default router
