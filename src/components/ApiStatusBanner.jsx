import { useApi } from '../context/ApiContext'
import { useLanguage } from '../context/LanguageContext'
import { getApiBase } from '../api/client'
import styles from './ApiStatusBanner.module.css'

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
            ? 'Сервер API недоступен — отзывы и покупки не сохраняются. В папке проекта выполните: cd Insider_academy && npm run dev:all (нужны порты 3001 и 5173).'
            : 'Сервер API недоступен. Откройте продакшен: insider-academy-vsxg.vercel.app или проверьте VITE_API_URL на Vercel.'
          : isLocalHost
            ? 'API is offline. From the project folder run: cd Insider_academy && npm run dev:all (ports 3001 and 5173).'
            : 'API is offline. Use the Vercel deployment or check VITE_API_URL.'}
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
