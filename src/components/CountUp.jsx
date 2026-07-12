import { useEffect, useState } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'

function parseTarget(value) {
  const str = String(value)
  const match = str.match(/^(\d+)(.*)$/)
  if (!match) return { target: 0, suffix: str, numeric: false }
  return { target: Number(match[1]), suffix: match[2] || '', numeric: true }
}

/**
 * Count-up when entering viewport. Duration 1s, once. Respects prefers-reduced-motion.
 */
export function CountUp({ value, duration = 1000, className = '' }) {
  const { target, suffix, numeric } = parseTarget(value)
  const { ref, visible } = useScrollReveal({ threshold: 0.35, rootMargin: '0px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!visible || !numeric) return undefined

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setDisplay(target)
      return undefined
    }

    let raf = 0
    const start = performance.now()

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      // Approximate cubic-bezier(0.16, 1, 0.3, 1)
      const eased = 1 - Math.pow(1 - t, 3.2)
      setDisplay(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible, target, duration, numeric])

  if (!numeric) {
    return <span className={className}>{value}</span>
  }

  return (
    <span ref={ref} className={className}>
      {display}{suffix}
    </span>
  )
}
