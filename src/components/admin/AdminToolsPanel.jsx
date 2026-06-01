import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client'
import { courses } from '../../data/courses'
import styles from '../../pages/Admin.module.css'

const FLAG_LABELS = {
  marketplace: 'Marketplace на сайте',
  vault: 'Vault (хранилище)',
  peerReview: 'Peer-review ДЗ',
  emailSequences: 'Email-цепочки',
}

function formatAction(action) {
  const map = {
    'promo.create': 'Создан промокод',
    'promo.update': 'Обновлён промокод',
    'course.grant': 'Выдан курс',
    'reviews.bulk_approve': 'Массовое одобрение отзывов',
    'application.approve': 'Одобрена заявка',
    'application.reject': 'Отказ по заявке',
    'application.update': 'Изменён статус заявки',
    'user.delete': 'Удалён аккаунт',
    'flags.update': 'Feature flags',
    'telegram.broadcast': 'Telegram-рассылка',
    'payout.create': 'Создана выплата',
    'marketplace.update': 'Marketplace',
  }
  return map[action] || action
}

export function AdminToolsPanel({ online, showToast, reviews = [], onReviewsUpdated }) {
  const [promos, setPromos] = useState([])
  const [flags, setFlags] = useState({})
  const [audit, setAudit] = useState([])
  const [products, setProducts] = useState([])
  const [payouts, setPayouts] = useState([])
  const [sheetsStatus, setSheetsStatus] = useState(null)
  const [loadErrors, setLoadErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [grantEmail, setGrantEmail] = useState('')
  const [grantCourse, setGrantCourse] = useState(courses[0]?.id || '')
  const [newPromo, setNewPromo] = useState({ code: '', discountPercent: 10, maxUses: 100 })
  const [broadcastText, setBroadcastText] = useState('')
  const [broadcastTitle, setBroadcastTitle] = useState('AI Insider Academy')
  const [payoutForm, setPayoutForm] = useState({ creatorEmail: '', amountEur: '', note: '' })

  const load = useCallback(async () => {
    if (!online) return
    setLoading(true)
    const errors = {}
    const tasks = [
      ['promos', () => api.adminPromoCodes()],
      ['flags', () => api.adminFeatureFlags()],
      ['audit', () => api.adminAuditLog()],
      ['products', () => api.adminMarketplaceProducts()],
      ['payouts', () => api.adminCreatorPayouts()],
      ['sheets', () => api.adminSheetsStatus()],
    ]

    const results = await Promise.allSettled(tasks.map(([, fn]) => fn()))
    results.forEach((result, i) => {
      const [key] = tasks[i]
      if (result.status === 'rejected') {
        errors[key] = result.reason?.message || 'Ошибка загрузки'
        return
      }
      const data = result.value
      if (key === 'promos') setPromos(data)
      if (key === 'flags') setFlags(data)
      if (key === 'audit') setAudit(data)
      if (key === 'products') setProducts(data.products || [])
      if (key === 'payouts') setPayouts(data)
      if (key === 'sheets') setSheetsStatus(data)
    })

    setLoadErrors(errors)
    setLoading(false)
    if (Object.keys(errors).length) {
      showToast(`Часть данных не загрузилась: ${Object.keys(errors).join(', ')}`, 'error')
    }
  }, [online, showToast])

  useEffect(() => { load() }, [load])

  const bulkApprove = async () => {
    const ids = reviews.filter((r) => r.status === 'pending' && String(r.text || '').trim()).map((r) => r.id)
    if (!ids.length) return showToast('Нет отзывов для массового одобрения')
    try {
      const r = await api.adminBulkApproveReviews(ids)
      showToast(`Одобрено: ${r.approved}`)
      onReviewsUpdated?.()
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const createPayout = async () => {
    const amount = Number(payoutForm.amountEur)
    if (!payoutForm.creatorEmail || !Number.isFinite(amount)) {
      return showToast('Укажите email креатора и сумму', 'error')
    }
    try {
      await api.adminCreateCreatorPayout({
        creatorEmail: payoutForm.creatorEmail,
        amountEur: amount,
        note: payoutForm.note || undefined,
      })
      showToast('Выплата создана')
      setPayoutForm({ creatorEmail: '', amountEur: '', note: '' })
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const sendBroadcast = async () => {
    if (!broadcastText.trim()) return showToast('Введите текст сообщения', 'error')
    try {
      const r = await api.adminTelegramBroadcast({
        title: broadcastTitle,
        text: broadcastText.trim(),
        url: '/courses',
      })
      showToast(`Telegram: отправлено ${r.sent || 0} пользователям`)
      setBroadcastText('')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  if (!online) {
    return <p className={styles.sectionDesc}>Инструменты доступны при подключении к API.</p>
  }

  return (
    <div>
      <div className={styles.courseActions} style={{ marginBottom: 16 }}>
        <button type="button" className={styles.smallBtn} disabled={loading} onClick={load}>
          {loading ? 'Обновление…' : '↻ Обновить данные'}
        </button>
        {Object.keys(loadErrors).length > 0 && (
          <span className={styles.sectionDesc} style={{ color: '#f87171' }}>
            Ошибки: {Object.entries(loadErrors).map(([k, v]) => `${k}: ${v}`).join(' · ')}
          </span>
        )}
      </div>

      <div className={styles.toolsGrid}>
        <section className={styles.toolCard}>
          <h3>Google Sheets — архив</h3>
          {sheetsStatus ? (
            <>
              <p className={styles.sectionDesc} style={{ margin: '0 0 8px' }}>
                {sheetsStatus.enabled
                  ? (sheetsStatus.ok ? '✅ Подключено · события пишутся автоматически' : `⚠️ ${sheetsStatus.error || sheetsStatus.message}`)
                  : `⚠️ ${sheetsStatus.message}`}
              </p>
              {sheetsStatus.folderUrl && (
                <a href={sheetsStatus.folderUrl} target="_blank" rel="noreferrer noopener" className={styles.inlineBtn}>
                  Открыть папку Drive
                </a>
              )}
              {sheetsStatus.sheets?.filter((s) => s.archive).map((s) => (
                <div key={s.key} className={styles.sectionDesc}>
                  {s.title}: {s.rowCount ?? '—'} строк
                  {s.url && (
                    <>
                      {' · '}
                      <a href={s.url} target="_blank" rel="noreferrer noopener">таблица</a>
                    </>
                  )}
                </div>
              ))}
            </>
          ) : (
            <p className={styles.drawerMuted}>Загрузка…</p>
          )}
        </section>

        <section className={styles.toolCard}>
          <h3>Telegram-рассылка</h3>
          <input
            type="text"
            placeholder="Заголовок"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            className={styles.input}
          />
          <textarea
            rows={3}
            placeholder="Текст для всех с подключённым ботом…"
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            className={styles.input}
          />
          <button type="button" className={styles.primaryBtn} onClick={sendBroadcast}>
            Отправить в Telegram
          </button>
        </section>

        <section className={styles.toolCard}>
          <h3>Массовое одобрение отзывов</h3>
          <p className={styles.sectionDesc}>Pending с текстом: {reviews.filter((r) => r.status === 'pending' && String(r.text || '').trim()).length}</p>
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
                load()
              } catch (err) {
                showToast(err.message, 'error')
              }
            }}
          >
            Выдать доступ
          </button>
        </section>

        <section className={styles.toolCard}>
          <h3>Промокоды</h3>
          <div className={styles.inlineForm}>
            <input placeholder="CODE" value={newPromo.code} onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value })} />
            <input type="number" placeholder="%" value={newPromo.discountPercent} onChange={(e) => setNewPromo({ ...newPromo, discountPercent: Number(e.target.value) })} />
            <button
              type="button"
              onClick={async () => {
                try {
                  await api.adminCreatePromo(newPromo)
                  showToast('Промокод создан')
                  load()
                } catch (err) {
                  showToast(err.message, 'error')
                }
              }}
            >
              Создать
            </button>
          </div>
          {promos.length === 0 ? (
            <p className={styles.drawerMuted}>Промокодов пока нет</p>
          ) : (
            <ul className={styles.compactList}>
              {promos.map((p) => (
                <li key={p.code}>{p.code} — {p.discountPercent}% · used {p.usedCount}/{p.maxUses || '∞'}</li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.toolCard}>
          <h3>Feature flags</h3>
          {Object.keys(flags).length === 0 ? (
            <p className={styles.drawerMuted}>{loadErrors.flags || 'Нет данных'}</p>
          ) : (
            Object.entries(flags).map(([key, val]) => (
              <label key={key} className={styles.flagRow}>
                <input
                  type="checkbox"
                  checked={Boolean(val)}
                  onChange={async (e) => {
                    const next = { ...flags, [key]: e.target.checked }
                    setFlags(next)
                    try {
                      await api.adminSetFeatureFlags({ [key]: e.target.checked })
                      load()
                    } catch (err) {
                      showToast(err.message, 'error')
                    }
                  }}
                />
                {FLAG_LABELS[key] || key}
              </label>
            ))
          )}
        </section>

        <section className={styles.toolCard}>
          <h3>Marketplace</h3>
          {products.length === 0 ? (
            <p className={styles.drawerMuted}>{loadErrors.products || 'Нет продуктов'}</p>
          ) : (
            <ul className={styles.compactList}>
              {products.slice(0, 8).map((p) => (
                <li key={p.id}>{p.titleRu} — €{p.priceEur}</li>
              ))}
              {products.length > 8 && <li>…ещё {products.length - 8}</li>}
            </ul>
          )}
        </section>

        <section className={styles.toolCard}>
          <h3>Выплаты креаторам</h3>
          <div className={styles.inlineForm}>
            <input
              type="email"
              placeholder="email креатора"
              value={payoutForm.creatorEmail}
              onChange={(e) => setPayoutForm({ ...payoutForm, creatorEmail: e.target.value })}
            />
            <input
              type="number"
              placeholder="€ сумма"
              value={payoutForm.amountEur}
              onChange={(e) => setPayoutForm({ ...payoutForm, amountEur: e.target.value })}
            />
            <button type="button" onClick={createPayout}>Создать</button>
          </div>
          {payouts.length === 0 ? (
            <p className={styles.drawerMuted}>Выплат пока нет</p>
          ) : (
            <ul className={styles.compactList}>
              {payouts.map((p) => (
                <li key={p.id}>{p.creatorEmail} €{p.amountEur} — {p.status}</li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.toolCard} style={{ gridColumn: '1 / -1' }}>
          <h3>Audit log</h3>
          <p className={styles.sectionDesc}>
            Журнал действий админов: выдача курсов, заявки, промокоды, удаление аккаунтов.
            {audit.length === 0 && ' Записи появятся после первых операций.'}
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Время</th><th>Кто</th><th>Действие</th><th>Цель</th></tr></thead>
              <tbody>
                {audit.length === 0 ? (
                  <tr><td colSpan={4} className={styles.empty}>Пока нет записей</td></tr>
                ) : (
                  audit.slice(0, 50).map((a) => (
                    <tr key={a.id}>
                      <td>{new Date(a.createdAt).toLocaleString('ru-RU')}</td>
                      <td>{a.actorEmail}</td>
                      <td>{formatAction(a.action)}</td>
                      <td>{a.targetType} {a.targetId}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
