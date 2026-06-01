import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useCourses } from '../context/CoursesContext'
import { getCourseField, getLessonDisplayTitle } from '../data/courses'
import { applyLessonProgramToCourse } from '../data/courseLessonPrograms'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../context/ProgressContext'
import { useLanguage } from '../context/LanguageContext'
import { recordCertificate, trackCourseClick, recordHomeworkSubmission, getHomeworkByUserAndLesson } from '../api/adminStore'
import { api, canUseAuthenticatedApi } from '../api/client'
import { VideoPlayer } from '../components/VideoPlayer'
import { CourseProgramPanel } from '../components/CourseProgramPanel'
import { CourseHomeworkPanel } from '../components/CourseHomeworkPanel'
import { CourseOverviewSection } from '../components/CourseOverviewSection'
import { CourseReviews } from '../components/CourseReviews'
import { LessonTest } from '../components/LessonTest'
import { CourseHero } from '../components/CourseHero'
import { CourseLandingSections } from '../components/CourseLandingSections'
import { Confetti } from '../components/Confetti'
import { OnboardingBanner } from '../components/OnboardingBanner'
import { getHomeworkForLesson } from '../data/courseHomework'
import { getCourseThemeStyle } from '../data/courseThemes'
import { isAcceleratorCourse } from '../data/courseCatalog'
import { ACCELERATOR_OFFER } from '../data/promo'
import { BundleCourseActions } from '../components/BundleCourseActions'
import { CourseBuyAction } from '../components/CourseBuyAction'
import { useTheme } from '../context/ThemeContext'
import styles from './Course.module.css'

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function Course() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { getCourseBySlug } = useCourses()
  const course = applyLessonProgramToCourse(getCourseBySlug(slug))
  const { user, hasPurchased, apiMode } = useAuth()
  const { getProgress, submitHomework, getPercent, markWatched } = useProgress()
  const { t, lang } = useLanguage()
  const { theme } = useTheme()
  const lessonFromUrl = parseInt(searchParams.get('lesson'), 10)
  const [selectedLesson, setSelectedLesson] = useState(Number.isFinite(lessonFromUrl) && lessonFromUrl >= 0 ? lessonFromUrl : 0)
  const certificateRecorded = useRef(false)
  const [showOnboarding, setShowOnboarding] = useState(searchParams.get('paid') === '1')
  const [showConfetti, setShowConfetti] = useState(false)
  const [hwText, setHwText] = useState({})
  const [hwFile, setHwFile] = useState({})
  const [hwError, setHwError] = useState({})
  const [homeworkMap, setHomeworkMap] = useState({})

  const lessonCount = course?.lessons?.length ?? 0

  useEffect(() => {
    if (course && Number.isFinite(lessonFromUrl) && lessonFromUrl >= 0 && (course.lessons || []).length > 0 && lessonFromUrl < (course.lessons || []).length) {
      setSelectedLesson(lessonFromUrl)
    }
  }, [course, lessonFromUrl])
  useEffect(() => {
    if (course?.id) trackCourseClick(course.id)
  }, [course?.id])

  useEffect(() => {
    if (!course?.id || !user?.email || lessonCount === 0) {
      setHomeworkMap({})
      return
    }
    let cancelled = false
    ;(async () => {
      const next = {}
      if (await canUseAuthenticatedApi()) {
        await Promise.all(
          Array.from({ length: lessonCount }, (_, index) => index).map(async (index) => {
            try {
              const hw = await api.getHomework(course.id, index)
              if (hw) next[index] = hw
            } catch (_) {}
          })
        )
      } else {
        for (let index = 0; index < lessonCount; index += 1) {
          const hw = getHomeworkByUserAndLesson(user.email, course.id, index)
          if (hw) next[index] = hw
        }
      }
      if (!cancelled) setHomeworkMap(next)
    })()
    return () => { cancelled = true }
  }, [course?.id, user?.email, lessonCount, apiMode])

  useEffect(() => {
    const refreshHomework = () => {
      if (!course?.id || !user?.email || lessonCount === 0) return
      ;(async () => {
        if (!(await canUseAuthenticatedApi())) return
        const next = {}
        await Promise.all(
          Array.from({ length: lessonCount }, (_, index) => index).map(async (index) => {
            try {
              const hw = await api.getHomework(course.id, index)
              if (hw) next[index] = hw
            } catch (_) {}
          })
        )
        setHomeworkMap(next)
      })()
    }
    window.addEventListener('lms-homework-refresh', refreshHomework)
    return () => window.removeEventListener('lms-homework-refresh', refreshHomework)
  }, [course?.id, user?.email, lessonCount])

  if (!course) {
    return (
      <div className={styles.wrap}>
        <div className={styles.container}>
          <p>{t('course.notFound')}</p>
          <Link to="/courses">{t('course.toCatalog')}</Link>
        </div>
      </div>
    )
  }

  const progress = getProgress(course.id)
  const purchased = hasPurchased(course.id)
  const isFreeTrial = course.isFreeTrial === true
  const isBundle = isAcceleratorCourse(course)

  const lessonsList = Array.isArray(course.lessons) ? course.lessons : []
  const safeSelectedLesson = Math.min(Math.max(selectedLesson ?? 0, 0), Math.max(lessonsList.length - 1, 0))
  const currentLesson = lessonsList[safeSelectedLesson]
  const lessonTitle = getLessonDisplayTitle(currentLesson, lang)
  const homeworkEntriesByLesson = lessonsList.reduce((map, _, index) => {
    map[index] = homeworkMap[index] ?? null
    return map
  }, {})

  // Пробный курс: все уроки открыты; иначе первый бесплатен, остальные по подписке
  const lessonAvailable = (index) => {
    if (isFreeTrial) return true
    if (index === 0) return true
    if (!purchased) return false
    if (course.hasHomework) {
      return homeworkEntriesByLesson[index - 1]?.status === 'accepted'
    }
    if (index === 1) return true
    return homeworkEntriesByLesson[index - 1]?.status === 'accepted'
  }

  const lessonStatus = (index) => {
    if (isFreeTrial) return 'open'
    if (index === 0) return 'open'
    if (!purchased) return 'lock'
    if (course.hasHomework || index > 1) {
      const prevStatus = homeworkEntriesByLesson[index - 1]?.status
      if (prevStatus === 'accepted') return 'open'
      if (prevStatus === 'pending') return 'review'
      return 'homework'
    }
    if (index === 1) return 'open'
    const prevStatus = homeworkEntriesByLesson[index - 1]?.status
    if (prevStatus === 'accepted') return 'open'
    if (prevStatus === 'pending') return 'review'
    return 'homework'
  }

  const canSelectLesson = (index) => {
    if (isFreeTrial) return true
    if (index === 0) return true
    if (!purchased) return false
    return lessonAvailable(index)
  }
  const priceEur = course.priceEur ?? Math.round(course.price / 100)
  const fullPriceEur = Math.round(priceEur * 1.15)
  const discount = fullPriceEur - priceEur
  const percent = getPercent(course.id, lessonsList.length)
  const isAutomation = course.id === 'ai-automation-builder'
  const showTestAfterLesson0 = !isFreeTrial && isAutomation && progress.watched.includes(0) && !progress.homeworkSubmitted.includes(0)
  const courseTitle = getCourseField(course, 'title', lang)
  const currentHomework = currentLesson ? getHomeworkForLesson(currentLesson, course) : null
  const hwLessonStartIndex = course.hasHomework ? 0 : 1
  const currentHwEntry = homeworkEntriesByLesson[safeSelectedLesson]
  const showHwForm =
    !isFreeTrial
    && purchased
    && safeSelectedLesson >= hwLessonStartIndex
    && lessonAvailable(safeSelectedLesson)
    && (!currentHwEntry || currentHwEntry.status === 'resubmit')

  const selectLesson = (index) => {
    setSelectedLesson(index)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (index > 0) next.set('lesson', String(index))
      else next.delete('lesson')
      return next
    }, { replace: true })
  }

  const handleWatch = () => {
    if (!(purchased || isFreeTrial) || !currentLesson) return
    markWatched(course.id, safeSelectedLesson)
    if (isFreeTrial && lessonsList.length > 0 && safeSelectedLesson + 1 < lessonsList.length) {
      const next = safeSelectedLesson + 1
      selectLesson(next)
    }
  }

  const handleHomeworkFileChange = async (index, file) => {
    if (!file) {
      setHwFile((prev) => ({ ...prev, [index]: null }))
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setHwFile((prev) => ({
        ...prev,
        [index]: {
          name: file.name,
          type: file.type || 'application/octet-stream',
          dataUrl,
          raw: file,
        },
      }))
      setHwError((prev) => ({ ...prev, [index]: '' }))
    } catch {
      setHwError((prev) => ({
        ...prev,
        [index]: lang === 'ru' ? 'Не удалось загрузить файл.' : 'Failed to load file.',
      }))
    }
  }

  const handleHomeworkSubmit = async (index) => {
    const file = hwFile[index]
    if (!file?.dataUrl && !file?.raw) {
      setHwError((prev) => ({
        ...prev,
        [index]: lang === 'ru' ? 'Добавьте файл перед отправкой ДЗ.' : 'Please attach a file before submitting homework.',
      }))
      return
    }

    if (!user?.email) {
      setHwError((prev) => ({
        ...prev,
        [index]: lang === 'ru' ? 'Войдите в аккаунт для отправки ДЗ.' : 'Sign in to submit homework.',
      }))
      return
    }

    const les = lessonsList[index]
    const lessonTitle = getLessonDisplayTitle(les, lang)
    const courseTitle = getCourseField(course, 'title', lang)

    try {
      let entry = null
      if (await canUseAuthenticatedApi() && file.raw) {
        const fd = new FormData()
        fd.append('file', file.raw)
        fd.append('courseId', course.id)
        fd.append('courseTitle', courseTitle)
        fd.append('lessonIndex', String(index))
        fd.append('lessonTitle', lessonTitle)
        fd.append('content', hwText[index] ?? '')
        const result = await api.submitHomeworkForm(fd)
        entry = await api.getHomework(course.id, index)
        if (!entry) {
          entry = {
            id: result.id,
            email: user.email,
            name: user.name || user.email,
            courseId: course.id,
            courseTitle,
            lessonIndex: index,
            lessonTitle,
            content: hwText[index] ?? '',
            fileName: file.name,
            fileType: file.type,
            status: 'pending',
            date: new Date().toISOString(),
          }
        }
      } else {
        recordHomeworkSubmission({
          email: user.email,
          name: user.name || user.email,
          courseId: course.id,
          courseTitle,
          lessonIndex: index,
          lessonTitle,
          content: hwText[index] ?? '',
          fileName: file.name,
          fileType: file.type,
          fileDataUrl: file.dataUrl,
        })
        entry = getHomeworkByUserAndLesson(user.email, course.id, index)
      }

      submitHomework(course.id, index)
      setHomeworkMap((prev) => ({ ...prev, [index]: entry }))
      setHwFile((prev) => ({ ...prev, [index]: null }))
      setHwError((prev) => ({ ...prev, [index]: '' }))
      window.dispatchEvent(new Event('lms-notifications-refresh'))
    } catch {
      setHwError((prev) => ({
        ...prev,
        [index]: lang === 'ru' ? 'Ошибка отправки. Проверьте вход в аккаунт.' : 'Submit failed. Check that you are signed in.',
      }))
    }
  }

  const isCourseComplete = percent === 100 && lessonsList.length > 0

  useEffect(() => {
    if (isCourseComplete && user && !certificateRecorded.current) {
      certificateRecorded.current = true
      setShowConfetti(true)
      recordCertificate({
        email: user.email,
        courseId: course.id,
        courseTitle: lang === 'en' && course.titleEn ? course.titleEn : course.title,
      })
    }
  }, [isCourseComplete, user, course.id, course.title, course.titleEn, lang])

  const dismissOnboarding = () => {
    setShowOnboarding(false)
    searchParams.delete('paid')
    setSearchParams(searchParams, { replace: true })
  }

  return (
    <div className={styles.wrap} style={getCourseThemeStyle(course.id, theme)}>
      <Confetti active={showConfetti} />
      <div className={styles.container}>
        <CourseHero
          course={course}
          lang={lang}
          backTo="/courses"
          backLabel={t('course.backToCourses')}
        />

        {showOnboarding && purchased && (
          <OnboardingBanner course={course} lang={lang} onDismiss={dismissOnboarding} />
        )}

        {isCourseComplete && (
          <div className={styles.completionBanner} role="alert">
            <div className={styles.completionIcon}>🎉</div>
            <h2 className={styles.completionTitle}>
              {lang === 'ru' ? 'Поздравляем! Вы прошли курс' : 'Congratulations! You completed the course'}
              {' «'}{courseTitle}{'»'}
            </h2>
            <p className={styles.completionText}>
              {lang === 'ru'
                ? 'Сертификат будет отправлен на почту в течение 24 часов и станет доступен во вкладке «Сертификаты» в личном кабинете.'
                : 'Your certificate will be sent to your email within 24 hours and will be available in the Certificates section of your account.'}
            </p>
            <Link to="/cabinet#certificates" className={styles.completionLink}>
              {lang === 'ru' ? 'Перейти к сертификатам →' : 'Go to certificates →'}
            </Link>
          </div>
        )}

        <div className={styles.grid}>
          <div className={styles.main}>
            {(purchased || isFreeTrial) && lessonsList.length > 0 && (
              <div className={styles.progressWrap}>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${percent}%` }} />
                </div>
                <p className={styles.progressMeta}>
                  {percent}% · {lang === 'ru' ? 'Урок' : 'Lesson'} {safeSelectedLesson + 1}/{lessonsList.length}
                </p>
              </div>
            )}

            <CourseOverviewSection course={course} lang={lang} />

            <section className={styles.videoSection}>
              {currentLesson && (
                <header className={styles.lessonHead} key={currentLesson.id}>
                  <span className={styles.lessonHeadNum}>{safeSelectedLesson + 1}</span>
                  <div className={styles.lessonHeadText}>
                    <h2 className={styles.lessonHeadTitle}>{lessonTitle}</h2>
                    {currentLesson.duration && (
                      <span className={styles.lessonHeadMeta}>{currentLesson.duration}</span>
                    )}
                  </div>
                </header>
              )}

              <VideoPlayer
                lesson={currentLesson}
                title={lessonTitle}
                locked={!lessonAvailable(safeSelectedLesson)}
                lockedMessage={safeSelectedLesson > 0 && !purchased ? t('course.lockedMessage') : undefined}
                onEnded={isFreeTrial ? handleWatch : undefined}
              />

              {currentLesson && currentHomework && (
                <CourseHomeworkPanel
                  lang={lang}
                  t={t}
                  lessonIndex={safeSelectedLesson}
                  homework={currentHomework}
                  hwText={hwText[safeSelectedLesson]}
                  hwFile={hwFile[safeSelectedLesson]}
                  hwError={hwError[safeSelectedLesson]}
                  homeworkEntry={currentHwEntry}
                  showForm={showHwForm}
                  canSubmit={showHwForm}
                  onTextChange={(v) => setHwText((prev) => ({ ...prev, [safeSelectedLesson]: v }))}
                  onFileChange={(file) => handleHomeworkFileChange(safeSelectedLesson, file)}
                  onSubmit={() => handleHomeworkSubmit(safeSelectedLesson)}
                />
              )}

              <div className={styles.videoActions}>
                <button
                  type="button"
                  className={styles.videoNavBtn}
                  disabled={safeSelectedLesson === 0}
                  onClick={() => selectLesson(safeSelectedLesson - 1)}
                >
                  {t('course.prevLesson')}
                </button>
                {lessonAvailable(safeSelectedLesson) && (purchased || isFreeTrial || safeSelectedLesson === 0) && (
                  <button type="button" className={styles.watchedBtn} onClick={handleWatch}>
                    {t('course.markWatched')}
                  </button>
                )}
                <button
                  type="button"
                  className={styles.videoNavBtn}
                  disabled={safeSelectedLesson >= lessonsList.length - 1 || !lessonAvailable(safeSelectedLesson + 1)}
                  onClick={() => selectLesson(safeSelectedLesson + 1)}
                >
                  {t('course.nextLesson')}
                </button>
              </div>

              {showTestAfterLesson0 && (
                <LessonTest
                  questions={lessonsList[0]?.quiz}
                  lang={lang}
                  onPass={() => submitHomework(course.id, 0)}
                />
              )}
            </section>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.priceCard}>
              <div className={styles.priceCardInner}>
                <div className={styles.priceCardIcon}>✓</div>
                <h3 className={styles.priceCardTitle}>{courseTitle}</h3>
                {isFreeTrial ? (
                  <div className={styles.priceCardPurchased}>
                    <span className={styles.priceCardBadge}>{lang === 'ru' ? 'Бесплатный пробный курс' : 'Free trial course'}</span>
                    <p className={styles.priceCardPercent}>{t('course.completed')}: <strong>{percent}%</strong></p>
                    <Link to="/courses" className={styles.priceCardWatch}>
                      {lang === 'ru' ? 'Полный каталог курсов →' : 'Full course catalog →'}
                    </Link>
                  </div>
                ) : purchased ? (
                  <div className={styles.priceCardPurchased}>
                    <span className={styles.priceCardBadge}>{t('course.accessOpen')}</span>
                    <p className={styles.priceCardPercent}>{t('course.completed')}: <strong>{percent}%</strong></p>
                  </div>
                ) : isBundle ? (
                  <>
                    <span className={styles.priceCardBadge}>
                      {lang === 'ru' ? 'Набор · по заявке' : 'Bundle · by application'}
                    </span>
                    <p className={styles.priceCardTrialText}>
                      {lang === 'en' ? ACCELERATOR_OFFER.selectionEn : ACCELERATOR_OFFER.selectionRu}
                    </p>
                    <BundleCourseActions
                      courseSlug={course.slug}
                      lang={lang}
                      showLearnMore={false}
                      variant="sidebar"
                    />
                  </>
                ) : (
                  <>
                    <div className={styles.priceRows}>
                      <div className={styles.priceRow}>
                        <span>{t('course.fullPrice')}</span>
                        <span className={styles.priceOld}>{fullPriceEur} €</span>
                      </div>
                      {discount > 0 && (
                        <div className={styles.priceRow}>
                          <span>{t('course.discount')}</span>
                          <span className={styles.priceDiscount}>−{discount} €</span>
                        </div>
                      )}
                      <div className={styles.priceRowHighlight}>
                        <span>{t('course.priceForYou')}</span>
                        <span className={styles.priceCurrent}>{priceEur} €</span>
                      </div>
                    </div>
                    <p className={styles.priceInstallment}>{t('course.installment')}</p>
                    <CourseBuyAction
                      course={course}
                      className={styles.priceBtn}
                      fallbackPath={`/courses/${course.slug}/buy`}
                    >
                      {t('course.buyCourse')}
                    </CourseBuyAction>
                  </>
                )}
              </div>
            </div>

            <section className={styles.programSidebar} aria-label={lang === 'ru' ? 'Содержание курса' : 'Course content'}>
              <div className={styles.programSidebarHead}>
                <h2 className={styles.sectionTitle}>{t('course.program')}</h2>
                <span className={styles.programCount}>{lessonsList.length}</span>
              </div>
              <p className={styles.programScheduleHint}>
                {course.hasHomework
                  ? (lang === 'ru'
                    ? 'Урок 1 бесплатно. Следующий открывается после принятия ДЗ.'
                    : 'Lesson 1 is free. Next unlocks after homework is accepted.')
                  : isFreeTrial
                    ? (lang === 'ru' ? 'Все уроки доступны бесплатно.' : 'All lessons are free.')
                    : t('course.programHint')}
              </p>
              <div className={styles.programSidebarBody}>
                <CourseProgramPanel
                  lessons={lessonsList}
                  lang={lang}
                  selectedLesson={safeSelectedLesson}
                  onSelectLesson={selectLesson}
                  canSelectLesson={canSelectLesson}
                  lessonStatus={lessonStatus}
                  lessonAvailable={lessonAvailable}
                  isFreeTrial={isFreeTrial}
                  purchased={purchased}
                />
              </div>
            </section>
          </aside>
        </div>

        <div className={styles.container}>
          <CourseReviews courseId={course.id} courseTitle={courseTitle} />
        </div>

        <CourseLandingSections
          course={course}
          lang={lang}
          purchased={purchased}
          priceEur={priceEur}
        />
      </div>
    </div>
  )
}
