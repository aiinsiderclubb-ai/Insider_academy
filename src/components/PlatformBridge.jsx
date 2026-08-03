import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Bot, GraduationCap, MessageCircle } from 'lucide-react'
import {
  MAIN_SITE_URL,
  TELEGRAM_MANAGER,
  PLATFORM_BRIDGE,
} from '../data/siteLinks'
import { ScrollReveal } from './ScrollReveal'
import styles from './PlatformBridge.module.css'

export function PlatformBridge({ lang = 'ru' }) {
  const copy = PLATFORM_BRIDGE[lang] || PLATFORM_BRIDGE.ru
  const ru = lang === 'ru'

  return (
    <ScrollReveal as="section" className={styles.wrap} aria-label={copy.title}>
      <div className={styles.card}>
        <div className={styles.glow} aria-hidden />
        <div className={styles.intro}>
          <span className={styles.eyebrow}>{ru ? 'Экосистема' : 'Ecosystem'}</span>
          <h2 className={styles.title}>{copy.title}</h2>
          <p className={styles.text}>
            {ru
              ? 'Два ресурса — один аккаунт. Оплата на любом из них открывает обучение здесь.'
              : 'Two resources — one account. A purchase on either unlocks learning here.'}
          </p>
          <a
            href={TELEGRAM_MANAGER}
            target="_blank"
            rel="noreferrer noopener"
            className={styles.managerChip}
          >
            <MessageCircle size={15} aria-hidden />
            {copy.managerLabel}
          </a>
        </div>

        <div className={styles.destinations}>
          <a
            href={MAIN_SITE_URL}
            target="_blank"
            rel="noreferrer noopener"
            className={`${styles.dest} ${styles.destSite}`}
          >
            <span className={styles.destIcon}><Bot size={22} strokeWidth={1.8} aria-hidden /></span>
            <span className={styles.destBody}>
              <span className={styles.destName}>insiderai.it.com</span>
              <span className={styles.destDesc}>
                {ru ? 'Chat-Bot · Voice Agent · VIP-менторство' : 'Chat-Bot · Voice Agent · VIP mentorship'}
              </span>
            </span>
            <ArrowUpRight size={19} className={styles.destArrow} aria-hidden />
          </a>
          <Link to="/courses" className={`${styles.dest} ${styles.destAcademy}`}>
            <span className={styles.destIcon}><GraduationCap size={22} strokeWidth={1.8} aria-hidden /></span>
            <span className={styles.destBody}>
              <span className={styles.destName}>Academy</span>
              <span className={styles.destDesc}>
                {ru ? 'Видеоуроки · домашки · сертификаты' : 'Video lessons · homework · certificates'}
              </span>
            </span>
            <ArrowRight size={19} className={styles.destArrow} aria-hidden />
          </Link>
        </div>
      </div>
    </ScrollReveal>
  )
}
