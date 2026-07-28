import { useEffect, useRef } from 'react'
import styles from './HeroShowcase.module.css'

const PARTICLES = 420
const LINK_DIST = 46

/**
 * «Нейро-ядро» — живая 3D-сфера из частиц на canvas.
 * Вращается, тянется за курсором, ближние частицы связываются нитями.
 * Палитра бренда: violet → magenta → ember + редкие sage-искры.
 */
export function HeroShowcase({ lang = 'ru' }) {
  const ru = lang === 'ru'
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return undefined

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const compact = window.matchMedia('(max-width: 720px)').matches
    const particleCount = compact ? 120 : PARTICLES
    const ctx = canvas.getContext('2d')
    let raf = 0
    let W = 0
    let H = 0
    let dpr = 1

    // частицы на сфере — распределение Фибоначчи
    const pts = []
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < particleCount; i++) {
      const y = 1 - (i / (particleCount - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const th = golden * i
      const roll = Math.random()
      pts.push({
        x: Math.cos(th) * r,
        y,
        z: Math.sin(th) * r,
        // 78% violet-magenta, 12% ember, 10% sage
        hue: roll < 0.78 ? 262 + Math.random() * 40 : roll < 0.9 ? 24 : 95,
        size: 0.8 + Math.random() * 1.4,
        tw: Math.random() * Math.PI * 2,
      })
    }

    let rotX = 0.35
    let rotY = 0
    let targX = 0.35
    let velY = 0.0028
    const mouse = { active: false, x: 0, y: 0 }

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = rect.width
      H = rect.height
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const onMove = (e) => {
      const rect = wrap.getBoundingClientRect()
      mouse.active = true
      mouse.x = (e.clientX - rect.left) / rect.width - 0.5
      mouse.y = (e.clientY - rect.top) / rect.height - 0.5
    }
    const onLeave = () => { mouse.active = false }
    wrap.addEventListener('mousemove', onMove)
    wrap.addEventListener('mouseleave', onLeave)

    let t = 0
    const proj = new Array(particleCount)
    let visible = !document.hidden
    const onVisibility = () => { visible = !document.hidden }
    document.addEventListener('visibilitychange', onVisibility)

    const frame = () => {
      if (!visible) {
        raf = requestAnimationFrame(frame)
        return
      }
      t += 1
      const cx = W / 2
      const cy = H / 2
      const R = Math.min(W, H) * 0.34

      // управление вращением
      if (mouse.active) {
        targX = 0.35 + mouse.y * 0.9
        velY += (0.0028 + mouse.x * 0.012 - velY) * 0.04
      } else {
        targX = 0.35
        velY += (0.0028 - velY) * 0.02
      }
      rotX += (targX - rotX) * 0.05
      rotY += velY

      ctx.clearRect(0, 0, W, H)

      // ядро
      const pulse = 1 + Math.sin(t * 0.02) * 0.06
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.85 * pulse)
      core.addColorStop(0, 'rgba(168, 130, 255, 0.34)')
      core.addColorStop(0.35, 'rgba(139, 92, 246, 0.16)')
      core.addColorStop(0.7, 'rgba(217, 76, 165, 0.06)')
      core.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = core
      ctx.fillRect(0, 0, W, H)

      const sinY = Math.sin(rotY)
      const cosY = Math.cos(rotY)
      const sinX = Math.sin(rotX)
      const cosX = Math.cos(rotX)

      // проекция
      for (let i = 0; i < particleCount; i++) {
        const p = pts[i]
        const x1 = p.x * cosY - p.z * sinY
        const z1 = p.x * sinY + p.z * cosY
        const y1 = p.y * cosX - z1 * sinX
        const z2 = p.y * sinX + z1 * cosX
        const scale = 1 / (1.65 + z2 * 0.62)
        proj[i] = {
          sx: cx + x1 * R * 1.55 * scale,
          sy: cy + y1 * R * 1.55 * scale,
          depth: z2,
          p,
        }
      }

      // нити между ближними (только передняя полусфера)
      ctx.lineWidth = 0.6
      for (let i = 0; i < particleCount; i += 2) {
        const a = proj[i]
        if (a.depth > 0.15) continue
        for (let j = i + 2; j < Math.min(i + 40, particleCount); j += 2) {
          const b = proj[j]
          if (b.depth > 0.15) continue
          const dx = a.sx - b.sx
          const dy = a.sy - b.sy
          const d2 = dx * dx + dy * dy
          if (d2 < LINK_DIST * LINK_DIST) {
            const alpha = 0.14 * (1 - Math.sqrt(d2) / LINK_DIST)
            ctx.strokeStyle = `hsla(${a.p.hue}, 80%, 72%, ${alpha})`
            ctx.beginPath()
            ctx.moveTo(a.sx, a.sy)
            ctx.lineTo(b.sx, b.sy)
            ctx.stroke()
          }
        }
      }

      // частицы
      for (let i = 0; i < particleCount; i++) {
        const q = proj[i]
        const front = 1 - (q.depth + 1) / 2 // 1 спереди, 0 сзади
        const twinkle = 0.72 + Math.sin(t * 0.04 + q.p.tw) * 0.28
        const alpha = (0.1 + front * 0.85) * twinkle
        const size = q.p.size * (0.55 + front * 0.9)
        ctx.fillStyle = `hsla(${q.p.hue}, 85%, ${62 + front * 16}%, ${alpha})`
        ctx.beginPath()
        ctx.arc(q.sx, q.sy, size, 0, 6.2832)
        ctx.fill()
      }

      if (!reduce) raf = requestAnimationFrame(frame)
    }
    frame()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      wrap.removeEventListener('mousemove', onMove)
      wrap.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div ref={wrapRef} className={styles.zone}>
      <div className={styles.halo} aria-hidden />
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden />
      <div className={styles.coreLabel} aria-hidden>
        <span className={styles.coreLabelTop}>AI</span>
        <span className={styles.coreLabelSub}>INSIDER CORE</span>
      </div>

      <div className={`${styles.chip} ${styles.chipTl}`}>
        <strong>24/7</strong>
        <span>{ru ? 'доступ к платформе' : 'platform access'}</span>
      </div>
      <div className={`${styles.chip} ${styles.chipTr}`}>
        <strong>60+</strong>
        <span>{ru ? 'уроков практики' : 'hands-on lessons'}</span>
      </div>
      <div className={`${styles.chip} ${styles.chipBr}`}>
        <strong>6</strong>
        <span>{ru ? 'AI-направлений' : 'AI tracks'}</span>
      </div>
      <div className={styles.caption}>
        <span className={styles.captionDot} aria-hidden />
        {ru ? 'Уроки, агенты и автоматизации — в одном ядре' : 'Lessons, agents and automations — one core'}
      </div>
    </div>
  )
}
