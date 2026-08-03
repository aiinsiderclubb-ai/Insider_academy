import { useEffect, useRef } from 'react'
import styles from './AuthVisual.module.css'

/**
 * «Жидкий шёлк» — flow-field из тысяч светящихся нитей.
 * Частицы текут по полю псевдо-шума и оставляют тающие следы —
 * получается переливающаяся шёлковая ткань в духе liquid-chrome
 * артов бренда (violet → magenta → ember + sage).
 * Курсор вкручивает в ткань вихрь.
 */
export function AuthVisual() {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return undefined

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = canvas.getContext('2d')
    let raf = 0
    let W = 0
    let H = 0
    let dpr = 1

    const N = 1900
    const parts = []
    const spawn = (p) => {
      p.x = Math.random() * W
      p.y = Math.random() * H
      p.px = p.x
      p.py = p.y
      p.life = 120 + Math.random() * 220
      p.speed = 0.9 + Math.random() * 1.3
      p.w = 1 + Math.random() * 1.6
      return p
    }
    for (let i = 0; i < N; i++) parts.push(spawn({}))

    const mouse = { active: false, x: 0, y: 0 }

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 1.75)
      W = rect.width
      H = rect.height
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      for (const p of parts) spawn(p)
      ctx.clearRect(0, 0, W, H)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const onMove = (e) => {
      const rect = wrap.getBoundingClientRect()
      mouse.active = true
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onLeave = () => { mouse.active = false }
    window.addEventListener('mousemove', onMove)
    wrap.addEventListener('mouseleave', onLeave)

    // поле направлений: сумма крупных синусоид → плавные вихри-волны
    const field = (x, y, t) => {
      const v =
        Math.sin(x * 0.0016 + t * 0.00042) +
        Math.cos(y * 0.0019 - t * 0.00031) +
        Math.sin((x + y) * 0.0009 + t * 0.0002) +
        Math.cos((x - y) * 0.0007)
      return v * 1.05 // радианы
    }

    // цветовая полоса ткани: violet база, magenta/ember/sage прожилки
    const strokeFor = (x, y, t, alpha) => {
      const band =
        Math.sin(x * 0.0011 - y * 0.0014 + t * 0.00022) +
        Math.sin((x + y) * 0.0006 - t * 0.00013)
      if (band > 1.15) return `hsla(24, 92%, 64%, ${alpha})`   // ember
      if (band > 0.55) return `hsla(322, 88%, 66%, ${alpha})`  // magenta
      if (band < -1.25) return `hsla(95, 55%, 66%, ${alpha * 0.8})` // sage
      const l = 60 + band * 8
      return `hsla(262, 85%, ${l}%, ${alpha})`                 // violet
    }

    let t = 0
    const step = (drawAlpha) => {
      for (const p of parts) {
        p.px = p.x
        p.py = p.y
        let a = field(p.x, p.y, t)
        // вихрь вокруг курсора
        if (mouse.active) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const d2 = dx * dx + dy * dy
          if (d2 < 48400) { // 220px
            const d = Math.sqrt(d2) || 1
            const k = 1 - d / 220
            a += Math.atan2(dy, dx) * 0 + k * 2.2 // подкрут
          }
        }
        p.x += Math.cos(a) * p.speed
        p.y += Math.sin(a) * p.speed
        p.life -= 1
        if (p.life <= 0 || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
          spawn(p)
          continue
        }
        ctx.strokeStyle = strokeFor(p.x, p.y, t, drawAlpha)
        ctx.lineWidth = p.w
        ctx.beginPath()
        ctx.moveTo(p.px, p.py)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }
    }

    const frame = () => {
      t += 1

      // тающие следы: стираем прозрачностью, канвас остаётся прозрачным
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0, 0, 0, 0.016)'
      ctx.fillRect(0, 0, W, H)

      // рисуем свет аддитивно
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = 'round'
      step(0.16)

      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(frame)
    }

    if (reduce) {
      // статичный «шёлковый» кадр: длинный прогон без анимации
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = 'round'
      for (let k = 0; k < 160; k++) {
        t += 1
        step(0.09)
      }
      ctx.globalCompositeOperation = 'source-over'
    } else {
      frame()
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('mousemove', onMove)
      wrap.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div ref={wrapRef} className={styles.visual} aria-hidden>
      <div className={styles.silkGlow} />
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.vignette} />
      <div className={styles.caption}>
        <span className={styles.captionTop}>AI INSIDER</span>
        <span className={styles.captionSub}>Learn the future</span>
      </div>
    </div>
  )
}
