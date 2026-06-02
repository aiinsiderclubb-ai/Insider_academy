import styles from './StarRating.module.css'

export function StarRating({ rating = 0, max = 5, className = '' }) {
  const n = Math.min(max, Math.max(0, Number(rating) || 0))
  return (
    <span className={`${styles.wrap} ${className}`} aria-label={`${n}/${max}`}>
      <span className={styles.filled}>{'★'.repeat(n)}</span>
      {n < max && <span className={styles.dim}>{'★'.repeat(max - n)}</span>}
    </span>
  )
}
