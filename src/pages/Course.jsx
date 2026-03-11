import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useCourses } from '../context/CoursesContext'
import { getCourseField } from '../data/courses'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../context/ProgressContext'
import { useLanguage } from '../context/LanguageContext'
import { recordCertificate, trackCourseClick, recordHomeworkSubmission, getHomeworkByUserAndLesson } from '../api/adminStore'
import { VideoPlayer } from '../components/VideoPlayer'
import { IconChevronDown } from '../components/Icons'
import { LessonTest } from '../components/LessonTest'
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
  const course = getCourseBySlug(slug)
  const { user, hasPurchased } = useAuth()
  const { getProgress, submitHomework, getPercent, markWatched } = useProgress()
  const { t, lang } = useLanguage()
  const lessonFromUrl = parseInt(searchParams.get('lesson'), 10)
  const [selectedLesson, setSelectedLesson] = useState(Number.isFinite(lessonFromUrl) && lessonFromUrl >= 0 ? lessonFromUrl : 0)
  const certificateRecorded = useRef(false)

  useEffect(() => {
    if (course && Number.isFinite(lessonFromUrl) && lessonFromUrl >= 0 && (course.lessons || []).length > 0 && lessonFromUrl < (course.lessons || []).length) {
      setSelectedLesson(lessonFromUrl)
    }
  }, [course, lessonFromUrl])
  useEffect(() => {
    if (course?.id) trackCourseClick(course.id)
  }, [course?.id])
  const [expandedProgram, setExpandedProgram] = useState(true)
  const [hwText, setHwText] = useState({})
  const [hwFile, setHwFile] = useState({})
  const [hwError, setHwError] = useState({})

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

  const lessonsList = Array.isArray(course.lessons) ? course.lessons : []
  const safeSelectedLesson = Math.min(Math.max(selectedLesson ?? 0, 0), Math.max(lessonsList.length - 1, 0))
  const currentLesson = lessonsList[safeSelectedLesson]
  const lessonTitle = currentLesson && (lang === 'en' && currentLesson.titleEn ? currentLesson.titleEn : currentLesson.title)
  const homeworkEntriesByLesson = lessonsList.reduce((map, _, index) => {
    map[index] = user?.email ? getHomeworkByUserAndLesson(user.email, course.id, index) : null
    return map
  }, {})

  // Пробный курс: все уроки открыты; иначе первый бесплатен, остальные по подписке
  const lessonAvailable = (index) => {
    if (isFreeTrial) return true
    if (index === 0) return true
    if (!purchased) return false
    if (index === 1) return true
    return homeworkEntriesByLesson[index - 1]?.status === 'accepted'
  }

  const lessonStatus = (index) => {
    if (isFreeTrial) return 'open'
    if (index === 0) return 'open'
    if (index === 1 && purchased) return 'open'
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
  const fullDesc = getCourseField(course, 'fullDescription', lang) || getCourseField(course, 'description', lang) || getCourseField(course, 'shortDescription', lang)
  const goalsList = getCourseField(course, 'goals', lang)
  const duration = getCourseField(course, 'duration', lang)

  const handleWatch = () => {
    if (!(purchased || isFreeTrial) || !currentLesson) return
    markWatched(course.id, safeSelectedLesson)
    if (isFreeTrial && lessonsList.length > 0 && safeSelectedLesson + 1 < lessonsList.length) {
      const next = safeSelectedLesson + 1
      setSelectedLesson(next)
      setSearchParams({ lesson: String(next) })
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

  const handleHomeworkSubmit = (index) => {
    const file = hwFile[index]
    if (!file?.dataUrl) {
      setHwError((prev) => ({
        ...prev,
        [index]: lang === 'ru' ? 'Добавьте файл перед отправкой ДЗ.' : 'Please attach a file before submitting homework.',
      }))
      return
    }

    submitHomework(course.id, index)
    if (user?.email) {
      const les = lessonsList[index]
      recordHomeworkSubmission({
        email: user.email,
        name: user.name || user.email,
        courseId: course.id,
        courseTitle: getCourseField(course, 'title', lang),
        lessonIndex: index,
        lessonTitle: les ? (lang === 'en' && les.titleEn ? les.titleEn : les.title) : '',
        content: hwText[index] ?? '',
        fileName: file.name,
        fileType: file.type,
        fileDataUrl: file.dataUrl,
      })
    }
    setHwError((prev) => ({ ...prev, [index]: '' }))
  }

  const isCourseComplete = percent === 100 && lessonsList.length > 0
  if (isCourseComplete && user && !certificateRecorded.current) {
    certificateRecorded.current = true
    recordCertificate({
      email: user.email,
      courseId: course.id,
      courseTitle: lang === 'en' && course.titleEn ? course.titleEn : course.title,
    })
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <Link to="/courses" className={styles.back}>{t('course.backToCourses')}</Link>

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
            <h1 className={styles.title}>{courseTitle}</h1>
            <p className={styles.desc}>
              {fullDesc || (lang === 'ru' ? 'Описание курса.' : 'Course description.')}
            </p>

            {goalsList && goalsList.length > 0 && (
              <section className={styles.goalsSection}>
                <h2 className={styles.sectionTitle}>{t('course.goals')}</h2>
                <ul className={styles.goalsList}>
                  {goalsList.map((goal, i) => (
                    <li key={i} className={styles.goalItem}>{goal}</li>
                  ))}
                </ul>
              </section>
            )}

            <div className={styles.badges}>
              {isFreeTrial && (
                <span className={styles.badgeFreeTrial}>{lang === 'ru' ? 'Бесплатный пробный курс' : 'Free trial course'}</span>
              )}
              {course.level && (
                <span className={styles.badge}><span className={styles.badgeIcon}>↑</span> {t('course.level')} {course.level}</span>
              )}
              <span className={styles.badge}><span className={styles.badgeIcon}>📚</span> {lessonsList.length} {t('course.lessons')}</span>
              <span className={styles.badge}><span className={styles.badgeIcon}>📅</span> {duration}</span>
              {(purchased || isFreeTrial) && (
                <span className={styles.badgeProgress}>{t('course.completed')}: {percent}%</span>
              )}
            </div>

            <section className={styles.videoSection}>
              <VideoPlayer
                lesson={currentLesson}
                title={lessonTitle}
                locked={!lessonAvailable(safeSelectedLesson)}
                lockedMessage={safeSelectedLesson > 0 && !purchased ? t('course.lockedMessage') : undefined}
                onEnded={isFreeTrial ? handleWatch : undefined}
              />
              <div className={styles.videoNav}>
                <button
                  type="button"
                  className={styles.videoNavBtn}
                  disabled={safeSelectedLesson === 0}
                  onClick={() => setSelectedLesson((s) => s - 1)}
                  aria-label={t('course.prevLesson')}
                >
                  {t('course.prevLesson')}
                </button>
                <button
                  type="button"
                  className={styles.videoNavBtn}
                  disabled={safeSelectedLesson >= lessonsList.length - 1 || !lessonAvailable(safeSelectedLesson + 1)}
                  onClick={() => setSelectedLesson((s) => s + 1)}
                  aria-label={t('course.nextLesson')}
                >
                  {t('course.nextLesson')}
                </button>
              </div>
              <p className={styles.videoHint}>{isFreeTrial ? (lang === 'ru' ? 'Все уроки пробного курса доступны бесплатно.' : 'All trial lessons are free.') : t('course.videoHint')}</p>
              {lessonAvailable(safeSelectedLesson) && (purchased || isFreeTrial || safeSelectedLesson === 0) && (
                <button type="button" className={styles.watchedBtn} onClick={handleWatch}>
                  {t('course.markWatched')}
                </button>
              )}
              {showTestAfterLesson0 && (
                <LessonTest
                  courseId={course.id}
                  onPass={() => submitHomework(course.id, 0)}
                />
              )}
            </section>

            <section className={styles.programSection} aria-label={lang === 'ru' ? 'Содержание курса' : 'Course content'}>
              <button
                type="button"
                className={styles.programHeader}
                onClick={() => setExpandedProgram((v) => !v)}
              >
                <h2 className={styles.sectionTitle}>{t('course.program')}</h2>
                <span className={`${styles.chevron} ${expandedProgram ? styles.chevronOpen : ''}`}>
                  <IconChevronDown />
                </span>
              </button>
              {expandedProgram && (
                <>
                  <p className={styles.programScheduleHint}>{isFreeTrial ? (lang === 'ru' ? 'Пробный курс: все 3 урока доступны бесплатно.' : 'Trial course: all 3 lessons are free.') : t('course.programHint')}</p>
                  {lessonsList.length === 0 ? (
                    <p className={styles.programEmpty}>{lang === 'ru' ? 'Содержание курса будет добавлено.' : 'Course content will be added.'}</p>
                  ) : (
                  <ul className={styles.programList}>
                    {lessonsList.map((lesson, index) => {
                      const available = lessonAvailable(index)
                      const status = lessonStatus(index)
                      const lesTitle = lang === 'en' && lesson.titleEn ? lesson.titleEn : lesson.title
                      return (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            className={`${styles.programItem} ${selectedLesson === index ? styles.programItemActive : ''} ${!canSelectLesson(index) ? styles.programItemDisabled : ''}`}
                            onClick={() => canSelectLesson(index) && setSelectedLesson(index)}
                            disabled={!canSelectLesson(index)}
                          >
                            <span className={styles.programNum}>{index + 1}</span>
                            <span className={styles.programContent}>
                              <span className={styles.programTitle}>{lesTitle}</span>
                            </span>
                            <span className={styles.programStatus}>
                              {isFreeTrial && <span className={styles.statusOpen}>{t('course.open')}</span>}
                              {!isFreeTrial && index === 0 && <span className={styles.statusFree}>{t('course.free')}</span>}
                              {!isFreeTrial && index > 0 && !purchased && <span className={styles.statusLock}>{t('course.bySubscription')}</span>}
                              {!isFreeTrial && purchased && index === 0 && <span className={styles.statusOpen}>{t('course.open')}</span>}
                              {!isFreeTrial && purchased && index > 0 && status === 'open' && <span className={styles.statusOpen}>{t('course.open')}</span>}
                              {!isFreeTrial && purchased && index > 0 && status === 'review' && <span className={styles.statusReview}>{t('course.hwReview')}</span>}
                              {!isFreeTrial && purchased && index > 0 && status === 'homework' && <span className={styles.statusHomework}>{t('course.submitHw')}</span>}
                            </span>
                          </button>
                          {!isFreeTrial && purchased && index >= 1 && available && (!homeworkEntriesByLesson[index] || homeworkEntriesByLesson[index]?.status === 'resubmit') && (
                            <div className={styles.hwBlock}>
                              {homeworkEntriesByLesson[index]?.status === 'resubmit' && (
                                <div className={styles.hwResubmitNote}>
                                  {lang === 'ru' ? 'Нужно исправить замечания и загрузить файл заново.' : 'Please revise the homework and upload the file again.'}
                                </div>
                              )}
                              <label className={styles.hwLabel}>{t('course.hwLabel')}</label>
                              <textarea
                                className={styles.hwTextarea}
                                placeholder={t('course.hwPlaceholder')}
                                value={hwText[index] ?? ''}
                                onChange={(e) => setHwText((prev) => ({ ...prev, [index]: e.target.value }))}
                                rows={3}
                              />
                              <label className={styles.hwLabel}>{t('course.hwFile')}</label>
                              <input
                                type="file"
                                className={styles.hwFileInput}
                                onChange={(e) => handleHomeworkFileChange(index, e.target.files?.[0])}
                              />
                              <span className={styles.hwFileRequired}>
                                {lang === 'ru' ? 'Файл обязателен для отправки.' : 'A file is required for submission.'}
                              </span>
                              {hwFile[index]?.name && <span className={styles.hwFileName}>{hwFile[index].name}</span>}
                              {hwError[index] && <span className={styles.hwError}>{hwError[index]}</span>}
                              <button
                                type="button"
                                className={styles.hwSubmitBtn}
                                onClick={() => handleHomeworkSubmit(index)}
                              >
                                {t('course.submitHwBtn')}
                              </button>
                            </div>
                          )}
                          {!isFreeTrial && purchased && homeworkEntriesByLesson[index] && (() => {
                            const hwFeedback = homeworkEntriesByLesson[index]
                            const comment = hwFeedback?.adminComment
                            return (
                              <div className={styles.hwActions}>
                                {comment && (
                                  <div className={styles.hwAdminComment}>
                                    <strong>{lang === 'ru' ? 'Комментарий проверяющего:' : 'Reviewer feedback:'}</strong>
                                    <p>{comment}</p>
                                  </div>
                                )}
                                <span className={styles.hwReviewText}>
                                  {hwFeedback.status === 'accepted'
                                    ? (lang === 'ru' ? 'ДЗ принято.' : 'Homework accepted.')
                                    : hwFeedback.status === 'resubmit'
                                      ? (lang === 'ru' ? 'ДЗ отправлено на доработку.' : 'Homework sent back for revision.')
                                      : t('course.hwReview')}
                                </span>
                              </div>
                            )
                          })()}
                        </li>
                      )
                    })}
                  </ul>
                  )}
                </>
              )}
            </section>
          </div>

          <aside className={styles.priceCard}>
            <div className={styles.priceCardInner}>
              <div className={styles.priceCardIcon}>✓</div>
              <h3 className={styles.priceCardTitle}>{courseTitle}</h3>
              {isFreeTrial ? (
                <div className={styles.priceCardPurchased}>
                  <span className={styles.priceCardBadge}>{lang === 'ru' ? 'Бесплатный пробный курс' : 'Free trial course'}</span>
                  <p className={styles.priceCardPercent}>{t('course.completed')}: <strong>{percent}%</strong></p>
                  <p className={styles.priceCardTrialText}>{lang === 'ru' ? 'Все 3 урока доступны бесплатно.' : 'All 3 lessons are free.'}</p>
                  <Link to="/courses" className={styles.priceCardWatch}>
                    {lang === 'ru' ? 'Полный каталог курсов →' : 'Full course catalog →'}
                  </Link>
                </div>
              ) : purchased ? (
                <div className={styles.priceCardPurchased}>
                  <span className={styles.priceCardBadge}>{t('course.accessOpen')}</span>
                  <p className={styles.priceCardPercent}>{t('course.completed')}: <strong>{percent}%</strong></p>
                  <Link to={`/courses/${course.slug}`} className={styles.priceCardWatch}>
                    {t('course.watchCourse')}
                  </Link>
                </div>
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
                  <Link to={`/courses/${course.slug}/buy`} className={styles.priceBtn}>
                    {t('course.buyCourse')}
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
