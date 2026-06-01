import { useApi } from '../context/ApiContext'
import { useLanguage } from '../context/LanguageContext'
import styles from './ApiStatusBanner.module.css'

const isLocalHost = typeof window !== 'undefined'
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

export function ApiStatusBanner() {
  const { online, refresh } = useApi()
  const { lang } = useLanguage()

  if (online === null || online) return null

  return (
    <div className={styles.banner} role="status">
      <span>
        {lang === 'ru'
          ? 'Сервер API недоступен — данные не сохраняются в базу. Запустите backend (npm run dev:all) или откройте сайт на Vercel.'
          : 'API server is offline — data is not saved to the database. Run the backend (npm run dev:all) or use the Vercel deployment.'}
      </span>
      {isLocalHost && (
        <code className={styles.hint}>http://localhost:3001/api/health</code>
      )}
      <button type="button" className={styles.retryBtn} onClick={() => refresh()}>
        {lang === 'ru' ? 'Повторить подключение' : 'Retry connection'}
      </button>
    </div>
  )
}
