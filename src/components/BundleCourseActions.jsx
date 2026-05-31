import { Link } from 'react-router-dom'
import { getAcceleratorApplicationUrl } from '../data/promo'
import styles from './BundleCourseActions.module.css'

export function BundleCourseActions({
  courseSlug,
  lang,
  showLearnMore = true,
  variant = 'default',
  className = '',
}) {
  const applyUrl = getAcceleratorApplicationUrl()
  const learnLabel = lang === 'ru' ? 'Узнать детальнее' : 'Learn more'
  const applyLabel = lang === 'ru' ? 'Подать заявку' : 'Apply'
  const applyTitle = !applyUrl
    ? (lang === 'ru' ? 'Ссылка на анкету скоро будет доступна' : 'Application link coming soon')
    : undefined

  return (
    <div className={`${styles.wrap} ${styles[variant] || ''} ${className}`.trim()}>
      {showLearnMore && courseSlug && (
        <Link to={`/courses/${courseSlug}`} className={styles.learnBtn}>
          {learnLabel}
        </Link>
      )}
      {applyUrl ? (
        <a
          href={applyUrl}
          className={styles.applyBtn}
          target="_blank"
          rel="noopener noreferrer"
        >
          {applyLabel} →
        </a>
      ) : (
        <span className={`${styles.applyBtn} ${styles.applyBtnDisabled}`} title={applyTitle}>
          {applyLabel} →
        </span>
      )}
    </div>
  )
}
