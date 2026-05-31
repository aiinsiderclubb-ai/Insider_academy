import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useCourses } from '../context/CoursesContext'
import { getCourseField, formatCourseDuration } from '../data/courses'
import { LEARNING_STAGES, ACADEMY_PRINCIPLES } from '../data/learningMap'
import { getCourseTheme } from '../data/courseThemes'
import { ScrollReveal } from '../components/ScrollReveal'
import styles from './LearningMap.module.css'

function CourseCard({ courseId, lang, expanded, onToggle, getCourseById }) {
  const course = getCourseById(courseId)
  if (!course) return null
  const theme = getCourseTheme(courseId)
  const title = getCourseField(course, 'title', lang)
  const short = getCourseField(course, 'shortDescription', lang)
  const price = course.priceEur === 0
    ? (lang === 'ru' ? 'Бесплатно' : 'Free')
    : `${course.priceEur} €`
  const tools = course.tools || []
  const skills = course.skills || course.goals?.slice(0, 4) || []

  return (
    <article className={styles.courseCard} style={{ '--stage-accent': theme.accent }}>
      <button type="button" className={styles.courseHead} onClick={onToggle} aria-expanded={expanded}>
        <span className={styles.courseIcon}>{theme.icon}</span>
        <div className={styles.courseMeta}>
          <strong>{title}</strong>
          <span className={styles.coursePrice}>{price} · {formatCourseDuration(course, lang)}</span>
        </div>
        <span className={styles.chevron}>{expanded ? '▾' : '▸'}</span>
      </button>
      {expanded && (
        <div className={styles.courseBody}>
          <p>{short}</p>
          {course.forAudience?.length > 0 && (
            <p className={styles.audience}>
              <strong>{lang === 'ru' ? 'Для кого:' : 'For:'}</strong>{' '}
              {(lang === 'en' ? course.forAudienceEn : course.forAudience)?.join(', ')}
            </p>
          )}
          {skills.length > 0 && (
            <>
              <strong className={styles.blockLabel}>{lang === 'ru' ? 'Навыки' : 'Skills'}</strong>
              <ul className={styles.tagList}>
                {skills.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </>
          )}
          {tools.length > 0 && (
            <>
              <strong className={styles.blockLabel}>{lang === 'ru' ? 'Инструменты' : 'Tools'}</strong>
              <div className={styles.toolRow}>
                {tools.map((t) => <span key={t} className={styles.toolChip}>{t}</span>)}
              </div>
            </>
          )}
          <p className={styles.format}>
            📹 {lang === 'ru' ? 'Формат: записанные видеоуроки · асинхронно' : 'Format: pre-recorded · self-paced'}
          </p>
          {course.finalProject && (
            <p className={styles.project}>
              🎯 {lang === 'ru' ? 'Проект:' : 'Capstone:'} {lang === 'en' && course.finalProjectEn ? course.finalProjectEn : course.finalProject}
            </p>
          )}
          <Link to={`/courses/${course.slug}`} className={styles.courseLink}>
            {lang === 'ru' ? 'Открыть курс →' : 'Open course →'}
          </Link>
        </div>
      )}
    </article>
  )
}

export function LearningMap() {
  const { lang } = useLanguage()
  const { courses, getCourseById } = useCourses()
  const [openStage, setOpenStage] = useState('stage-1')
  const [openCourse, setOpenCourse] = useState(null)

  const principles = lang === 'en' ? ACADEMY_PRINCIPLES.en : ACADEMY_PRINCIPLES.ru

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.pill}>AI Insider Academy</span>
          <h1 className={styles.title}>{lang === 'ru' ? 'Карта обучения' : 'Learning map'}</h1>
          <p className={styles.subtitle}>{principles}</p>
          <div className={styles.stats}>
            <span>{courses.length} {lang === 'ru' ? 'программ' : 'programs'}</span>
            <span>3 {lang === 'ru' ? 'этапа' : 'stages'}</span>
            <span>100% {lang === 'ru' ? 'асинхронно' : 'async'}</span>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.timeline}>
          {LEARNING_STAGES.map((stage, idx) => {
            const open = openStage === stage.id
            return (
              <ScrollReveal key={stage.id} delay={idx * 80}>
                <section className={styles.stage} style={{ '--stage-accent': stage.accent }}>
                  <button
                    type="button"
                    className={styles.stageHead}
                    onClick={() => setOpenStage(open ? null : stage.id)}
                  >
                    <span className={styles.stageNum}>{stage.order}</span>
                    <div>
                      <h2>{lang === 'en' && stage.titleEn ? stage.titleEn : stage.title}</h2>
                      <p>{lang === 'en' && stage.subtitleEn ? stage.subtitleEn : stage.subtitle}</p>
                    </div>
                    <span className={styles.stageCount}>{stage.courseIds.length}</span>
                  </button>
                  {open && (
                    <div className={styles.stageBody}>
                      {stage.courseIds.map((id) => (
                        <CourseCard
                          key={id}
                          courseId={id}
                          lang={lang}
                          expanded={openCourse === id}
                          onToggle={() => setOpenCourse((prev) => (prev === id ? null : id))}
                          getCourseById={getCourseById}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </ScrollReveal>
            )
          })}
        </div>

        <aside className={styles.ctaBox}>
          <h3>{lang === 'ru' ? 'Начните бесплатно' : 'Start for free'}</h3>
          <p>{lang === 'ru' ? 'Этап 1 — три бесплатные программы без оплаты.' : 'Stage 1 — three free programs, no payment.'}</p>
          <Link to="/courses/ai-start" className={styles.ctaBtn}>{lang === 'ru' ? 'AI Starter Week →' : 'AI Starter Week →'}</Link>
          <Link to="/courses" className={styles.ctaSecondary}>{lang === 'ru' ? 'Весь каталог' : 'Full catalog'}</Link>
        </aside>
      </div>
    </div>
  )
}
