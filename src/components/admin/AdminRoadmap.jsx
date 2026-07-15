import { useCallback, useEffect, useState } from 'react'
import { Check, ChevronDown, ChevronRight, Circle, CircleDot } from 'lucide-react'
import {
  getRoadmap,
  saveRoadmap,
  resetRoadmap,
  cycleTaskStatus,
  calcPhaseProgress,
  calcOverallProgress,
  ROADMAP_STATUS,
  defaultRoadmap,
} from '../../data/adminRoadmap'
import styles from '../../pages/Admin.module.css'

const statusClass = {
  planned: styles.roadmapPlanned,
  in_progress: styles.roadmapProgress,
  done: styles.roadmapDone,
}

export function AdminRoadmap({ onToast }) {
  const [phases, setPhases] = useState(() => getRoadmap())
  const [expandedPhase, setExpandedPhase] = useState(phases[0]?.id || null)
  const [filter, setFilter] = useState('all')

  const reload = useCallback(() => setPhases(getRoadmap()), [])

  useEffect(() => {
    const handler = () => reload()
    window.addEventListener('lms-admin-roadmap-updated', handler)
    return () => window.removeEventListener('lms-admin-roadmap-updated', handler)
  }, [reload])

  const overall = calcOverallProgress(phases)

  const updatePhases = (next) => {
    setPhases(next)
    saveRoadmap(next)
  }

  const toggleTask = (phaseId, taskId) => {
    const next = phases.map((phase) => {
      if (phase.id !== phaseId) return phase
      const tasks = phase.tasks.map((t) => {
        if (t.id !== taskId) return t
        const newStatus = cycleTaskStatus(t.status)
        return { ...t, status: newStatus }
      })
      const doneCount = tasks.filter((t) => t.status === 'done').length
      let phaseStatus = 'planned'
      if (doneCount === tasks.length) phaseStatus = 'done'
      else if (tasks.some((t) => t.status === 'in_progress' || t.status === 'done')) phaseStatus = 'in_progress'
      return { ...phase, tasks, status: phaseStatus }
    })
    updatePhases(next)
    onToast?.('Статус задачи обновлён')
  }

  const setPhaseStatus = (phaseId, status) => {
    const next = phases.map((p) => (p.id === phaseId ? { ...p, status } : p))
    updatePhases(next)
  }

  const handleReset = () => {
    if (!window.confirm('Сбросить роадмап к значениям по умолчанию?')) return
    resetRoadmap()
    setPhases(defaultRoadmap.map((p) => ({ ...p, tasks: p.tasks.map((t) => ({ ...t })) })))
    onToast?.('Роадмап сброшен')
  }

  const filteredPhases = phases.filter((phase) => {
    if (filter === 'all') return true
    return phase.status === filter
  })

  return (
    <div className={styles.roadmap}>
      <div className={styles.roadmapHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Роадмап платформы</h2>
          <p className={styles.sectionDesc}>
            Кликайте по задачам, чтобы менять статус: «запланировано», «в работе», затем «готово».
          </p>
        </div>
        <div className={styles.roadmapActions}>
          <button type="button" className={styles.restoreBtn} onClick={handleReset}>Сбросить</button>
        </div>
      </div>

      <div className={styles.overallProgress}>
        <div className={styles.overallProgressHead}>
          <span>Общий прогресс</span>
          <strong>{overall}%</strong>
        </div>
        <div className={styles.progressTrackLg}>
          <div className={styles.progressFillLg} style={{ width: `${overall}%` }} />
        </div>
        <div className={styles.phaseLegend}>
          {Object.entries(ROADMAP_STATUS).map(([key, { label }]) => (
            <span key={key} className={statusClass[key]}>{label}</span>
          ))}
        </div>
      </div>

      <div className={styles.roadmapFilters}>
        {['all', 'in_progress', 'planned', 'done'].map((f) => (
          <button
            key={f}
            type="button"
            className={`${styles.filterChip} ${filter === f ? styles.filterChipActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Все фазы' : ROADMAP_STATUS[f]?.label || f}
          </button>
        ))}
      </div>

      <div className={styles.phaseList}>
        {filteredPhases.map((phase, index) => {
          const progress = calcPhaseProgress(phase)
          const open = expandedPhase === phase.id
          return (
            <article key={phase.id} className={`${styles.phaseCard} ${statusClass[phase.status]}`}>
              <button
                type="button"
                className={styles.phaseHead}
                onClick={() => setExpandedPhase(open ? null : phase.id)}
              >
                <span className={styles.phaseNum}>{index + 1}</span>
                <div className={styles.phaseMeta}>
                  <strong>{phase.title}</strong>
                  <span>{phase.quarter} · {ROADMAP_STATUS[phase.status]?.label}</span>
                </div>
                <div className={styles.phaseProgressWrap}>
                  <div className={styles.progressTrackSm}>
                    <div className={styles.progressFillSm} style={{ width: `${progress}%` }} />
                  </div>
                  <span>{progress}%</span>
                </div>
                <span className={styles.phaseChevron}>{open ? <ChevronDown size={17} aria-hidden /> : <ChevronRight size={17} aria-hidden />}</span>
              </button>

              {open && (
                <div className={styles.phaseBody}>
                  <div className={styles.phaseStatusBtns}>
                    {Object.keys(ROADMAP_STATUS).map((st) => (
                      <button
                        key={st}
                        type="button"
                        className={`${styles.statusBtn} ${phase.status === st ? styles.statusBtnActive : ''}`}
                        onClick={() => setPhaseStatus(phase.id, st)}
                      >
                        {ROADMAP_STATUS[st].label}
                      </button>
                    ))}
                  </div>
                  <ul className={styles.taskList}>
                    {phase.tasks.map((task) => {
                      const TaskIcon = task.status === 'done' ? Check : task.status === 'in_progress' ? CircleDot : Circle
                      return (
                        <li key={task.id}>
                          <button
                            type="button"
                            className={`${styles.taskBtn} ${statusClass[task.status]}`}
                            onClick={() => toggleTask(phase.id, task.id)}
                          >
                            <span className={styles.taskCheck}><TaskIcon size={16} strokeWidth={1.9} aria-hidden /></span>
                            <span>{task.title}</span>
                            <span className={styles.taskStatus}>{ROADMAP_STATUS[task.status]?.label}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </article>
          )
        })}
      </div>

      <section className={styles.panel} style={{ marginTop: 24 }}>
        <h3 className={styles.panelTitle}>Что добавить дальше (идеи)</h3>
        <div className={styles.ideaGrid}>
          {[
            { title: 'Экспорт CSV', desc: 'Выгрузка регистраций и покупок для Excel/CRM' },
            { title: 'Push-уведомления', desc: 'Браузерные пуши о новых ДЗ и сертификатах' },
            { title: 'A/B тесты лендингов', desc: 'Два варианта hero-блока с метриками конверсии' },
            { title: 'Чат поддержки', desc: 'Встроенный чат между студентом и куратором' },
            { title: 'Gamification', desc: 'Бейджи, streak, рейтинг студентов' },
            { title: 'Мультиязычность', desc: 'Полный EN/UK интерфейс из админки' },
          ].map((idea) => (
            <div key={idea.title} className={styles.ideaCard}>
              <strong>{idea.title}</strong>
              <p>{idea.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
