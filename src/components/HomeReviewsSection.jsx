import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, checkApiOnline } from '../api/client'
import { getFeaturedReviews } from '../api/adminStore'
import { ScrollReveal } from './ScrollReveal'
import { StarRating } from './StarRating'
import styles from './HomeReviewsSection.module.css'

function formatDate(iso, lang) {
  try {
    return new Date(iso).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function courseTitle(review, lang) {
  return lang === 'en' && review.courseTitleEn ? review.courseTitleEn : review.courseTitle
}

export function HomeReviewsSection({ lang }) {
  const [data, setData] = useState({ reviews: [], average: null, count: 0 })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const payload = (await checkApiOnline())
          ? await api.getFeaturedReviews(9)
          : getFeaturedReviews(9)
        if (!cancelled) setData(payload)
      } catch {
        if (!cancelled) setData(getFeaturedReviews(9))
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (data.reviews.length === 0) return null

  return (
    <ScrollReveal>
      <section className={styles.section} aria-label={lang === 'ru' ? 'Отзывы студентов' : 'Student reviews'}>
        <div className={styles.container}>
          <div className={styles.head}>
            <div>
              <span className={styles.pill}>{lang === 'ru' ? 'Отзывы' : 'Reviews'}</span>
              <h2 className={styles.title}>{lang === 'ru' ? 'Что говорят студенты' : 'What students say'}</h2>
              <p className={styles.desc}>
                {lang === 'ru'
                  ? 'Реальные отзывы после прохождения курсов — с указанием программы.'
                  : 'Real reviews from course graduates — with program labels.'}
              </p>
            </div>
            {data.average != null && data.count > 0 && (
              <div className={styles.score}>
                <span className={styles.scoreValue}>{data.average}</span>
                <span className={styles.scoreStars}>{'★'.repeat(Math.round(data.average))}</span>
                <span className={styles.scoreCount}>{data.count} {lang === 'ru' ? 'отзывов' : 'reviews'}</span>
              </div>
            )}
          </div>

          <div className={styles.grid}>
            {data.reviews.map((r) => (
              <article key={r.id} className={styles.card}>
                <Link to={`/courses/${r.courseSlug}`} className={styles.courseBadge}>
                  <span className={styles.courseBadgeIcon} aria-hidden>📚</span>
                  <span className={styles.courseBadgeText}>{courseTitle(r, lang)}</span>
                </Link>
                <div className={styles.cardTop}>
                  <div className={styles.avatar}>{(r.userName || 'U')[0].toUpperCase()}</div>
                  <div className={styles.meta}>
                    <strong>{r.userName || (lang === 'ru' ? 'Студент' : 'Student')}</strong>
                    <span className={styles.date}>{formatDate(r.date, lang)}</span>
                  </div>
                  <StarRating rating={r.rating} className={styles.stars} />
                </div>
                <p className={styles.text}>{r.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}
