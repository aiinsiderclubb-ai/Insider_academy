/** Полное удаление аккаунта и связанных записей по email / user id. */

async function cleanupEmailRecords(db, email) {
  const mail = String(email || '').trim().toLowerCase()
  if (!mail) return

  const byEmail = [
    ['registrations', 'email'],
    ['homework', 'email'],
    ['certificates', 'email'],
    ['purchase_log', 'email'],
    ['notifications', 'email'],
    ['referral_discounts', 'email'],
    ['support_messages', 'email'],
    ['email_tokens', 'email'],
    ['accelerator_applications', 'email'],
  ]

  for (const [table, column] of byEmail) {
    await db.run(`DELETE FROM ${table} WHERE lower(${column}) = ?`, [mail]).catch(() => {})
  }

  await db.run('DELETE FROM referrals WHERE lower(referrer_email) = ? OR lower(referred_email) = ?', [mail, mail]).catch(() => {})
  await db.run('DELETE FROM reviews WHERE lower(email) = ? OR lower(contact_email) = ?', [mail, mail]).catch(() => {})
  await db.run('DELETE FROM payments WHERE lower(email) = ?', [mail]).catch(() => {})
}

export async function deleteUserAccount(db, { userId, email }) {
  let user = null
  if (userId != null && userId !== '') {
    user = await db.get('SELECT * FROM users WHERE id = ?', [userId])
  }
  if (!user && email) {
    user = await db.get('SELECT * FROM users WHERE lower(email) = ?', [String(email).trim().toLowerCase()])
  }

  if (!user) {
    if (email) {
      await cleanupEmailRecords(db, email)
      const reg = await db.get('SELECT id FROM registrations WHERE lower(email) = ?', [String(email).trim().toLowerCase()])
      return {
        ok: Boolean(reg),
        deleted: reg ? 'registration_only' : false,
        email: String(email).trim().toLowerCase(),
        error: reg ? null : 'User not found',
      }
    }
    return { ok: false, error: 'User not found' }
  }

  const mail = String(user.email).trim().toLowerCase()
  const uid = user.id

  const ownedTeams = await db.all('SELECT id FROM teams WHERE owner_id = ?', [uid])
  for (const team of ownedTeams) {
    await db.run('DELETE FROM team_members WHERE team_id = ?', [team.id]).catch(() => {})
    await db.run('DELETE FROM teams WHERE id = ?', [team.id]).catch(() => {})
  }

  await db.run('DELETE FROM team_members WHERE user_id = ?', [uid]).catch(() => {})
  await db.run('DELETE FROM user_achievements WHERE user_id = ?', [uid]).catch(() => {})
  await db.run('DELETE FROM lesson_reminders WHERE user_id = ?', [uid]).catch(() => {})
  await db.run('DELETE FROM payments WHERE user_id = ?', [uid]).catch(() => {})
  await db.run('DELETE FROM reviews WHERE user_id = ?', [uid]).catch(() => {})

  await cleanupEmailRecords(db, mail)

  await db.run('DELETE FROM users WHERE id = ?', [uid])

  return {
    ok: true,
    deleted: 'user',
    userId: uid,
    email: mail,
    personalId: user.personal_id || null,
    name: user.name || null,
  }
}
