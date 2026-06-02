import { useApi } from '../context/ApiContext'
import { useLanguage } from '../context/LanguageContext'
import { getApiBase } from '../api/client'
import styles from './ApiStatusBanner.module.css'

const ACADEMY_URL = 'https://myinsideracademy.com'

const isLocalHost = typeof window !== 'undefined'
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

export function ApiStatusBanner() {
  const { online, showOfflineBanner, refresh } = useApi()
  const { lang } = useLanguage()

  if (!showOfflineBanner || online === null || online) return null

  const healthUrl = `${getApiBase()}/health`

  return (
    <div className={styles.banner} role="status">
      <span>
        {lang === 'ru'
          ? isLocalHost
            ? 'Бэкенд недоступен. Запустите: npm run dev:all — или откройте '
            : 'Не удаётся подключиться к API. Подождите 1–2 мин (сервер просыпается) или обновите страницу. Сайт: '
          : isLocalHost
            ? 'Backend unreachable. Run npm run dev:all — or open '
            : 'Cannot reach the API. Wait ~1 min or refresh. Site: '}
        <a href={ACADEMY_URL} className={styles.prodLink}>{ACADEMY_URL.replace('https://', '')}</a>
      </span>
      {isLocalHost && (
        <code className={styles.hint}>{healthUrl}</code>
      )}
      <button type="button" className={styles.retryBtn} onClick={() => refresh({ wake: true, userRetry: true })}>
        {lang === 'ru' ? 'Повторить подключение' : 'Retry connection'}
      </button>
    </div>
  )
}
