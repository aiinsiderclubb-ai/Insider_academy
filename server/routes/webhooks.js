import { Router } from 'express'
import { getDb } from '../db.js'
import { constructWebhookEvent } from '../services/stripe.js'
import { verifyCallback } from '../services/liqpay.js'
import { verifyTributeSignature } from '../services/tribute.js'
import { logWebhookEvent } from '../services/access.js'
import { reconcilePaidPayment } from '../services/paymentFulfillment.js'
import { config } from '../config.js'
import { marketplaceWebhookAllowed } from '../middleware/prelaunch.js'
import { revokeMarketplaceEntitlements } from '../services/marketplace.js'

const router = Router()

function moneyFromPayload(value, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return Number(fallback)
  return number > 1000 ? number / 100 : number
}

async function reconcile(payment, overrides = {}) {
  return reconcilePaidPayment({
    payment,
    provider: payment.provider,
    externalId: payment.external_id,
    userId: payment.user_id,
    productId: payment.course_id,
    amount: payment.amount,
    currency: payment.currency || 'EUR',
    ...overrides,
  })
}

async function revokePaymentAccess(db, payment, reason) {
  if (!payment) return 0
  return db.transaction(async (tx) => {
    const modern = await revokeMarketplaceEntitlements(tx, { sourceId: payment.id, reason })
    const legacy = await tx.run(
      `UPDATE asset_entitlements SET status = 'revoked', expires_at = ?
       WHERE order_id IN (SELECT id FROM marketplace_orders WHERE payment_id = ?) AND status = 'active'`,
      [new Date().toISOString(), payment.id]
    )
    await tx.run("UPDATE marketplace_orders SET status = 'refunded' WHERE payment_id = ? AND status = 'completed'", [payment.id])
    await tx.run("UPDATE payments SET status = 'refunded' WHERE id = ? AND status = 'completed'", [payment.id])
    return modern + Number(legacy?.changes ?? legacy?.rowCount ?? 0)
  })
}

export async function handleStripeWebhook(req, res) {
  try {
    const event = constructWebhookEvent(req.body, req.headers['stripe-signature'])
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const payment = await getDb().get(
        "SELECT * FROM payments WHERE provider = 'stripe' AND external_id = ? LIMIT 1",
        [session.id]
      )
      const result = await reconcile(payment, {
        provider: 'stripe',
        externalId: session.id,
        userId: Number(session.metadata?.userId),
        productId: session.metadata?.courseId,
        amount: Number(session.amount_total || 0) / 100,
        currency: String(session.currency || '').toUpperCase(),
      })
      if (payment && session.payment_intent) {
        await getDb().run('UPDATE checkout_contexts SET provider_reference = ? WHERE payment_id = ?', [String(session.payment_intent), payment.id])
      }
      await logWebhookEvent({ provider: 'stripe', eventName: event.type, status: 'ok', payload: { courseId: result.courseId } })
    } else if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
      const charge = event.data.object
      const providerReference = String(charge.payment_intent || '')
      const context = providerReference
        ? await getDb().get('SELECT * FROM checkout_contexts WHERE provider_reference = ? LIMIT 1', [providerReference])
        : null
      if (context) {
        const payment = await getDb().get('SELECT * FROM payments WHERE id = ? LIMIT 1', [context.payment_id])
        await revokePaymentAccess(getDb(), payment, event.type)
      }
      await logWebhookEvent({ provider: 'stripe', eventName: event.type, status: context ? 'ok' : 'ignored', payload: { paymentId: context?.payment_id } })
    }
    res.json({ received: true })
  } catch (err) {
    console.error('[stripe webhook]', err.message)
    await logWebhookEvent({ provider: 'stripe', eventName: 'error', status: 'error', payload: { message: err.message } })
    res.status(err.status || 400).send(`Webhook Error: ${err.message}`)
  }
}

router.post('/liqpay', marketplaceWebhookAllowed, async (req, res) => {
  const decoded = verifyCallback(req.body.data, req.body.signature)
  if (!decoded) return res.status(400).send('Invalid signature')
  const successful = decoded.status === 'success'
    || (decoded.status === 'sandbox' && process.env.NODE_ENV !== 'production')
  if (!successful) {
    if (['reversed', 'refund', 'chargeback'].includes(decoded.status)) {
      const payment = await getDb().get("SELECT * FROM payments WHERE provider = 'liqpay' AND external_id = ? LIMIT 1", [decoded.order_id])
      if (payment) {
        await revokePaymentAccess(getDb(), payment, `liqpay:${decoded.status}`)
      }
    }
    return res.json({ ok: true })
  }

  try {
    const payment = await getDb().get(
      "SELECT * FROM payments WHERE provider = 'liqpay' AND external_id = ? LIMIT 1",
      [decoded.order_id]
    )
    const result = await reconcile(payment, {
      provider: 'liqpay',
      externalId: decoded.order_id,
      userId: payment?.user_id,
      productId: payment?.course_id,
      amount: decoded.amount,
      currency: decoded.currency,
    })
    await logWebhookEvent({ provider: 'liqpay', eventName: decoded.status, status: 'ok', payload: { orderId: decoded.order_id, courseId: result.courseId } })
    res.json({ ok: true })
  } catch (err) {
    await logWebhookEvent({ provider: 'liqpay', eventName: decoded.status, status: 'error', payload: { orderId: decoded.order_id, message: err.message } })
    res.status(err.status || 400).json({ error: err.message })
  }
})

