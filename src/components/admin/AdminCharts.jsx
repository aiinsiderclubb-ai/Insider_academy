import { useMemo } from 'react'
import styles from '../../pages/Admin.module.css'

function lastNDays(n = 14) {
  const days = []
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function mapByDay(rows, valueKey = 'count') {
  const map = {}
  ;(rows || []).forEach((r) => { map[r.day] = Number(r[valueKey]) || 0 })
  return map
}

function MiniLineChart({ data, label, color = 'var(--glow-purple)', suffix = '' }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * 100
    const y = 100 - (d.value / max) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <div className={styles.chartBlock}>
      <div className={styles.chartHead}>
        <span>{label}</span>
        <strong>{data.reduce((s, d) => s + d.value, 0).toLocaleString('ru-RU')}{suffix}</strong>
      </div>
      <svg viewBox="0 0 100 40" className={styles.miniChart} preserveAspectRatio="none">
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
        <polyline fill={`${color}33`} stroke="none" points={`0,40 ${points} 100,40`} />
      </svg>
    </div>
  )
}

function FunnelStep({ label, value, pct, widthPct }) {
  return (
    <div className={styles.funnelStep}>
      <div className={styles.funnelBar} style={{ width: `${widthPct}%` }}>
        <span>{label}</span>
        <strong>{value.toLocaleString('ru-RU')}</strong>
      </div>
      {pct != null && <span className={styles.funnelPct}>{pct}% →</span>}
    </div>
  )
}

export function AdminCharts({ charts, analytics, registrations, purchases }) {
  const days = useMemo(() => lastNDays(14), [])

  const revenueData = useMemo(() => {
    const map = mapByDay(charts?.purchasesByDay, 'revenue')
    return days.map((day) => ({ day, value: map[day] || 0 }))
  }, [charts, days])

  const regData = useMemo(() => {
    const map = mapByDay(charts?.registrationsByDay, 'count')
    if (Object.keys(map).length === 0) {
      const local = {}
      registrations.forEach((r) => {
        const day = r.date?.slice(0, 10)
        if (day) local[day] = (local[day] || 0) + 1
      })
      return days.map((day) => ({ day, value: local[day] || 0 }))
    }
    return days.map((day) => ({ day, value: map[day] || 0 }))
  }, [charts, registrations, days])

  const visitData = useMemo(() => {
    const map = {}
    ;(charts?.visitsByDay || []).forEach((r) => { map[r.day] = r.count })
    return days.map((day) => ({ day, value: map[day] || 0 }))
  }, [charts, days])

  const funnel = charts?.funnel || {
    visits: analytics?.visits || 0,
    registrations: registrations.length,
    purchases: purchases.length,
    conversionReg: 0,
    conversionPurchase: 0,
  }

  const maxFunnel = Math.max(funnel.visits, funnel.registrations, funnel.purchases, 1)

  return (
    <section className={styles.chartsSection}>
      <h3 className={styles.panelTitle}>Аналитика за 14 дней</h3>
      <div className={styles.chartsGrid}>
        <MiniLineChart data={visitData} label="Визиты" color="#818cf8" />
        <MiniLineChart data={regData} label="Регистрации" color="#c084fc" />
        <MiniLineChart data={revenueData} label="Выручка" color="#34d399" suffix=" €" />
      </div>

      <h3 className={styles.panelTitle} style={{ marginTop: 24 }}>Воронка конверсии</h3>
      <div className={styles.funnel}>
        <FunnelStep label="Визиты" value={funnel.visits} pct={funnel.conversionReg} widthPct={(funnel.visits / maxFunnel) * 100} />
        <FunnelStep label="Регистрации" value={funnel.registrations} pct={funnel.conversionPurchase} widthPct={(funnel.registrations / maxFunnel) * 100} />
        <FunnelStep label="Покупки" value={funnel.purchases} widthPct={(funnel.purchases / maxFunnel) * 100} />
      </div>
    </section>
  )
}
