import { useApi } from '../context/ApiContext'
import { useLanguage } from '../context/LanguageContext'
import styles from './ApiStatusBanner.module.css'

export function ApiStatusBanner() {
  const { online } = useApi()
  const { lang } = useLanguage()

  if (online === null || online) return null

  return (
    <div className={styles.banner} role="status">
      {lang === 'ru'
        ? 'Сервер недоступен — работаем в офлайн-режиме (localStorage). Запустите API: npm run dev:all'
        : 'Server offline — using local storage. Start API: npm run dev:all'}
    </div>
  )
}
