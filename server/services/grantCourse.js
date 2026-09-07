import crypto from 'crypto'
import { getDb } from '../db.js'
import { nowIso } from '../db/time.js'
import * as sheetsTrack from './sheetsTrack.js'
import { prelaunchServiceGuard } from '../middleware/prelaunch.js'

export async function grantCourseAccess({
  email,
  courseId,
  courseTitle,
  provider = 'admin_grant',
}) {
  const blocked = prelaunchServiceGuard()
  if (blocked) return blocked
  const db = getDb()
  const mail = String(email || '').trim().toLowerCase()
  const cid = String(courseId || '').trim()
  const title = String(courseTitle || cid)

  if (!mail || !cid) {
    return { ok: false, error: 'email and courseId required' }
  }

  let user = await db.get('SELECT id, email FROM users WHERE email = ?', [mail])
  let userCreated = false

  if (!user) {
    const bcrypt = await import('bcryptjs')
    const hash = bcrypt.default.hashSync(crypto.randomBytes(8).toString('hex'), 10)
    const result = await db.run('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)', [
      mail,
      hash,
      mail.split('@')[0],
    ])
    const userId = result?.lastInsertRowid || (await db.get('SELECT id FROM users WHERE email = ?', [mail]))?.id
    user = { id: userId, email: mail }
    userCreated = true
  }

  const exists = await db.get('SELECT id FROM purchases WHERE user_id = ? AND course_id = ?', [user.id, cid])
  let granted = false

  if (!exists) {
    await db.run('INSERT INTO purchases (user_id, course_id, payment_provider) VALUES (?, ?, ?)', [
      user.id,
      cid,
      provider,
    ])
    await db.run(
      'INSERT INTO purchase_log (id, email, course_id, course_title, amount, date) VALUES (?, ?, ?, ?, ?, ?)',
      [`grant-${Date.now()}`, mail, cid, title, 0, nowIso()]
    )
    const uRow = await db.get('SELECT personal_id FROM users WHERE id = ?', [user.id])
    sheetsTrack.trackPurchase({
      email: mail,
      personalId: uRow?.personal_id,
      courseId: cid,
      courseTitle: title,
      amount: 0,
      source: provider,
    }).catch(() => {})
    granted = true
    const { notifyCourseAccessOpened } = await import('./notifications.js')
    await notifyCourseAccessOpened(db, {
      email: mail,
      courseId: cid,
      courseTitle: title,
    })
  }

  return { ok: true, userId: user.id, email: mail, granted, userCreated, alreadyHadAccess: !granted }
}
