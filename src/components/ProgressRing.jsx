import { useEffect, useState } from 'react'
import styles from './ProgressRing.module.css'

export function ProgressRing({ percent = 0, size = 44, stroke = 3, children, className = '' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const target = Math.min(100, Math.max(0, percent))
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const reduce = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setDisplay(target)
      return undefined
    }
    setDisplay(0)
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setDisplay(target))
    })
    return () => cancelAnimationFrame(id)
  }, [target])

  const offset = c - (display / 100) * c

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
