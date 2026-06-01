import { Link } from 'react-router-dom'
import { IconBook } from './Icons'
import { getCourseField, getCourseDescription } from '../data/courses'
import { getCourseTheme, getCourseThemeStyle } from '../data/courseThemes'
import { useTheme } from '../context/ThemeContext'
import styles from './CourseHero.module.css'

export function CourseHero({
  course,
  lang,
  backTo,
  backLabel,
  children,
  compact = false,
}) {
  const { theme } = useTheme()
  const themeStyle = getCourseThemeStyle(course.id, theme)
  const accent = getCourseTheme(course.id)
  const title = getCourseField(course, 'title', lang)
  const subtitle = getCourseField(course, 'subtitle', lang)
  const description = getCourseDescription(course, lang)
  const category = getCourseField(course, 'category', lang)
  const lessonsCount = course.lessons?.length ?? 0

  return (
    <section
      className={`${styles.hero} ${compact ? styles.heroCompact : ''}`}
      style={themeStyle}
      aria-label={title}
    >
      <div className={styles.bgImage} style={{ backgroundImage: `url(${course.image})` }} aria-hidden />
      <div className={styles.bgOverlay} aria-hidden />
      <div className={styles.orbs} aria-hidden>
        <span className={styles.orb1} />
        <span className={styles.orb2} />
        <span className={styles.orb3} />
      </div>

      <div className={styles.inner}>
        {backTo && (
          <Link to={backTo} className={styles.back}>
            <span className={styles.backArrow} aria-hidden>←</span>
            {backLabel || title}
          </Link>
        )}

        <div className={styles.content}>
          <div className={styles.badges}>
            <span className={styles.badgeCategory}>{category}</span>
            {course.level && (
              <span className={styles.badgeLevel}>{course.level}</span>
            )}
            {course.isFreeTrial && (
              <span className={styles.badgeFree}>
                {lang === 'ru' ? 'Бесплатно' : 'Free'}
              </span>
            )}
          </div>

          <div className={styles.titleRow}>
            <span className={styles.icon} aria-hidden>{accent.icon}</span>
            <h1 className={styles.title}>{title}</h1>
          </div>

          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {!compact && description && <p className={styles.desc}>{description}</p>}

          <div className={styles.meta}>
            <span className={styles.metaChip}>
              <IconBook size={16} />
              {lessonsCount} {lang === 'ru' ? 'уроков' : 'lessons'}
            </span>
          </div>

          {children}
        </div>

        {!compact && (
          <div className={styles.heroImageWrap}>
            <img src={course.image} alt="" className={styles.heroImage} loading="eager" />
            <div className={styles.imageGlow} aria-hidden />
          </div>
        )}
      </div>
    </section>
  )
}
