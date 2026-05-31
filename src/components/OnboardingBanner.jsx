import { Link } from 'react-router-dom'
import styles from './OnboardingBanner.module.css'

export function OnboardingBanner({ course, lang, onDismiss }) {
  const firstLesson = course.lessons?.[0]

  return (
    <div className={styles.banner} role="alert">
      <div className={styles.icon} aria-hidden>🎉</div>
      <div className={styles.content}>
        <h2 className={styles.title}>
          {lang === 'ru' ? 'Оплата прошла успешно!' : 'Payment successful!'}
        </h2>
        <p className={styles.text}>
          {lang === 'ru'
            ? `Шаг 1: начните с урока «${firstLesson?.title || 'Введение'}»`
            : `Step 1: start with "${firstLesson?.titleEn || firstLesson?.title || 'Introduction'}"`}
        </p>
        <Link
          to={`/courses/${course.slug}?lesson=0`}
          className={styles.btn}
          onClick={onDismiss}
        >
          {lang === 'ru' ? 'Смотреть первый урок →' : 'Watch first lesson →'}
        </Link>
      </div>
      <button type="button" className={styles.close} onClick={onDismiss} aria-label="Close">×</button>
    </div>
  )
}
