import { IconSend } from './Icons'
import { ScrollReveal } from './ScrollReveal'
import styles from './TelegramWidget.module.css'

export function TelegramWidget({ lang, compact = false }) {
  return (
    <ScrollReveal>
      <section className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
        <div className={styles.iconWrap} aria-hidden>
          <IconSend />
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>
            {lang === 'ru' ? 'Telegram-сообщество AI Insider' : 'AI Insider Telegram community'}
          </h3>
          <p className={styles.desc}>
            {lang === 'ru'
              ? 'Новости, разборы, поддержка и нетворкинг с единомышленниками.'
              : 'News, breakdowns, support and networking with like-minded people.'}
          </p>
        </div>
        <a
          href="https://t.me/tribute/app?startapp=ph8e"
          target="_blank"
          rel="noreferrer noopener"
          className={styles.btn}
        >
          {lang === 'ru' ? 'Вступить в клуб' : 'Join the club'}
        </a>
      </section>
    </ScrollReveal>
  )
}
