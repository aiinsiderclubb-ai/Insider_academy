import { getDb } from '../db.js'
import { config, isEmailEnabled } from '../config.js'
import { sendEmail } from './email.js'

const DIGEST_KEY = 'admin_digest_last'

export async function sendAdminDailyDigest() {
  if (!config.adminDigestEnabled) return
  const adminEmail = config.adminEmail
  if (!adminEmail) return

  const db = getDb()
  const lastRow = await db.get('SELECT value FROM analytics WHERE key = ?', [DIGEST_KEY])
  const today = new Date().toISOString().slice(0, 10)
  if (lastRow?.value === today) return

  const pendingHw = (await db.get("SELECT COUNT(*) AS c FROM homework WHERE status = 'pending'"))?.c || 0
  const pendingCerts = (await db.get('SELECT COUNT(*) AS c FROM certificates WHERE file_path IS NULL OR file_path = ""'))?.c || 0
  const newRegs = (await db.get("SELECT COUNT(*) AS c FROM registrations WHERE date(date) = date('now')"))?.c || 0
  const newPurchases = (await db.get("SELECT COUNT(*) AS c FROM purchase_log WHERE date(date) = date('now')"))?.c || 0

  if (pendingHw === 0 && pendingCerts === 0 && newRegs === 0 && newPurchases === 0) {
    await db.run(
      'INSERT INTO analytics (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [DIGEST_KEY, today]
    )
    return
  }

  const adminUrl = `${config.appUrl}/admin`
  const lines = [
    pendingHw > 0 ? `📝 Домашних заданий на проверке: ${pendingHw}` : null,
    pendingCerts > 0 ? `🎓 Сертификатов ожидает выдачи: ${pendingCerts}` : null,
    newRegs > 0 ? `👤 Новых регистраций сегодня: ${newRegs}` : null,
    newPurchases > 0 ? `💳 Покупок сегодня: ${newPurchases}` : null,
  ].filter(Boolean)

  await sendEmail({
    to: adminEmail,
    subject: `AI Insider Admin — ${pendingHw} ДЗ на проверке`,
    html: `<p>Ежедневный дайджест админ-панели:</p><ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul><p><a href="${adminUrl}">Открыть админ-панель</a></p>`,
    text: lines.join('\n') + `\n\n${adminUrl}`,
  })

  await db.run(
    'INSERT INTO analytics (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [DIGEST_KEY, today]
  )

  if (!isEmailEnabled()) {
    console.log('[digest:dev]', { adminEmail, pendingHw, pendingCerts, newRegs, newPurchases })
  }
}
