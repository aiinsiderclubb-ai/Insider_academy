import { useEffect, useRef } from 'react'
import styles from './AuthVisual.module.css'

/**
 * «ДНК знаний» — 3D двойная спираль света на canvas.
 * Две нити вращаются вокруг вертикальной оси, между ними — светящиеся
 * перекладины (как base pairs = закодированное знание), вокруг восходящий
 * поток частиц-данных. Реагирует на курсор. Ассоциация: обучение и рост.
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

    // палитра бренда: violet, magenta, ember, sage
    const hueAt = (r) => (r < 0.55 ? 262 : r < 0.78 ? 322 : r < 0.9 ? 24 : 95)

    const TURNS = 3.2
    const NODES = 132 // на нить
    const strand = (offset) =>
      Array.from({ length: NODES }, (_, i) => {
        const p = i / (NODES - 1)
        return { p, ang: p * Math.PI * 2 * TURNS + offset, hue: hueAt(Math.random()) }
      })
    const strandA = strand(0)
    const strandB = strand(Math.PI)

    // восходящие частицы-данные
    const DUST = 90
    const dust = Array.from({ length: DUST }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 2 - 1,
      sp: 0.0006 + Math.random() * 0.0016,
      sz: 0.6 + Math.random() * 1.6,
      hue: hueAt(Math.random()),
      tw: Math.random() * 6.28,
    }))

    let rot = 0
    let vel = 0.011
    const mouse = { active: false, x: 0, y: 0 }

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = rect.width
      H = rect.height
      canvas.width = W * dpr
      canvas.height = H * dpr
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
    const frame = () => {
      t += 1
      const cx = W / 2
      const helixR = Math.min(W * 0.3, 190)
      const topPad = H * 0.1
      const spanY = H * 0.8
      const tiltBase = mouse.active ? mouse.y * 0.5 : 0

      vel += ((mouse.active ? 0.011 + mouse.x * 0.03 : 0.011) - vel) * 0.05
      rot += vel

      ctx.clearRect(0, 0, W, H)

      // центральное свечение-ядро
      const pulse = 1 + Math.sin(t * 0.02) * 0.08
      const glow = ctx.createRadialGradient(cx, H * 0.5, 0, cx, H * 0.5, helixR * 2.4 * pulse)
      glow.addColorStop(0, 'rgba(150, 110, 255, 0.22)')
      glow.addColorStop(0.4, 'rgba(139, 92, 246, 0.1)')
      glow.addColorStop(0.75, 'rgba(217, 76, 165, 0.04)')
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, W, H)

      // проекция узла нити
      const project = (node) => {
        const a = node.ang + rot
        const x3 = Math.cos(a)
        const z3 = Math.sin(a)
        const y = topPad + node.p * spanY
        const depth = z3 // -1 сзади .. 1 спереди
        const scale = 0.72 + (depth + 1) / 2 * 0.5
        // лёгкий наклон оси за курсором
        const skew = tiltBase * (node.p - 0.5) * helixR
        return {
          sx: cx + x3 * helixR * scale + skew,
          sy: y,
          depth,
          scale,
          hue: node.hue,
        }
      }

      const projA = strandA.map(project)
      const projB = strandB.map(project)

      // перекладины (base pairs) — рисуем на задней глубине первыми
      const rungs = []
      for (let i = 0; i < NODES; i += 4) {
        rungs.push({ a: projA[i], b: projB[i], depth: (projA[i].depth + projB[i].depth) / 2 })
      }
      rungs.sort((r1, r2) => r1.depth - r2.depth)
      for (const r of rungs) {
        const front = (r.depth + 1) / 2
        const grad = ctx.createLinearGradient(r.a.sx, r.a.sy, r.b.sx, r.b.sy)
        grad.addColorStop(0, `hsla(${r.a.hue}, 85%, 68%, ${0.1 + front * 0.4})`)
        grad.addColorStop(0.5, `hsla(322, 90%, 70%, ${0.06 + front * 0.3})`)
        grad.addColorStop(1, `hsla(${r.b.hue}, 85%, 68%, ${0.1 + front * 0.4})`)
        ctx.strokeStyle = grad
        ctx.lineWidth = 0.6 + front * 1.4
        ctx.beginPath()
        ctx.moveTo(r.a.sx, r.a.sy)
        ctx.lineTo(r.b.sx, r.b.sy)
        ctx.stroke()
      }

      // нити-линии вдоль спирали
      const drawStrand = (proj) => {
        for (let i = 1; i < proj.length; i++) {
          const a = proj[i - 1]
          const b = proj[i]
          const front = (b.depth + 1) / 2
          ctx.strokeStyle = `hsla(${b.hue}, 82%, 66%, ${0.12 + front * 0.45})`
          ctx.lineWidth = 0.6 + front * 1.6
          ctx.beginPath()
          ctx.moveTo(a.sx, a.sy)
          ctx.lineTo(b.sx, b.sy)
          ctx.stroke()
        }
      }
      drawStrand(projA)
      drawStrand(projB)

      // узлы (сортировка по глубине для правильного наложения)
      const allNodes = [...projA, ...projB].sort((n1, n2) => n1.depth - n2.depth)
      for (const n of allNodes) {
        const front = (n.depth + 1) / 2
        const tw = 0.7 + Math.sin(t * 0.05 + n.sy) * 0.3
        const size = (1 + front * 2.4) * tw
        ctx.fillStyle = `hsla(${n.hue}, 90%, ${64 + front * 18}%, ${0.25 + front * 0.75})`
        if (front > 0.6) {
          ctx.shadowColor = `hsla(${n.hue}, 90%, 65%, 0.9)`
          ctx.shadowBlur = 8 * front
        } else {
          ctx.shadowBlur = 0
        }
        ctx.beginPath()
        ctx.arc(n.sx, n.sy, size, 0, 6.2832)
        ctx.fill()
      }
      ctx.shadowBlur = 0

      // восходящий поток данных
      for (const d of dust) {
        if (!reduce) {
          d.y -= d.sp
          if (d.y < -0.05) { d.y = 1.05; d.x = Math.random() }
        }
        const depth = (d.z + 1) / 2
        const sx = d.x * W
        const sy = d.y * H
        const tw = 0.5 + Math.sin(t * 0.06 + d.tw) * 0.5
        ctx.fillStyle = `hsla(${d.hue}, 85%, 72%, ${(0.08 + depth * 0.4) * tw})`
        ctx.beginPath()
        ctx.arc(sx, sy, d.sz * (0.5 + depth), 0, 6.2832)
        ctx.fill()
      }

      if (!reduce) raf = requestAnimationFrame(frame)
    }
    frame()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      wrap.removeEventListener('mousemove', onMove)
      wrap.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div ref={wrapRef} className={styles.visual} aria-hidden>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.vignette} />
      <div className={styles.caption}>
        <span className={styles.captionTop}>AI INSIDER</span>
        <span className={styles.captionSub}>Learn the future</span>
      </div>
    </div>
  )
}
