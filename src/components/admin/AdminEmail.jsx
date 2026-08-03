import { useState } from 'react'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { api } from '../../api/client'
import styles from '../../pages/Admin.module.css'

export function AdminEmail({ emailStatus, online, onToast }) {
  const [testEmail, setTestEmail] = useState(emailStatus?.adminEmail || '')
  const [sending, setSending] = useState(false)

  const sendTest = async () => {
    if (!online) {
      onToast?.('API недоступен', 'error')
      return
    }
    setSending(true)
    try {
      const res = await api.adminTestEmail(testEmail.trim())
      onToast?.(`Письмо отправлено на ${res.to}`)
    } catch (e) {
      onToast?.(e.data?.errorRu || e.message || 'Ошибка отправки', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className={styles.panel}>
      <h3 className={styles.panelTitle}>Почта платформы (SMTP)</h3>
      <p className={styles.sectionDesc}>
        Автописьма: код регистрации, сброс пароля, проверка ДЗ, приветствие, напоминание о неактивности.
        Настраивается на <strong>Render</strong> (сервис API), не в интерфейсе сайта.
      </p>
      <ul className={styles.settingsList}>
        <li className={styles.inlineStatus}>
          {emailStatus?.enabled ? <CheckCircle2 size={15} aria-hidden /> : <XCircle size={15} aria-hidden />}
          SMTP: {emailStatus?.enabled ? 'включён' : 'не настроен (показывается ссылка сброса на экране)'}
        </li>
        <li>Отправитель: <code>{emailStatus?.from || '—'}</code></li>
        <li>Сервер: {emailStatus?.smtpHost ? <code>{emailStatus.smtpHost}:{emailStatus.smtpPort}</code> : '—'}</li>
        <li className={styles.inlineStatus}>
          {emailStatus?.adminEmail ? <CheckCircle2 size={15} aria-hidden /> : <AlertTriangle size={15} aria-hidden />}
          Дайджест админу: {emailStatus?.adminEmail || 'задайте ADMIN_EMAIL на Render'}
        </li>
      </ul>

      {emailStatus?.enabled ? (
        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <input
            type="email"
            className={styles.input}
            placeholder="email для теста"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            style={{ minWidth: 260 }}
          />
          <button type="button" className={styles.addBtn} disabled={sending} onClick={sendTest}>
            {sending ? 'Отправка…' : 'Отправить тестовое письмо'}
          </button>
        </div>
      ) : (
        <p className={styles.sectionDesc} style={{ marginTop: 12 }}>
          Инструкция: <code>docs/EMAIL_SETUP.ru.md</code> в репозитории — GoDaddy, Google Workspace или Brevo.
        </p>
      )}
    </section>
  )
}
