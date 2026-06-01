import { Link, useLocation } from 'react-router-dom'
import styles from './FloatingHotOffer.module.css'

export function FloatingHotOffer({ lang, courseSlug }) {
  const { pathname } = useLocation()
  const onHome = pathname === '/'
  const hiddenPaths = ['/register', '/login', '/admin']
  if (hiddenPaths.some((p) => pathname.startsWith(p))) return null

  const handleClick = () => {
    const el = document.getElementById('super-offer')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (courseSlug) {
      window.location.href = `/courses/${courseSlug}`
    }
  }

  if (!onHome && !courseSlug) return null

  const label =
    lang === 'ru' ? 'Горящее предложение — набор' : 'Hot offer — bundle'

  if (onHome) {
    return (
      <button
        type="button"
        className={styles.fab}
        onClick={handleClick}
        title={label}
        aria-label={label}
      >
        <span className={styles.fabIcon} aria-hidden>
          🔥
        </span>
        <span className={styles.fabRing} aria-hidden />
      </button>
    )
  }

  return (
    <Link
      to={`/courses/${courseSlug}`}
      className={styles.fab}
      title={label}
      aria-label={label}
    >
      <span className={styles.fabIcon} aria-hidden>
        🔥
      </span>
      <span className={styles.fabRing} aria-hidden />
    </Link>
  )
}
