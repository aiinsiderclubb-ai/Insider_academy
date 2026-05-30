import Stripe from 'stripe'
import { config, isStripeEnabled } from '../config.js'

let stripe = null

function getStripe() {
  if (!stripe && isStripeEnabled()) stripe = new Stripe(config.stripe.secretKey)
  return stripe
}

export async function createCheckoutSession({ userId, email, courseId, courseTitle, amountEur, successUrl, cancelUrl }) {
  const client = getStripe()
  if (!client) throw new Error('Stripe not configured')

  const session = await client.checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    line_items: [{
      price_data: {
        currency: config.stripe.currency,
        product_data: { name: courseTitle, metadata: { courseId } },
        unit_amount: Math.round(amountEur * 100),
      },
      quantity: 1,
    }],
    metadata: { userId: String(userId), courseId, courseTitle },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return session
}

export function constructWebhookEvent(rawBody, signature) {
  const client = getStripe()
  if (!client) throw new Error('Stripe not configured')
  return client.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret)
}
