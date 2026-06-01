import { Fragment, useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import {
  getAcceleratorApplications,
  updateAcceleratorApplication,
} from '../../api/adminStore'
import {
  ACTIVITY_OPTIONS,
  AI_EXPERIENCE_OPTIONS,
  APPLICATION_STATUS_LABELS,
  ACCELERATOR_COURSE_TITLE,
  SOURCE_OPTIONS,
  labelForOption,
  labelInterests,
} from '../../data/acceleratorApplication'
import {
  REJECT_TEMPLATES,
  TELEGRAM_TEMPLATES,
  buildPromoCode,
} from '../../data/applicationAdmin'
import styles from '../../pages/Admin.module.css'

const STATUS_ORDER = ['new', 'reviewed', 'accepted', 'rejected']

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso || '—'
  }
}

function hoursSince(iso) {
  if (!iso) return 0
  return (Date.now() - new Date(iso).getTime()) / 3600000
}

function exportApplicationsCsv(rows) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const headers = [
    'Дата', 'Имя', 'Фамилия', 'Возраст', 'Страна', 'Email', 'Telegram', 'Бот подключён',
    'Занятость', 'Опыт AI', 'Интересы', 'Источник', 'Статус', 'Доступ выдан',
    'Мотивация', 'Цель 12 мес.', 'Заметка админа',
  ]
  const lines = [headers.map(escape).join(',')]
  for (const app of rows) {
    lines.push([
      formatDate(app.date),
      app.firstName,
      app.lastName,
      app.age,
      app.country,
      app.email,
      app.telegram,
      app.telegramConnected ? 'да' : 'нет',
      labelForOption(ACTIVITY_OPTIONS, app.currentActivity, 'ru'),
      labelForOption(AI_EXPERIENCE_OPTIONS, app.aiExperience, 'ru'),
      labelInterests(app.interests, 'ru'),
      labelForOption(SOURCE_OPTIONS, app.source, 'ru'),
      APPLICATION_STATUS_LABELS[app.status || 'new']?.ru,
      app.accessGranted ? 'да' : 'нет',
      app.motivation,
      app.futureGoal,
      app.adminNote,
    ].map(escape).join(','))
  }
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'accelerator-applications.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function actionLabel(action) {
  const map = {
    'application.update': 'Изменение статуса',
    'application.approve': 'Одобрение',
    'application.reject': 'Отказ',
    'application.bulk_approve': 'Массовое одобрение',
    'application.telegram': 'Telegram',
  }
  return map[action] || action
}

