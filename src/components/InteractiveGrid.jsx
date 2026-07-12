import { useEffect, useRef, useState } from 'react'
import styles from './InteractiveGrid.module.css'

/**
 * Thin interactive grid for hero — opacity 0.15, mouse parallax.
 * Disabled on touch / reduced-motion.
 */
export function InteractiveGrid({ className = '' }) {
  const ref = useRef(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mqFine = window.matchMedia('(pointer: fine)')
    const mqDesktop = window.matchMedia('(min-width: 768px)')

    const sync = () => {
      setEnabled(!mqReduce.matches && mqFine.matches && mqDesktop.matches)
    }
    sync()
    mqReduce.addEventListener('change', sync)
    mqFine.addEventListener('change', sync)
    mqDesktop.addEventListener('change', sync)
    return () => {
      mqReduce.removeEventListener('change', sync)
      mqFine.removeEventListener('change', sync)
      mqDesktop.removeEventListener('change', sync)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return undefined
    const el = ref.current
    if (!el) return undefined

    let raf = 0
    const onMove = (e) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 16
        el.style.setProperty('--px', `${x.toFixed(2)}px`)
        el.style.setProperty('--py', `${y.toFixed(2)}px`)
      })
    }
    const onLeave = () => {
      el.style.setProperty('--px', '0px')
      el.style.setProperty('--py', '0px')
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      ref={ref}
      className={`${styles.grid} ${className}`}
      aria-hidden
    />
  )
}
