import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { courses } from '../../data/courses'
import styles from '../../pages/Admin.module.css'

export function AdminToolsPanel({ online, showToast, reviews = [], onReviewsUpdated }) {
  const [promos, setPromos] = useState([])
  const [flags, setFlags] = useState({})
  const [audit, setAudit] = useState([])
  const [products, setProducts] = useState([])
  const [payouts, setPayouts] = useState([])
  const [grantEmail, setGrantEmail] = useState('')
  const [grantCourse, setGrantCourse] = useState(courses[0]?.id || '')
  const [newPromo, setNewPromo] = useState({ code: '', discountPercent: 10, maxUses: 100 })

  const load = async () => {
    if (!online) return
    try {
      const [p, f, a, mp, pay] = await Promise.all([
        api.adminPromoCodes(),
        api.adminFeatureFlags(),
        api.adminAuditLog(),
        api.adminMarketplaceProducts(),
        api.adminCreatorPayouts(),
      ])
      setPromos(p)
      setFlags(f)
      setAudit(a)
      setProducts(mp.products || [])
      setPayouts(pay)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  useEffect(() => { load() }, [online])

  const bulkApprove = async () => {
    const ids = reviews.filter((r) => r.status === 'pending' && String(r.text || '').trim()).map((r) => r.id)
    if (!ids.length) return showToast('Нет отзывов для массового одобрения')
    try {
      const r = await api.adminBulkApproveReviews(ids)
      showToast(`Одобрено: ${r.approved}`)
      onReviewsUpdated?.()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  if (!online) {
    return <p className={styles.sectionDesc}>Инструменты доступны при подключении к API.</p>
  }

  return (
    <div className={styles.toolsGrid}>
      <section className={styles.toolCard}>
        <h3>Массовое одобрение отзывов</h3>
        <button type="button" className={styles.primaryBtn} onClick={bulkApprove}>Одобрить все pending с текстом</button>
      </section>

      <section className={styles.toolCard}>
        <h3>Выдать курс вручную</h3>
        <input type="email" placeholder="email" value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} className={styles.input} />
        <select value={grantCourse} onChange={(e) => setGrantCourse(e.target.value)} className={styles.input}>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={async () => {
            try {
              const c = courses.find((x) => x.id === grantCourse)
              await api.adminGrantCourse({ email: grantEmail, courseId: grantCourse, courseTitle: c?.title })
              showToast('Курс выдан')
            } catch (err) {
              showToast(err.message, 'error')
            }
          }}
        >
          Выдать доступ
        </button>
      </section>

      <section className={styles.toolCard}>
        <h3>Промокоды (COM-04)</h3>
        <div className={styles.inlineForm}>
          <input placeholder="CODE" value={newPromo.code} onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value })} />
          <input type="number" placeholder="%" value={newPromo.discountPercent} onChange={(e) => setNewPromo({ ...newPromo, discountPercent: Number(e.target.value) })} />
          <button
            type="button"
            onClick={async () => {
              await api.adminCreatePromo(newPromo)
              showToast('Промокод создан')
              load()
            }}
          >
            Создать
          </button>
        </div>
        <ul className={styles.compactList}>
          {promos.map((p) => (
            <li key={p.code}>{p.code} — {p.discountPercent}% · used {p.usedCount}/{p.maxUses || '∞'}</li>
          ))}
        </ul>
      </section>

      <section className={styles.toolCard}>
        <h3>Feature flags</h3>
        {Object.entries(flags).map(([key, val]) => (
          <label key={key} className={styles.flagRow}>
            <input
              type="checkbox"
              checked={Boolean(val)}
              onChange={async (e) => {
                const next = { ...flags, [key]: e.target.checked }
                setFlags(next)
                await api.adminSetFeatureFlags({ [key]: e.target.checked })
              }}
            />
            {key}
          </label>
        ))}
      </section>

      <section className={styles.toolCard}>
        <h3>Marketplace (ADM-11)</h3>
        <ul className={styles.compactList}>
          {products.slice(0, 8).map((p) => (
            <li key={p.id}>{p.titleRu} — €{p.priceEur}</li>
          ))}
          {products.length > 8 && <li>…ещё {products.length - 8}</li>}
        </ul>
      </section>

      <section className={styles.toolCard}>
        <h3>Выплаты креаторам (MP-01)</h3>
        <ul className={styles.compactList}>
          {payouts.map((p) => (
            <li key={p.id}>{p.creatorEmail} €{p.amountEur} — {p.status}</li>
          ))}
        </ul>
      </section>

      <section className={styles.toolCard} style={{ gridColumn: '1 / -1' }}>
        <h3>Audit log</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Время</th><th>Кто</th><th>Действие</th><th>Цель</th></tr></thead>
            <tbody>
              {audit.slice(0, 30).map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.createdAt).toLocaleString('ru-RU')}</td>
                  <td>{a.actorEmail}</td>
                  <td>{a.action}</td>
                  <td>{a.targetType} {a.targetId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
