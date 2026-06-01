import { Link } from 'react-router-dom'
import { getCourseField, formatCourseDuration, getCourseDescription } from '../data/courses'
import { isAcceleratorCourse } from '../data/courseCatalog'
import { getCourseThemeStyle } from '../data/courseThemes'
import { CourseCover } from './CourseCover'
import { CourseBuyAction } from './CourseBuyAction'
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
}) {
  const title = getCourseField(course, 'title', lang)
  const description = getCourseDescription(course, lang)
  const category = getCourseField(course, 'category', lang)
  const duration = formatCourseDuration(course, lang)
    .replace(/\s*\([^)]*(?:мин|min)[^)]*\)/i, '')
    .trim()
  const isIntake = isAcceleratorCourse(course)
  const isFree = (course.priceEur ?? 0) === 0 && !isIntake
  const price = course.priceEur ?? Math.round((course.price || 0) / 100)
  const detailsPath = `/courses/${course.slug}`
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
      className={styles.card}
      style={getCourseThemeStyle(course.id, theme)}
    >
      <Link to={detailsPath} className={styles.imageWrap} aria-label={title}>
        <CourseCover src={course.image} courseId={course.id} showBrand={false} />
        {purchased && !isFree && !isIntake && percent != null && completedLabel && (
          <span className={styles.progressBadge}>{percent}% {completedLabel}</span>
        )}
      </Link>

      <div className={styles.body}>
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
        </div>

        {!isFree && !isIntake && (
          <div className={styles.priceBlock}>
            <span className={styles.priceMain}>{priceLabel || `${price}€`}</span>
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
    </article>
  )
}
