import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Gauge,
  LockKeyhole,
  Map as MapIcon,
  Play,
  Route,
  Sparkles,
  Target,
  Video,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useCourses } from '../context/CoursesContext'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../context/ProgressContext'
import { getCourseDesignCover } from '../utils/designAssets'
import { getCourseField, formatCourseDuration } from '../data/courses'
import { LEARNING_STAGES } from '../data/learningMap'
import { getCourseTheme } from '../data/courseThemes'
import { ScrollReveal } from '../components/ScrollReveal'
import styles from './LearningMap.module.css'

const AGENT_MODULES = [
  {
    id: 'foundations',
    titleRu: 'Введение в AI-агентов',
    titleEn: 'Introduction to AI agents',
    subtitleRu: 'Основы и модель agent loop',
    subtitleEn: 'Foundations and the agent loop',
    lessonIndexes: [0],
  },
  {
    id: 'architecture',
    titleRu: 'Архитектура агентов',
    titleEn: 'Agent architecture',
    subtitleRu: 'Фреймворки, роли и multi-agent',
    subtitleEn: 'Frameworks, roles and multi-agent',
    lessonIndexes: [1, 11, 12, 13, 14],
  },
  {
    id: 'memory',
    titleRu: 'Память и контекст',
    titleEn: 'Memory and context',
    subtitleRu: 'RAG, embeddings, vector DB и memory',
    subtitleEn: 'RAG, embeddings, vector DB and memory',
    lessonIndexes: [5, 6, 7, 8, 9, 10, 15],
  },
  {
    id: 'reasoning',
    titleRu: 'Планирование и рассуждения',
    titleEn: 'Planning and reasoning',
    subtitleRu: 'Agent planning и цепочки решений',
    subtitleEn: 'Agent planning and decision chains',
    lessonIndexes: [16],
  },
  {
    id: 'tools',
    titleRu: 'Инструменты и Actions',
    titleEn: 'Tools and actions',
    subtitleRu: 'Tool Calling, Function Calling и MCP',
    subtitleEn: 'Tool calling, function calling and MCP',
    lessonIndexes: [2, 3, 4],
  },
  {
    id: 'deployment',
    titleRu: 'Развёртывание',
    titleEn: 'Deployment',
    subtitleRu: 'Production, monitoring и финальный агент',
    subtitleEn: 'Production, monitoring and the final agent',
    lessonIndexes: [17, 18, 19],
  },
]

function AgentModuleNode({ module, index, lang, state, percent, courseSlug }) {
  const title = lang === 'ru' ? module.titleRu : module.titleEn
  const subtitle = lang === 'ru' ? module.subtitleRu : module.subtitleEn
  const stateCopy = {
    complete: lang === 'ru' ? 'Завершено' : 'Complete',
    active: lang === 'ru' ? 'В процессе' : 'In progress',
    open: lang === 'ru' ? 'Доступно' : 'Available',
    locked: lang === 'ru' ? 'Следующий этап' : 'Next stage',
  }
  const StateIcon = state === 'complete'
    ? CheckCircle2
    : state === 'active'
      ? Play
      : state === 'open'
        ? BookOpen
        : LockKeyhole

  return (
    <Link
      to={`/courses/${courseSlug}?lesson=${module.lessonIndexes[0]}`}
      className={`${styles.moduleNode} ${styles[`moduleNode${index + 1}`]} ${styles[`moduleNode_${state}`]}`}
      aria-label={`${title}: ${stateCopy[state]}, ${percent}%`}
    >
      <span className={styles.moduleNodeHead}>
        <span className={styles.moduleIndex}>{String(index + 1).padStart(2, '0')}</span>
        <span className={styles.moduleState} aria-label={stateCopy[state]}>
          <StateIcon size={15} strokeWidth={1.8} aria-hidden />
        </span>
      </span>
      <strong className={styles.moduleTitle}>{title}</strong>
      <span className={styles.moduleSubtitle}>{subtitle}</span>
      <span className={styles.moduleFooter}>
        <span>{stateCopy[state]}</span>
        <span>{percent}%</span>
      </span>
    </Link>
  )
}

