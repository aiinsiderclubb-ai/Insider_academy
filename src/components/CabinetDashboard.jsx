import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCourses } from '../context/CoursesContext'
import { useProgress } from '../context/ProgressContext'
import { getCourseField } from '../data/courses'
import { pickContinueTarget } from '../utils/continueLearning'
import { getMarketplaceFavorites } from '../utils/marketplaceFavorites'
import { getMarketplaceProduct } from '../data/marketplace/products'
import { getActiveGiveaways } from '../data/giveaways'
import { getUpcomingEvents } from '../data/events'
import { TELEGRAM_COMMUNITY } from '../data/siteLinks'
import { UiIcon } from './UiIcon'
import styles from './CabinetDashboard.module.css'

export function CabinetDashboard({ lang, notifications = [], unreadCount = 0, giveawayCount = null }) {
  const ru = lang === 'ru'
  const { purchases } = useAuth()
  const { courses } = useCourses()
  const { getPercent, getProgress } = useProgress()

  const target = pickContinueTarget({ purchases, courses, getPercent, getProgress })
  const favorites = getMarketplaceFavorites()
    .map((id) => getMarketplaceProduct(id))
    .filter(Boolean)
    .slice(0, 3)
  const giveaway = getActiveGiveaways()[0] || null
  const nextEvent = getUpcomingEvents()[0] || null
  const recentNotifs = notifications.filter((n) => !n.read).slice(0, 3)

  const goalTitle = target?.course
    ? getCourseField(target.course, 'title', lang)
    : null
  const lesson = target?.course?.lessons?.[target.lessonIndex]
  const lessonTitle = lesson
    ? (lang === 'en' && lesson.titleEn ? lesson.titleEn : lesson.title)
    : null

  return (
    <section className={styles.dash} aria-label={ru ? 'Обзор кабинета' : 'Cabinet overview'}>
      <div className={styles.head}>
        <h2 className={styles.title}>{ru ? 'Домашняя база' : 'Home base'}</h2>
        <p className={styles.lead}>
          {ru
            ? 'Цель на сегодня, уведомления, избранное и ближайшие события.'
            : 'Today’s goal, notifications, favorites and upcoming events.'}
        </p>
      </div>

      <div className={styles.grid}>
        <article className={`${styles.card} ${styles.goalCard}`}>
          <span className={styles.label}>{ru ? 'Сегодняшняя цель' : 'Today’s goal'}</span>
          {goalTitle ? (
            <>
              <h3 className={styles.cardTitle}>{goalTitle}</h3>
              {lessonTitle && (
                <p className={styles.meta}>
                  {ru ? 'Урок' : 'Lesson'} {target.lessonIndex + 1}: {lessonTitle}
                </p>
              )}
              <div className={styles.progressLine}>
                <div className={styles.progressFill} style={{ width: `${target.percent || 0}%` }} />
              </div>
              <Link
                to={`/courses/${target.course.slug}?lesson=${target.lessonIndex}`}
                className={styles.cta}
              >
                {ru ? 'Продолжить →' : 'Continue →'}
              </Link>
            </>
          ) : (
            <>
              <h3 className={styles.cardTitle}>{ru ? 'Начните бесплатный курс' : 'Start a free course'}</h3>
              <p className={styles.meta}>{ru ? 'AI Starter Week — 7 дней основ' : 'AI Starter Week — 7 days'}</p>
              <Link to="/courses/ai-start?lesson=0" className={styles.cta}>
                {ru ? 'Начать →' : 'Start →'}
              </Link>
            </>
          )}
        </article>

        <article className={styles.card}>
          <span className={styles.label}>
            {ru ? 'Уведомления' : 'Notifications'}
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </span>
          {recentNotifs.length === 0 ? (
            <p className={styles.meta}>{ru ? 'Пока тихо — всё прочитано.' : 'All quiet — you’re caught up.'}</p>
          ) : (
            <ul className={styles.notifList}>
              {recentNotifs.map((n) => (
                <li key={n.id}>
                  <Link to={n.targetPath || '/cabinet'}>{n.message || n.type}</Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={styles.card}>
          <span className={styles.label}>{ru ? 'Избранное Marketplace' : 'Marketplace favorites'}</span>
          {favorites.length === 0 ? (
            <>
              <p className={styles.meta}>{ru ? 'Пока пусто — сохраните товары в избранное' : 'Empty — save products to favorites'}</p>
              <Link to="/marketplace" className={styles.link}>{ru ? 'Открыть Marketplace' : 'Open Marketplace'}</Link>
            </>
          ) : (
            <ul className={styles.favList}>
              {favorites.map((p) => (
                <li key={p.id}>
                  <Link to={`/marketplace/${p.slug}`}>
                    {p.coverIcon} {ru ? p.titleRu : p.titleEn}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={styles.card}>
          <span className={styles.label}>{ru ? 'Розыгрыш' : 'Giveaway'}</span>
          {giveaway ? (
            <>
              <h3 className={styles.cardTitle}>{ru ? giveaway.prizeRu : giveaway.prizeEn}</h3>
              <p className={styles.meta}>
                {giveawayCount != null
                  ? (ru ? `${giveawayCount} участников` : `${giveawayCount} participants`)
                  : (ru ? giveaway.tagRu : giveaway.tagEn)}
              </p>
              <Link to={`/giveaway/${giveaway.slug}`} className={styles.cta}>
                {ru ? 'К розыгрышу →' : 'Open giveaway →'}
              </Link>
            </>
          ) : (
            <p className={styles.meta}>{ru ? 'Сейчас нет активного розыгрыша' : 'No active giveaway'}</p>
          )}
        </article>

        <article className={`${styles.card} ${styles.eventCard}`}>
          <span className={styles.label}>{ru ? 'Ближайший эфир / AMA' : 'Next live / AMA'}</span>
          {nextEvent ? (
            <>
              <h3 className={styles.cardTitle}>
                <UiIcon name={nextEvent.icon} variant="inline" size={18} tone="accent" />
                {' '}{ru ? nextEvent.titleRu : nextEvent.titleEn}
              </h3>
              <p className={styles.meta}>{ru ? nextEvent.dateRu : nextEvent.dateEn}</p>
              <a href={TELEGRAM_COMMUNITY} target="_blank" rel="noreferrer noopener" className={styles.link}>
                {ru ? 'Анонс в Telegram →' : 'Telegram announcement →'}
              </a>
            </>
          ) : (
            <p className={styles.meta}>{ru ? 'Следите за анонсами в Telegram' : 'Watch Telegram for announcements'}</p>
          )}
        </article>
      </div>
    </section>
  )
}
