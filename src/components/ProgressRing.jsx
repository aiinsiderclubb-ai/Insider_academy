import styles from './ProgressRing.module.css'

export function ProgressRing({ percent = 0, size = 44, stroke = 3, children, className = '' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c

  return (
    <div className={`${styles.wrap} ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className={styles.svg} aria-hidden>
        <circle
          className={styles.track}
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
        />
        <circle
          className={styles.progress}
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.inner}>{children}</div>
    </div>
  )
}