function CourseCard({ courseId, lang, expanded, onToggle, getCourseById }) {
  const course = getCourseById(courseId)
  if (!course) return null
  const theme = getCourseTheme(courseId)
  const title = getCourseField(course, 'title', lang)
  const short = getCourseField(course, 'shortDescription', lang)
  const price = course.priceEur === 0
    ? (lang === 'ru' ? 'Бесплатно' : 'Free')
    : `${course.priceEur} €`
  const tools = course.tools || []
  const skills = course.skills || course.goals?.slice(0, 4) || []

  return (
    <article className={styles.courseCard} style={{ '--stage-accent': theme.accent }}>
      <button type="button" className={styles.courseHead} onClick={onToggle} aria-expanded={expanded}>
        <span className={styles.courseIcon} aria-hidden="true">
          <img src={getCourseDesignCover(course)} alt="" loading="lazy" />
        </span>
        <div className={styles.courseMeta}>
          <strong>{title}</strong>
          <span className={styles.coursePrice}>{price} · {formatCourseDuration(course, lang)}</span>
        </div>
        <span className={styles.chevron} aria-hidden="true">
          {expanded
            ? <ChevronDown size={17} strokeWidth={1.7} />
            : <ChevronRight size={17} strokeWidth={1.7} />}
        </span>
      </button>
      {expanded && (
        <div className={styles.courseBody}>
          <p>{short}</p>
          {course.forAudience?.length > 0 && (
            <p className={styles.audience}>
              <strong>{lang === 'ru' ? 'Для кого:' : 'For:'}</strong>{' '}
              {(lang === 'en' ? course.forAudienceEn : course.forAudience)?.join(', ')}
            </p>
          )}
          {skills.length > 0 && (
            <>
              <strong className={styles.blockLabel}>{lang === 'ru' ? 'Навыки' : 'Skills'}</strong>
              <ul className={styles.tagList}>
                {skills.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </>
          )}
          {tools.length > 0 && (
            <>
              <strong className={styles.blockLabel}>{lang === 'ru' ? 'Инструменты' : 'Tools'}</strong>
              <div className={styles.toolRow}>
                {tools.map((t) => <span key={t} className={styles.toolChip}>{t}</span>)}
              </div>
            </>
          )}
          <p className={styles.format}>
            <Video size={15} strokeWidth={1.7} aria-hidden="true" />{' '}
            {lang === 'ru' ? 'Формат: записанные видеоуроки · асинхронно' : 'Format: pre-recorded · self-paced'}
          </p>
          {course.finalProject && (
            <p className={styles.project}>
              <Target size={15} strokeWidth={1.7} aria-hidden="true" />{' '}
              {lang === 'ru' ? 'Проект:' : 'Capstone:'} {lang === 'en' && course.finalProjectEn ? course.finalProjectEn : course.finalProject}
            </p>
          )}
          <Link to={`/courses/${course.slug}`} className={styles.courseLink}>
            {lang === 'ru' ? 'Открыть курс' : 'Open course'} <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" />
          </Link>
        </div>
      )}
    </article>
  )
}

export function LearningMap() {
  const { lang } = useLanguage()
  const { getCourseById } = useCourses()
  const { hasPurchased } = useAuth()
  const { getPercent, getProgress } = useProgress()
  const [openStage, setOpenStage] = useState('stage-1')
  const [openCourse, setOpenCourse] = useState(null)

  const agentCourse = getCourseById('ai-agent-engineer')
  const courseSlug = agentCourse?.slug || 'ai-agent-engineer'
  const courseTitle = agentCourse ? getCourseField(agentCourse, 'title', lang) : 'AI Agent Engineer'
  const totalLessons = agentCourse?.lessons?.length || 20
  const courseProgress = getProgress(agentCourse?.id || 'ai-agent-engineer')
  const completedLessons = new Set([
    ...(courseProgress.watched || []),
    ...(courseProgress.homeworkSubmitted || []),
    ...(courseProgress.homeworkChecked || []),
  ])
  const overallProgress = getPercent(agentCourse?.id || 'ai-agent-engineer', totalLessons)
  const hasCourseAccess = Boolean(
    agentCourse
    && (agentCourse.priceEur === 0 || agentCourse.isFreeTrial === true || hasPurchased(agentCourse.id))
  )
  const modules = AGENT_MODULES.map((module, index) => {
    const completedCount = module.lessonIndexes.filter((lessonIndex) => completedLessons.has(lessonIndex)).length
    const percent = Math.round((completedCount / module.lessonIndexes.length) * 100)
    const state = percent >= 100
      ? 'complete'
      : percent > 0 || index === 0
        ? 'active'
        : hasCourseAccess
          ? 'open'
          : 'locked'
    return { module, percent, state }
  })

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.pathPanel} aria-labelledby="learning-path-title">
          <header className={styles.courseToolbar}>
            <Link to={`/courses/${courseSlug}`} className={styles.courseIdentity}>
              <span className={styles.courseIdentityIcon} aria-hidden><Route size={18} strokeWidth={1.7} /></span>
              <span className={styles.courseIdentityCopy}>
                <small>02 / {lang === 'ru' ? 'Карта обучения' : 'Learning map'}</small>
                <h1 id="learning-path-title">{courseTitle}</h1>
              </span>
              <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden />
            </Link>

            <div className={styles.toolbarProgress}>
              <span className={styles.toolbarProgressLabel}>
                <span><Gauge size={13} aria-hidden />{lang === 'ru' ? 'Общий прогресс' : 'Overall progress'}</span>
                <strong>{overallProgress}%</strong>
              </span>
              <span className={styles.toolbarProgressTrack} aria-hidden>
                <span style={{ width: `${overallProgress}%` }} />
              </span>
            </div>

            <span className={styles.viewMode} aria-label={lang === 'ru' ? 'Режим карты' : 'Map view'}>
              <MapIcon size={14} aria-hidden />
              {lang === 'ru' ? 'Карта' : 'Map'}
            </span>
          </header>

          <div className={styles.pathCanvas}>
            <div className={styles.pathCore} aria-label={lang === 'ru' ? 'AI — центр архитектуры курса' : 'AI course architecture core'}>
              <img src="/design/course-ai-data.webp" alt="" className={styles.pathCoreImage} />
              <span className={styles.pathCoreShade} aria-hidden />
              <span className={styles.pathCoreBadge}><Sparkles size={12} aria-hidden />AI Core</span>
              <span className={styles.pathCoreCopy}>
                <strong>AI</strong>
                <small>Insider core</small>
              </span>
            </div>

            {modules.map(({ module, percent, state }, index) => (
              <AgentModuleNode
                key={module.id}
                module={module}
                index={index}
                lang={lang}
                percent={percent}
                state={state}
                courseSlug={courseSlug}
              />
            ))}
          </div>
        </section>

        <div className={styles.detailsHeading}>
          <span>{lang === 'ru' ? 'Детали маршрута' : 'Route details'}</span>
          <h2>{lang === 'ru' ? 'Все этапы и программы' : 'All stages and programs'}</h2>
          <p>{lang === 'ru' ? 'Раскройте этап, чтобы увидеть программу, навыки и инструменты.' : 'Open a stage to review its curriculum, skills and tools.'}</p>
        </div>

        <div className={styles.timeline}>
          {LEARNING_STAGES.map((stage, idx) => {
            const open = openStage === stage.id
            return (
              <ScrollReveal key={stage.id} delay={idx * 80}>
                <section className={styles.stage} style={{ '--stage-accent': stage.accent }}>
                  <button
                    type="button"
                    className={styles.stageHead}
                    onClick={() => setOpenStage(open ? null : stage.id)}
                    aria-expanded={open}
                  >
                    <span className={styles.stageNum}>{stage.order}</span>
                    <div>
                      <h2>{lang === 'en' && stage.titleEn ? stage.titleEn : stage.title}</h2>
                      <p>{lang === 'en' && stage.subtitleEn ? stage.subtitleEn : stage.subtitle}</p>
                    </div>
                    <span className={styles.stageCount}>{stage.courseIds.length}</span>
                  </button>
                  {open && (
                    <div className={styles.stageBody}>
                      {stage.courseIds.map((id) => (
                        <CourseCard
                          key={id}
                          courseId={id}
                          lang={lang}
                          expanded={openCourse === id}
                          onToggle={() => setOpenCourse((prev) => (prev === id ? null : id))}
                          getCourseById={getCourseById}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </ScrollReveal>
            )
          })}
        </div>

        <aside className={styles.ctaBox}>
          <h3>{lang === 'ru' ? 'Начните бесплатно' : 'Start for free'}</h3>
          <p>{lang === 'ru' ? 'Этап 1 — три бесплатные программы без оплаты.' : 'Stage 1 — three free programs, no payment.'}</p>
          <Link to="/courses/ai-start" className={styles.ctaBtn}>AI Starter Week <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" /></Link>
          <Link to="/courses" className={styles.ctaSecondary}>{lang === 'ru' ? 'Весь каталог' : 'Full catalog'}</Link>
        </aside>
      </div>
    </div>
  )
}
