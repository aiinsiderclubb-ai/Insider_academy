import crypto from 'crypto'

const PREFIX = 'AIA-'
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generatePersonalId() {
  let suffix = ''
  for (let i = 0; i < 6; i += 1) {
    suffix += CHARS[crypto.randomInt(0, CHARS.length)]
  }
  return `${PREFIX}${suffix}`
}

export async function ensurePersonalId(db, userId) {
  const row = await db.get('SELECT id, email, personal_id FROM users WHERE id = ?', [userId])
  if (!row) return null
  if (row.personal_id) return row.personal_id

  let personalId = null
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = generatePersonalId()
    const exists = await db.get('SELECT id FROM users WHERE personal_id = ?', [candidate])
    if (!exists) {
      personalId = candidate
      break
    }
  }
  if (!personalId) personalId = `${PREFIX}${String(userId).padStart(6, '0')}`

  await db.run('UPDATE users SET personal_id = ? WHERE id = ?', [personalId, userId])
  if (row.email) {
    await db.run('UPDATE registrations SET personal_id = ? WHERE email = ?', [personalId, row.email]).catch(() => {})
  }
  return personalId
}

export async function backfillPersonalIds(db) {
  const rows = await db.all('SELECT id FROM users WHERE personal_id IS NULL OR personal_id = \'\'')
  for (const row of rows) {
    await ensurePersonalId(db, row.id)
  }
}
