import { useEffect, useRef } from 'react'
import styles from './TelegramPostEmbed.module.css'

export function TelegramPostEmbed({ embedId, lang }) {
  const hostRef = useRef(null)
  const ru = lang === 'ru'

  useEffect(() => {
    const host = hostRef.current
    if (!host || !embedId) return undefined

    host.innerHTML = ''
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-post', embedId)
    script.setAttribute('data-width', '100%')
    script.setAttribute('data-dark', '1')
    host.appendChild(script)

    return () => {
      host.innerHTML = ''
    }
  }, [embedId])

  if (!embedId) {
    return (
      <div className={styles.fallback}>
        {ru ? 'Ссылка на пост Telegram не настроена' : 'Telegram post URL not configured'}
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div ref={hostRef} className={styles.host} />
    </div>
  )
}
