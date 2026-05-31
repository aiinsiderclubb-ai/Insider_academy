import styles from './SkeletonLoader.module.css'

export function CourseCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden>
      <div className={`${styles.block} ${styles.image}`} />
      <div className={`${styles.block} ${styles.title}`} />
      <div className={`${styles.block} ${styles.line}`} />
      <div className={`${styles.block} ${styles.lineShort}`} />
      <div className={styles.meta}>
        <div className={`${styles.block} ${styles.metaItem}`} />
        <div className={`${styles.block} ${styles.metaItem}`} />
      </div>
    </div>
  )
}

export function CourseGridSkeleton({ count = 6 }) {
  return (
    <div className={styles.grid} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  )
}
