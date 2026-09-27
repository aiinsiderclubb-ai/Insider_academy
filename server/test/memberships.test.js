import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import os from 'os'

const TRIBUTE_KEY = 'tribute-test-api-key'
const CLUB_SUB = 9001
const PRO_SUB = 9002
const OTHER_SUB = 7777 // someone else's channel on the same Tribute account

const tmpDb = path.join(os.tmpdir(), `lms-memberships-${Date.now()}.sqlite`)
process.env.DATABASE_URL = ''
process.env.LMS_TEST_DB = tmpDb
process.env.UPLOADS_DIR = path.join(os.tmpdir(), 'lms-test-uploads')
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.ADMIN_JWT_SECRET = 'test-admin-jwt'
process.env.ADMIN_PASSWORD = 'AdminTest-2026-Only!'
process.env.EDITOR_PASSWORD = 'EditorTest-2026-Only!'
process.env.MODERATOR_PASSWORD = 'ModeratorTest-2026!'
process.env.CORS_ORIGIN = 'http://localhost:5173'
// As in production: prelaunch, with Tribute webhooks let through.
process.env.PRELAUNCH_MODE = '1'
process.env.MARKETPLACE_LIVE = '1'
process.env.TRIBUTE_API_KEY = TRIBUTE_KEY
process.env.TRIBUTE_SUBSCRIPTION_MAP = JSON.stringify({ [CLUB_SUB]: 'club', [PRO_SUB]: 'pro', 1: 'gold' })

const json = { 'Content-Type': 'application/json' }
const inDays = (n) => new Date(Date.now() + n * 86_400_000).toISOString()

