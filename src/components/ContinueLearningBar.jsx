import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCourses } from '../context/CoursesContext'
import { useProgress } from '../context/ProgressContext'
import { useLanguage } from '../context/LanguageContext'
import { getCourseField } from '../data/courses'
import { pickContinueTarget } from '../utils/continueLearning'
import { ProgressRing } from './ProgressRing'
import styles from './ContinueLearningBar.module.css'

export function ContinueLearningBar() {
  const { user, purchases } = useAuth()
  const { courses } = useCourses()
  const { getPercent, getProgress } = useProgress()
  const { lang } = useLanguage()

  if (!user) return null

  const target = pickContinueTarget({ purchases, courses, getPercent, getProgress })
  if (!target?.course) return null

  const { course, lessonIndex, percent } = target
  const title = getCourseField(course, 'title', lang)
  const lesson = course.lessons?.[lessonIndex]
  const lessonTitle = lesson
    ? lang === 'en' && lesson.titleEn
      ? lesson.titleEn
      : lesson.title
    : null

  return (
    <Link
      to={`/courses/${course.slug}?lesson=${lessonIndex}`}
      className={styles.bar}
    >
      <ProgressRing percent={percent} size={40} stroke={3}>
        <span className={styles.ringPct}>{percent}%</span>
      </ProgressRing>
      <div className={styles.text}>
        <span className={styles.label}>
          {lang === 'ru' ? 'Продолжить обучение' : 'Continue learning'}
        </span>
        <strong className={styles.course}>{title}</strong>
        {lessonTitle && (
          <span className={styles.lesson}>
            {lang === 'ru' ? 'Урок' : 'Lesson'} {lessonIndex + 1}: {lessonTitle}
          </span>
        )}
      </div>
      <span className={styles.arrow} aria-hidden>→</span>
    </Link>
  )
}
