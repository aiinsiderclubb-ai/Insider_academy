import styles from './LoadingSpinner.module.css'

export function LoadingSpinner({ fullPage = false, label = 'Загрузка…' }) {
  return (
    <div className={fullPage ? styles.fullPage : styles.inline} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  )
}
