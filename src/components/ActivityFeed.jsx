import { Link } from 'react-router-dom'
import { UiIcon } from './UiIcon'
import styles from './ActivityFeed.module.css'

const TONE_LABEL = {
  live: { ru: 'Live', en: 'Live' },
  giveaway: { ru: 'Giveaway', en: 'Giveaway' },
  challenge: { ru: 'Challenge', en: 'Challenge' },
  product: { ru: 'Drop', en: 'Drop' },
}

function formatAgo(at, lang) {
  const mins = Math.max(1, Math.round((Date.now() - at) / 60000))
  if (mins < 60) return lang === 'ru' ? `${mins}м` : `${mins}m`
  const hours = Math.round(mins / 60)
  if (hours < 24) return lang === 'ru' ? `${hours}ч` : `${hours}h`
  const days = Math.round(hours / 24)
  return lang === 'ru' ? `${days}д` : `${days}d`
}

export function ActivityFeed({ items = [], lang = 'ru', title }) {
  const ru = lang === 'ru'
  if (!items.length) return null

  const visible = items.slice(0, 6)

  return (
    <section className={styles.wrap} aria-label={ru ? 'Лента активности' : 'Activity feed'}>
      <header className={styles.head}>
        <div className={styles.headCopy}>
          <span className={styles.eyebrow}>
            <i className={styles.pulse} aria-hidden />
            live
          </span>
          <h2 className={styles.title}>
            {title || (ru ? 'Сейчас в Academy' : 'Live at Academy')}
          </h2>
        </div>
        <span className={styles.count}>
          {visible.length}
          <span aria-hidden> / </span>
          {ru ? 'событий' : 'events'}
        </span>
      </header>

      <ul className={styles.list}>
        {visible.map((item, index) => {
          const text = ru ? item.textRu : item.textEn
          const tone = item.tone || 'live'
          const label = TONE_LABEL[tone] || TONE_LABEL.live
          const Tag = item.href ? Link : 'div'
          const linkProps = item.href ? { to: item.href } : {}

          return (
            <li
              key={item.id}
              className={`${styles.item} ${styles[tone] || ''} ${index === 0 ? styles.itemLead : ''}`}
            >
              <Tag className={styles.row} {...linkProps}>
                <time className={styles.time} dateTime={new Date(item.at).toISOString()}>
                  {formatAgo(item.at, lang)}
                </time>
                <span className={styles.rail} aria-hidden>
                  <span className={styles.dot} />
                </span>
                <span className={styles.main}>
                  <span className={styles.meta}>
                    <UiIcon name={item.icon || 'circleDot'} size={14} tone="accent" />
                    <span className={styles.kind}>{ru ? label.ru : label.en}</span>
                  </span>
                  <span className={styles.text}>{text}</span>
                </span>
              </Tag>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
