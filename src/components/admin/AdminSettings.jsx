import styles from '../../pages/Admin.module.css'

export function AdminSettings({ settings, webhookLog, onCopy, onEnablePush }) {
  const url = settings?.tributeWebhookUrl || ''

  return (
    <div className={styles.settings}>
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
