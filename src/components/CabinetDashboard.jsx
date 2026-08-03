import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileArchive,
  Flame,
  MessageCircle,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCourses } from '../context/CoursesContext'
import { useProgress } from '../context/ProgressContext'
import { getCourseField } from '../data/courses'
import { pickContinueTarget } from '../utils/continueLearning'
import { getMarketplaceProduct } from '../data/marketplace/products'
import { getVaultProduct } from '../data/vaultProducts'
import { getActiveGiveaways } from '../data/giveaways'
import { getUpcomingEvents } from '../data/events'
import styles from './CabinetDashboard.module.css'

export function CabinetDashboard({
  lang,
  notifications = [],
  unreadCount = 0,
  giveawayCount = null,
  stats = null,
  certificateCount = 0,
}) {
  const ru = lang === 'ru'
  const { user, purchases } = useAuth()
  const { courses } = useCourses()
  const { getPercent, getProgress } = useProgress()

  const target = pickContinueTarget({ purchases, courses, getPercent, getProgress })
  const courseTitle = target?.course ? getCourseField(target.course, 'title', lang) : null
  const lesson = target?.course?.lessons?.[target.lessonIndex]
  const lessonTitle = lesson
    ? (lang === 'en' && lesson.titleEn ? lesson.titleEn : lesson.title)
    : null
  const totalLessons = target?.course?.lessons?.length || 0
  const progress = Math.min(100, Math.max(0, target?.percent || 0))
  const completedLessons = totalLessons ? Math.min(totalLessons, Math.round(totalLessons * progress / 100)) : 0
  const streak = Math.max(0, stats?.streak?.current || 0)
  const firstName = String(user?.name || user?.email?.split('@')[0] || (ru ? 'студент' : 'student')).trim().split(/\s+/)[0]

  const ownedDownloads = [
    ...purchases.map((purchase) => {
      const product = getMarketplaceProduct(purchase.id)
      return product ? {
        id: `market-${product.id}`,
        title: ru ? product.titleRu : product.titleEn,
        meta: product.fileTypes?.join(' · ') || 'ZIP',
        to: `/marketplace/${product.slug}`,
      } : null
    }),
    ...purchases.map((purchase) => {
      const product = getVaultProduct(purchase.id)
      return product ? {
        id: `vault-${product.id}`,
        title: ru ? product.titleRu : product.titleEn,
        meta: 'Vault · ZIP',
        to: `/vault/${product.slug}`,
      } : null
    }),
  ].filter(Boolean).slice(0, 2)

  const recentItems = notifications.slice(0, 3)
  const giveaway = getActiveGiveaways()[0] || null
  const nextEvent = getUpcomingEvents()[0] || null
  const activeDays = Math.min(7, Math.max(streak, progress > 0 ? Math.ceil(progress / 16) : 0))
  const weekDays = ru ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
  const today = new Intl.DateTimeFormat(ru ? 'ru-RU' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  return (
    <section className={styles.dash} aria-label={ru ? 'Обзор кабинета' : 'Cabinet overview'}>
      <header className={styles.topbar}>
        <div>
          <span className={styles.kicker}>
            <Sparkles size={13} aria-hidden />
            {ru ? 'Персональная траектория' : 'Personal learning path'}
          </span>
          <h1 className={styles.greeting}>
            {ru ? 'Доброе утро' : 'Good morning'}, {firstName}
          </h1>
          <p className={styles.subline}>
            {ru ? 'Продолжайте учиться. Следующий шаг уже готов.' : 'Keep learning. Your next step is ready.'}
          </p>
        </div>
        <div className={styles.topActions}>
          <Link to="/calendar" className={styles.dateChip} aria-label={ru ? 'Открыть календарь' : 'Open calendar'}>
            <CalendarDays size={15} aria-hidden />
            <span>{today}</span>
          </Link>
          <Link to="/account" className={styles.iconButton} aria-label={ru ? 'Открыть уведомления' : 'Open notifications'}>
            <Bell size={17} aria-hidden />
            {unreadCount > 0 && <span className={styles.notificationDot}>{Math.min(unreadCount, 9)}</span>}
          </Link>
        </div>
      </header>

      <div className={styles.heroGrid}>
        <article className={styles.courseCard}>
          <div className={styles.courseCopy}>
            <span className={styles.cardLabel}>{ru ? 'Текущий курс' : 'Current course'}</span>
            <h2 className={styles.courseTitle}>{courseTitle || (ru ? 'AI Starter Week' : 'AI Starter Week')}</h2>
            <p className={styles.courseMeta}>
              {lessonTitle
                ? `${ru ? 'Урок' : 'Lesson'} ${(target?.lessonIndex || 0) + 1}: ${lessonTitle}`
                : (ru ? '7 дней, чтобы уверенно начать работу с AI' : '7 days to confidently start with AI')}
            </p>

            <div className={styles.progressMeta}>
              <span>{ru ? 'Ваш прогресс' : 'Your progress'}</span>
              <strong>{progress}%</strong>
            </div>
            <div className={styles.progressTrack} aria-label={`${progress}%`}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.courseStats}>
              <span><BookOpen size={14} aria-hidden />{completedLessons} / {totalLessons || 7} {ru ? 'уроков' : 'lessons'}</span>
              <span><Clock3 size={14} aria-hidden />{lesson?.duration || '12:48'}</span>
            </div>

            <Link
              to={target?.course ? `/courses/${target.course.slug}?lesson=${target.lessonIndex}` : '/courses/ai-start?lesson=0'}
              className={styles.primaryCta}
            >
              {progress > 0 ? (ru ? 'Продолжить обучение' : 'Continue learning') : (ru ? 'Начать обучение' : 'Start learning')}
              <ArrowRight size={17} aria-hidden />
            </Link>
          </div>
          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.heroOrb} />
            <img src="/design/course-ai-automation.webp" alt="" className={styles.heroImage} />
          </div>
        </article>

        <aside className={styles.sideStack}>
          <article className={styles.mentorCard}>
            <div className={styles.mentorTop}>
              <span className={styles.cardLabel}>{ru ? 'AI-наставник' : 'AI mentor'}</span>
              <span className={styles.onlineDot} aria-hidden />
            </div>
            <div className={styles.mentorBody}>
              <img src="/design/course-ai-agents.webp" alt="" className={styles.mentorAvatar} />
              <p>{ru ? 'Готов помочь разобрать сложный момент или выбрать следующий шаг.' : 'Ready to explain a difficult topic or choose your next step.'}</p>
            </div>
            <button
              type="button"
              className={styles.mentorCta}
              onClick={() => {
                const supportButton = document.querySelector(
                  `button[aria-label="${ru ? 'Чат поддержки' : 'Support chat'}"]`
                )
                supportButton?.click()
              }}
            >
              <MessageCircle size={15} aria-hidden />
              {ru ? 'Спросить' : 'Ask mentor'}
              <ArrowRight size={14} aria-hidden />
            </button>
          </article>

          <article className={styles.streakCard}>
            <div>
              <span className={styles.cardLabel}>{ru ? 'Серия дней' : 'Learning streak'}</span>
              <strong className={styles.streakValue}>{streak || activeDays}</strong>
              <span className={styles.streakUnit}>{ru ? 'дней подряд' : 'days in a row'}</span>
            </div>
            <div className={styles.streakBars} aria-hidden="true">
              {[32, 49, 42, 66, 82].map((height, index) => (
                <i key={height} style={{ height: `${height}%` }} className={index >= 3 ? styles.hotBar : ''} />
              ))}
            </div>
            <Flame size={21} className={styles.flameIcon} aria-hidden />
          </article>
        </aside>
      </div>

      <div className={styles.lowerGrid}>
        <article className={styles.weekCard}>
          <div className={styles.cardHead}>
            <div>
              <span className={styles.cardLabel}>{ru ? 'Ритм на неделю' : 'Weekly rhythm'}</span>
              <h3>{ru ? 'Учитесь в своём темпе' : 'Learn at your pace'}</h3>
            </div>
            <strong>{activeDays} / 7</strong>
          </div>
          <div className={styles.weekDays}>
            {weekDays.map((day, index) => (
              <div key={day} className={index < activeDays ? styles.dayActive : ''}>
                <span>{day}</span>
                <i>{index < activeDays && <Check size={12} strokeWidth={3} aria-hidden />}</i>
              </div>
            ))}
          </div>
          <div className={styles.weekGoal}>
            <span>{ru ? 'Цель: 5 уроков в неделю' : 'Goal: 5 lessons a week'}</span>
            <div><i style={{ width: `${Math.min(100, activeDays * 20)}%` }} /></div>
          </div>
        </article>

        <article className={styles.downloadCard}>
          <div className={styles.cardHead}>
            <div>
              <span className={styles.cardLabel}>{ru ? 'Загрузки' : 'Downloads'}</span>
              <h3>{ru ? 'Материалы курса' : 'Course materials'}</h3>
            </div>
            <Download size={17} aria-hidden />
          </div>
          <div className={styles.downloadList}>
            {(ownedDownloads.length ? ownedDownloads : [{
              id: 'course-materials',
              title: ru ? 'AI Agents Handbook.pdf' : 'AI Agents Handbook.pdf',
              meta: 'PDF · 12.4 MB',
              to: target?.course ? `/courses/${target.course.slug}` : '/courses',
            }]).map((item) => (
              <Link to={item.to} key={item.id}>
                <span className={styles.fileIcon}><FileArchive size={15} aria-hidden /></span>
                <span><strong>{item.title}</strong><small>{item.meta}</small></span>
                <Download size={15} aria-hidden />
              </Link>
            ))}
          </div>
          <Link to="/account?tab=downloads" className={styles.textLink}>
            {ru ? 'Все файлы' : 'All files'} <ArrowRight size={14} aria-hidden />
          </Link>
        </article>

        <article className={styles.activityCard}>
          <div className={styles.cardHead}>
            <div>
              <span className={styles.cardLabel}>{ru ? 'Недавняя активность' : 'Recent activity'}</span>
              <h3>{ru ? 'Ваши последние шаги' : 'Your latest steps'}</h3>
            </div>
            <CheckCircle2 size={17} aria-hidden />
          </div>
          <div className={styles.activityList}>
            {recentItems.length > 0 ? recentItems.map((item) => (
              <Link to={item.targetPath || '/cabinet'} key={item.id}>
                <CheckCircle2 size={15} aria-hidden />
                <span>{item.message || item.type}</span>
              </Link>
            )) : (
              <>
                <div><CheckCircle2 size={15} aria-hidden /><span>{ru ? 'План обучения собран' : 'Learning plan created'}</span></div>
                <div><CheckCircle2 size={15} aria-hidden /><span>{ru ? `${completedLessons} уроков завершено` : `${completedLessons} lessons completed`}</span></div>
              </>
            )}
          </div>
          <div className={styles.activityLinks}>
            {giveaway && (
              <Link to={`/giveaway/${giveaway.slug}`}>
                {ru ? 'Розыгрыш' : 'Giveaway'}
                {giveawayCount != null && <span>{giveawayCount}</span>}
              </Link>
            )}
            {nextEvent && (
              <Link to="/events">{ru ? 'Ближайший эфир' : 'Next live'}</Link>
            )}
            {certificateCount > 0 && (
              <Link to="/account?tab=certificates">{ru ? 'Сертификаты' : 'Certificates'} <span>{certificateCount}</span></Link>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}
