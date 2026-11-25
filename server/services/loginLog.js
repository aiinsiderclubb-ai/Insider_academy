/**
 * Who signed in, as whom and when — for the Studio's learner pages.
 *
 * One row per issued session. The address is kept as the client sent it
 * (behind the proxy, the first X-Forwarded-For hop) so the team can tell a
 * shared account from a forgotten password; rows older than KEEP_DAYS go.
 */
import { getDb } from '../db.js'

const KEEP_DAYS = 180
const DAY = 24 * 60 * 60 * 1000

function clientIp(req) {
  const forwarded = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim()
  return (forwarded || req?.ip || '').slice(0, 64) || null
}

export async function recordLogin(req, { userId, email, personalId, method }) {
  const db = getDb()
  try {
    await db.run(
      `INSERT INTO login_events (user_id, email, personal_id, method, ip, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId ?? null,
        email ? String(email).toLowerCase() : null,
        personalId || null,
        method || 'password',
        clientIp(req),
        String(req?.headers?.['user-agent'] || '').slice(0, 300) || null,
        new Date().toISOString(),
      ]
    )
  } catch (err) {
    console.warn('[login-log]', err.message)
  }
}

export async function pruneLoginLog(now = Date.now()) {
  await getDb().run('DELETE FROM login_events WHERE created_at < ?', [new Date(now - KEEP_DAYS * DAY).toISOString()]).catch(() => {})
}

export function mapLogin(row) {
  return {
    id: row.id,
    userId: row.user_id == null ? null : Number(row.user_id),
    email: row.email,
    personalId: row.personal_id,
    method: row.method,
    ip: row.ip,
    userAgent: row.user_agent,
    at: row.created_at,
  }
}
