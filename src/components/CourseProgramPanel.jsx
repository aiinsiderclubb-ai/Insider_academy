import { getLessonDisplayTitle, getLessonDescription } from '../data/courses'
import styles from './CourseProgramPanel.module.css'

export function CourseProgramPanel({
  lessons,
  lang,
  selectedLesson,
  onSelectLesson,
  canSelectLesson,
  lessonStatus,
  lessonAvailable,
  isFreeTrial,
  purchased,
}) {
  if (!lessons?.length) {
    return (
      <p className={styles.empty}>
        {lang === 'ru' ? 'Содержание курса будет добавлено.' : 'Course content will be added.'}
      </p>
    )
  }

  return (
    <ul className={styles.list}>
      {lessons.map((lesson, index) => {
        const available = lessonAvailable(index)
        const status = lessonStatus(index)
        const active = selectedLesson === index
        const disabled = !canSelectLesson(index)
        const description = getLessonDescription(lesson, lang)

        return (
          <li key={lesson.id}>
            <button
              type="button"
              className={`${styles.item} ${active ? styles.itemActive : ''} ${disabled ? styles.itemDisabled : ''}`}
              onClick={() => !disabled && onSelectLesson(index)}
              disabled={disabled}
              aria-current={active ? 'true' : undefined}
            >
              <span className={styles.num}>{index + 1}</span>
              <span className={styles.content}>
                <span className={styles.title}>{getLessonDisplayTitle(lesson, lang)}</span>
                {description && <span className={styles.desc}>{description}</span>}
              </span>
              <span className={styles.status} aria-hidden>
                {isFreeTrial && <span className={styles.statusOpen}>●</span>}
                {!isFreeTrial && index === 0 && <span className={styles.statusFree}>●</span>}
                {!isFreeTrial && index > 0 && !purchased && <span className={styles.statusLock}>🔒</span>}
                {!isFreeTrial && purchased && status === 'open' && <span className={styles.statusOpen}>●</span>}
                {!isFreeTrial && purchased && status === 'review' && <span className={styles.statusReview}>◐</span>}
                {!isFreeTrial && purchased && status === 'homework' && !available && <span className={styles.statusLock}>🔒</span>}
                {!isFreeTrial && purchased && status === 'homework' && available && <span className={styles.statusHomework}>!</span>}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
