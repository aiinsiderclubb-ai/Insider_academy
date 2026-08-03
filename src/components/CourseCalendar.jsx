import { getUnlockDates, isLessonUnlocked, formatScheduleLabel } from '../utils/releaseCalendar'
import { CalendarDays, Check, LockKeyhole } from 'lucide-react'
import styles from './CourseCalendar.module.css'

export function CourseCalendar({ course, purchaseDate, className }) {
  if (!purchaseDate || !course?.releaseSchedule) return null
  const unlockDates = getUnlockDates(
    purchaseDate,
    course.releaseSchedule,
    course.lessons?.length ?? 0
  )
  const scheduleLabel = formatScheduleLabel(course.releaseSchedule)
  const now = new Date()

  return (
    <div className={`${styles.wrap} ${className || ''}`}>
      <div className={styles.head}>
        <span className={styles.icon} aria-hidden="true"><CalendarDays size={18} strokeWidth={1.8} /></span>
        <div>
          <h4 className={styles.title}>Календарь выхода уроков</h4>
          <p className={styles.schedule}>
            Новые уроки: <strong>{scheduleLabel}</strong>
          </p>
        </div>
      </div>
      <div className={styles.calendar}>
        {unlockDates.map(({ lessonIndex, unlockAt }) => {
          const unlocked = isLessonUnlocked(lessonIndex, unlockDates, now)
          const lesson = course.lessons?.[lessonIndex]
          const dateStr = unlockAt.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
          return (
            <div
              key={lessonIndex}
              className={`${styles.row} ${unlocked ? styles.rowUnlocked : styles.rowLocked}`}
            >
              <span className={styles.num}>{lessonIndex + 1}</span>
              <span className={styles.name}>{lesson?.title ?? `Урок ${lessonIndex + 1}`}</span>
              <span className={styles.date}>{dateStr}</span>
              {unlocked ? (
                <span className={styles.badgeOpen}><Check size={12} aria-hidden />Открыт</span>
              ) : (
                <span className={styles.badgeSoon}><LockKeyhole size={11} aria-hidden />С {dateStr}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
