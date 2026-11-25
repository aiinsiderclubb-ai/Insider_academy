/**
 * Turning what an admin types into accounts.
 *
 * The Studio lets the team name people the way they know them: the numeric
 * account id, the email, or the personal id the learner sees in their cabinet
 * (also their referral code). Anything else is reported back, not guessed.
 */
import { coursePlans } from './coursePlan.js'

export function splitTokens(input) {
  const raw = Array.isArray(input) ? input.join('\n') : String(input || '')
  return [...new Set(raw.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean))]
}

export async function resolveAccounts(db, input) {
  const found = new Map()
  const unknown = []
  for (const token of splitTokens(input)) {
    let row = null
    if (/^\d+$/.test(token)) {
      row = await db.get('SELECT id, email, name, personal_id FROM users WHERE id = ?', [Number(token)])
    }
    if (!row && token.includes('@')) {
      row = await db.get('SELECT id, email, name, personal_id FROM users WHERE lower(email) = lower(?)', [token])
    }
    if (!row) {
      row = await db.get('SELECT id, email, name, personal_id FROM users WHERE upper(personal_id) = upper(?)', [token])
    }
    if (row) found.set(Number(row.id), { id: Number(row.id), email: row.email, name: row.name || null, personalId: row.personal_id || null })
    else unknown.push(token)
  }
  return { accounts: [...found.values()], unknown }
}

/** Who a mailing goes to. Free-form addresses are allowed for one-off letters. */
export const SEGMENTS = ['list', 'all', 'buyers', 'mentor', 'self', 'course', 'no_purchase']

export async function resolveAudience(db, { segment = 'list', recipients = '', courseId = '' } = {}) {
  if (segment === 'list') {
    const { accounts, unknown } = await resolveAccounts(db, recipients)
    // Unknown tokens that look like addresses still get the letter.
    const loose = unknown.filter((t) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)).map((email) => ({ id: null, email: email.toLowerCase(), name: null }))
    return {
      people: [...accounts, ...loose],
      unknown: unknown.filter((t) => !t.includes('@')),
    }
  }
  let rows = []
  if (segment === 'all') {
    rows = await db.all('SELECT id, email, name FROM users WHERE email_verified = 1')
  } else if (segment === 'no_purchase') {
    rows = await db.all('SELECT u.id, u.email, u.name FROM users u WHERE u.email_verified = 1 AND NOT EXISTS (SELECT 1 FROM purchases p WHERE p.user_id = u.id)')
  } else if (segment === 'buyers' || segment === 'course' || segment === 'mentor' || segment === 'self') {
    const params = []
    let where = ''
    if (segment === 'course' || ((segment === 'mentor' || segment === 'self') && courseId)) {
      where = 'WHERE p.course_id = ?'
      params.push(courseId)
    }
    rows = await db.all(
      `SELECT DISTINCT u.id, u.email, u.name FROM purchases p JOIN users u ON u.id = p.user_id ${where}`,
      params
    )
    if (segment === 'mentor' || segment === 'self') {
      const keep = []
      for (const row of rows) {
        const plans = await coursePlans(db, row.id)
        const owned = await db.all('SELECT course_id FROM purchases WHERE user_id = ?', [row.id])
        const ids = courseId ? [courseId] : owned.map((o) => o.course_id)
        // A course bought before plans existed, or through a pack, counts as mentor.
        const match = ids.some((id) => (plans.get(id) || 'mentor') === segment && owned.some((o) => o.course_id === id))
        if (match) keep.push(row)
      }
      rows = keep
    }
  } else {
    throw Object.assign(new Error('Unknown segment'), { status: 400 })
  }
  const seen = new Set()
  const people = []
  for (const row of rows) {
    const email = String(row.email || '').toLowerCase()
    if (!email || seen.has(email)) continue
    seen.add(email)
    people.push({ id: Number(row.id), email, name: row.name || null })
  }
  return { people, unknown: [] }
}
