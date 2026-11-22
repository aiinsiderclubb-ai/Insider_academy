#!/usr/bin/env node
/**
 * Prepares a Paddle account (sandbox or production) for the Academy, safely
 * re-runnable:
 *
 *   1. a client-side token for Paddle.js on the website;
 *   2. the notification destination for the API's webhook;
 *   3. the catalog (scripts/paddle-sync.js);
 *
 * then prints the environment variables to set on Render and Vercel.
 *
 *   PADDLE_ENV=production PADDLE_API_KEY=pdl_live_… node scripts/paddle-setup.js
 *
 * Two settings have no API and stay in the dashboard (Checkout → Checkout
 * settings): the default payment link https://myinsideracademy.com/pay, and
 * "Allow buyers to add a discount code" switched off — discounts are ours.
 */
import 'dotenv/config'
import { spawnSync } from 'node:child_process'
import { config } from '../config.js'
import { paddleList, paddleRequest } from '../services/paddle.js'

const API_URL = process.env.API_PUBLIC_URL || 'https://insider-academy-mzbb.onrender.com'
const WEBHOOK = `${API_URL.replace(/\/$/, '')}/api/webhooks/paddle`
const EVENTS = ['transaction.completed', 'transaction.payment_failed', 'adjustment.created', 'adjustment.updated']
const TOKEN_NAME = 'myinsideracademy.com web'

async function clientToken() {
  const tokens = await paddleList('/client-tokens')
  const existing = tokens.find((t) => t.name === TOKEN_NAME && t.status === 'active')
  if (existing) return existing.token
  const created = await paddleRequest('POST', '/client-tokens', { name: TOKEN_NAME, description: 'Paddle.js on the website' })
  return created.data.token
}

async function webhook() {
  const destinations = await paddleList('/notification-settings')
  let destination = destinations.find((d) => d.destination === WEBHOOK)
  if (!destination) {
    destination = (await paddleRequest('POST', '/notification-settings', {
      description: 'Insider Academy API',
      type: 'url',
      destination: WEBHOOK,
      api_version: 1,
      include_sensitive_fields: false,
      traffic_source: 'all',
      subscribed_events: EVENTS,
    })).data
  } else {
    const subscribed = new Set((destination.subscribed_events || []).map((e) => e.name || e))
    if (EVENTS.some((e) => !subscribed.has(e)) || !destination.active) {
      destination = (await paddleRequest('PATCH', `/notification-settings/${destination.id}`, { subscribed_events: EVENTS, active: true })).data
    }
  }
  return destination
}

async function main() {
  console.log(`Paddle ${config.paddle.env}\n`)
  const token = await clientToken()
  const destination = await webhook()
  console.log(`✓ client token ${token.slice(0, 8)}…`)
  console.log(`✓ webhook → ${destination.destination} (${destination.active ? 'active' : 'inactive'})`)

  const sync = spawnSync(process.execPath, ['scripts/paddle-sync.js'], { stdio: 'inherit', env: process.env })
  if (sync.status !== 0) process.exit(sync.status ?? 1)

  const show = process.argv.includes('--show-secrets')
  const secret = destination.endpoint_secret_key || '(see the destination in the Paddle dashboard)'
  const mask = (value) => (show ? value : `${String(value).slice(0, 12)}…  (run with --show-secrets to print)`)
  console.log(`
Render — API service:
  PADDLE_ENV=${config.paddle.env}
  PADDLE_API_KEY=${mask(config.paddle.apiKey)}
  PADDLE_WEBHOOK_SECRET=${mask(secret)}

Vercel — website (then redeploy):
  NEXT_PUBLIC_PADDLE_ENV=${config.paddle.env}
  NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=${token}

Dashboard, by hand: Checkout settings → default payment link https://myinsideracademy.com/pay,
and turn off "Allow buyers to add a discount code".`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
