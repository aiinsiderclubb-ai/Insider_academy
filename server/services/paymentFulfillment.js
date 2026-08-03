import { getDb } from '../db.js'
import { grantAccess } from './access.js'
import { fulfillMarketplaceOrder, getMarketplaceProduct } from './marketplaceCatalog.js'

function sameMoney(left, right) {
  return Math.abs(Number(left) - Number(right)) < 0.01
}

export async function reconcilePaidPayment({ payment, provider, externalId, userId, productId, amount, currency }) {
  if (!payment) throw Object.assign(new Error('Pending payment not found'), { status: 404 })
  const expectedCurrency = String(payment.currency || 'EUR').toUpperCase()
  const actualCurrency = String(currency || '').toUpperCase()
  if (payment.provider !== provider
    || String(payment.external_id || '') !== String(externalId || '')
    || Number(payment.user_id) !== Number(userId)
    || payment.course_id !== productId
    || !sameMoney(payment.amount, amount)
    || expectedCurrency !== actualCurrency) {
    throw Object.assign(new Error('Payment reconciliation mismatch'), { status: 409 })
  }
  if (payment.status === 'completed') return { ok: true, idempotent: true, userId, courseId: productId }
  if (payment.status !== 'pending') throw Object.assign(new Error('Payment is not pending'), { status: 409 })

  const db = getDb()
  const product = await getMarketplaceProduct(db, productId, { includeUnpublished: true })
  if (product?.productType === 'marketplace') {
    const result = await fulfillMarketplaceOrder(db, {
      paymentId: payment.id,
      userId,
      productId,
      amount,
      currency: actualCurrency,
      provider,
      externalId,
    })
    if (!result.handled) throw Object.assign(new Error('Marketplace order not found'), { status: 409 })
    await db.run("UPDATE payments SET status = 'completed', completed_at = ? WHERE id = ? AND status = 'pending'", [new Date().toISOString(), payment.id])
    return { ok: true, idempotent: result.idempotent, userId, courseId: productId, marketplace: true }
  }

  return grantAccess({
    userId,
    email: payment.email,
    courseId: productId,
    courseTitle: payment.course_title,
    amount: payment.amount,
    provider,
    externalId,
  })
}
