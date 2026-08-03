import { useMemo, useState, useEffect } from 'react'
import { ChevronDown, Circle, CircleAlert, CircleDashed } from 'lucide-react'
import { getLessonDisplayTitle, getLessonDescription } from '../data/courses'
import { UiIcon } from './UiIcon'
import styles from './CourseProgramPanel.module.css'

export function CourseProgramPanel({
  lessons,
  lang,
  selectedLesson,
  onSelectLesson,
  canSelectLesson,
  lessonStatus,
  lessonAvailable,
  isFreeTrial,
  purchased,
}) {
  const MODULE_SIZE = 5

  const weekGroups = useMemo(() => {
    if (!lessons?.length) return null

    if (lessons.some((l) => l.week != null)) {
      const map = new Map()
      lessons.forEach((lesson, index) => {
        const week = lesson.week ?? 0
        if (!map.has(week)) {
          map.set(week, {
            week,
            kind: 'week',
            goal: lang === 'en' ? (lesson.weekGoalEn || lesson.weekGoal) : lesson.weekGoal,
            items: [],
          })
        }
        map.get(week).items.push({ lesson, index })
      })
      return [...map.values()].sort((a, b) => a.week - b.week)
    }

    // Без данных о неделях длинные программы делим на модули — компактнее для навигации
    if (lessons.length <= 10) return null
    const groups = []
    lessons.forEach((lesson, index) => {
      const moduleNum = Math.floor(index / MODULE_SIZE) + 1
      if (!groups[moduleNum - 1]) {
        groups.push({ week: moduleNum, kind: 'module', goal: null, items: [] })
      }
      groups[moduleNum - 1].items.push({ lesson, index })
    })
    return groups
  }, [lessons, lang])

  const selectedWeek = weekGroups
    ? (weekGroups.find((g) => g.items.some((it) => it.index === selectedLesson))?.week ?? weekGroups[0]?.week)
    : null

  const [openWeeks, setOpenWeeks] = useState(() => new Set(selectedWeek != null ? [selectedWeek] : []))

  useEffect(() => {
    if (selectedWeek == null) return
    setOpenWeeks((prev) => {
      if (prev.has(selectedWeek)) return prev
      const next = new Set(prev)
      next.add(selectedWeek)
      return next
    })
  }, [selectedWeek])

  if (!lessons?.length) {
    return (
      <p className={styles.empty}>
        {lang === 'ru' ? 'Содержание курса будет добавлено.' : 'Course content will be added.'}
      </p>
    )
  }

  const renderLesson = (lesson, index) => {
    const available = lessonAvailable(index)
    const status = lessonStatus(index)
    const active = selectedLesson === index
    const disabled = !canSelectLesson(index)
    const description = getLessonDescription(lesson, lang)

    return (
      <li key={lesson.id}>
        <button
          type="button"
          className={`${styles.item} ${active ? styles.itemActive : ''} ${disabled ? styles.itemDisabled : ''}`}
          onClick={() => !disabled && onSelectLesson(index)}
          disabled={disabled}
          aria-current={active ? 'true' : undefined}
        >
          <span className={styles.num}>{index + 1}</span>
          <span className={styles.content}>
            <span className={styles.title}>{getLessonDisplayTitle(lesson, lang)}</span>
            {description && <span className={styles.desc}>{description}</span>}
          </span>
          <span className={styles.status} aria-hidden>
            {isFreeTrial && <Circle className={styles.statusOpen} size={10} fill="currentColor" />}
            {!isFreeTrial && index === 0 && <Circle className={styles.statusFree} size={10} fill="currentColor" />}
            {!isFreeTrial && index > 0 && !purchased && (
              <span className={styles.statusLock} aria-hidden>
                <UiIcon name="lock" size={14} tone="secondary" />
              </span>
            )}
            {!isFreeTrial && purchased && status === 'open' && <Circle className={styles.statusOpen} size={10} fill="currentColor" />}
            {!isFreeTrial && purchased && status === 'review' && <CircleDashed className={styles.statusReview} size={12} />}
            {!isFreeTrial && purchased && status === 'homework' && !available && (
              <span className={styles.statusLock} aria-hidden>
                <UiIcon name="lock" size={14} tone="secondary" />
              </span>
            )}
            {!isFreeTrial && purchased && status === 'homework' && available && <CircleAlert className={styles.statusHomework} size={12} />}
          </span>
        </button>
      </li>
    )
  }

  if (!weekGroups) {
    return (
      <ul className={styles.list}>
        {lessons.map((lesson, index) => renderLesson(lesson, index))}
      </ul>
    )
  }

  const toggleWeek = (week) => {
    setOpenWeeks((prev) => {
      const next = new Set(prev)
      if (next.has(week)) next.delete(week)
      else next.add(week)
      return next
    })
  }

  return (
    <div className={styles.weeks}>
      {weekGroups.map((group) => {
        const open = openWeeks.has(group.week)
        const lessonsWord = lang === 'ru'
          ? `${group.items.length} ${group.items.length === 1 ? 'урок' : group.items.length < 5 ? 'урока' : 'уроков'}`
          : `${group.items.length} lesson${group.items.length === 1 ? '' : 's'}`

        return (
          <section key={group.week} className={styles.weekGroup}>
            <button
              type="button"
              className={styles.weekHead}
              onClick={() => toggleWeek(group.week)}
              aria-expanded={open}
            >
              <span className={styles.weekHeadText}>
                <span className={styles.weekTitle}>
                  {group.kind === 'module'
                    ? (lang === 'ru' ? `Модуль ${group.week}` : `Module ${group.week}`)
                    : (lang === 'ru' ? `Неделя ${group.week}` : `Week ${group.week}`)}
                  <span className={styles.weekCount}>{lessonsWord}</span>
                </span>
                {group.goal && <span className={styles.weekGoal}>{group.goal}</span>}
              </span>
              <span className={`${styles.weekChevron} ${open ? styles.weekChevronOpen : ''}`} aria-hidden>
                <ChevronDown size={16} />
              </span>
            </button>
            {open && (
              <ul className={styles.list}>
                {group.items.map(({ lesson, index }) => renderLesson(lesson, index))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
