import styles from './CourseCover.module.css'

export function CourseCover({ src, alt = '', courseId, className = '', showBrand = true }) {
  return (
    <div className={`${styles.wrap} ${className}`} data-course={courseId}>
      <img src={src} alt={alt} className={styles.image} loading="lazy" />
      <div className={styles.overlay} aria-hidden />
      {showBrand && <span className={styles.brand}>AI Insider</span>}
    </div>
  )
}
