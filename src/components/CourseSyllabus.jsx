import { useState } from 'react'
import { IconChevronDown } from './Icons'
import { WeekHomeworkBlock } from './WeekHomeworkBlock'
import { getWeekDisplayTitle } from '../data/courses'
import styles from './CourseSyllabus.module.css'

export function CourseSyllabus({ weeks, lang = 'ru', compact = false }) {
  const [openWeek, setOpenWeek] = useState(compact ? null : 0)
  if (!weeks?.length) return null

  return (
    <div className={`${styles.syllabus} ${compact ? styles.compact : ''}`}>
      {weeks.map((w, i) => {
        const open = openWeek === i
        const title = getWeekDisplayTitle(w, lang)
        const goal = lang === 'en' ? w.goalEn : w.goal
        const outcome = lang === 'en' ? w.outcomeEn : w.outcome
        const skills = lang === 'en' ? w.skillsEn : w.skills

        return (
          <article key={w.number} className={styles.week}>
            <button
              type="button"
              className={styles.weekHead}
              onClick={() => setOpenWeek(open ? null : i)}
              aria-expanded={open}
            >
              <span className={styles.weekNum}>{w.number}</span>
              <span className={styles.weekTitle}>{title}</span>
              <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>
                <IconChevronDown />
              </span>
            </button>
            {open && (
              <div className={styles.weekBody}>
                <p className={styles.goal}>
                  <strong>{lang === 'ru' ? 'Цель:' : 'Goal:'}</strong> {goal}
                </p>
                {skills?.length > 0 && (
                  <>
                    <strong className={styles.label}>{lang === 'ru' ? 'Навыки' : 'Skills'}</strong>
                    <ul className={styles.skills}>
                      {skills.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </>
                )}
                <p className={styles.outcome}>
                  <strong>{lang === 'ru' ? 'Практический результат:' : 'Practical outcome:'}</strong>{' '}
                  {outcome}
                </p>
                {w.homework && <WeekHomeworkBlock homework={w.homework} lang={lang} compact />}
                {w.videoTitles?.length > 1 && (
                  <>
                    <strong className={styles.label}>{lang === 'ru' ? 'Видео недели' : 'Week videos'}</strong>
                    <ol className={styles.videoList}>
                      {w.videoTitles.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ol>
                  </>
                )}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
