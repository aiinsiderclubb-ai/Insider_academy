import { Link } from 'react-router-dom'
import { ACCELERATOR_APPLY_PATH } from '../data/acceleratorApplication'
import styles from './BundleCourseActions.module.css'

export function BundleCourseActions({
  courseSlug,
  lang,
  showLearnMore = true,
  variant = 'default',
  className = '',
}) {
  const learnLabel = lang === 'ru' ? 'Узнать детальнее' : 'Learn more'
  const applyLabel = lang === 'ru' ? 'Подать заявку' : 'Apply'

  return (
    <div className={`${styles.wrap} ${styles[variant] || ''} ${className}`.trim()}>
      {showLearnMore && courseSlug && (
        <Link to={`/courses/${courseSlug}`} className={styles.learnBtn}>
          {learnLabel}
        </Link>
      )}
      <Link to={ACCELERATOR_APPLY_PATH} className={styles.applyBtn}>
        {applyLabel} →
      </Link>
    </div>
  )
}
