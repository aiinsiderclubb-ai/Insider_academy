import { getDb } from '../db.js'
import * as sheetsTrack from './sheetsTrack.js'

export async function logWebhookEvent({ provider, eventName, status, payload }) {
  try {
    const db = getDb()
    await db.run(
      `INSERT INTO webhook_events (id, provider, event_name, status, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`wh-${Date.now()}`, provider, eventName, status, JSON.stringify(payload || {}).slice(0, 2000), new Date().toISOString()]
    )
  } catch (_) {}
}

export async function grantAccess({ userId, email, courseId, courseTitle, amount, provider, externalId }) {
  const db = getDb()
  if (!courseId) return { ok: false, reason: 'no courseId' }

  let resolvedUserId = userId
  if (!resolvedUserId && email) {
    const user = await db.get('SELECT id FROM users WHERE email = ? COLLATE NOCASE', [email])
    if (user) resolvedUserId = user.id
  }

  if (!resolvedUserId && email && courseId) {
    const pending = await db.get(
      `SELECT user_id FROM payments WHERE email = ? AND course_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1`,
      [email, courseId]
    )
    if (pending?.user_id) resolvedUserId = pending.user_id
  }

  const exists = resolvedUserId
    ? await db.get('SELECT id FROM purchases WHERE user_id = ? AND course_id = ?', [resolvedUserId, courseId])
    : null

  let newlyGranted = false
  if (!exists && resolvedUserId) {
    await db.run(
      'INSERT INTO purchases (user_id, course_id, payment_provider, payment_id) VALUES (?, ?, ?, ?)',
      [resolvedUserId, courseId, provider, externalId]
    )
    newlyGranted = true
  }

  if (email && newlyGranted) {
    await db.run(
      'INSERT INTO purchase_log (id, email, course_id, course_title, amount, date) VALUES (?, ?, ?, ?, ?, ?)',
      [`purchase-${Date.now()}`, email, courseId, courseTitle || courseId, amount, new Date().toISOString()]
    )
    const u = await db.get('SELECT personal_id, email FROM users WHERE id = ?', [resolvedUserId])
    sheetsTrack.trackPurchase({
      email: email || u?.email,
      personalId: u?.personal_id,
      courseId,
      courseTitle: courseTitle || courseId,
      amount,
      source: provider || 'webhook',
    }).catch(() => {})
  }

  if (externalId) {
    await db.run(
      `UPDATE payments SET status = 'completed', completed_at = ? WHERE external_id = ? OR id = ?`,
      [new Date().toISOString(), externalId, externalId]
    )
  }

  return { ok: true, userId: resolvedUserId, courseId }
}
