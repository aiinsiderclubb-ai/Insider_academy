import { Link } from 'react-router-dom'
import { getCourseField, formatCourseDuration, getCourseDescription } from '../data/courses'
import { isAcceleratorCourse } from '../data/courseCatalog'
import { getCourseThemeStyle } from '../data/courseThemes'
import { CourseCover } from './CourseCover'
import { BundleCourseActions } from './BundleCourseActions'
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
  const isBundle = isAcceleratorCourse(course)
  const isFree = (course.priceEur ?? 0) === 0
  const price = course.priceEur ?? Math.round((course.price || 0) / 100)

  const metaRight = priceLabel ?? (
    isFree
      ? (isBundle ? (lang === 'ru' ? 'По заявке' : 'Apply') : (lang === 'ru' ? 'Бесплатно' : 'Free'))
      : `${price} €`
  )

  const cardBody = (
    <>
      <div className={styles.imageWrap}>
        <CourseCover src={course.image} courseId={course.id} showBrand={false} />
        {purchased && !isFree && percent != null && completedLabel && (
          <span className={styles.progressBadge}>{percent}% {completedLabel}</span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.badges}>
          <span className={styles.category}>{category}</span>
          {isBundle && <span className={styles.tagBundle}>{lang === 'ru' ? 'Набор' : 'Bundle'}</span>}
          {isFree && !isBundle && <span className={styles.tagFree}>{lang === 'ru' ? 'Бесплатно' : 'Free'}</span>}
          {!isFree && !isBundle && <span className={styles.tagPro}>Pro</span>}
        </div>

        <h2 className={styles.title}>{title}</h2>
        <p className={styles.desc}>{description}</p>

        {isBundle ? (
          <BundleCourseActions
            courseSlug={course.slug}
            lang={lang}
            variant="compact"
            className={styles.bundleActions}
          />
        ) : (
          <div className={styles.meta}>
            <span>{duration}</span>
            {actionLabel ? (
              <span className={styles.action}>{actionLabel}</span>
            ) : (
              <span className={isFree ? styles.priceFree : styles.price}>{metaRight}</span>
            )}
          </div>
        )}
      </div>
    </>
  )

  if (isBundle) {
    return (
      <article className={styles.card} style={getCourseThemeStyle(course.id, theme)}>
        {cardBody}
      </article>
    )
  }

  return (
    <Link
      to={`/courses/${course.slug}`}
      className={styles.card}
      style={getCourseThemeStyle(course.id, theme)}
    >
      {cardBody}
    </Link>
  )
}