export function AdminApplicationsPanel({
  applications = [],
  online,
  onUpdated,
  showToast,
  onOpenStudent,
  initialFilter = 'all',
}) {
  const [filter, setFilter] = useState(initialFilter)
  const [expandedId, setExpandedId] = useState(null)
  const [notes, setNotes] = useState({})
  const [approvingId, setApprovingId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [historyById, setHistoryById] = useState({})
  const [historyLoading, setHistoryLoading] = useState(null)
  const [promoById, setPromoById] = useState({})
  const [localApps, setLocalApps] = useState(() => (online ? [] : getAcceleratorApplications()))

  useEffect(() => {
    setFilter(initialFilter)
  }, [initialFilter])

  useEffect(() => {
    if (!online) setLocalApps(getAcceleratorApplications())
  }, [online, applications])

  const list = online ? applications : localApps

  const filtered = useMemo(() => {
    if (filter === 'all') return list
    return list.filter((a) => (a.status || 'new') === filter)
  }, [list, filter])

  const counts = useMemo(() => ({
    all: list.length,
    new: list.filter((a) => (a.status || 'new') === 'new').length,
    reviewed: list.filter((a) => a.status === 'reviewed').length,
    accepted: list.filter((a) => a.status === 'accepted').length,
    rejected: list.filter((a) => a.status === 'rejected').length,
  }), [list])

  const selectableIds = useMemo(
    () => filtered.filter((a) => (a.status || 'new') !== 'accepted').map((a) => a.id),
    [filtered]
  )

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size >= selectableIds.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(selectableIds))
    }
  }

  const setStatus = async (id, status) => {
    const app = list.find((a) => a.id === id)
    const adminNote = notes[id] ?? undefined

    if (status === 'accepted' && app && online) {
      return approveApplication(app)
    }

    try {
      if (online) {
        await api.adminUpdateApplication(id, { status, adminNote })
      } else {
        updateAcceleratorApplication(id, { status, adminNote })
        setLocalApps(getAcceleratorApplications())
      }
      showToast(`Статус: ${APPLICATION_STATUS_LABELS[status]?.ru || status}`)
      onUpdated?.()
    } catch {
      showToast('Ошибка обновления', 'error')
    }
  }

  const saveNote = async (id) => {
    const adminNote = notes[id] ?? ''
    try {
      if (online) {
        await api.adminUpdateApplication(id, { adminNote })
      } else {
        updateAcceleratorApplication(id, { adminNote })
        setLocalApps(getAcceleratorApplications())
      }
      showToast('Заметка сохранена')
      onUpdated?.()
    } catch {
      showToast('Ошибка сохранения', 'error')
    }
  }

  const approveApplication = async (app) => {
    const adminNote = notes[app.id] ?? app.adminNote ?? ''
    if (!window.confirm(`Одобрить заявку ${app.firstName} ${app.lastName} (${app.email})?\n\nОткроется доступ к курсу. Telegram не отправляется автоматически — напишите студенту сами при необходимости.`)) {
      return
    }
    setApprovingId(app.id)
    try {
      if (online) {
        const result = await api.adminApproveApplication(app.id, { adminNote: adminNote || undefined })
        showToast('Заявка одобрена · доступ к курсу открыт', 'success')
      } else {
        updateAcceleratorApplication(app.id, { status: 'accepted', adminNote })
        setLocalApps(getAcceleratorApplications())
        showToast('Заявка одобрена (локально)')
      }
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(app.id)
        return next
      })
      onUpdated?.()
    } catch (err) {
      showToast(err?.message || 'Ошибка одобрения', 'error')
    } finally {
      setApprovingId(null)
    }
  }

  const bulkApprove = async () => {
    const ids = [...selected].filter((id) => {
      const app = list.find((a) => a.id === id)
      return app && (app.status || 'new') !== 'accepted'
    })
    if (!ids.length) return
    if (!window.confirm(`Одобрить ${ids.length} заявок?\n\nКаждому откроется доступ к курсу. Telegram не отправляется автоматически.`)) {
      return
    }
    setBulkBusy(true)
    try {
      if (online) {
        const result = await api.adminBulkApproveApplications(ids)
        showToast(`Одобрено: ${result.approved} из ${ids.length}`, result.approved ? 'success' : 'info')
      } else {
        ids.forEach((id) => updateAcceleratorApplication(id, { status: 'accepted' }))
        setLocalApps(getAcceleratorApplications())
        showToast(`Одобрено локально: ${ids.length}`)
      }
      setSelected(new Set())
      onUpdated?.()
    } catch (err) {
      showToast(err?.message || 'Ошибка массового одобрения', 'error')
    } finally {
      setBulkBusy(false)
    }
  }

  const rejectApplication = async (app, template) => {
    const adminNote = template?.note || notes[app.id] || app.adminNote || ''
    const preview = adminNote.length > 120 ? `${adminNote.slice(0, 120)}…` : adminNote
    const issuePromo = window.confirm(
      `${template?.label || 'Отказ'}\n\n${preview}\n\nВыдать промокод на AI Start (скидка 15%)?`
    )
    const promoCode = issuePromo ? (promoById[app.id] || buildPromoCode()) : null
    if (issuePromo && !promoById[app.id]) {
      setPromoById((prev) => ({ ...prev, [app.id]: promoCode }))
    }
    setNotes((prev) => ({ ...prev, [app.id]: adminNote }))
    setRejectingId(app.id)
    try {
      if (online) {
        const result = await api.adminRejectApplication(app.id, {
          adminNote,
          reason: template?.id,
          promoCode: promoCode || undefined,
          discountPercent: promoCode ? 15 : undefined,
        })
        let msg = 'Заявка отклонена'
        if (result.promoCreated) msg += ` · промо ${result.promoCreated.code}`
        showToast(msg, 'info')
      } else {
        updateAcceleratorApplication(app.id, { status: 'rejected', adminNote })
        setLocalApps(getAcceleratorApplications())
        showToast('Отказ сохранён (локально)')
      }
      onUpdated?.()
    } catch (err) {
      showToast(err?.message || 'Ошибка отказа', 'error')
    } finally {
      setRejectingId(null)
    }
  }

  const sendTelegram = async (app, template) => {
    try {
      if (online) {
        const result = await api.adminSendApplicationTelegram(app.id, {
          text: template.text,
          title: 'AI Insider Academy',
          template: template.id,
        })
        showToast(
          result.sent ? 'Telegram отправлен' : (result.hint || 'Не удалось отправить'),
          result.sent ? 'success' : 'info'
        )
      } else {
        showToast('Telegram доступен только при подключении к серверу', 'info')
      }
    } catch {
      showToast('Ошибка отправки Telegram', 'error')
    }
  }

  const loadHistory = async (appId) => {
    if (historyById[appId]) return
    if (!online) return
    setHistoryLoading(appId)
    try {
      const { history } = await api.adminApplicationHistory(appId)
      setHistoryById((prev) => ({ ...prev, [appId]: history || [] }))
    } catch {
      showToast('Не удалось загрузить историю', 'error')
    } finally {
      setHistoryLoading(null)
    }
  }

  const openDetails = (app) => {
    const next = expandedId === app.id ? null : app.id
    setExpandedId(next)
    if (next) loadHistory(app.id)
  }

  const isCompleteApplication = (app) => Boolean(
    app.firstName && app.lastName && app.email && app.telegram && app.motivation && app.futureGoal
  )

  return (
    <div>
      <div className={styles.appPanelHeader}>
        <p className={styles.sectionDesc} style={{ margin: 0 }}>
          Курс: <strong>{ACCELERATOR_COURSE_TITLE}</strong>
          {' · '}
          Заявки с формы на сайте попадают сюда автоматически.
          {!online && ' (локальный режим — данные из браузера)'}
        </p>
        <button
          type="button"
          className={styles.exportBtn}
          onClick={() => exportApplicationsCsv(filtered)}
          disabled={filtered.length === 0}
        >
          Экспорт CSV
        </button>
      </div>

      {selected.size > 0 && (
        <div className={styles.bulkToolbar}>
          <span>Выбрано: {selected.size}</span>
          <button
            type="button"
            className={styles.approveBtn}
            disabled={bulkBusy}
            onClick={bulkApprove}
          >
            {bulkBusy ? 'Одобряем…' : '✓ Одобрить выбранные'}
          </button>
          <button type="button" className={styles.inlineBtn} onClick={() => setSelected(new Set())}>
            Снять выбор
          </button>
        </div>
      )}

      <div className={styles.filterRow}>
        {['all', 'new', 'reviewed', 'accepted', 'rejected'].map((f) => (
          <button
            key={f}
            type="button"
            className={`${styles.filterChip} ${filter === f ? styles.filterChipActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Все' : APPLICATION_STATUS_LABELS[f]?.ru}
            {' '}
            ({counts[f] ?? 0})
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Выбрать все"
                  checked={selectableIds.length > 0 && selected.size === selectableIds.length}
                  onChange={toggleSelectAll}
                  disabled={selectableIds.length === 0}
                />
              </th>
              <th>Дата</th>
              <th>ФИО</th>
              <th>Email</th>
              <th>Telegram</th>
              <th>Бот</th>
              <th>Статус</th>
              <th>Доступ</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.empty}>
                  Нет заявок{filter !== 'all' ? ' в этой категории' : ''}. Новые появятся после отправки анкеты на сайте.
                </td>
              </tr>
            ) : (
              filtered.map((app) => {
                const expanded = expandedId === app.id
                const status = app.status || 'new'
                const stale = status === 'new' && hoursSince(app.date) >= 24
                return (
                  <Fragment key={app.id}>
                    <tr className={status === 'new' ? styles.unseenRow : ''}>
                      <td>
                        {status !== 'accepted' && (
                          <input
                            type="checkbox"
                            checked={selected.has(app.id)}
                            onChange={() => toggleSelect(app.id)}
                            aria-label={`Выбрать ${app.email}`}
                          />
                        )}
                      </td>
                      <td>
                        {formatDate(app.date)}
                        {stale && <span className={styles.slaWarn} title="Более 24 ч в статусе «Новая»"> &gt;24ч</span>}
                      </td>
                      <td><strong>{app.firstName} {app.lastName}</strong></td>
                      <td>
                        {onOpenStudent ? (
                          <button
                            type="button"
                            className={styles.emailLinkBtn}
                            onClick={() => onOpenStudent(app.email, app)}
                          >
                            {app.email}
                          </button>
                        ) : (
                          <a href={`mailto:${app.email}`} className={styles.mailLink}>{app.email}</a>
                        )}
                      </td>
                      <td>
                        {app.telegram ? (
                          <a
                            href={`https://t.me/${String(app.telegram).replace(/^@/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.mailLink}
                          >
                            {app.telegram}
                          </a>
                        ) : '—'}
                      </td>
                      <td>
                        <span
                          className={app.telegramConnected ? styles.tgBadgeOn : styles.tgBadgeOff}
                          title={app.telegramConnected ? 'Бот подключён' : 'Бот не подключён — отправьте шаблон «Подключить бота»'}
                        >
                          {app.telegramConnected ? '✓ бот' : '— бот'}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusPill} ${styles[`status_${status}`]}`}>
                          {APPLICATION_STATUS_LABELS[status]?.ru}
                        </span>
                      </td>
                      <td>
                        {app.accessGranted ? (
                          <span className={styles.accessGranted}>✓ выдан</span>
                        ) : (
                          <span className={styles.drawerMuted}>—</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          {status !== 'accepted' && isCompleteApplication(app) && (
                            <button
                              type="button"
                              className={styles.approveBtn}
                              disabled={approvingId === app.id}
                              onClick={() => approveApplication(app)}
                              title="Одобрить и открыть доступ к курсу"
                            >
                              {approvingId === app.id ? '…' : '✓ Одобрить'}
                            </button>
                          )}
                          {status !== 'accepted' && status !== 'rejected' && (
                            <div className={styles.rejectMenu}>
                              <button
                                type="button"
                                className={styles.rejectBtn}
                                disabled={rejectingId === app.id}
                                onClick={() => rejectApplication(app, REJECT_TEMPLATES[0])}
                              >
                                ✕ Отказ
                              </button>
                              <select
                                className={styles.statusSelect}
                                defaultValue=""
                                onChange={(e) => {
                                  const tpl = REJECT_TEMPLATES.find((t) => t.id === e.target.value)
                                  if (tpl) rejectApplication(app, tpl)
                                  e.target.value = ''
                                }}
                                aria-label="Шаблон отказа"
                              >
                                <option value="" disabled>Шаблон отказа…</option>
                                {REJECT_TEMPLATES.map((t) => (
                                  <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          <button
                            type="button"
                            className={styles.inlineBtn}
                            onClick={() => openDetails(app)}
                          >
                            {expanded ? 'Скрыть' : 'Подробнее'}
                          </button>
                          <select
                            className={styles.statusSelect}
                            value={status}
                            onChange={(e) => setStatus(app.id, e.target.value)}
                            aria-label="Статус заявки"
                          >
                            {STATUS_ORDER.map((s) => (
                              <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]?.ru}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className={styles.appDetailRow}>
                        <td colSpan={9}>
                          <div className={styles.appDetailGrid}>
                            <div className={styles.appDetailBlock}>
                              <strong>Возраст / страна / занятость</strong>
                              <p>
                                {app.age ?? '—'} лет · {app.country || '—'} ·{' '}
                                {labelForOption(ACTIVITY_OPTIONS, app.currentActivity, 'ru')} ·{' '}
                                {labelForOption(AI_EXPERIENCE_OPTIONS, app.aiExperience, 'ru')}
                              </p>
                            </div>
                            <div className={styles.appDetailBlock}>
                              <strong>Интересы / источник</strong>
                              <p>{labelInterests(app.interests, 'ru')} · {labelForOption(SOURCE_OPTIONS, app.source, 'ru')}</p>
                            </div>
                            <div className={styles.appDetailBlock}>
                              <strong>Мотивационное письмо</strong>
                              <p>{app.motivation}</p>
                            </div>
                            <div className={styles.appDetailBlock}>
                              <strong>Цель через 12 месяцев</strong>
                              <p>{app.futureGoal}</p>
                            </div>
                            <label className={styles.appNoteField}>
                              <span>Заметка админа</span>
                              <textarea
                                rows={3}
                                value={notes[app.id] ?? app.adminNote ?? ''}
                                onChange={(e) => setNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
                              />
                            </label>
                            <div className={styles.reviewAdminActions}>
                              <button type="button" className={styles.inlineBtn} onClick={() => saveNote(app.id)}>
                                Сохранить заметку
                              </button>
                              {status !== 'accepted' && isCompleteApplication(app) && (
                                <button
                                  type="button"
                                  className={styles.approveBtn}
                                  disabled={approvingId === app.id}
                                  onClick={() => approveApplication(app)}
                                >
                                  {approvingId === app.id ? 'Одобряем…' : '✓ Одобрить и открыть доступ'}
                                </button>
                              )}
                            </div>

                            <div className={styles.appDetailBlock}>
                              <strong>Telegram-шаблоны</strong>
                              <div className={styles.templateRow}>
                                {TELEGRAM_TEMPLATES.map((tpl) => (
                                  <button
                                    key={tpl.id}
                                    type="button"
                                    className={styles.smallBtn}
                                    onClick={() => sendTelegram(app, tpl)}
                                  >
                                    {tpl.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {(status === 'reviewed' || status === 'rejected') && (
                              <div className={styles.appDetailBlock}>
                                <strong>Промокод AI Start (ожидание / отказ)</strong>
                                <div className={styles.templateRow}>
                                  <input
                                    type="text"
                                    className={styles.promoInput}
                                    placeholder="AIA-XXXXXX"
                                    value={promoById[app.id] || ''}
                                    onChange={(e) => setPromoById((prev) => ({ ...prev, [app.id]: e.target.value.toUpperCase() }))}
                                  />
                                  <button
                                    type="button"
                                    className={styles.smallBtn}
                                    onClick={() => {
                                      const code = promoById[app.id] || buildPromoCode()
                                      setPromoById((prev) => ({ ...prev, [app.id]: code }))
                                      if (online) {
                                        api.adminCreatePromo({ code, discountPercent: 15, courseIds: ['ai-start'] })
                                          .then(() => showToast(`Промокод ${code} создан`))
                                          .catch(() => showToast('Ошибка создания промо', 'error'))
                                      } else {
                                        showToast(`Промокод ${code} (локально)`)
                                      }
                                    }}
                                  >
                                    Создать промо 15%
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className={styles.appDetailBlock}>
                              <strong>История действий</strong>
                              {historyLoading === app.id && <p className={styles.drawerMuted}>Загрузка…</p>}
                              {!online && <p className={styles.drawerMuted}>История доступна при подключении к серверу</p>}
                              {online && historyById[app.id]?.length === 0 && historyLoading !== app.id && (
                                <p className={styles.drawerMuted}>Пока нет записей</p>
                              )}
                              {historyById[app.id]?.length > 0 && (
                                <ul className={styles.historyList}>
                                  {historyById[app.id].map((h) => (
                                    <li key={h.id}>
                                      <time>{formatDate(h.createdAt)}</time>
                                      {' · '}
                                      <strong>{actionLabel(h.action)}</strong>
                                      {' · '}
                                      {h.actor}
                                      {h.meta?.status && ` · ${h.meta.status}`}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {status === 'accepted' && (
                              <p className={styles.sectionDesc} style={{ margin: 0 }}>
                                ✅ Доступ к курсу выдан · студент может войти на myinsideracademy.com
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