test('memberships: Tribute subscriptions become Club / Pro on the site', async (t) => {
  const { resetDatabase, getDb } = await import('../db/index.js')
  resetDatabase()
  const { createApp } = await import('../app.js')
  const app = await createApp()
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance))
    instance.once('error', reject)
  })
  const base = `http://127.0.0.1:${server.address().port}`
  t.after(() => new Promise((resolve) => { server.close(resolve); fs.unlinkSync(tmpDb) }))

  const webhook = (name, payload, { sign = true } = {}) => {
    const body = JSON.stringify({ name, created_at: new Date().toISOString(), sent_at: new Date().toISOString(), payload })
    const signature = crypto.createHmac('sha256', sign ? TRIBUTE_KEY : 'wrong-key').update(body).digest('hex')
    return fetch(`${base}/api/webhooks/tribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'trbt-signature': signature },
      body,
    })
  }
  const signUp = async (email, name) => {
    const reg = await fetch(`${base}/api/auth/register`, {
      method: 'POST', headers: json, body: JSON.stringify({ email, password: 'SecretTest12', name }),
    }).then((r) => r.json())
    await fetch(`${base}/api/auth/verify-email-code`, {
      method: 'POST', headers: json, body: JSON.stringify({ email, code: reg.devCode }),
    })
    const login = await fetch(`${base}/api/auth/login`, {
      method: 'POST', headers: json, body: JSON.stringify({ email, password: 'SecretTest12' }),
    }).then((r) => r.json())
    return { ...json, Authorization: `Bearer ${login.token}` }
  }
  const me = (headers) => fetch(`${base}/api/me`, { headers }).then((r) => r.json())
  const linkTelegram = (email, telegramId) =>
    getDb().run('UPDATE users SET telegram_chat_id = ? WHERE email = ?', [String(telegramId), email])
  // Postgres returns COUNT(*) as a string; SQLite as a number.
  const countRows = async () => Number((await getDb().get('SELECT COUNT(*) AS n FROM memberships')).n)

  // ---- signatures are checked before anything is written ----
  const forged = await webhook('new_subscription', {
    subscription_id: CLUB_SUB, telegram_user_id: 111, expires_at: inDays(30),
  }, { sign: false })
  assert.equal(forged.status, 401)
  assert.equal(await countRows(), 0)

  // ---- paying before linking Telegram still works ----
  const early = await webhook('new_subscription', {
    subscription_id: CLUB_SUB, telegram_user_id: 111, telegram_username: 'anna',
    period: 'monthly', price: 5900, currency: 'eur', expires_at: inDays(30),
  })
  assert.equal(early.status, 200)
  assert.equal((await early.json()).linked, false, 'no account has this Telegram yet')

  const anna = await signUp(`anna-${Date.now()}@example.com`, 'Anna')
  const annaEmail = (await me(anna)).user.email
  assert.equal((await me(anna)).user.role, null, 'no Telegram linked, so no tier')

  await linkTelegram(annaEmail, 111)
  const linked = await me(anna)
  assert.equal(linked.user.role, 'club', 'the membership is picked up the moment Telegram is linked')
  assert.equal(linked.user.membership.renewing, true)

  const forum = await fetch(`${base}/api/forum/access`, { headers: anna }).then((r) => r.json())
  assert.equal(forum.member, true, 'a subscriber is a buyer: the community is open to them')

  // ---- renewals extend; a delayed older event never shortens ----
  await webhook('renewed_subscription', { subscription_id: CLUB_SUB, telegram_user_id: 111, expires_at: inDays(60) })
  const renewed = (await me(anna)).user.membership.expiresAt
  assert.ok(renewed > inDays(59), 'renewal moves the expiry out')

  await webhook('renewed_subscription', { subscription_id: CLUB_SUB, telegram_user_id: 111, expires_at: inDays(10) })
  assert.equal((await me(anna)).user.membership.expiresAt, renewed, 'a late, older event does not cut the period short')

  // ---- camelCase event names are understood as well ----
  const camel = await webhook('renewedSubscription', { subscription_id: CLUB_SUB, telegram_user_id: 111, expires_at: inDays(61) })
  assert.equal(camel.status, 200)

  // ---- cancelling keeps what was paid for ----
  await webhook('cancelled_subscription', {
    subscription_id: CLUB_SUB, telegram_user_id: 111, cancel_reason: 'too expensive', expires_at: inDays(61),
  })
  const cancelled = await me(anna)
  assert.equal(cancelled.user.role, 'club', 'access runs to the end of the paid period')
  assert.equal(cancelled.user.membership.renewing, false)

  // ---- Pro outranks Club ----
  await webhook('new_subscription', { subscription_id: PRO_SUB, telegram_user_id: 111, expires_at: inDays(30) })
  assert.equal((await me(anna)).user.role, 'pro')

  // ---- other channels on the same Tribute account grant nothing ----
  const before = await countRows()
  const unrelated = await webhook('new_subscription', { subscription_id: OTHER_SUB, telegram_user_id: 222, expires_at: inDays(30) })
  assert.equal(unrelated.status, 202)
  assert.equal((await unrelated.json()).reason, 'unmapped_subscription')
  assert.equal(await countRows(), before)

  // ---- a map entry naming a tier that does not exist is dropped ----
  const gold = await webhook('new_subscription', { subscription_id: 1, telegram_user_id: 333, expires_at: inDays(30) })
  assert.equal(gold.status, 202)

  // ---- an expired membership grants nothing ----
  const bob = await signUp(`bob-${Date.now()}@example.com`, 'Bob')
  const bobEmail = (await me(bob)).user.email
  await linkTelegram(bobEmail, 444)
  await webhook('cancelled_subscription', { subscription_id: CLUB_SUB, telegram_user_id: 444, expires_at: inDays(-1) })
  assert.equal((await me(bob)).user.role, null)

  // ---- Studio: grant, list, revoke ----
  const adminLogin = await fetch(`${base}/api/admin/login`, {
    method: 'POST', headers: json, body: JSON.stringify({ password: 'AdminTest-2026-Only!' }),
  }).then((r) => r.json())
  const admin = { ...json, Authorization: `Bearer ${adminLogin.token}` }

  assert.equal(
    (await fetch(`${base}/api/admin/memberships/grant`, {
      method: 'POST', headers: bob, body: JSON.stringify({ email: bobEmail, tier: 'pro', days: 30 }),
    })).status,
    401,
    'a learner cannot grant themselves Pro'
  )
  assert.equal((await fetch(`${base}/api/admin/memberships/grant`, {
    method: 'POST', headers: admin, body: JSON.stringify({ email: bobEmail, tier: 'gold', days: 30 }),
  })).status, 400)
  assert.equal((await fetch(`${base}/api/admin/memberships/grant`, {
    method: 'POST', headers: admin, body: JSON.stringify({ email: bobEmail, tier: 'club', days: 0 }),
  })).status, 400)

  const granted = await fetch(`${base}/api/admin/memberships/grant`, {
    method: 'POST', headers: admin, body: JSON.stringify({ email: bobEmail, tier: 'club', days: 30 }),
  })
  assert.equal(granted.status, 201)
  const bobMe = await me(bob)
  assert.equal(bobMe.user.role, 'club')
  assert.equal(bobMe.user.membership.renewing, false, 'a hand grant does not renew on its own')

  const listing = await fetch(`${base}/api/admin/memberships?email=${encodeURIComponent(bobEmail)}`, { headers: admin })
    .then((r) => r.json())
  const grant = listing.memberships.find((row) => row.provider === 'admin')
  assert.ok(grant)
  assert.equal((await fetch(`${base}/api/admin/memberships/${grant.id}/revoke`, { method: 'POST', headers: admin })).status, 200)
  assert.equal((await me(bob)).user.role, null, 'revoked ends it now')

  const audit = await getDb().all("SELECT action FROM audit_log WHERE action LIKE 'membership.%'")
  assert.deepEqual(audit.map((row) => row.action).sort(), ['membership.grant', 'membership.revoke'])
})

test('memberships: syncing from Tribute brings in existing subscribers', async () => {
  const { getDb } = await import('../db/index.js')
  const { syncTributeSubscribers } = await import('../services/memberships.js')
  const db = getDb()

  const fake = async (subscriptionId) => (
    Number(subscriptionId) === CLUB_SUB
      ? [
          { telegramUserId: 555, status: 'active', subscriptionId: CLUB_SUB, expireAt: inDays(20) },
          { telegramUserId: 666, status: 'pre_cancelled', subscriptionId: CLUB_SUB, expireAt: inDays(5) },
          { telegramUserId: null, status: 'active', subscriptionId: CLUB_SUB, expireAt: inDays(5) },
        ]
      : []
  )
  const summary = await syncTributeSubscribers(db, { fetchSubscribers: fake })
  assert.equal(summary.subscriptions, 2, 'club and pro are both asked; the invalid entry was never mapped')
  assert.equal(summary.active, 2)
  assert.equal(summary.skipped, 1, 'a subscriber without a Telegram id is skipped, not guessed')

  const again = await syncTributeSubscribers(db, { fetchSubscribers: fake })
  assert.equal(again.active, 2)
  const rows = await db.get("SELECT COUNT(*) AS n FROM memberships WHERE telegram_user_id IN ('555','666')")
  assert.equal(Number(rows.n), 2, 'running it twice creates nothing new')

  // Tribute's own list is the truth: a shorter expiry from it is taken as given.
  const shorter = async (id) => (Number(id) === CLUB_SUB
    ? [{ telegramUserId: 555, status: 'cancelled', subscriptionId: CLUB_SUB, expireAt: inDays(-1) }]
    : [])
  await syncTributeSubscribers(db, { fetchSubscribers: shorter })
  const row = await db.get("SELECT status, expires_at FROM memberships WHERE telegram_user_id = '555'")
  assert.equal(row.status, 'cancelled')
  assert.ok(row.expires_at < new Date().toISOString(), 'sync may shorten, unlike a webhook')
})
