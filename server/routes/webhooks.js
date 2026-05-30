import { Router } from 'express'
import { getDb } from '../db.js'
import { constructWebhookEvent } from '../services/stripe.js'
import { verifyCallback } from '../services/liqpay.js'

const router = Router()

async function grantAccess({ userId, email, courseId, courseTitle, amount, provider, externalId }) {
  const db = getDb()
  const exists = await db.get('SELECT id FROM purchases WHERE user_id = ? AND course_id = ?', [userId, courseId])
  if (!exists && userId) {
    await db.run(
      'INSERT INTO purchases (user_id, course_id, payment_provider, payment_id) VALUES (?, ?, ?, ?)',
      [userId, courseId, provider, externalId]
    )
  }
  await db.run(
    'INSERT INTO purchase_log (id, email, course_id, course_title, amount, date) VALUES (?, ?, ?, ?, ?, ?)',
    [`purchase-${Date.now()}`, email, courseId, courseTitle, amount, new Date().toISOString()]
  )
  await db.run(
    `UPDATE payments SET status = 'completed', completed_at = ? WHERE external_id = ? OR id = ?`,
    [new Date().toISOString(), externalId, externalId]
  )
}

export async function handleStripeWebhook(req, res) {
  try {
    const event = constructWebhookEvent(req.body, req.headers['stripe-signature'])
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const { userId, courseId, courseTitle } = session.metadata || {}
      await grantAccess({
        userId: Number(userId),
        email: session.customer_email,
        courseId,
        courseTitle,
        amount: (session.amount_total || 0) / 100,
        provider: 'stripe',
        externalId: session.id,
      })
    }
    res.json({ received: true })
  } catch (err) {
    console.error('[stripe webhook]', err.message)
    res.status(400).send(`Webhook Error: ${err.message}`)
  }
}

router.post('/liqpay', async (req, res) => {
  const decoded = verifyCallback(req.body.data, req.body.signature)
  if (!decoded) return res.status(400).send('Invalid signature')
  if (decoded.status === 'success' || decoded.status === 'sandbox') {
    const payment = await getDb().get('SELECT * FROM payments WHERE external_id = ? OR id = ?', [decoded.order_id, decoded.order_id])
    if (payment) {
      await grantAccess({
        userId: payment.user_id,
        email: payment.email,
        courseId: payment.course_id,
        courseTitle: payment.course_title,
        amount: payment.amount,
        provider: 'liqpay',
        externalId: decoded.order_id,
      })
    }
  }
  res.json({ ok: true })
})

export default router
