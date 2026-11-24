import { Router } from 'express'
import { getDb } from '../db.js'
import { constructWebhookEvent } from '../services/stripe.js'
import { paidAmount, verifyPaddleSignature } from '../services/paddle.js'
import { verifyCallback } from '../services/liqpay.js'
import { getGumroadSale, parsePing, tierFromVariants, verifyGumroadSignature } from '../services/gumroad.js'
import { quoteMarketplaceItem } from '../services/marketplace.js'
import { courses as courseCatalog } from '../../src/data/courses.js'
import { VAULT_PRODUCTS } from '../../src/data/vaultProducts.js'
import { COURSE_BUNDLES } from '../../src/data/coursePacks.js'
import { verifyTributeSignature } from '../services/tribute.js'
import { logWebhookEvent } from '../services/access.js'
import { reconcilePaidPayment } from '../services/paymentFulfillment.js'
import { config } from '../config.js'
import { marketplaceWebhookAllowed } from '../middleware/prelaunch.js'
import { revokeMarketplaceEntitlements } from '../services/marketplace.js'
import { cancelPaymentRewards } from '../services/rewards.js'
import { alertRefund, alertUnclaimedSale, alertWebhookProblem } from '../services/adminAlerts.js'

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

export async function revokePaymentAccess(db, payment, reason) {
  if (!payment) return 0
  const wasPaid = ['completed', 'unclaimed'].includes(payment.status)
  const revoked = await revokeAccess(db, payment, reason)
  if (wasPaid) alertRefund(payment, reason)
  return revoked
}

