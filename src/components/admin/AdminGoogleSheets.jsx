import { useEffect, useState } from 'react'
import { api, getAdminToken, getApiBase } from '../../api/client'
import styles from '../../pages/Admin.module.css'

export function AdminGoogleSheets({ online, onToast }) {
  const [status, setStatus] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const load = () => {
    if (!online) return
    api.adminSheetsStatus().then(setStatus).catch(() => setStatus(null))
  }

  useEffect(load, [online])

  const runSync = async () => {
    setSyncing(true)
    try {
      const res = await api.adminSheetsSync()
      onToast?.(`Синхронизация завершена: ${JSON.stringify(res.counts || {})}`)
      load()
    } catch (e) {
      onToast?.(e.message || 'Ошибка синхронизации', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const downloadSheet = async (key, title) => {
    try {
      const res = await fetch(`${getApiBase()}/admin/sheets/export/${key}`, {
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      onToast?.('Не удалось скачать таблицу', 'error')
    }
  }

  return (
    <section className={styles.panel}>
      <h3 className={styles.panelTitle}>Google Таблицы (Google Drive)</h3>
      <p className={styles.sectionDesc}>
        Все действия пользователей дублируются в таблицы на Google Drive с датой и автором.
        Папка:{' '}
        {status?.folderUrl ? (
          <a href={status.folderUrl} target="_blank" rel="noreferrer noopener">открыть на Drive</a>
        ) : (
          'настройте GOOGLE_DRIVE_FOLDER_ID'
        )}
      </p>

      {!online && (
        <p className={styles.sectionDesc} style={{ color: '#fbbf24' }}>
          Подключите API-сервер — без него синхронизация с Google недоступна.
        </p>
      )}

      {status && (
        <p className={styles.sectionDesc}>
          Статус: {status.enabled
            ? (status.ok ? '✅ подключено' : `⚠️ ${status.error || status.message}`)
            : `⚠️ ${status.message}`}
        </p>
      )}

      <div className={styles.courseActions}>
        <button
          type="button"
          className={styles.addBtn}
          disabled={!online || syncing}
          onClick={runSync}
        >
          {syncing ? 'Синхронизация…' : 'Синхронизировать БД → Sheets'}
        </button>
        <button type="button" className={styles.smallBtn} disabled={!online} onClick={load}>
          Обновить статус
        </button>
      </div>

      {status?.sheets?.length > 0 && (
        <div className={styles.tableWrap} style={{ marginTop: 16 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Таблица</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {status.sheets.map((s) => (
                <tr key={s.key}>
                  <td>
                    {s.title}
                    {s.url && (
                      <>
                        {' '}
                        <a href={s.url} target="_blank" rel="noreferrer noopener" className={styles.inlineBtn}>
                          открыть
                        </a>
                      </>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.smallBtn}
                      disabled={!online || !status.enabled}
                      onClick={() => downloadSheet(s.key, s.title)}
                    >
                      Скачать CSV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
