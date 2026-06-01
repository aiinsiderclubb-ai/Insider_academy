import { useMemo } from 'react'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { adminRecommendations } from '../../data/adminRoadmap'
import styles from '../../pages/Admin.module.css'
import { AdminCharts } from './AdminCharts'
import { canAccessTab } from '../../utils/adminAuth'
import { ACCELERATOR_ADMIN_TAB } from '../../data/acceleratorApplication'

function StatCard({ label, value, suffix = '', trend, accent }) {
  const animated = useAnimatedNumber(value)
  return (
    <div className={`${styles.kpiCard} ${accent ? styles.kpiAccent : ''}`}>
      <span className={styles.kpiValue}>
        {animated.toLocaleString('ru-RU')}{suffix}
      </span>
      <span className={styles.kpiLabel}>{label}</span>
      {trend != null && (
        <span className={styles.kpiTrend}>{trend > 0 ? `+${trend} за 7 дн.` : '—'}</span>
      )}
    </div>
  )
}

function BarChart({ items, courses }) {
  const max = Math.max(...items.map(([, c]) => c), 1)
  return (
    <div className={styles.barChart}>
      {items.length === 0 ? (
        <p className={styles.emptyChart}>Нет данных о кликах</p>
      ) : (
        items.map(([id, count]) => {
          const course = courses.find((c) => c.id === id)
          const title = course?.title || id
          const pct = Math.round((count / max) * 100)
          return (
            <div key={id} className={styles.barRow}>
              <span className={styles.barLabel} title={title}>{title.slice(0, 28)}{title.length > 28 ? '…' : ''}</span>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${pct}%` }} />
              </div>
              <span className={styles.barCount}>{count}</span>
            </div>
          )
        })
      )}
    </div>
  )
}

function buildActivityFeed({ registrations, purchases, homeworkList, certificates }) {
  const events = []
  registrations.slice(0, 5).forEach((r) => {
    events.push({ type: 'reg', label: `Регистрация: ${r.email}`, date: r.date, tab: 'registrations' })
  })
  purchases.slice(0, 5).forEach((p) => {
    events.push({ type: 'purchase', label: `Покупка: ${p.courseTitle}`, sub: p.email, date: p.date, tab: 'purchases' })
  })
  homeworkList.filter((h) => h.status === 'pending').slice(0, 5).forEach((h) => {
    events.push({ type: 'hw', label: `ДЗ на проверке: ${h.courseTitle}`, sub: h.email, date: h.updatedAt || h.date, tab: 'homework' })
  })
  certificates.filter((c) => !c.fileDataUrl).slice(0, 3).forEach((c) => {
    events.push({ type: 'cert', label: `Сертификат ожидает: ${c.courseTitle}`, sub: c.email, date: c.date, tab: 'certificates' })
  })
  return events
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8)
}

const typeIcons = { reg: '👤', purchase: '💳', hw: '📝', cert: '🎓' }

function hoursSince(iso) {
  if (!iso) return 0
  return (Date.now() - new Date(iso).getTime()) / 3600000
}

export function AdminDashboard({
  analytics,
  charts,
  registrations,
  purchases,
  homeworkList,
  certificates,
  courses,
  referrals,
  applications = [],
  unreadByTab,
  onTabChange,
  formatDate,
  adminRole = 'admin',
}) {
  const topCourseClicks = useMemo(
    () => Object.entries(analytics.courseClicks || {}).sort((a, b) => b[1] - a[1]).slice(0, 6),
    [analytics.courseClicks]
  )

  const revenue = useMemo(
    () => purchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [purchases]
  )

  const pendingHw = homeworkList.filter((h) => h.status === 'pending').length
  const pendingCerts = certificates.filter((c) => !c.fileDataUrl).length
  const newApplications = applications.filter((a) => (a.status || 'new') === 'new')
  const staleApplications = newApplications.filter((a) => hoursSince(a.date) >= 24)

  const last7Days = (items) => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    return items.filter((i) => new Date(i.date).getTime() >= cutoff).length
  }

  const activity = useMemo(
    () => buildActivityFeed({ registrations, purchases, homeworkList, certificates }),
    [registrations, purchases, homeworkList, certificates]
  )

  const recs = useMemo(() => {
    return adminRecommendations.filter((r) => {
      if (r.id === 'rec-hw') return pendingHw > 0
      if (r.id === 'rec-cert') return pendingCerts > 0
      return true
    }).slice(0, 4)
  }, [pendingHw, pendingCerts])

  const quickActions = [
    canAccessTab(adminRole, ACCELERATOR_ADMIN_TAB) && {
      label: 'Новые заявки',
      tab: ACCELERATOR_ADMIN_TAB,
      badge: newApplications.length,
      filter: 'new',
    },
    canAccessTab(adminRole, ACCELERATOR_ADMIN_TAB) && { label: 'Отборочный курс', tab: ACCELERATOR_ADMIN_TAB, badge: unreadByTab[ACCELERATOR_ADMIN_TAB] },
    canAccessTab(adminRole, 'homework') && { label: 'Проверить ДЗ', tab: 'homework', badge: unreadByTab.homework },
    canAccessTab(adminRole, 'certificates') && { label: 'Выдать сертификат', tab: 'certificates', badge: unreadByTab.certificates },
    canAccessTab(adminRole, 'courses') && { label: 'Добавить курс', tab: 'courses' },
    canAccessTab(adminRole, 'roadmap') && { label: 'Роадмап', tab: 'roadmap' },
  ].filter(Boolean)

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Дашборд</h2>
          <p className={styles.sectionDesc}>Обзор платформы в реальном времени</p>
        </div>
        <div className={styles.quickActions}>
          {quickActions.map((a) => (
            <button
              key={`${a.tab}-${a.label}`}
              type="button"
              className={styles.quickBtn}
              onClick={() => onTabChange(a.tab, a.filter)}
            >
              {a.label}
              {a.badge > 0 && <span className={styles.quickBadge}>{a.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {staleApplications.length > 0 && canAccessTab(adminRole, ACCELERATOR_ADMIN_TAB) && (
        <div className={styles.staleBanner} role="status">
          <div>
            <strong>⚠️ {staleApplications.length} заявок в статусе «Новая» более 24 часов</strong>
            <p className={styles.sectionDesc} style={{ margin: '6px 0 0' }}>
              Рекомендуем проверить очередь и одобрить или отклонить заявки.
            </p>
          </div>
          <button
            type="button"
            className={styles.quickBtn}
            onClick={() => onTabChange(ACCELERATOR_ADMIN_TAB, 'new')}
          >
            Открыть новые заявки
          </button>
        </div>
      )}

      <div className={styles.kpiGrid}>
        <StatCard label="Заходов на сайт" value={analytics.visits || 0} accent />
        <StatCard label="Регистраций" value={registrations.length} trend={last7Days(registrations)} />
        <StatCard label="Покупок" value={purchases.length} trend={last7Days(purchases)} />
        <StatCard label="Выручка" value={Math.round(revenue)} suffix=" €" accent />
        {canAccessTab(adminRole, ACCELERATOR_ADMIN_TAB) && (
          <StatCard label="Новые заявки" value={newApplications.length} accent={newApplications.length > 0} />
        )}
        <StatCard label="ДЗ на проверке" value={pendingHw} />
        <StatCard label="Сертификатов ждут" value={pendingCerts} />
        <StatCard label="Рефералов" value={referrals.length} />
        <StatCard label="Курсов" value={courses.length} />
      </div>

      {(canAccessTab(adminRole, 'analytics') || adminRole === 'admin') && (
        <section className={styles.panel} style={{ marginBottom: 24 }}>
          <h3 className={styles.panelTitle}>Воронка (упрощённая)</h3>
          <div className={styles.funnel}>
            {[
              { label: 'Визиты', value: analytics.visits || 0 },
              { label: 'Регистрации', value: registrations.length },
              { label: 'Покупки', value: purchases.length },
              { label: 'ДЗ сдано', value: homeworkList.length },
              {
                label: 'ДЗ принято',
                value: homeworkList.filter((h) => h.status === 'accepted').length,
              },
            ].map((step, i, arr) => {
              const prev = i > 0 ? arr[i - 1].value : step.value
              const conv = prev > 0 ? Math.round((step.value / prev) * 100) : 0
              return (
                <div key={step.label} className={styles.funnelStep}>
                  <span>{step.label}</span>
                  <strong>{step.value}</strong>
                  {i > 0 && <small>{conv}%</small>}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {(canAccessTab(adminRole, 'analytics') || adminRole === 'admin') && (
        <AdminCharts
          charts={charts}
          analytics={analytics}
          registrations={registrations}
          purchases={purchases}
        />
      )}

      <div className={styles.dashboardGrid}>
        <section className={styles.panel}>
          <h3 className={styles.panelTitle}>Топ курсов по кликам</h3>
          <BarChart items={topCourseClicks} courses={courses} />
        </section>

        <section className={styles.panel}>
          <h3 className={styles.panelTitle}>Последняя активность</h3>
          <ul className={styles.activityList}>
            {activity.length === 0 ? (
              <li className={styles.activityEmpty}>Пока нет событий</li>
            ) : (
              activity.map((ev, i) => (
                <li key={i}>
                  <button type="button" className={styles.activityItem} onClick={() => onTabChange(ev.tab)}>
                    <span className={styles.activityIcon}>{typeIcons[ev.type]}</span>
                    <span className={styles.activityBody}>
                      <strong>{ev.label}</strong>
                      {ev.sub && <small>{ev.sub}</small>}
                      <time>{formatDate(ev.date)}</time>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className={styles.panel}>
        <h3 className={styles.panelTitle}>Рекомендации</h3>
        <div className={styles.recGrid}>
          {recs.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`${styles.recCard} ${styles[`rec_${r.priority}`]}`}
              onClick={() => onTabChange(r.tab)}
            >
              <span className={styles.recIcon}>{r.icon}</span>
              <div>
                <strong>{r.title}</strong>
                <p>{r.desc}</p>
              </div>
              <span className={styles.recArrow}>→</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
