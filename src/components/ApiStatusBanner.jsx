import { useApi } from '../context/ApiContext'
import { useLanguage } from '../context/LanguageContext'
import { getApiBase } from '../api/client'
import styles from './ApiStatusBanner.module.css'

const PRODUCTION_APP = 'https://insider-academy-vsxg.vercel.app'

const isLocalHost = typeof window !== 'undefined'
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

export function ApiStatusBanner() {
  const { online, refresh } = useApi()
  const { lang } = useLanguage()

  if (online === null || online) return null

  const healthUrl = `${getApiBase()}/health`

  return (
    <div className={styles.banner} role="status">
      <span>
        {lang === 'ru'
          ? isLocalHost
            ? 'Локальный API (порт 3001) недоступен. Запустите: cd Insider_academy && npm run dev:all — или откройте прод: '
            : 'API недоступен. Откройте Academy на продакшене: '
          : isLocalHost
            ? 'Local API (port 3001) is offline. Run: cd Insider_academy && npm run dev:all — or use production: '
            : 'API is offline. Open the production app: '}
        {!isLocalHost && (
          <a href={PRODUCTION_APP} className={styles.prodLink}>{PRODUCTION_APP.replace('https://', '')}</a>
        )}
        {isLocalHost && (
          <a href={PRODUCTION_APP} className={styles.prodLink}>{PRODUCTION_APP.replace('https://', '')}</a>
        )}
      </span>
      {isLocalHost && (
        <code className={styles.hint}>{healthUrl}</code>
      )}
      <button type="button" className={styles.retryBtn} onClick={() => refresh()}>
        {lang === 'ru' ? 'Повторить подключение' : 'Retry connection'}
      </button>
    </div>
  )
}
