import { useMemo } from 'react'
import { TrendingDown } from 'lucide-react'
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

  return (
    <div className={styles.chartBlock}>
      <div className={styles.chartHead}>
        <span>{label}</span>
        <strong>{data.reduce((s, d) => s + d.value, 0).toLocaleString('ru-RU')}{suffix}</strong>
      </div>
      <div className={styles.miniChart} role="img" aria-label={`${label}: динамика за 14 дней`}>
        {data.map((item) => (
          <span
            key={item.day}
            className={styles.miniBar}
            style={{ height: `${Math.max((item.value / max) * 100, 3)}%`, backgroundColor: color }}
            title={`${item.day}: ${item.value}${suffix}`}
          />
        ))}
      </div>
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
      {pct != null && <span className={styles.funnelPct}>{pct}% <TrendingDown size={13} aria-hidden /></span>}
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
        <MiniLineChart data={visitData} label="Визиты" color="var(--accent-soft)" />
        <MiniLineChart data={regData} label="Регистрации" color="var(--accent-hot)" />
        <MiniLineChart data={revenueData} label="Выручка" color="var(--success)" suffix=" €" />
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
