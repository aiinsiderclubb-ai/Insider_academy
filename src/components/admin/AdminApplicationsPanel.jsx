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

function exportApplicationsCsv(rows) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const headers = [
    'Дата', 'Имя', 'Фамилия', 'Возраст', 'Страна', 'Email', 'Telegram',
    'Занятость', 'Опыт AI', 'Интересы', 'Источник', 'Статус',
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
      labelForOption(ACTIVITY_OPTIONS, app.currentActivity, 'ru'),
      labelForOption(AI_EXPERIENCE_OPTIONS, app.aiExperience, 'ru'),
      labelInterests(app.interests, 'ru'),
      labelForOption(SOURCE_OPTIONS, app.source, 'ru'),
      APPLICATION_STATUS_LABELS[app.status || 'new']?.ru,
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

export function AdminApplicationsPanel({
  applications = [],
  online,
  onUpdated,
  showToast,
}) {
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [notes, setNotes] = useState({})
  const [approvingId, setApprovingId] = useState(null)
  const [localApps, setLocalApps] = useState(() => (online ? [] : getAcceleratorApplications()))

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
    if (!window.confirm(`Одобрить заявку ${app.firstName} ${app.lastName} (${app.email})?\n\nОткроется доступ к курсу и уйдёт уведомление в Telegram (если бот подключён).`)) {
      return
    }
    setApprovingId(app.id)
    try {
      if (online) {
        const result = await api.adminApproveApplication(app.id, { adminNote: adminNote || undefined })
        let msg = 'Заявка одобрена · доступ к курсу открыт'
        if (result.telegramSent) msg += ' · Telegram отправлен'
        else if (result.telegramHint) msg += ` · ${result.telegramHint}`
        showToast(msg, result.telegramSent ? 'success' : 'info')
      } else {
        updateAcceleratorApplication(app.id, { status: 'accepted', adminNote })
        setLocalApps(getAcceleratorApplications())
        showToast('Заявка одобрена (локально)')
      }
      onUpdated?.()
    } catch (err) {
      showToast(err?.message || 'Ошибка одобрения', 'error')
    } finally {
      setApprovingId(null)
    }
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
              <th>Дата</th>
              <th>ФИО</th>
              <th>Возраст</th>
              <th>Страна</th>
              <th>Email</th>
              <th>Telegram</th>
              <th>Занятость</th>
              <th>Опыт AI</th>
              <th>Интересы</th>
              <th>Источник</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className={styles.empty}>
                  Нет заявок{filter !== 'all' ? ' в этой категории' : ''}. Новые появятся после отправки анкеты на сайте.
                </td>
              </tr>
            ) : (
              filtered.map((app) => {
                const expanded = expandedId === app.id
                const status = app.status || 'new'
                return (
                  <Fragment key={app.id}>
                    <tr className={status === 'new' ? styles.unseenRow : ''}>
                      <td>{formatDate(app.date)}</td>
                      <td><strong>{app.firstName} {app.lastName}</strong></td>
                      <td>{app.age ?? '—'}</td>
                      <td>{app.country || '—'}</td>
                      <td>
                        <a href={`mailto:${app.email}`} className={styles.mailLink}>{app.email}</a>
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
                      <td>{labelForOption(ACTIVITY_OPTIONS, app.currentActivity, 'ru')}</td>
                      <td>{labelForOption(AI_EXPERIENCE_OPTIONS, app.aiExperience, 'ru')}</td>
                      <td className={styles.cellWrap}>{labelInterests(app.interests, 'ru')}</td>
                      <td>{labelForOption(SOURCE_OPTIONS, app.source, 'ru')}</td>
                      <td>
                        <span className={`${styles.statusPill} ${styles[`status_${status}`]}`}>
                          {APPLICATION_STATUS_LABELS[status]?.ru}
                        </span>
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          {status !== 'accepted' && isCompleteApplication(app) && (
                            <button
                              type="button"
                              className={styles.approveBtn}
                              disabled={approvingId === app.id}
                              onClick={() => approveApplication(app)}
                              title="Одобрить, открыть доступ к курсу и отправить Telegram"
                            >
                              {approvingId === app.id ? '…' : '✓ Одобрить'}
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.inlineBtn}
                            onClick={() => setExpandedId(expanded ? null : app.id)}
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
                        <td colSpan={12}>
                          <div className={styles.appDetailGrid}>
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
