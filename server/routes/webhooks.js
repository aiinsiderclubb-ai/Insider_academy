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

      // Strict match only: pending payment created for this exact product.
      // (Previously matched ANY pending tribute payment — could grant access
      // to the wrong user when two purchases were in flight.)
      const pendingByProduct = await db.get(
        `SELECT user_id, email, course_id, course_title, amount FROM payments
         WHERE external_id = ? AND provider = 'tribute' AND status = 'pending'
         ORDER BY created_at DESC LIMIT 1`,
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

      // Fallback by courseId: only when the buyer email matches the pending
      // payment (or webhook carries no email at all AND there is exactly one
      // recent pending payment for this course — unambiguous).
      if (!userId && courseId) {
        const windowStart = new Date(Date.now() - 2 * 3600_000).toISOString()
        if (email) {
          const pending = await db.get(
            `SELECT user_id, email, course_title, amount FROM payments
             WHERE course_id = ? AND provider = 'tribute' AND status = 'pending'
               AND email = ? COLLATE NOCASE AND created_at >= ?
             ORDER BY created_at DESC LIMIT 1`,
            [courseId, email, windowStart]
          )
          if (pending) {
            userId = pending.user_id
            amount = amount ?? pending.amount
          }
        } else {
          const candidates = await db.all(
            `SELECT user_id, email, course_title, amount FROM payments
             WHERE course_id = ? AND provider = 'tribute' AND status = 'pending'
               AND created_at >= ?
             ORDER BY created_at DESC LIMIT 2`,
            [courseId, windowStart]
          )
          if (candidates.length === 1) {
            userId = candidates[0].user_id
            email = candidates[0].email
            amount = amount ?? candidates[0].amount
          } else if (candidates.length > 1) {
            console.warn('[tribute webhook] ambiguous pending payments for course, skipping auto-grant:', courseId)
          }
        }
      }

      if (!courseId && config.tribute.defaultProductId && String(productId) === String(config.tribute.defaultProductId)) {
        // Default-product fallback: grant only when unambiguous (exactly one
        // recent pending payment). Never guess between concurrent buyers.
        const windowStart = new Date(Date.now() - 2 * 3600_000).toISOString()
        const candidates = await db.all(
          `SELECT user_id, email, course_id, course_title, amount FROM payments
           WHERE provider = 'tribute' AND status = 'pending' AND created_at >= ?
           ORDER BY created_at DESC LIMIT 2`,
          [windowStart]
        )
        const match = email
          ? candidates.find((c) => String(c.email || '').toLowerCase() === String(email).toLowerCase())
          : (candidates.length === 1 ? candidates[0] : null)
        if (match) {
          userId = match.user_id
          email = email || match.email
          courseId = match.course_id
          courseTitle = match.course_title || courseTitle
          amount = match.amount ?? amount
        } else if (candidates.length > 1) {
          console.warn('[tribute webhook] ambiguous default-product payment, skipping auto-grant (manual review needed)')
        }
      }

      result = await grantAccess({
        userId,
        email,
        courseId,
        courseTitle,
        amount,
        provider: 'tribute',
        externalId: `product-${productId}-${Date.now()}`,
      })
    }

    const shopEvents = ['shopOrderPaymentReceived', 'shopOrderChargeSuccess', 'shopOrder', 'order_paid']
    if (shopEvents.includes(name)) {
      const orderUuid = payload.uuid || payload.orderUuid || payload.order_id
      const payment = orderUuid
        ? await db.get('SELECT * FROM payments WHERE external_id = ? AND provider = ?', [orderUuid, 'tribute'])
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
