import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Star } from 'lucide-react'
import { api, checkApiOnline } from '../api/client'
import { getFeaturedReviews } from '../api/adminStore'
import { SEED_REVIEW_ROLES } from '../data/seedReviews'
import { REVIEW_SCREENSHOTS } from '../data/reviewScreenshots'
import { TELEGRAM_COMMUNITY } from '../data/siteLinks'
import { ScrollReveal } from './ScrollReveal'
import { StarRating } from './StarRating'
import { UiIcon } from './UiIcon'
import styles from './HomeReviewsSection.module.css'

function courseTitle(review, lang) {
  return lang === 'en' && review.courseTitleEn ? review.courseTitleEn : review.courseTitle
}

function formatReviewDate(dateStr, lang) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })
}

function ReviewBubble({ review, lang }) {
  const seedRole = SEED_REVIEW_ROLES[review.id]
  const role = lang === 'ru'
    ? (review.role || seedRole?.role)
    : (review.roleEn || review.role || seedRole?.roleEn)
  const date = formatReviewDate(review.date, lang)

  return (
    <article className={styles.bubble}>
      <div className={styles.bubbleTop}>
        <div className={styles.avatar} aria-hidden>{(review.userName || 'U')[0].toUpperCase()}</div>
        <div className={styles.meta}>
          <strong className={styles.name}>{review.userName || (lang === 'ru' ? 'Студент' : 'Student')}</strong>
          {role && <span className={styles.role}>{role}</span>}
        </div>
        <StarRating rating={review.rating} className={styles.stars} />
      </div>
      <p className={styles.text}>{review.text}</p>
      <div className={styles.bubbleFoot}>
        <Link to={`/courses/${review.courseSlug}`} className={styles.courseChip}>
          <UiIcon name="bookOpen" variant="chip" tone="accent" />
          <span>{courseTitle(review, lang)}</span>
        </Link>
        {date && <time className={styles.date}>{date}</time>}
      </div>
      <span className={styles.bubbleTail} aria-hidden />
    </article>
  )
}

export function HomeReviewsSection({ lang }) {
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const payload = (await checkApiOnline())
          ? await api.getFeaturedReviews(12)
          : getFeaturedReviews(12)
        if (!cancelled) setReviews(payload.reviews || [])
      } catch {
        if (!cancelled) setReviews(getFeaturedReviews(12).reviews || [])
      }
    })()
    return () => { cancelled = true }
  }, [])

  const { rowA, rowB, avgRating } = useMemo(() => {
    // максимум 6 карточек на ряд: каждый ряд дублируется для бесшовной ленты,
    // больше — тяжёлая отрисовка на слабых устройствах
    const pool = reviews.slice(0, 12)
    const mid = Math.ceil(pool.length / 2)
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
    return {
      rowA: pool.slice(0, mid),
      rowB: pool.slice(mid),
      avgRating: reviews.length ? (sum / reviews.length).toFixed(1).replace('.', lang === 'ru' ? ',' : '.') : null,
    }
  }, [reviews, lang])

  if (reviews.length === 0) return null

  const renderRow = (items, reverse) => (
    <div className={`${styles.marquee} ${reverse ? styles.marqueeReverse : ''}`}>
      <div className={styles.marqueeTrack}>
        {items.map((r) => <ReviewBubble key={r.id} review={r} lang={lang} />)}
        {items.map((r) => (
          <div key={`dup-${r.id}`} aria-hidden className={styles.dup}>
            <ReviewBubble review={r} lang={lang} />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <ScrollReveal
      as="section"
      className={styles.section}
      aria-label={lang === 'ru' ? 'Отзывы студентов' : 'Student reviews'}
    >
      <div className={styles.container}>
        <div className={styles.head}>
          <div className={styles.headText}>
            <span className={styles.pill}>
              <Send size={12} strokeWidth={2.2} aria-hidden />
              {lang === 'ru' ? 'Из нашего Telegram-канала' : 'From our Telegram channel'}
            </span>
            <h2 className={styles.title}>{lang === 'ru' ? 'Что говорят студенты' : 'What students say'}</h2>
            <p className={styles.desc}>
              {lang === 'ru'
                ? 'Живые отзывы выпускников — как они приходят к нам в Telegram, с указанием программы.'
                : 'Real graduate feedback — the way it lands in our Telegram, with program labels.'}
            </p>
          </div>
          <div className={styles.headStats}>
            {avgRating && (
              <div className={styles.statBox}>
                <span className={styles.statValue}>
                  <Star size={16} className={styles.statStar} aria-hidden />
                  {avgRating}
                </span>
                <span className={styles.statLabel}>{lang === 'ru' ? 'средняя оценка' : 'average rating'}</span>
              </div>
            )}
            <div className={styles.statBox}>
              <span className={styles.statValue}>{reviews.length}+</span>
              <span className={styles.statLabel}>{lang === 'ru' ? 'отзывов на витрине' : 'featured reviews'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.marqueeZone}>
        {renderRow(rowA, false)}
        {rowB.length > 0 && renderRow(rowB, true)}
      </div>

      {REVIEW_SCREENSHOTS.length > 0 && (
        <div className={styles.container}>
          <div className={styles.shotsHead}>
            <h3 className={styles.shotsTitle}>{lang === 'ru' ? 'Скриншоты — без монтажа' : 'Screenshots — unedited'}</h3>
            <p className={styles.shotsDesc}>
              {lang === 'ru' ? 'Прямо из канала, как есть.' : 'Straight from the channel, as is.'}
            </p>
          </div>
          <div className={styles.shots}>
            {REVIEW_SCREENSHOTS.map((shot) => (
              <figure key={shot.src} className={styles.shotFrame}>
                <img src={shot.src} alt={shot.alt || ''} loading="lazy" />
              </figure>
            ))}
          </div>
        </div>
      )}

      <div className={`${styles.container} ${styles.ctaRow}`}>
        <a className={styles.tgCta} href={TELEGRAM_COMMUNITY} target="_blank" rel="noreferrer noopener">
          <Send size={17} strokeWidth={2} aria-hidden />
          {lang === 'ru' ? 'Читать все отзывы в Telegram' : 'Read all reviews on Telegram'}
        </a>
      </div>
    </ScrollReveal>
  )
}
