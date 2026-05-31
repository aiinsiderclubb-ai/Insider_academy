import { Link } from 'react-router-dom'
import {
  MAIN_SITE_COURSES,
  MAIN_SITE_URL,
  TELEGRAM_MANAGER,
  PLATFORM_BRIDGE,
} from '../data/siteLinks'
import styles from './PlatformBridge.module.css'

export function PlatformBridge({ lang = 'ru' }) {
  const copy = PLATFORM_BRIDGE[lang] || PLATFORM_BRIDGE.ru

  return (
    <section className={styles.wrap}>
      <div className={styles.inner}>
        <h2 className={styles.title}>{copy.title}</h2>
        <p className={styles.text}>{copy.text}</p>
        <div className={styles.links}>
          <a href={MAIN_SITE_URL} target="_blank" rel="noreferrer noopener" className={styles.linkPrimary}>
            {copy.siteLabel} ↗
          </a>
          <a href={MAIN_SITE_COURSES} target="_blank" rel="noreferrer noopener" className={styles.link}>
            {copy.coursesLabel} ↗
          </a>
          <Link to="/courses" className={styles.link}>
            {copy.academyLabel} →
          </Link>
          <a href={TELEGRAM_MANAGER} target="_blank" rel="noreferrer noopener" className={styles.link}>
            {copy.managerLabel} ↗
          </a>
        </div>
      </div>
    </section>
  )
}
