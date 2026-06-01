import { useApi } from '../context/ApiContext'
import { useLanguage } from '../context/LanguageContext'
import { getApiBase } from '../api/client'
import styles from './ApiStatusBanner.module.css'

const PRODUCTION_APP = 'https://insiderai.it.com'
const PRODUCTION_API = 'https://insider-academy.onrender.com/api'

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
            ? 'Бэкенд (Render) недоступен. Запустите локально: npm run dev:all — или сайт: '
            : 'Не удаётся подключиться к API на Render. Проверьте интернет или подождите 1–2 мин (сервер просыпается). API: '
          : isLocalHost
            ? 'Backend (Render) is unreachable. Run npm run dev:all locally — or: '
            : 'Cannot reach the API on Render. Check your connection or wait ~1 min. API: '}
        <a href={PRODUCTION_API} className={styles.prodLink} target="_blank" rel="noreferrer">
          {PRODUCTION_API.replace('https://', '')}
        </a>
        {!isLocalHost && (
          <>
            {' · '}
            <a href={PRODUCTION_APP} className={styles.prodLink}>{PRODUCTION_APP.replace('https://', '')}</a>
          </>
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
