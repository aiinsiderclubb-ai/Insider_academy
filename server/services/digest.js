import { getDb } from '../db.js'
import { config, isEmailEnabled } from '../config.js'
import { sendTemplateEmail } from './email.js'

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

  const lines = [
    pendingHw > 0 ? `Домашних заданий на проверке: ${pendingHw}` : null,
    pendingCerts > 0 ? `Сертификатов ожидает выдачи: ${pendingCerts}` : null,
    newRegs > 0 ? `Новых регистраций сегодня: ${newRegs}` : null,
    newPurchases > 0 ? `Покупок сегодня: ${newPurchases}` : null,
  ].filter(Boolean)

  await sendTemplateEmail(adminEmail, 'admin_digest', {
    locale: 'ru',
    lines,
    pendingHw,
  })

  await db.run(
    'INSERT INTO analytics (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [DIGEST_KEY, today]
  )

  if (!isEmailEnabled()) {
    console.log('[digest:dev]', { adminEmail, pendingHw, pendingCerts, newRegs, newPurchases })
  }
}
