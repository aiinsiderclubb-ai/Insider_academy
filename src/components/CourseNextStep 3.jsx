import { Link } from 'react-router-dom'
import styles from './CourseNextStep.module.css'

export function CourseNextStep({
  lang,
  variant,
  lessonIndex,
  nextLessonTitle,
  courseSlug,
}) {
  const ru = lang === 'ru'

  if (variant === 'hw_pending') {
    return (
      <div className={styles.box} data-variant="pending">
        <span className={styles.icon} aria-hidden>📝</span>
        <div>
          <strong>{ru ? 'ДЗ на проверке' : 'Homework under review'}</strong>
          <p>
            {ru
              ? 'Следующий урок откроется после принятия задания.'
              : 'The next lesson unlocks after your homework is accepted.'}
          </p>
        </div>
      </div>
    )
  }

  if (variant === 'hw_required') {
    return (
      <div className={styles.box} data-variant="action">
        <span className={styles.icon} aria-hidden>✋</span>
        <div>
          <strong>{ru ? 'Сдайте домашнее задание' : 'Submit homework'}</strong>
          <p>
            {ru
              ? 'Чтобы открыть следующий урок, отправьте ДЗ по текущему.'
              : 'Submit homework for this lesson to unlock the next one.'}
          </p>
        </div>
      </div>
    )
  }

  if (variant === 'certificate') {
    return (
      <div className={styles.box} data-variant="success">
        <span className={styles.icon} aria-hidden>🎓</span>
        <div>
          <strong>{ru ? 'Курс почти завершён' : 'Almost done'}</strong>
          <p>
            {ru
              ? 'Завершите оставшиеся уроки и получите сертификат в кабинете.'
              : 'Finish remaining lessons and get your certificate in the cabinet.'}
          </p>
          <Link to="/cabinet#certificates" className={styles.link}>
            {ru ? 'Мои сертификаты →' : 'My certificates →'}
          </Link>
        </div>
      </div>
    )
  }

  if (variant === 'next_lesson' && nextLessonTitle) {
    return (
      <div className={styles.box} data-variant="next">
        <span className={styles.icon} aria-hidden>▶</span>
        <div>
          <strong>{ru ? 'Следующий урок' : 'Next lesson'}</strong>
          <p>{nextLessonTitle}</p>
          <Link to={`/courses/${courseSlug}?lesson=${lessonIndex}`} className={styles.link}>
            {ru ? 'Перейти →' : 'Go →'}
          </Link>
        </div>
      </div>
    )
  }

  return null
}
