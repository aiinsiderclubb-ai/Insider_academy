import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, checkApiOnline } from '../api/client'
import { getFeaturedReviews } from '../api/adminStore'
import { SEED_REVIEW_ROLES } from '../data/seedReviews'
import { ScrollReveal } from './ScrollReveal'
import { StaggerReveal } from './StaggerReveal'
import { StarRating } from './StarRating'
import { UiIcon } from './UiIcon'
import styles from './HomeReviewsSection.module.css'

function courseTitle(review, lang) {
  return lang === 'en' && review.courseTitleEn ? review.courseTitleEn : review.courseTitle
}

export function HomeReviewsSection({ lang }) {
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const payload = (await checkApiOnline())
          ? await api.getFeaturedReviews(9)
          : getFeaturedReviews(9)
        if (!cancelled) setReviews(payload.reviews || [])
      } catch {
        if (!cancelled) setReviews(getFeaturedReviews(9).reviews || [])
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (reviews.length === 0) return null

  return (
    <ScrollReveal
      as="section"
      className={styles.section}
      aria-label={lang === 'ru' ? 'Отзывы студентов' : 'Student reviews'}
    >
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
        </div>

        <StaggerReveal className={styles.masonry} stagger={60}>
          {reviews.map((r, i) => {
            const seedRole = SEED_REVIEW_ROLES[r.id]
            const role = lang === 'ru'
              ? (r.role || seedRole?.role)
              : (r.roleEn || r.role || seedRole?.roleEn)
            return (
              <article
                key={r.id}
                className={`${styles.card} ${i % 3 === 1 ? styles.cardTall : ''} ${i % 5 === 0 ? styles.cardShort : ''}`}
              >
                <Link to={`/courses/${r.courseSlug}`} className={styles.courseBadge}>
                  <UiIcon name="bookOpen" variant="chip" tone="accent" />
                  <span className={styles.courseBadgeText}>{courseTitle(r, lang)}</span>
                </Link>
                <div className={styles.cardTop}>
                  <div className={styles.avatar}>{(r.userName || 'U')[0].toUpperCase()}</div>
                  <div className={styles.meta}>
                    <strong>{r.userName || (lang === 'ru' ? 'Студент' : 'Student')}</strong>
                    {role && <span className={styles.role}>{role}</span>}
                  </div>
                  <StarRating rating={r.rating} className={styles.stars} />
                </div>
                <p className={styles.text}>{r.text}</p>
              </article>
            )
          })}
        </StaggerReveal>
      </div>
    </ScrollReveal>
  )
}
