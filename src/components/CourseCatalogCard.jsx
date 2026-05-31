import { Link } from 'react-router-dom'
import { getCourseField, formatCourseDuration, getCourseDescription, getLessonDisplayTitle } from '../data/courses'
import { isAcceleratorCourse } from '../data/courseCatalog'
import { getCourseThemeStyle } from '../data/courseThemes'
import { CourseCover } from './CourseCover'
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
  const isIntake = isAcceleratorCourse(course)
  const isFree = (course.priceEur ?? 0) === 0 && !isIntake
  const price = course.priceEur ?? Math.round((course.price || 0) / 100)

  const metaRight = priceLabel ?? (
    isIntake
      ? (lang === 'ru' ? 'По заявке' : 'Apply')
      : isFree
        ? (lang === 'ru' ? 'Бесплатно' : 'Free')
        : `${price} €`
  )

  return (
    <Link
      to={`/courses/${course.slug}`}
      className={styles.card}
      style={getCourseThemeStyle(course.id, theme)}
    >
      <div className={styles.imageWrap}>
        <CourseCover src={course.image} courseId={course.id} showBrand={false} />
        {purchased && !isFree && !isIntake && percent != null && completedLabel && (
          <span className={styles.progressBadge}>{percent}% {completedLabel}</span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.badges}>
          <span className={styles.category}>{category}</span>
          {isIntake && (
            <span className={styles.tagBundle}>{lang === 'ru' ? 'Набор' : 'Intake'}</span>
          )}
          {isFree && <span className={styles.tagFree}>{lang === 'ru' ? 'Бесплатно' : 'Free'}</span>}
          {!isFree && !isIntake && <span className={styles.tagPro}>Pro</span>}
        </div>

        <h2 className={styles.title}>{title}</h2>
        <p className={styles.desc}>{description}</p>

        {course.lessons?.length > 0 && (
          <ul className={styles.lessonPreview} aria-label={lang === 'ru' ? 'Программа' : 'Program'}>
            {course.lessons.slice(0, 4).map((lesson, index) => (
              <li key={lesson.id || index}>
                <span className={styles.lessonNum}>{index + 1}</span>
                {getLessonDisplayTitle(lesson, lang)}
              </li>
            ))}
            {course.lessons.length > 4 && (
              <li className={styles.lessonMore}>
                +{course.lessons.length - 4} {lang === 'ru' ? 'уроков' : 'lessons'}
              </li>
            )}
          </ul>
        )}

        <div className={styles.meta}>
          <span>{duration}</span>
          {actionLabel ? (
            <span className={styles.action}>{actionLabel}</span>
          ) : (
            <span className={isFree ? styles.priceFree : isIntake ? styles.priceIntake : styles.price}>
              {metaRight}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
