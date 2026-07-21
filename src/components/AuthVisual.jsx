import { useEffect, useRef } from 'react'
import styles from './AuthVisual.module.css'

/**
 * «ДНК знаний» v2 — плазменная двойная спираль.
 * Аддитивное свечение (composite 'lighter'), glow-спрайты вместо плоских точек,
 * энергетические импульсы бегут вверх по нитям, ядро-звезда с лучами,
 * искры, орбитальное кольцо и живая туманность. Реагирует на курсор.
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

    // ---------- glow-спрайты (мягкий круглый свет, дёшево через drawImage) ----------
    const makeSprite = (h, s, l) => {
      const c = document.createElement('canvas')
      c.width = c.height = 64
      const g = c.getContext('2d')
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
      grad.addColorStop(0, `hsla(${h}, ${s}%, 96%, 1)`)
      grad.addColorStop(0.25, `hsla(${h}, ${s}%, ${l}%, 0.85)`)
      grad.addColorStop(0.6, `hsla(${h}, ${s}%, ${l - 8}%, 0.28)`)
      grad.addColorStop(1, `hsla(${h}, ${s}%, ${l - 12}%, 0)`)
      g.fillStyle = grad
      g.fillRect(0, 0, 64, 64)
      return c
    }
    const SPRITES = {
      262: makeSprite(262, 90, 70),
      322: makeSprite(322, 92, 68),
      24: makeSprite(24, 95, 66),
      95: makeSprite(95, 70, 70),
      white: makeSprite(262, 30, 92),
    }
    const hueKeyAt = (r) => (r < 0.56 ? 262 : r < 0.8 ? 322 : r < 0.91 ? 24 : 95)
    const glow = (key, x, y, size, alpha) => {
      ctx.globalAlpha = alpha
      const s = SPRITES[key] || SPRITES[262]
      ctx.drawImage(s, x - size, y - size, size * 2, size * 2)
    }

    // ---------- геометрия спирали ----------
    const TURNS = 3.1
    const NODES = 120
    const strand = (offset) =>
      Array.from({ length: NODES }, (_, i) => {
        const p = i / (NODES - 1)
        return { p, ang: p * Math.PI * 2 * TURNS + offset, hue: hueKeyAt(Math.random()) }
      })
    const strandA = strand(0)
    const strandB = strand(Math.PI)

    // энергетические импульсы, бегущие вверх по нитям
    const pulses = Array.from({ length: 5 }, (_, i) => ({
      strand: i % 2,
      p: Math.random(),
      sp: 0.0022 + Math.random() * 0.0022,
      hue: i % 2 ? 322 : 262,
    }))

    // восходящая пыль-данные
    const dust = Array.from({ length: 110 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 2 - 1,
      sp: 0.0006 + Math.random() * 0.0016,
      sz: 0.7 + Math.random() * 1.7,
      hue: hueKeyAt(Math.random()),
      tw: Math.random() * 6.28,
    }))

    // орбитальное кольцо
    const orbit = Array.from({ length: 80 }, (_, i) => ({
      a: (i / 80) * Math.PI * 2,
      r: 0.85 + Math.random() * 0.45,
      tilt: 0.3 + Math.random() * 0.14,
      hue: hueKeyAt(Math.random()),
      sz: 0.7 + Math.random() * 1.4,
      sp: 0.003 + Math.random() * 0.004,
    }))

    // искры из ядра
    const sparks = []
    const spawnSparks = (cx, cy) => {
      const n = 8 + (Math.random() * 6) | 0
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        const v = 0.6 + Math.random() * 2.2
        sparks.push({
          x: cx, y: cy,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v * 0.7,
          life: 1,
          decay: 0.012 + Math.random() * 0.02,
          hue: hueKeyAt(Math.random()),
          sz: 1 + Math.random() * 2,
        })
      }
    }

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
    window.addEventListener('mousemove', onMove)
    wrap.addEventListener('mouseleave', onLeave)

    let t = 0
    const frame = () => {
      t += 1
      const cx = W / 2
      const cyMid = H * 0.5
      const helixR = Math.min(W * 0.3, 190)
      const topPad = H * 0.08
      const spanY = H * 0.84
      const tiltBase = mouse.active ? mouse.y * 0.5 : 0

      vel += ((mouse.active ? 0.011 + mouse.x * 0.03 : 0.011) - vel) * 0.05
      rot += vel

      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.clearRect(0, 0, W, H)

      // ---------- фон: дышащая туманность ----------
      const pulse = 1 + Math.sin(t * 0.017) * 0.09
      const neb = ctx.createRadialGradient(cx, cyMid, 0, cx, cyMid, helixR * 3.6 * pulse)
      neb.addColorStop(0, 'rgba(150, 110, 255, 0.24)')
      neb.addColorStop(0.3, 'rgba(139, 92, 246, 0.12)')
      neb.addColorStop(0.6, 'rgba(217, 76, 165, 0.05)')
      neb.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = neb
      ctx.fillRect(0, 0, W, H)

      // два медленно кружащих цветных облака
      const na = t * 0.004
      glowCloud(cx + Math.cos(na) * helixR * 0.9, cyMid + Math.sin(na * 1.3) * helixR * 1.1, helixR * 1.5, 'rgba(120, 74, 210, 0.05)')
      glowCloud(cx + Math.cos(na + 2.6) * helixR * 1.1, cyMid + Math.sin(na * 0.8 + 1.4) * helixR * 1.3, helixR * 1.4, 'rgba(116, 154, 134, 0.045)')

      function glowCloud(x, y, r, color) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0, color)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
      }

      // ---------- всё светящееся — аддитивно ----------
      ctx.globalCompositeOperation = 'lighter'

      const project = (p, ang, hue) => {
        const a = ang + rot
        const x3 = Math.cos(a)
        const z3 = Math.sin(a)
        const y = topPad + p * spanY
        const depth = z3
        const scale = 0.72 + (depth + 1) / 2 * 0.5
        const skew = tiltBase * (p - 0.5) * helixR
        return { sx: cx + x3 * helixR * scale + skew, sy: y, depth, hue }
      }
      const projNode = (n) => project(n.p, n.ang, n.hue)

      const projA = strandA.map(projNode)
      const projB = strandB.map(projNode)

      // перекладины
      for (let i = 0; i < NODES; i += 4) {
        const a = projA[i]
        const b = projB[i]
        const front = ((a.depth + b.depth) / 2 + 1) / 2
        const grad = ctx.createLinearGradient(a.sx, a.sy, b.sx, b.sy)
        grad.addColorStop(0, `hsla(262, 85%, 70%, ${0.05 + front * 0.3})`)
        grad.addColorStop(0.5, `hsla(322, 90%, 70%, ${0.03 + front * 0.22})`)
        grad.addColorStop(1, `hsla(262, 85%, 70%, ${0.05 + front * 0.3})`)
        ctx.strokeStyle = grad
        ctx.globalAlpha = 1
        ctx.lineWidth = 0.6 + front * 1.2
        ctx.beginPath()
        ctx.moveTo(a.sx, a.sy)
        ctx.lineTo(b.sx, b.sy)
        ctx.stroke()
      }

      // линии нитей
      const drawStrand = (proj) => {
        for (let i = 1; i < proj.length; i++) {
          const a = proj[i - 1]
          const b = proj[i]
          const front = (b.depth + 1) / 2
          ctx.strokeStyle = `hsla(262, 82%, 68%, ${0.08 + front * 0.4})`
          ctx.globalAlpha = 1
          ctx.lineWidth = 0.5 + front * 1.5
          ctx.beginPath()
          ctx.moveTo(a.sx, a.sy)
          ctx.lineTo(b.sx, b.sy)
          ctx.stroke()
        }
      }
      drawStrand(projA)
      drawStrand(projB)

      // узлы-светлячки (glow-спрайты)
      for (const q of [...projA, ...projB]) {
        const front = (q.depth + 1) / 2
        const tw = 0.75 + Math.sin(t * 0.05 + q.sy * 0.13) * 0.25
        glow(q.hue, q.sx, q.sy, (2.2 + front * 5.5) * tw, 0.14 + front * 0.6)
      }

      // ---------- энергетические импульсы вдоль нитей ----------
      for (const pl of pulses) {
        if (!reduce) {
          pl.p -= pl.sp
          if (pl.p < -0.02) { pl.p = 1.02; pl.strand = Math.random() > 0.5 ? 1 : 0 }
        }
        const offset = pl.strand ? Math.PI : 0
        // хвост из 7 сэмплов позади
        for (let k = 6; k >= 0; k--) {
          const pp = Math.min(1, Math.max(0, pl.p + k * 0.008))
          const q = project(pp, pp * Math.PI * 2 * TURNS + offset, pl.hue)
          const front = (q.depth + 1) / 2
          const fade = 1 - k / 7
          glow(pl.hue, q.sx, q.sy, (3 + front * 8) * fade, (0.1 + front * 0.75) * fade)
        }
        // голова импульса — белая горячая
        const q = project(Math.max(0, pl.p), Math.max(0, pl.p) * Math.PI * 2 * TURNS + offset, pl.hue)
        const front = (q.depth + 1) / 2
        glow('white', q.sx, q.sy, 4 + front * 7, 0.5 + front * 0.5)
      }

      // ---------- орбитальное кольцо ----------
      for (const o of orbit) {
        if (!reduce) o.a += o.sp
        const x3 = Math.cos(o.a) * o.r
        const z3 = Math.sin(o.a) * o.r
        const depth = z3
        const scale = 0.7 + (depth + 1) / 2 * 0.5
        const sx = cx + x3 * helixR * 1.95 * scale
        const sy = cyMid + Math.sin(o.a) * helixR * o.tilt
        const front = (depth + 1) / 2
        glow(o.hue, sx, sy, o.sz * (1.4 + front * 2.6), 0.08 + front * 0.5)
      }

      // ---------- восходящая пыль ----------
      for (const d of dust) {
        if (!reduce) {
          d.y -= d.sp
          if (d.y < -0.05) { d.y = 1.05; d.x = Math.random() }
        }
        const depth = (d.z + 1) / 2
        const tw = 0.5 + Math.sin(t * 0.06 + d.tw) * 0.5
        glow(d.hue, d.x * W, d.y * H, d.sz * (1 + depth * 1.6), (0.05 + depth * 0.3) * tw)
      }

      // ---------- ядро-звезда ----------
      const coreR = helixR * 0.4 * pulse
      // лучи-флейры (крест, медленно вращается)
      const fa = t * 0.003
      for (const [ang, len, alpha] of [[fa, coreR * 3.4, 0.22], [fa + Math.PI / 2, coreR * 2.2, 0.16]]) {
        const dx = Math.cos(ang) * len
        const dy = Math.sin(ang) * len
        const lg = ctx.createLinearGradient(cx - dx, cyMid - dy, cx + dx, cyMid + dy)
        lg.addColorStop(0, 'rgba(139, 92, 246, 0)')
        lg.addColorStop(0.5, `rgba(196, 168, 255, ${alpha})`)
        lg.addColorStop(1, 'rgba(139, 92, 246, 0)')
        ctx.strokeStyle = lg
        ctx.globalAlpha = 1
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(cx - dx, cyMid - dy)
        ctx.lineTo(cx + dx, cyMid + dy)
        ctx.stroke()
      }
      // хроматическое кольцо вокруг ядра
      for (const [key, rr, alpha] of [[262, 1.35, 0.5], [322, 1.5, 0.3], [24, 1.66, 0.2]]) {
        ctx.strokeStyle = `hsla(${key}, 90%, 70%, ${alpha * (0.7 + Math.sin(t * 0.03 + rr) * 0.3)})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(cx, cyMid, coreR * rr, fa * (key === 322 ? -1.4 : 1), fa * (key === 322 ? -1.4 : 1) + Math.PI * 1.4)
        ctx.stroke()
      }
      // само ядро
      glow('white', cx, cyMid, coreR * 1.3, 0.95)
      glow(262, cx, cyMid, coreR * 2.1, 0.5)
      glow(322, cx, cyMid, coreR * 2.9, 0.22)

      // ---------- искры ----------
      if (!reduce && t % 110 === 0) spawnSparks(cx, cyMid)
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.x += s.vx
        s.y += s.vy
        s.vx *= 0.985
        s.vy *= 0.985
        s.life -= s.decay
        if (s.life <= 0) { sparks.splice(i, 1); continue }
        glow(s.hue, s.x, s.y, s.sz * (1 + (1 - s.life) * 2), s.life * 0.8)
      }

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'

      if (!reduce) raf = requestAnimationFrame(frame)
    }
    frame()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('mousemove', onMove)
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
