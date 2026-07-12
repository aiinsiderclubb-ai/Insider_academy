import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCourses } from '../context/CoursesContext'
import { useProgress } from '../context/ProgressContext'
import { useLanguage } from '../context/LanguageContext'
import { getCourseField } from '../data/courses'
import { pickContinueTarget } from '../utils/continueLearning'
import { ProgressRing } from './ProgressRing'
import { UiIcon } from './UiIcon'
import styles from './ContinueLearningPanel.module.css'

export const STREAK_MILESTONES = [
  { days: 3, icon: 'flame', titleRu: 'Разгон', titleEn: 'Ignition', rewardRu: 'Бейдж «Серия 3»', rewardEn: '3-day badge' },
  { days: 7, icon: 'zap', titleRu: 'Неделя силы', titleEn: 'Power week', rewardRu: 'Бейдж «Серия 7»', rewardEn: '7-day badge' },
  { days: 14, icon: 'sparkles', titleRu: 'Две недели', titleEn: 'Two weeks', rewardRu: 'Бейдж «Серия 14»', rewardEn: '14-day badge' },
]

export function ContinueLearningPanel({ streakCurrent = 0, compact = false }) {
  const { user, purchases } = useAuth()
  const { courses } = useCourses()
  const { getPercent, getProgress } = useProgress()
  const { lang } = useLanguage()
  const ru = lang === 'ru'

  if (!user) return null

  const target = pickContinueTarget({ purchases, courses, getPercent, getProgress })
  if (!target?.course) return null

  const { course, lessonIndex, percent } = target
  const title = getCourseField(course, 'title', lang)
  const lesson = course.lessons?.[lessonIndex]
  const lessonTitle = lesson
    ? (lang === 'en' && lesson.titleEn ? lesson.titleEn : lesson.title)
    : null
  const totalLessons = course.lessons?.length || 0
  const nextMilestone = STREAK_MILESTONES.find((m) => streakCurrent < m.days) || STREAK_MILESTONES[STREAK_MILESTONES.length - 1]
  const nextGoal = nextMilestone.days
  const streakPct = Math.min(100, Math.round((streakCurrent / nextGoal) * 100))

  return (
    <section className={`${styles.panel} ${compact ? styles.compact : ''}`}>
      <div className={styles.main}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>{ru ? 'Продолжить обучение' : 'Continue learning'}</span>
          <h2 className={styles.courseTitle}>{title}</h2>
          {lessonTitle && (
            <p className={styles.nextLesson}>
              {ru ? 'Следующий урок' : 'Next lesson'}:{' '}
              <strong>{lessonIndex + 1}. {lessonTitle}</strong>
            </p>
          )}
        </div>

        <div className={styles.progressRow}>
          <ProgressRing percent={percent} size={compact ? 56 : 72} stroke={4}>
            <span className={styles.ringPct}>{percent}%</span>
          </ProgressRing>
          <div className={styles.progressMeta}>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${percent}%` }} />
            </div>
            <span className={styles.progressHint}>
              {ru
                ? `Урок ${Math.min(lessonIndex + 1, totalLessons)} из ${totalLessons}`
                : `Lesson ${Math.min(lessonIndex + 1, totalLessons)} of ${totalLessons}`}
            </span>
          </div>
        </div>

        <Link to={`/courses/${course.slug}?lesson=${lessonIndex}`} className={styles.cta}>
          {percent > 0
            ? (ru ? 'Продолжить урок →' : 'Continue lesson →')
            : (ru ? 'Начать урок →' : 'Start lesson →')}
        </Link>
      </div>

      <aside className={styles.streakSide}>
        <div className={styles.streakHead}>
          <UiIcon name="flame" variant="box" tone="accent" />
          <div>
            <strong className={styles.streakValue}>{streakCurrent}</strong>
            <span className={styles.streakLabel}>{ru ? 'дней подряд' : 'day streak'}</span>
          </div>
        </div>

        <div className={styles.milestoneTrack}>
          {STREAK_MILESTONES.map((m) => {
            const unlocked = streakCurrent >= m.days
            return (
              <div
                key={m.days}
                className={`${styles.milestone} ${unlocked ? styles.milestoneDone : ''}`}
                title={ru ? m.rewardRu : m.rewardEn}
              >
                <span className={styles.milestoneIcon}>
                  <UiIcon name={m.icon} variant="badge" tone={unlocked ? 'accent' : 'secondary'} />
                </span>
                <span className={styles.milestoneDays}>{m.days}</span>
              </div>
            )
          })}
        </div>

        <div className={styles.streakBarTrack}>
          <div className={styles.streakBarFill} style={{ width: `${streakPct}%` }} />
        </div>
        <p className={styles.streakHint}>
          {streakCurrent >= 14
            ? (ru ? 'Все награды серии открыты!' : 'All streak rewards unlocked!')
            : (ru
              ? `До награды «${nextMilestone.titleRu}»: ${Math.max(0, nextGoal - streakCurrent)} дн.`
              : `${Math.max(0, nextGoal - streakCurrent)} days to “${nextMilestone.titleEn}”`)}
        </p>
      </aside>
    </section>
  )
}