async function findTributeDigitalPayment(db, payload) {
  const productId = String(payload.product_id ?? payload.productId ?? payload.id ?? '')
  if (!productId) return null
  const candidates = await db.all(
    `SELECT * FROM payments
     WHERE provider = 'tribute' AND external_id = ? AND status IN ('pending', 'completed')
     ORDER BY created_at DESC LIMIT 3`,
    [productId]
  )
  if (candidates.length === 1) return candidates[0]
  const email = String(payload.email || payload.buyer_email || '').trim().toLowerCase()
  if (!email) return null
  const matches = candidates.filter((item) => String(item.email || '').trim().toLowerCase() === email)
  return matches.length === 1 ? matches[0] : null
}

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
    let payment = null
    const shopEvents = ['shopOrderPaymentReceived', 'shopOrderChargeSuccess']
    const digitalEvents = ['new_digital_product', 'newDigitalProduct', 'digital_product_purchase']
    const reversalEvents = ['shopOrderRefunded', 'shopOrderChargeback', 'shopOrderCancelled', 'order_refunded', 'chargeback']
    const paymentState = String(payload.payment_status || payload.paymentStatus || payload.status || '').toLowerCase()
    const paidStates = ['paid', 'success', 'succeeded', 'captured', 'completed']

    if (reversalEvents.includes(name)) {
      const orderUuid = payload.uuid || payload.orderUuid || payload.order_id
      payment = orderUuid
        ? await db.get("SELECT * FROM payments WHERE provider = 'tribute' AND external_id = ? LIMIT 1", [orderUuid])
        : await findTributeDigitalPayment(db, payload)
      const revoked = await revokePaymentAccess(db, payment, `tribute:${name}`)
      await logWebhookEvent({ provider: 'tribute', eventName: name, status: payment ? 'ok' : 'ignored', payload: { paymentId: payment?.id, revoked } })
      return res.status(payment ? 200 : 202).json({ ok: true, revoked })
    }

    if (shopEvents.includes(name)) {
      if (!paidStates.includes(paymentState)) {
        await logWebhookEvent({ provider: 'tribute', eventName: name, status: 'ignored', payload: { reason: 'payment_not_settled' } })
        return res.status(202).json({ ok: true, granted: false })
      }
      const orderUuid = payload.uuid || payload.orderUuid || payload.order_id
      payment = orderUuid
        ? await db.get("SELECT * FROM payments WHERE provider = 'tribute' AND external_id = ? LIMIT 1", [orderUuid])
        : null
    } else if (digitalEvents.includes(name)) {
      if (!paidStates.includes(paymentState)) {
        await logWebhookEvent({ provider: 'tribute', eventName: name, status: 'ignored', payload: { reason: 'payment_not_settled' } })
        return res.status(202).json({ ok: true, granted: false })
      }
      payment = await findTributeDigitalPayment(db, payload)
    }

    if (!payment) {
      await logWebhookEvent({ provider: 'tribute', eventName: name, status: 'ignored', payload: { reason: 'payment_not_unique_or_missing' } })
      return res.status(202).json({ ok: true, granted: false, reviewRequired: true })
    }

    const result = await reconcile(payment, {
      provider: 'tribute',
      externalId: payment.external_id,
      userId: payment.user_id,
      productId: payment.course_id,
      amount: moneyFromPayload(payload.amount, payment.amount),
      currency: String(payload.currency || payment.currency || 'EUR').toUpperCase(),
    })

    await logWebhookEvent({
      provider: 'tribute',
      eventName: name,
      status: 'ok',
      payload: { courseId: result.courseId, userId: result.userId, marketplace: result.marketplace || false },
    })
    res.json({ ok: true, granted: result.ok })
  } catch (err) {
    console.error('[tribute webhook]', err)
    await logWebhookEvent({ provider: 'tribute', eventName: name, status: 'error', payload: { message: err.message } })
    res.status(err.status || 500).json({ error: err.message })
  }
}

export default router
