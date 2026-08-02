import { Router } from 'express'
import { getDb } from '../db.js'
import { constructWebhookEvent } from '../services/stripe.js'
import { verifyCallback } from '../services/liqpay.js'
import {
  verifyTributeSignature,
  getCourseIdForProduct,
} from '../services/tribute.js'
import { grantAccess, logWebhookEvent } from '../services/access.js'
import { config } from '../config.js'

const router = Router()

export { grantAccess }

export async function handleStripeWebhook(req, res) {
  try {
    const event = constructWebhookEvent(req.body, req.headers['stripe-signature'])
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const { userId, courseId, courseTitle, commerceType, licenseTier, paymentId } = session.metadata || {}
      if (commerceType === 'marketplace') {
        const payment = await getDb().get(
          `SELECT p.*, c.license_tier, c.quoted_amount_eur
           FROM payments p JOIN checkout_contexts c ON c.payment_id = p.id
           WHERE p.id = ? AND p.external_id = ?`,
          [paymentId, session.id]
        )
        if (!payment || Math.round(Number(payment.quoted_amount_eur) * 100) !== Number(session.amount_total)) {
          throw new Error('Marketplace checkout amount or identity mismatch')
        }
      }
      await grantAccess({
        userId: Number(userId),
        email: session.customer_email,
        courseId,
        courseTitle,
        amount: (session.amount_total || 0) / 100,
        provider: 'stripe',
        externalId: session.id,
        licenseTier: licenseTier || 'personal',
      })
      await logWebhookEvent({ provider: 'stripe', eventName: event.type, status: 'ok', payload: { courseId } })
    }
    res.json({ received: true })
  } catch (err) {
    console.error('[stripe webhook]', err.message)
    await logWebhookEvent({ provider: 'stripe', eventName: 'error', status: 'error', payload: { message: err.message } })
    res.status(400).send(`Webhook Error: ${err.message}`)
  }
}

router.post('/liqpay', async (req, res) => {
  const decoded = verifyCallback(req.body.data, req.body.signature)
  if (!decoded) return res.status(400).send('Invalid signature')
  if (decoded.status === 'success' || decoded.status === 'sandbox') {
    const payment = await getDb().get(
      `SELECT p.*, c.license_tier, c.quoted_amount_eur FROM payments p
       LEFT JOIN checkout_contexts c ON c.payment_id = p.id
       WHERE p.external_id = ? OR p.id = ?`,
      [decoded.order_id, decoded.order_id]
    )
    if (payment) {
      if (payment.quoted_amount_eur != null && Number(payment.quoted_amount_eur) !== Number(decoded.amount)) {
        return res.status(400).send('Amount mismatch')
      }
      await grantAccess({
        userId: payment.user_id,
        email: payment.email,
        courseId: payment.course_id,
        courseTitle: payment.course_title,
        amount: payment.amount,
        provider: 'liqpay',
        externalId: decoded.order_id,
        licenseTier: payment.license_tier || 'personal',
      })
      await logWebhookEvent({ provider: 'liqpay', eventName: decoded.status, status: 'ok', payload: { orderId: decoded.order_id } })
    }
  }
  res.json({ ok: true })
})

