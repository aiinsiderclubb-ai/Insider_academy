import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../context/ProgressContext'
import { useLanguage } from '../context/LanguageContext'
import { useCourses } from '../context/CoursesContext'
import { getCourseField } from '../data/courses'
import { getCertificates, getUserDiscountPercent, getCourseAverageScore } from '../api/adminStore'
import styles from './Cabinet.module.css'

export function Cabinet() {
  const { user, purchases } = useAuth()
  const { getPercent } = useProgress()
  const { t, lang } = useLanguage()
  const { getCourseById } = useCourses()
  const [copied, setCopied] = useState(false)
  const myCourses = purchases
    .map((p) => getCourseById(p.id))
    .filter(Boolean)
  const userDiscount = getUserDiscountPercent(user?.email || 0)
  const myCertificates = (getCertificates() || []).filter(
    (c) => c.email && user?.email && c.email.toLowerCase() === user.email.toLowerCase()
  )
  const referralLink = user?.email
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${btoa(user.email)}`
    : ''

  const copyReferralLink = useCallback(() => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }, [referralLink])

  const formatScore = (value) => {
    if (value == null || Number.isNaN(value)) {
      return lang === 'ru' ? 'Оценка появится после проверки ДЗ' : 'Score will appear after homework review'
    }
    return `${String(value).replace('.', ',')} / 10`
  }

  const formatCompactScore = (value) => {
    if (value == null || Number.isNaN(value)) {
      return lang === 'ru' ? 'нет оценки' : 'no score'
    }
    return `${String(value).replace('.', ',')} / 10`
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>{t('cabinet.title')}</h1>
        {userDiscount > 0 && (
          <p className={styles.discountBadge}>
            {lang === 'ru' ? `Ваша реферальная скидка: −${userDiscount}% на обучение` : `Your referral discount: −${userDiscount}% on courses`}
          </p>
        )}
        {myCourses.length === 0 ? (
          <div className={styles.empty}>
            <p>{t('cabinet.empty')}</p>
            <Link to="/courses" className={styles.link}>{t('cabinet.toCatalog')}</Link>
          </div>
        ) : (
          <div className={styles.cards}>
            {myCourses.map((course) => {
              const percent = getPercent(course.id, course.lessons?.length ?? 0)
              const title = getCourseField(course, 'title', lang)
              const duration = getCourseField(course, 'duration', lang)
              const score = getCourseAverageScore(user?.email, course.id)
              return (
                <Link to={`/courses/${course.slug}`} key={course.id} className={styles.card}>
                  <div className={styles.cardImageWrap}>
                    <img src={course.image} alt="" className={styles.cardImage} />
                    <span className={styles.cardBadge}>{t('cabinet.accessOpen')}</span>
                    <div className={styles.cardProgressBar}>
                      <div className={styles.cardProgressFill} style={{ width: `${percent}%` }} />
                    </div>
                    <span className={styles.cardPercent}>{percent}% {t('cabinet.completed')}</span>
                  </div>
                  <h3 className={styles.cardTitle}>{title}</h3>
                  <p className={styles.cardMeta}>{duration} · {course.lessons.length} {lang === 'ru' ? 'уроков' : 'lessons'}</p>
                  <div className={styles.cardStats}>
                    <p className={styles.cardStatRow}>
                      <span>{lang === 'ru' ? 'Пройдено:' : 'Completed:'}</span>
                      <strong>{percent}%</strong>
                    </p>
                    <p className={styles.cardStatRow}>
                      <span>{lang === 'ru' ? 'Успеваемость:' : 'Performance:'}</span>
                      <strong>{formatCompactScore(score)}</strong>
                    </p>
                  </div>
                  <span className={styles.cardAction}>{t('cabinet.watchCourse')}</span>
                </Link>
              )
            })}
          </div>
        )}
        <div className={styles.ctaRow}>
          <Link to="/courses" className={styles.ctaPrimary}>{t('cabinet.catalogBtn')}</Link>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{lang === 'ru' ? 'Успеваемость' : 'Performance'}</h2>
          <p className={styles.sectionDesc}>
            {lang === 'ru'
              ? 'Здесь отображается средний балл по каждому курсу на основе проверенных домашних заданий.'
              : 'This section shows your average score for each course based on reviewed homework.'}
          </p>
          {myCourses.length === 0 ? (
            <p className={styles.muted}>{lang === 'ru' ? 'Пока нет данных по курсам.' : 'No course data yet.'}</p>
          ) : (
            <div className={styles.performanceList}>
              {myCourses.map((course) => {
                const title = getCourseField(course, 'title', lang)
                const score = getCourseAverageScore(user?.email, course.id)
                return (
                  <div key={`score-${course.id}`} className={styles.performanceItem}>
                    <span className={styles.performanceCourse}>{title}</span>
                    <span className={styles.performanceScore}>{formatScore(score)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section id="certificates" className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('nav.myCertificates')}</h2>
          <p className={styles.sectionDesc}>
            {lang === 'ru'
              ? 'Сертификаты об окончании курсов приходят на почту в течение 24 часов и отображаются здесь.'
              : 'Course completion certificates are sent to your email within 24 hours and listed here.'}
          </p>
          {myCertificates.length === 0 ? (
            <p className={styles.muted}>{lang === 'ru' ? 'Пока нет сертификатов.' : 'No certificates yet.'}</p>
          ) : (
            <ul className={styles.certList}>
              {myCertificates.map((cert, i) => (
                <li key={i} id={`cert-${i}`}>
                  <div className={styles.certItem} title={lang === 'ru' ? 'Сертификат доступен в течение 24 ч после окончания курса' : 'Certificate available within 24h after course completion'}>
                    <span className={styles.certIcon}>📜</span>
                    <span className={styles.certCourse}>{cert.courseTitle}</span>
                    <span className={styles.certScore}>
                      {lang === 'ru' ? 'Балл:' : 'Score:'} {formatScore(cert.score ?? getCourseAverageScore(user?.email, cert.courseId))}
                    </span>
                    <span className={styles.certDate}>
                      {cert.date ? new Date(cert.date).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </span>
                    {cert.fileDataUrl && (
                      <span className={styles.certActions}>
                        <a href={cert.fileDataUrl} target="_blank" rel="noreferrer" className={styles.certLink}>
                          {lang === 'ru' ? 'Открыть' : 'Open'}
                        </a>
                        <a href={cert.fileDataUrl} download={cert.fileName || 'certificate'} className={styles.certLink}>
                          {lang === 'ru' ? 'Скачать' : 'Download'}
                        </a>
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="awards" className={styles.section} aria-hidden>
          <h2 className={styles.sectionTitle}>{lang === 'ru' ? 'Награды' : 'Awards'}</h2>
          <p className={styles.muted}>{lang === 'ru' ? 'Раздел в разработке.' : 'Coming soon.'}</p>
        </section>
        <section id="invite" className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('nav.inviteFriend')}</h2>
          <p className={styles.sectionDesc}>
            {lang === 'ru'
              ? 'Пригласите друга по ссылке: за каждого приглашённого вы получите скидку 1% на обучение, за каждого купившего по вашей ссылке — 5% разово.'
              : 'Invite a friend with your link: 1% discount per invite, 5% one-time discount for each referred purchase.'}
          </p>
          <div className={styles.referralRow}>
            <input readOnly value={referralLink} className={styles.referralInput} />
            <button type="button" onClick={copyReferralLink} className={styles.copyBtn}>
              {copied ? (lang === 'ru' ? 'Скопировано' : 'Copied') : (lang === 'ru' ? 'Копировать' : 'Copy')}
            </button>
          </div>
        </section>
        <section id="support" className={styles.section} aria-hidden>
          <h2 className={styles.sectionTitle}>{lang === 'ru' ? 'Поддержка' : 'Support'}</h2>
          <p className={styles.muted}>{lang === 'ru' ? 'Поддержка 24/7: support@example.com' : '24/7 support: support@example.com'}</p>
        </section>
      </div>
    </div>
  )
}
