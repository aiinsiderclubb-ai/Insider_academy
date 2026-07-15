import { useEffect, useMemo, useState } from 'react'
import { Clock3, LockKeyhole } from 'lucide-react'
import { getRelease } from '../config/availability'
import styles from './ComingSoonLock.module.css'

function getRemaining(releaseAt) {
  const target = new Date(releaseAt).getTime()
  const diff = Number.isFinite(target) ? Math.max(0, target - Date.now()) : 0
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function useCountdown(releaseAt) {
  const [remaining, setRemaining] = useState(() => getRemaining(releaseAt))

  useEffect(() => {
    setRemaining(getRemaining(releaseAt))
    const timer = window.setInterval(() => setRemaining(getRemaining(releaseAt)), 1000)
    return () => window.clearInterval(timer)
  }, [releaseAt])

  return remaining
}

function Countdown({ releaseAt, lang, compact = false }) {
  const remaining = useCountdown(releaseAt)
  const ru = lang === 'ru'
  const items = useMemo(() => [
    [remaining.days, ru ? 'дней' : 'days'],
    [remaining.hours, ru ? 'часов' : 'hours'],
    [remaining.minutes, ru ? 'мин' : 'min'],
    [remaining.seconds, ru ? 'сек' : 'sec'],
  ], [remaining, ru])

  return (
    <span className={`${styles.timer} ${compact ? styles.timerCompact : ''}`} aria-hidden="true">
      {items.map(([value, label]) => (
        <span className={styles.timeCell} key={label}>
          <strong>{String(value).padStart(2, '0')}</strong>
          <small>{label}</small>
        </span>
      ))}
    </span>
  )
}

export function ComingSoonLock({ kind = 'courses', lang = 'ru', compact = false, className = '' }) {
  const release = getRelease(kind)
  const ru = lang === 'ru'
  if (!release.enabled) return null

  return (
    <span
      className={`${styles.overlay} ${compact ? styles.compact : ''} ${className}`.trim()}
      role="status"
      aria-label={ru ? 'Материал скоро станет доступен' : 'Coming soon'}
    >
      <span className={styles.scan} aria-hidden="true" />
      <span className={styles.lockOrb} aria-hidden="true">
        <LockKeyhole size={compact ? 19 : 25} strokeWidth={1.8} />
      </span>
      <span className={styles.copy}>
        <strong>{ru ? 'Скоро' : 'Coming soon'}</strong>
        <small><Clock3 size={12} aria-hidden /> {ru ? 'До открытия' : 'Until launch'}</small>
      </span>
      <Countdown releaseAt={release.at} lang={lang} compact={compact} />
    </span>
  )
}

export function ComingSoonAction({ kind = 'courses', lang = 'ru', className = '' }) {
  const release = getRelease(kind)
  if (!release.enabled) return null

  return (
    <span className={`${className} ${styles.action}`.trim()} aria-disabled="true">
      <LockKeyhole size={15} strokeWidth={1.9} aria-hidden />
      {lang === 'ru' ? 'Скоро' : 'Coming soon'}
    </span>
  )
}

export function ComingSoonPage({ kind = 'courses', lang = 'ru', backTo = '/', backLabel }) {
  const release = getRelease(kind)
  const ru = lang === 'ru'

  return (
    <main className={styles.page}>
      <section className={styles.pagePanel}>
        <span className={styles.pageGlow} aria-hidden="true" />
        <span className={styles.pageIcon}><LockKeyhole size={34} strokeWidth={1.6} aria-hidden /></span>
        <span className={styles.pageEyebrow}>{ru ? 'Доступ готовится' : 'Access is being prepared'}</span>
        <h1>{ru ? 'Скоро откроем' : 'Launching soon'}</h1>
        <p>{ru
          ? 'Контент проходит финальную подготовку. Покупка и доступ временно закрыты.'
          : 'Content is in final preparation. Purchase and access are temporarily locked.'}</p>
        <Countdown releaseAt={release.at} lang={lang} />
        <a href={backTo}>{backLabel || (ru ? 'Вернуться в каталог' : 'Back to catalog')}</a>
      </section>
    </main>
  )
}
