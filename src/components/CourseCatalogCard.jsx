import { Link } from 'react-router-dom'
import { getCourseField, formatCourseDuration, getCourseDescription } from '../data/courses'
import { isAcceleratorCourse } from '../data/courseCatalog'
import { getCourseThemeStyle } from '../data/courseThemes'
import { CourseCover } from './CourseCover'
import { CourseBuyAction } from './CourseBuyAction'
import { ProductBadge } from './ProductBadge'
import { getCourseDesignCover } from '../utils/designAssets'
import { ComingSoonLock } from './ComingSoonLock'
import { isComingSoon } from '../config/availability'
import styles from './CourseCatalogCard.module.css'

export function CourseCatalogCard({
  course,
  lang,
  theme,
  purchased = false,
  percent,
  completedLabel,
  priceLabel,
  actionLabel,
  featured = false,
  mediaOnly = false,
}) {
  const title = getCourseField(course, 'title', lang)
  const description = getCourseDescription(course, lang)
  const category = getCourseField(course, 'category', lang)
  const duration = formatCourseDuration(course, lang)
  const isIntake = isAcceleratorCourse(course)
  const isFree = (course.priceEur ?? 0) === 0 && !isIntake
  const price = course.priceEur ?? Math.round((course.price || 0) / 100)
  const oldPrice = course.oldPriceEur && course.oldPriceEur > price ? course.oldPriceEur : null
  const level = course.level === 'Pro'
    ? (lang === 'ru' ? 'Продвинутый' : 'Advanced')
    : (lang === 'ru' ? 'Базовый' : 'Beginner')
  const detailsPath = `/courses/${course.slug}`
  const cover = getCourseDesignCover(course)
  const comingSoon = isComingSoon('courses')
  const primaryPath = isIntake
    ? `/courses/${course.slug}/apply`
    : isFree
      ? detailsPath
      : `/courses/${course.slug}/buy`

  const primaryLabel = actionLabel || (
    isIntake
      ? (lang === 'ru' ? 'Подать заявку' : 'Apply')
      : isFree
        ? (lang === 'ru' ? 'Начать бесплатно' : 'Start free')
        : (lang === 'ru' ? 'Купить' : 'Buy')
  )

  return (
    <article
      className={`${styles.card} ${featured ? styles.featured : ''} ${mediaOnly ? styles.mediaOnly : ''}`}
      style={getCourseThemeStyle(course.id, theme)}
    >
      <Link to={detailsPath} className={styles.imageWrap} aria-label={title}>
        <CourseCover src={cover} courseId={course.id} showBrand={false} />
        <span className={styles.coverLabel}>AI INSIDER / {level}</span>
        {course.badge && <ProductBadge type={course.badge} lang={lang} />}
        {purchased && !isFree && !isIntake && percent != null && completedLabel && (
          <span className={styles.progressBadge}>
            <span className={styles.progressText}>{percent}% {completedLabel}</span>
            <span className={styles.progressTrack} aria-hidden>
              <span className={styles.progressFill} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
            </span>
          </span>
        )}
      </Link>

      {!mediaOnly && (
        <div className={styles.body}>
          <div className={styles.metaTop}>
            <span className={styles.metaChip}>{duration}</span>
            <span className={styles.metaChip}>
              {lang === 'ru' ? '100% асинхронно' : '100% async'}
            </span>
          </div>

          <div className={styles.badges}>
            <span className={styles.category}>{category}</span>
            {isIntake && (
              <span className={styles.tagBundle}>{lang === 'ru' ? 'Набор' : 'Intake'}</span>
            )}
            {isFree && <span className={styles.tagFree}>{lang === 'ru' ? 'Бесплатно' : 'Free'}</span>}
            {!isFree && !isIntake && <span className={styles.tagPro}>Pro</span>}
          </div>

          <h2 className={styles.title}>
            <Link to={detailsPath}>{title}</Link>
          </h2>
          <p className={styles.desc}>{description}</p>

          <div className={styles.meta}>
            <span>{duration}</span>
            <span className={styles.metaDot} aria-hidden>·</span>
            <span>{level}</span>
          </div>

          {!isFree && !isIntake && (
            <div className={styles.priceBlock}>
              <div className={styles.priceRow}>
                <span className={styles.priceMain}>{priceLabel || `${price}€`}</span>
                {oldPrice && !priceLabel && (
                  <span className={styles.priceOld}>{oldPrice}€</span>
                )}
              </div>
              <span className={styles.priceNote}>
                {lang === 'ru' ? 'Оплата частями без комиссии' : 'Split payments, no fees'}
              </span>
            </div>
          )}

          <div className={styles.actions}>
            <CourseBuyAction
              course={course}
              className={styles.buyBtn}
              fallbackPath={primaryPath}
            >
              {primaryLabel}
            </CourseBuyAction>
            <Link to={detailsPath} className={styles.detailsBtn}>
              {lang === 'ru' ? 'Подробнее' : 'Details'}
            </Link>
          </div>
        </div>
      )}
      {comingSoon && <ComingSoonLock kind="courses" lang={lang} />}
    </article>
  )
}