export async function handleTributeWebhook(req, res) {
  const rawBody = req.body
  const signature = req.headers['trbt-signature']
  const skipVerify = config.tribute.webhookSkipVerify && process.env.NODE_ENV !== 'production'

  if (!skipVerify && !verifyTributeSignature(rawBody, signature)) {
    await logWebhookEvent({ provider: 'tribute', eventName: 'auth_failed', status: 'error', payload: {} })
    return res.status(401).send('Invalid signature')
  }

  let event
  try {
    event = JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody)
  } catch {
    return res.status(400).send('Invalid JSON')
  }

  const db = getDb()
  const name = event.name || event.event || 'unknown'
  const payload = event.payload || event.data || {}

  try {
    let result = null

    if (name === 'new_digital_product' || name === 'newDigitalProduct' || name === 'digital_product_purchase') {
      const productId = payload.product_id ?? payload.productId ?? payload.id
      let courseId = getCourseIdForProduct(productId)
      let userId = null
      let email = payload.email || payload.buyer_email || null
      let courseTitle = payload.product_name || payload.name || courseId
      let amount = payload.amount ? (payload.amount > 1000 ? payload.amount / 100 : payload.amount) : null

      const pendingByProduct = await db.get(
        `SELECT p.user_id, p.email, p.course_id, p.course_title, p.amount, c.license_tier
         FROM payments p LEFT JOIN checkout_contexts c ON c.payment_id = p.id
         WHERE p.external_id = ? AND p.provider = 'tribute' AND p.status = 'pending'
         ORDER BY p.created_at DESC LIMIT 1`,
        [String(productId)]
      )
      if (pendingByProduct) {
        userId = pendingByProduct.user_id
        email = email || pendingByProduct.email
        courseId = pendingByProduct.course_id || courseId
        courseTitle = pendingByProduct.course_title || courseTitle
        amount = pendingByProduct.amount ?? amount
      }

      const tgId = String(payload.telegram_user_id ?? payload.telegramUserId ?? '')
      if (tgId) {
        const user = await db.get('SELECT id, email FROM users WHERE telegram_chat_id = ?', [tgId])
        if (user) {
          userId = user.id
          email = email || user.email
        }
      }

      if (!userId && courseId) {
        const pending = await db.get(
          `SELECT user_id, email, course_title, amount FROM payments
           WHERE course_id = ? AND provider = 'tribute' AND status = 'pending'
           ORDER BY created_at DESC LIMIT 1`,
          [courseId]
        )
        if (pending) {
          userId = pending.user_id
          email = email || pending.email
          amount = amount ?? pending.amount
        }
      }

      if (!courseId && config.tribute.defaultProductId && String(productId) === String(config.tribute.defaultProductId)) {
        const latestPending = await db.get(
          `SELECT user_id, email, course_id, course_title, amount FROM payments
           WHERE provider = 'tribute' AND status = 'pending' ORDER BY created_at DESC LIMIT 1`
        )
        if (latestPending) {
          userId = latestPending.user_id
          email = email || latestPending.email
          courseId = latestPending.course_id
          courseTitle = latestPending.course_title || courseTitle
          amount = latestPending.amount ?? amount
        }
      }

      result = await grantAccess({
        userId,
        email,
        courseId,
        courseTitle,
        amount,
        provider: 'tribute',
        externalId: String(payload.transaction_id || payload.purchase_id || payload.order_id || `product-${productId}`),
        licenseTier: pendingByProduct?.license_tier || 'personal',
      })
    }

    const shopEvents = ['shopOrderPaymentReceived', 'shopOrderChargeSuccess', 'shopOrder', 'order_paid']
    if (shopEvents.includes(name)) {
      const orderUuid = payload.uuid || payload.orderUuid || payload.order_id
      const payment = orderUuid
        ? await db.get(
          `SELECT p.*, c.license_tier, c.quoted_amount_eur FROM payments p
           LEFT JOIN checkout_contexts c ON c.payment_id = p.id
           WHERE p.external_id = ? AND p.provider = ?`,
          [orderUuid, 'tribute']
        )
        : null

      const customerId = payload.customerId || payload.customer_id
      const userId = payment?.user_id || (customerId ? Number(customerId) : null)
      const email = payment?.email || payload.email
      const courseId = payment?.course_id
      const status = payload.status || name

      if (courseId && (userId || email) && (status === 'paid' || name.includes('PaymentReceived') || name.includes('ChargeSuccess') || name === 'order_paid')) {
        result = await grantAccess({
          userId,
          email,
          courseId,
          courseTitle: payment?.course_title,
          amount: payment?.amount,
          provider: 'tribute',
          externalId: orderUuid,
          licenseTier: payment?.license_tier || 'personal',
        })
      }
    }

    await logWebhookEvent({
      provider: 'tribute',
      eventName: name,
      status: result?.ok ? 'ok' : 'processed',
      payload: { courseId: result?.courseId, userId: result?.userId, productId: payload.product_id },
    })

    res.json({ ok: true, granted: result?.ok || false })
  } catch (err) {
    console.error('[tribute webhook]', err)
    await logWebhookEvent({ provider: 'tribute', eventName: name, status: 'error', payload: { message: err.message } })
    res.status(500).json({ error: err.message })
  }
}

export default router
