import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { courses } from '../../data/courses'
import styles from '../../pages/Admin.module.css'

const FLAG_LABELS = {
  marketplace: 'Marketplace на сайте',
  vault: 'Vault (хранилище)',
  peerReview: 'Peer-review ДЗ',
  emailSequences: 'Email-цепочки',
}

const PAYOUT_STATUS_LABELS = {
  pending: 'Ожидает',
  paid: 'Выплачено',
  cancelled: 'Отменено',
}

const AUDIT_ACTION_OPTIONS = [
  { value: 'all', label: 'Все действия' },
  { value: 'course.grant', label: 'Выдача курса' },
  { value: 'user.delete', label: 'Удаление аккаунта' },
  { value: 'application.approve', label: 'Одобрение заявки' },
  { value: 'application.reject', label: 'Отказ по заявке' },
  { value: 'application.update', label: 'Статус заявки' },
  { value: 'promo.create', label: 'Промокоды' },
  { value: 'reviews.bulk_approve', label: 'Отзывы' },
  { value: 'payout.create', label: 'Создание выплаты' },
  { value: 'payout.update', label: 'Статус выплаты' },
  { value: 'marketplace.update', label: 'Marketplace' },
  { value: 'flags.update', label: 'Feature flags' },
  { value: 'telegram.broadcast', label: 'Telegram' },
]

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
    'payout.update': 'Статус выплаты',
    'marketplace.update': 'Marketplace',
  }
  return map[action] || action
}

export function AdminToolsPanel({ online, showToast, reviews = [], onReviewsUpdated, onTabChange }) {
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
  const [auditFilter, setAuditFilter] = useState('all')
  const [productBusy, setProductBusy] = useState(null)
  const [payoutBusy, setPayoutBusy] = useState(null)

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

  const filteredAudit = useMemo(() => {
    if (auditFilter === 'all') return audit
    return audit.filter((a) => a.action === auditFilter)
  }, [audit, auditFilter])

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

  const updatePayoutStatus = async (id, status) => {
    setPayoutBusy(id)
    try {
      await api.adminUpdateCreatorPayout(id, { status })
      showToast(`Статус: ${PAYOUT_STATUS_LABELS[status] || status}`)
      load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPayoutBusy(null)
    }
  }

  const toggleProduct = async (product) => {
    setProductBusy(product.id)
    try {
      await api.adminUpdateMarketplaceProduct(product.id, { active: !product.active })
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p)))
      showToast(product.active ? 'Продукт скрыт' : 'Продукт включён')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setProductBusy(null)
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
        {onTabChange && (
          <button
            type="button"
            className={styles.quickBtn}
            onClick={() => onTabChange('registrations')}
          >
            👤 Удалить пользователя → Регистрации
          </button>
        )}
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

        <section className={styles.toolCard} style={{ gridColumn: 'span 2' }}>
          <h3>Marketplace — продукты</h3>
          <p className={styles.sectionDesc}>Включите или скройте продукты на витрине Marketplace.</p>
          {products.length === 0 ? (
            <p className={styles.drawerMuted}>{loadErrors.products || 'Нет продуктов'}</p>
          ) : (
            <ul className={styles.marketplaceAdminList}>
              {products.map((p) => (
                <li key={p.id} className={styles.marketplaceAdminRow}>
                  <div>
                    <strong>{p.titleRu}</strong>
                    <span className={styles.drawerMuted}> · €{p.priceEur}</span>
                    {!p.active && <span className={styles.slaWarn} style={{ marginLeft: 8 }}>скрыт</span>}
                  </div>
                  <label className={styles.flagRow}>
                    <input
                      type="checkbox"
                      checked={Boolean(p.active)}
                      disabled={productBusy === p.id}
                      onChange={() => toggleProduct(p)}
                    />
                    На сайте
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.toolCard} style={{ gridColumn: 'span 2' }}>
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
                <li key={p.id} className={styles.payoutRow}>
                  <span>
                    {p.creatorEmail} · €{p.amountEur}
                    {' · '}
                    <span className={p.status === 'paid' ? styles.tgBadgeOn : p.status === 'cancelled' ? styles.slaWarn : styles.drawerMuted}>
                      {PAYOUT_STATUS_LABELS[p.status] || p.status}
                    </span>
                  </span>
                  {p.status === 'pending' && (
                    <span className={styles.payoutActions}>
                      <button
                        type="button"
                        className={styles.smallBtn}
                        disabled={payoutBusy === p.id}
                        onClick={() => updatePayoutStatus(p.id, 'paid')}
                      >
                        ✓ Выплачено
                      </button>
                      <button
                        type="button"
                        className={styles.smallBtnDanger}
                        disabled={payoutBusy === p.id}
                        onClick={() => updatePayoutStatus(p.id, 'cancelled')}
                      >
                        ✕ Отменить
                      </button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.toolCard} style={{ gridColumn: '1 / -1' }}>
          <div className={styles.appPanelHeader}>
            <h3 style={{ margin: 0 }}>Audit log</h3>
            <select
              className={styles.statusSelect}
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value)}
              aria-label="Фильтр по типу действия"
            >
              {AUDIT_ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <p className={styles.sectionDesc}>
            Журнал действий админов.
            {filteredAudit.length !== audit.length && ` Показано ${filteredAudit.length} из ${audit.length}.`}
            {audit.length === 0 && ' Записи появятся после первых операций.'}
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Время</th><th>Кто</th><th>Действие</th><th>Цель</th></tr></thead>
              <tbody>
                {filteredAudit.length === 0 ? (
                  <tr><td colSpan={4} className={styles.empty}>Нет записей для фильтра</td></tr>
                ) : (
                  filteredAudit.slice(0, 50).map((a) => (
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
