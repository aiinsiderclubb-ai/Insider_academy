import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Workflow,
} from 'lucide-react'
import { getCourseField, getCourseDescription } from '../data/courses'
import { getCourseThemeStyle } from '../data/courseThemes'
import { useTheme } from '../context/ThemeContext'
import styles from './CourseHero.module.css'

export function getCourseVisual(course) {
  const key = `${course?.id || ''} ${course?.slug || ''} ${course?.category || ''}`.toLowerCase()
  if (key.includes('agent') || key.includes('voice') || key.includes('conversational')) {
    return '/design/course-ai-agents.webp'
  }
  if (key.includes('automation') || key.includes('n8n')) {
    return '/design/course-ai-automation.webp'
  }
  if (key.includes('content') || key.includes('business') || key.includes('agency') || key.includes('saas')) {
    return '/design/course-ai-content-business.webp'
  }
  return '/design/course-ai-data.webp'
}

function getCourseIcon(course) {
  const key = `${course?.id || ''} ${course?.slug || ''} ${course?.category || ''}`.toLowerCase()
  if (key.includes('agent') || key.includes('voice') || key.includes('conversational')) return Bot
  if (key.includes('automation') || key.includes('n8n')) return Workflow
  if (key.includes('content') || key.includes('business') || key.includes('agency') || key.includes('saas')) {
    return BriefcaseBusiness
  }
  return ChartNoAxesCombined
}

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
  const visual = getCourseVisual(course)
  const CourseIcon = getCourseIcon(course)
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
      <div className={styles.bgImage} style={{ backgroundImage: `url(${visual})` }} aria-hidden />
      <div className={styles.bgOverlay} aria-hidden />
      <div className={styles.orbs} aria-hidden>
        <span className={styles.orb1} />
        <span className={styles.orb2} />
        <span className={styles.orb3} />
      </div>

      <div className={styles.inner}>
        {backTo && (
          <Link to={backTo} className={styles.back}>
            <ArrowLeft className={styles.backArrow} size={15} aria-hidden />
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
            <span className={styles.icon} aria-hidden>
              <CourseIcon size={18} strokeWidth={1.8} />
            </span>
            <h1 className={styles.title}>{title}</h1>
          </div>

          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {!compact && description && <p className={styles.desc}>{description}</p>}

          <div className={styles.meta}>
            <span className={styles.metaChip}>
              <BookOpen size={16} aria-hidden />
              {lessonsCount} {lang === 'ru' ? 'уроков' : 'lessons'}
            </span>
          </div>

          {children}
        </div>

        {!compact && (
          <div className={styles.heroImageWrap}>
            <img src={visual} alt="" className={styles.heroImage} loading="eager" />
            <div className={styles.imageGlow} aria-hidden />
          </div>
        )}
      </div>
    </section>
  )
}
