import { AdminGoogleSheets } from './AdminGoogleSheets'
import { AdminEmail } from './AdminEmail'
import styles from '../../pages/Admin.module.css'

export function AdminSettings({ settings, webhookLog, dataHealth, emailStatus, online, onCopy, onEnablePush, onToast }) {
  const url = settings?.tributeWebhookUrl || ''

  return (
    <div className={styles.settings}>
      {dataHealth && (
        <section className={styles.panel}>
          <h3 className={styles.panelTitle}>Состояние базы данных</h3>
          <p className={styles.sectionDesc}>
            Сводка записей на сервере ({dataHealth.db}). Пароли хранятся только как хеш — в админке видна дата смены, не сам пароль.
          </p>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}><span className={styles.statValue}>{dataHealth.users}</span><span className={styles.statLabel}>Пользователей</span></div>
            <div className={styles.statCard}><span className={styles.statValue}>{dataHealth.withPersonalId}</span><span className={styles.statLabel}>С личным ID</span></div>
            <div className={styles.statCard}><span className={styles.statValue}>{dataHealth.registrations}</span><span className={styles.statLabel}>Регистраций</span></div>
            <div className={styles.statCard}><span className={styles.statValue}>{dataHealth.homework}</span><span className={styles.statLabel}>Домашних заданий</span></div>
            <div className={styles.statCard}><span className={styles.statValue}>{dataHealth.reviews?.total ?? 0}</span><span className={styles.statLabel}>Отзывов</span></div>
            <div className={styles.statCard}><span className={styles.statValue}>{dataHealth.reviews?.pending ?? 0}</span><span className={styles.statLabel}>На модерации</span></div>
            <div className={styles.statCard}><span className={styles.statValue}>{dataHealth.purchases}</span><span className={styles.statLabel}>Покупок</span></div>
            <div className={styles.statCard}><span className={styles.statValue}>{dataHealth.certificates}</span><span className={styles.statLabel}>Сертификатов</span></div>
            <div className={styles.statCard}><span className={styles.statValue}>{dataHealth.passwordChanges}</span><span className={styles.statLabel}>Смен пароля</span></div>
            <div className={styles.statCard}><span className={styles.statValue}>{dataHealth.telegramLinked ?? 0}</span><span className={styles.statLabel}>Telegram привязан</span></div>
            <div className={styles.statCard}><span className={styles.statValue}>{dataHealth.applications ?? 0}</span><span className={styles.statLabel}>Заявок</span></div>
          </div>
        </section>
      )}

      <AdminGoogleSheets online={online} onToast={onToast} />

      <AdminEmail emailStatus={emailStatus} online={online} onToast={onToast} />

      <section className={styles.panel}>
        <h3 className={styles.panelTitle}>Tribute Webhook (production)</h3>
        <p className={styles.sectionDesc}>
          Укажите этот URL в настройках Tribute для автовыдачи доступа после оплаты.
        </p>
        <div className={styles.webhookUrlBox}>
          <code>{url || '—'}</code>
          {url && (
            <button type="button" className={styles.smallBtn} onClick={() => onCopy(url)}>Копировать</button>
          )}
        </div>
        <ul className={styles.settingsList}>
          <li>Tribute API: {settings?.tributeEnabled ? '✅ подключён' : '❌ не настроен'}</li>
          <li>Локально webhook не работает — используйте ngrok или деплой</li>
          <li>Prod: заголовок <code>trbt-signature</code> (HMAC SHA256 от тела запроса)</li>
        </ul>
      </section>

      <section className={styles.panel}>
        <h3 className={styles.panelTitle}>Уведомления</h3>
        <p className={styles.sectionDesc}>Email-дайджест раз в день (если задан ADMIN_EMAIL). Браузерные push — при новых ДЗ.</p>
        <button type="button" className={styles.addBtn} onClick={onEnablePush}>Включить push в браузере</button>
      </section>

      {webhookLog?.length > 0 && (
        <section className={styles.panel}>
          <h3 className={styles.panelTitle}>Последние webhook-события</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table} style={{ minWidth: 500 }}>
              <thead>
                <tr><th>Событие</th><th>Статус</th><th>Время</th></tr>
              </thead>
              <tbody>
                {webhookLog.map((ev) => (
                  <tr key={ev.id}>
                    <td>{ev.event_name}</td>
                    <td>{ev.status}</td>
                    <td>{new Date(ev.created_at).toLocaleString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
