import { nowIso } from '../db/time.js'

export async function mapUserResponse(db, user) {
  let avatarUrl = null
  if (user.avatar_url) {
    if (String(user.avatar_url).startsWith('data:')) {
      avatarUrl = user.avatar_url
    } else {
      try {
        const { getFileUrl } = await import('./storage.js')
        avatarUrl = await getFileUrl(user.avatar_url, 'local')
      } catch {
        avatarUrl = null
      }
    }
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: Boolean(user.email_verified),
    telegramChatId: user.telegram_chat_id,
    avatarUrl,
    profileUpdatedAt: user.profile_updated_at || null,
    passwordChangedAt: user.password_changed_at || null,
  }
}

export async function syncUserRecords(db, oldEmail, updates = {}) {
  const email = updates.email || oldEmail
  const name = updates.name
  const now = nowIso()

  if (name != null) {
    await db.run('UPDATE registrations SET name = ? WHERE email = ?', [name, oldEmail])
    await db.run('UPDATE homework SET name = ? WHERE email = ?', [name, oldEmail])
    await db.run('UPDATE support_messages SET name = ? WHERE email = ?', [name, oldEmail])
  }

  if (updates.email && updates.email !== oldEmail) {
    const tables = [
      ['registrations', 'email'],
      ['homework', 'email'],
      ['certificates', 'email'],
      ['purchase_log', 'email'],
      ['notifications', 'email'],
      ['referrals', 'referrer_email'],
      ['referrals', 'referred_email'],
      ['referral_discounts', 'email'],
      ['support_messages', 'email'],
    ]
    for (const [table, column] of tables) {
      await db.run(`UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`, [email, oldEmail]).catch(() => {})
    }
    await db.run('UPDATE reviews SET contact_email = ? WHERE contact_email = ?', [email, oldEmail]).catch(() => {})
  }

  return now
}

export function userSelectFields() {
  return 'id, email, name, email_verified, telegram_chat_id, avatar_url, profile_updated_at, password_changed_at, created_at'
}
