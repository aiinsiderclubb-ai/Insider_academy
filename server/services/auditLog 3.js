import { getDb } from '../db.js'
import { nowIso } from '../db/time.js'
import crypto from 'crypto'

export async function logAudit({ actorEmail, action, targetType, targetId, meta = {} }) {
  const db = getDb()
  const id = `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`
  await db.run(
    `INSERT INTO audit_log (id, actor_email, action, target_type, target_id, meta, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      actorEmail || 'system',
      action,
      targetType || null,
      targetId || null,
      JSON.stringify(meta),
      nowIso(),
    ]
  ).catch((err) => {
    console.warn('[audit]', err.message)
  })
  return id
}
