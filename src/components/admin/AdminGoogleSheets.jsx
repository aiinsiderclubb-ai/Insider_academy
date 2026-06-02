import { useEffect, useState } from 'react'
import { api, getAdminToken, getApiBase } from '../../api/client'
import styles from '../../pages/Admin.module.css'

const ARCHIVE_KEYS = new Set(['users', 'logins', 'purchases', 'homework', 'reviews'])

export function AdminGoogleSheets({ online, onToast }) {
  const [status, setStatus] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(false)

  const load = async () => {
    if (!online) return
    setLoadingStatus(true)
    try {
      const s = await api.adminSheetsStatus()
      setStatus(s)
    } catch (e) {
      setStatus(null)
      onToast?.(e?.message || 'Не удалось обновить статус', 'error')
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(load, [online])

  const runSync = async () => {
    if (!window.confirm(
      'Перезаписать основные таблицы (Пользователи, Входы, Покупки, ДЗ, Отзывы) данными из базы?\n\nНовые события по-прежнему добавляются автоматически в реальном времени.'
    )) return
    setSyncing(true)
    try {
      const res = await api.adminSheetsSync()
      const counts = res.counts || {}
      const summary = Object.entries(counts)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join(' · ')
      onToast?.(`Синхронизация завершена${summary ? `: ${summary}` : ''}`)
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

  const archiveSheets = status?.sheets?.filter((s) => ARCHIVE_KEYS.has(s.key)) || []

  return (
    <section className={styles.panel}>
      <h3 className={styles.panelTitle}>Google Таблицы (Google Drive)</h3>
      <p className={styles.sectionDesc}>
        Архив в реальном времени: регистрации, входы, покупки, ДЗ и отзывы автоматически
        дописываются в таблицы на Google Drive при каждом событии на сервере.
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
        <>
          <p className={styles.sectionDesc}>
            Статус: {status.enabled
              ? (status.ok ? '✅ подключено · авто-синхронизация включена' : `⚠️ ${status.error || status.message}`)
              : `⚠️ ${status.message}`}
          </p>
          {status.lastFullSync?.at && (
            <p className={styles.sectionDesc}>
              Последняя синхронизация БД → Drive:{' '}
              <strong>{new Date(status.lastFullSync.at).toLocaleString('ru-RU')}</strong>
            </p>
          )}
          {status.serviceAccountEmail && (
            <p className={styles.sectionDesc}>
              Service Account: <code>{status.serviceAccountEmail}</code>
              {' — '}
              дайте этому email доступ «Редактор» к папке на Google Drive.
            </p>
          )}
        </>
      )}

      {archiveSheets.length > 0 && (
        <div className={styles.statsGrid} style={{ marginBottom: 16 }}>
          {archiveSheets.map((s) => (
            <div key={s.key} className={styles.statCard}>
              <span className={styles.statValue}>{s.rowCount ?? '—'}</span>
              <span className={styles.statLabel}>{s.title}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.courseActions}>
        <button
          type="button"
          className={styles.addBtn}
          disabled={!online || syncing}
          onClick={runSync}
        >
          {syncing ? 'Синхронизация…' : 'Обновить архив из БД'}
        </button>
        <button type="button" className={styles.smallBtn} disabled={!online || loadingStatus} onClick={load}>
          {loadingStatus ? 'Обновление…' : 'Обновить статус'}
        </button>
      </div>

      {status?.sheets?.length > 0 && (
        <div className={styles.tableWrap} style={{ marginTop: 16 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Таблица</th>
                <th>Строк</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {status.sheets.map((s) => (
                <tr key={s.key}>
                  <td>
                    {s.title}
                    {s.archive && <span className={styles.passwordChangedBadge} style={{ marginLeft: 8 }}>архив</span>}
                    {s.url && (
                      <>
                        {' '}
                        <a href={s.url} target="_blank" rel="noreferrer noopener" className={styles.inlineBtn}>
                          открыть
                        </a>
                      </>
                    )}
                  </td>
                  <td>{s.rowCount ?? '—'}</td>
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