async function revokeAccess(db, payment, reason) {
  // Codes this payment earned (next purchase, the inviter's reward) go with it.
  await cancelPaymentRewards(db, payment.id).catch((err) => console.warn('[rewards] not cancelled:', err.message))
  return db.transaction(async (tx) => {
    let modern = await revokeMarketplaceEntitlements(tx, { sourceId: payment.id, reason })
    // Grants made through grantAccess (a vault's products, a pack's bonuses) carry
    // the provider's reference rather than our payment id.
    if (payment.external_id) {
      modern += await revokeMarketplaceEntitlements(tx, { sourceId: `${payment.provider}:${payment.external_id}`, reason })
    }
    const legacy = await tx.run(
      `UPDATE asset_entitlements SET status = 'revoked', expires_at = ?
       WHERE order_id IN (SELECT id FROM marketplace_orders WHERE payment_id = ?) AND status = 'active'`,
      [new Date().toISOString(), payment.id]
    )
    await tx.run("UPDATE marketplace_orders SET status = 'refunded' WHERE payment_id = ? AND status = 'completed'", [payment.id])
    // A refunded course closes again — every course the payment opened, a pack's
    // included — since each purchase row carries the provider's transaction id.
    const course = payment.external_id
      ? await tx.run('DELETE FROM purchases WHERE user_id = ? AND payment_id = ?', [payment.user_id, payment.external_id])
      : null
    await tx.run("UPDATE payments SET status = 'refunded' WHERE id = ? AND status = 'completed'", [payment.id])
    return modern + Number(legacy?.changes ?? legacy?.rowCount ?? 0) + Number(course?.changes ?? course?.rowCount ?? 0)
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

/**
 * Paddle notifications. `transaction.completed` grants access once Paddle has
 * the money; an approved full refund or a chargeback takes it back. Paddle
 * retries until it gets a 2xx, and reconciliation is idempotent, so a repeat
 * delivery changes nothing.
 */
export async function handlePaddleWebhook(req, res) {
  const rawBody = req.body
  if (!verifyPaddleSignature(rawBody, req.headers['paddle-signature'])) {
    await logWebhookEvent({ provider: 'paddle', eventName: 'auth_failed', status: 'error', payload: {} })
    alertWebhookProblem('paddle', 'auth_failed')
    return res.status(401).send('Invalid signature')
  }
  let event
  try {
    event = JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody)
  } catch {
    return res.status(400).send('Invalid JSON')
  }
  const db = getDb()
  const type = event.event_type || 'unknown'
  const data = event.data || {}
  try {
    if (type === 'transaction.completed') {
      const payment = await db.get("SELECT * FROM payments WHERE provider = 'paddle' AND external_id = ? LIMIT 1", [data.id])
      if (!payment) {
        await logWebhookEvent({ provider: 'paddle', eventName: type, status: 'ignored', payload: { transactionId: data.id } })
        return res.status(200).json({ ok: true, ignored: true })
      }
      const result = await reconcile(payment, {
        provider: 'paddle',
        externalId: data.id,
        userId: Number(data.custom_data?.user_id ?? payment.user_id),
        productId: data.custom_data?.item_id ?? payment.course_id,
        amount: paidAmount(data),
        currency: String(data.currency_code || '').toUpperCase(),
      })
      await db.run('UPDATE checkout_contexts SET provider_reference = ? WHERE payment_id = ?', [data.id, payment.id])
      await logWebhookEvent({ provider: 'paddle', eventName: type, status: 'ok', payload: { paymentId: payment.id, courseId: result.courseId } })
      return res.json({ ok: true })
    }
    if (type === 'adjustment.created' || type === 'adjustment.updated') {
      const reverses = (data.action === 'refund' && data.type === 'full') || data.action === 'chargeback' || data.action === 'chargeback_warning'
      if (!reverses || data.status !== 'approved') {
        await logWebhookEvent({ provider: 'paddle', eventName: type, status: 'ignored', payload: { action: data.action, status: data.status } })
        return res.json({ ok: true, ignored: true })
      }
      const payment = await db.get("SELECT * FROM payments WHERE provider = 'paddle' AND external_id = ? LIMIT 1", [data.transaction_id])
      const revoked = await revokePaymentAccess(db, payment, `paddle:${data.action}`)
      await logWebhookEvent({ provider: 'paddle', eventName: type, status: payment ? 'ok' : 'ignored', payload: { paymentId: payment?.id, revoked } })
      return res.json({ ok: true, revoked })
    }
    await logWebhookEvent({ provider: 'paddle', eventName: type, status: 'ignored', payload: {} })
    res.json({ ok: true, ignored: true })
  } catch (err) {
    console.error('[paddle webhook]', err.message)
    if (err.status !== 409) alertWebhookProblem('paddle', 'error', err.message)
    await logWebhookEvent({ provider: 'paddle', eventName: type, status: 'error', payload: { message: err.message } })
    res.status(err.status === 409 ? 409 : 500).json({ error: err.message })
  }
}

/* -------------------------------- Gumroad --------------------------------- */

const GUMROAD_CATALOG = [...courseCatalog, ...VAULT_PRODUCTS, ...COURSE_BUNDLES]

/**
 * A sale Gumroad made without our checkout — straight from the storefront —
 * is matched to an account by the buyer's email, at the price Gumroad charged.
 */
async function adoptGumroadSale(db, ping, saleId) {
  const itemId = ping.product_permalink
  const user = await db.get('SELECT id, email FROM users WHERE lower(email) = lower(?) LIMIT 1', [ping.email || ''])
  const course = GUMROAD_CATALOG.find((entry) => entry.id === itemId)
  let store = null
  if (!course) {
    try {
      store = quoteMarketplaceItem({ productId: itemId, licenseTier: tierFromVariants(ping.variants) || 'personal', enforceRelease: false })
    } catch {
      store = null
    }
  }
  if (!course && !store) return null
  const amount = store ? store.amountEur : Number(course.priceEur ?? course.price)
  const paymentId = `gr-${saleId}`
  const exists = await db.get('SELECT * FROM payments WHERE id = ? LIMIT 1', [paymentId])
  if (exists) return exists
  await db.run(
    `INSERT INTO payments (id, user_id, email, course_id, course_title, amount, currency, provider, external_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'EUR', 'gumroad', ?, ?, ?)`,
    [paymentId, user?.id ?? null, ping.email || null, itemId, store?.title || course?.title || itemId, amount, saleId, user ? 'pending' : 'unclaimed', new Date().toISOString()]
  )
  if (store) {
    await db.run(
      `INSERT INTO checkout_contexts (payment_id, product_id, license_tier, quoted_amount_eur, legal_snapshot, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [paymentId, store.productId, store.licenseTier, store.amountEur, JSON.stringify(store.legalSnapshot), new Date().toISOString()]
    )
  }
  return db.get('SELECT * FROM payments WHERE id = ? LIMIT 1', [paymentId])
}

export async function handleGumroadPing(req, res) {
  const rawBody = req.body
  if (!verifyGumroadSignature(rawBody, req.headers['x-gumroad-signature'])) {
    await logWebhookEvent({ provider: 'gumroad', eventName: 'auth_failed', status: 'error', payload: {} })
    alertWebhookProblem('gumroad', 'auth_failed')
    // 2xx would drop nothing we trust; a 4xx is not retried by Gumroad.
    return res.status(401).send('Invalid signature')
  }
  const ping = parsePing(rawBody)
  const db = getDb()
  const kind = ping.resource_name || 'sale'
  const saleId = ping.sale_id
  try {
    if (!saleId) return res.status(400).send('No sale_id')
    if (String(ping.test) === 'true' && process.env.NODE_ENV === 'production') {
      await logWebhookEvent({ provider: 'gumroad', eventName: `${kind}:test`, status: 'ignored', payload: { saleId } })
      return res.json({ ok: true, ignored: true })
    }

    if (kind === 'refund' || kind === 'dispute') {
      const payment = await db.get("SELECT * FROM payments WHERE provider = 'gumroad' AND external_id = ? LIMIT 1", [saleId])
      const revoked = await revokePaymentAccess(db, payment, `gumroad:${kind}`)
      await logWebhookEvent({ provider: 'gumroad', eventName: kind, status: payment ? 'ok' : 'ignored', payload: { saleId, paymentId: payment?.id, revoked } })
      return res.json({ ok: true, revoked })
    }
    if (kind !== 'sale') {
      await logWebhookEvent({ provider: 'gumroad', eventName: kind, status: 'ignored', payload: { saleId } })
      return res.json({ ok: true, ignored: true })
    }

    // The ping says a sale happened; Gumroad's own record says what was sold.
    const sale = await getGumroadSale(saleId).catch((err) => {
      if (err.status === 404) return null
      throw err
    })
    if (!sale || sale.refunded || sale.chargedback) {
      await logWebhookEvent({ provider: 'gumroad', eventName: kind, status: 'ignored', payload: { saleId, reason: sale ? 'reversed' : 'unknown_sale' } })
      return res.json({ ok: true, ignored: true })
    }
    const permalink = ping.product_permalink
    const pid = ping.url_params?.pid
    let payment = pid
      ? await db.get("SELECT * FROM payments WHERE id = ? AND provider = 'gumroad' LIMIT 1", [pid])
      : null
    if (payment && payment.course_id !== permalink) payment = null
    if (payment && payment.status === 'completed' && payment.external_id !== saleId) payment = null
    if (!payment) payment = await db.get("SELECT * FROM payments WHERE provider = 'gumroad' AND external_id = ? LIMIT 1", [saleId])
    if (!payment) payment = await adoptGumroadSale(db, ping, saleId)
    if (!payment || payment.status === 'unclaimed') {
      await logWebhookEvent({ provider: 'gumroad', eventName: kind, status: 'ignored', payload: { saleId, permalink, email: ping.email, reason: payment ? 'no_account' : 'unknown_item' } })
      alertUnclaimedSale({
        provider: 'gumroad',
        saleId,
        email: ping.email,
        item: payment?.course_title || ping.product_name || permalink,
        reason: payment ? 'no_account' : 'unknown_item',
      })
      return res.json({ ok: true, ignored: true })
    }

    // The license the buyer settled on at Gumroad is the one they paid for.
    const tier = tierFromVariants(ping.variants)
    if (tier) await db.run('UPDATE checkout_contexts SET license_tier = ? WHERE payment_id = ?', [tier, payment.id])
    if (payment.status === 'pending' && payment.external_id !== saleId) {
      await db.run('UPDATE payments SET external_id = ? WHERE id = ?', [saleId, payment.id])
      payment = { ...payment, external_id: saleId }
    }
    const result = await reconcile(payment, { provider: 'gumroad', externalId: saleId })
    await db.run('UPDATE checkout_contexts SET provider_reference = ? WHERE payment_id = ?', [saleId, payment.id])
    await logWebhookEvent({ provider: 'gumroad', eventName: kind, status: 'ok', payload: { saleId, paymentId: payment.id, courseId: result.courseId } })
    res.json({ ok: true })
  } catch (err) {
    console.error('[gumroad ping]', err.message)
    if (err.status !== 409) alertWebhookProblem('gumroad', 'error', err.message)
    await logWebhookEvent({ provider: 'gumroad', eventName: kind, status: 'error', payload: { saleId, message: err.message } })
    // 500 is retried by Gumroad (1m, 3m, 10m, 1h); a mismatch is not worth retrying.
    res.status(err.status === 409 ? 200 : 500).json({ error: err.message })
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
