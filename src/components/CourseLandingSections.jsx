import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getLessonCountLabel } from '../data/courseLessonPrograms'
import { isAcceleratorCourse } from '../data/courseCatalog'
import { getCourseField, getLessonDisplayTitle, getLessonDescription } from '../data/courses'
import { getAudienceList, INSTRUCTOR, SOCIAL_PROOF, COURSE_FAQ } from '../data/courseLanding'
import { ACCELERATOR_OFFER } from '../data/promo'
import { ACADEMY_GRADING_STANDARD } from '../data/courseHomework'
import { ScrollReveal } from './ScrollReveal'
import { BundleCourseActions } from './BundleCourseActions'
import { IconChevronDown, IconStar, IconUsers } from './Icons'
import styles from './CourseLandingSections.module.css'

export function CourseLandingSections({ course, lang, purchased, priceEur, marketingOnly = false }) {
  const [openFaq, setOpenFaq] = useState(null)
  const audience = getAudienceList(course, lang)
  const goals = getCourseField(course, 'goals', lang) || []
  const courseIdea = getCourseField(course, 'courseIdea', lang) || getCourseField(course, 'fullDescription', lang)
  const finalProject = getCourseField(course, 'finalProject', lang)
  const programLabel = getLessonCountLabel(course.id, lang)
  const lessons = course.lessons || []
  const isLearner = purchased || course.isFreeTrial
  const isBundle = isAcceleratorCourse(course)

  if (isLearner && !marketingOnly) {
    return (
      <div className={styles.sections}>
        <ScrollReveal delay={80}>
          <section className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>FAQ</h2>
            <div className={styles.faqList}>
              {COURSE_FAQ.map((item, i) => {
                const open = openFaq === i
                return (
                  <div key={i} className={styles.faqItem}>
                    <button
                      type="button"
                      className={styles.faqQuestion}
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                    >
                      {lang === 'ru' ? item.q : item.qEn}
                      <span className={`${styles.faqChevron} ${open ? styles.faqChevronOpen : ''}`}>
                        <IconChevronDown />
                      </span>
                    </button>
                    {open && (
                      <p className={styles.faqAnswer}>{lang === 'ru' ? item.a : item.aEn}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </ScrollReveal>
      </div>
    )
  }

  return (
    <div className={styles.sections}>
      <ScrollReveal>
        <section className={styles.socialProof}>
          <div className={styles.proofItem}>
            <IconUsers />
            <strong>{SOCIAL_PROOF.students}+</strong>
            <span>{lang === 'ru' ? 'студентов' : 'students'}</span>
          </div>
          <div className={styles.proofItem}>
            <IconStar />
            <strong>{SOCIAL_PROOF.rating}</strong>
            <span>{lang === 'ru' ? 'рейтинг' : 'rating'}</span>
          </div>
          <div className={styles.proofItem}>
            <span className={styles.proofEmoji} aria-hidden>📜</span>
            <strong>{SOCIAL_PROOF.certificates}+</strong>
            <span>{lang === 'ru' ? 'сертификатов' : 'certificates'}</span>
          </div>
        </section>
      </ScrollReveal>

      {courseIdea && (
        <ScrollReveal delay={40}>
          <section className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>{lang === 'ru' ? 'О курсе' : 'About the course'}</h2>
            <p className={styles.ideaText}>{courseIdea}</p>
            {finalProject && (
              <p className={styles.finalProject}>
                🎯 {lang === 'ru' ? 'Финальный результат:' : 'Final outcome:'} {finalProject}
              </p>
            )}
          </section>
        </ScrollReveal>
      )}

      <ScrollReveal delay={80}>
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>{lang === 'ru' ? 'Для кого подходит курс' : 'Who is this for'}</h2>
          <p className={styles.audienceLead}>{lang === 'ru' ? 'Этот курс создан для:' : 'This course is designed for:'}</p>
          <div className={styles.audienceGrid}>
            {audience.map((item) => (
              <span key={item} className={styles.audienceChip}>{item}</span>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {goals.length > 0 && (
        <ScrollReveal delay={120}>
          <section className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              {lang === 'ru' ? 'Результат после прохождения курса' : 'Results after completing the course'}
            </h2>
            <ul className={styles.outcomesList}>
              {goals.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </section>
        </ScrollReveal>
      )}

      {lessons.length > 0 && (
        <ScrollReveal delay={140}>
          <section className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>{lang === 'ru' ? 'Программа курса' : 'Course program'}</h2>
            {programLabel && <p className={styles.programMeta}>{programLabel}</p>}
            <ul className={styles.programPreview}>
              {lessons.map((lesson, index) => {
                const description = getLessonDescription(lesson, lang)
                return (
                  <li key={lesson.id || index}>
                    <span className={styles.programNum}>{index + 1}</span>
                    <div className={styles.programItemContent}>
                      <strong className={styles.programItemTitle}>{getLessonDisplayTitle(lesson, lang)}</strong>
                      {description && <p className={styles.programItemDesc}>{description}</p>}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        </ScrollReveal>
      )}

      {course.hasHomework && (
        <ScrollReveal delay={160}>
          <section className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              {(lang === 'en' ? ACADEMY_GRADING_STANDARD.en : ACADEMY_GRADING_STANDARD.ru).title}
            </h2>
            <div className={styles.gradingGrid}>
              {(lang === 'en' ? ACADEMY_GRADING_STANDARD.en : ACADEMY_GRADING_STANDARD.ru).levels.map((level) => (
                <div key={level.name} className={styles.gradingCard}>
                  <strong>{level.name}</strong>
                  <p>{level.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      <ScrollReveal delay={200}>
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>{lang === 'ru' ? 'Преподаватель' : 'Instructor'}</h2>
          <div className={styles.instructor}>
            <img src={INSTRUCTOR.avatar} alt="" className={styles.instructorAvatar} />
            <div>
              <h3 className={styles.instructorName}>{lang === 'ru' ? INSTRUCTOR.nameRu : INSTRUCTOR.name}</h3>
              <p className={styles.instructorRole}>{lang === 'ru' ? INSTRUCTOR.roleRu : INSTRUCTOR.role}</p>
              <p className={styles.instructorBio}>{lang === 'ru' ? INSTRUCTOR.bioRu : INSTRUCTOR.bio}</p>
              <ul className={styles.instructorStats}>
                {(lang === 'ru' ? INSTRUCTOR.statsRu : INSTRUCTOR.statsEn).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className={styles.instructorLinks}>
                <a href={INSTRUCTOR.siteUrl} target="_blank" rel="noreferrer noopener" className={styles.instructorLink}>
                  {lang === 'ru' ? 'Программы на insiderai.it.com ↗' : 'Programs on insiderai.it.com ↗'}
                </a>
                <a href={INSTRUCTOR.telegram} target="_blank" rel="noreferrer noopener" className={styles.instructorLink}>
                  Telegram @vladyslavarcher ↗
                </a>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={280}>
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>FAQ</h2>
          <div className={styles.faqList}>
            {COURSE_FAQ.map((item, i) => {
              const open = openFaq === i
              return (
                <div key={i} className={styles.faqItem}>
                  <button
                    type="button"
                    className={styles.faqQuestion}
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                  >
                    {lang === 'ru' ? item.q : item.qEn}
                    <span className={`${styles.faqChevron} ${open ? styles.faqChevronOpen : ''}`}>
                      <IconChevronDown />
                    </span>
                  </button>
                  {open && (
                    <p className={styles.faqAnswer}>{lang === 'ru' ? item.a : item.aEn}</p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </ScrollReveal>

      {!purchased && !course.isFreeTrial && (
        <ScrollReveal delay={320}>
          <section className={styles.ctaStrip}>
            {isBundle ? (
              <>
                <div>
                  <h2 className={styles.ctaTitle}>
                    {lang === 'ru' ? 'Хотите попасть в набор?' : 'Want to join the cohort?'}
                  </h2>
                  <p className={styles.ctaText}>
                    {lang === 'en' ? ACCELERATOR_OFFER.selectionEn : ACCELERATOR_OFFER.selectionRu}
                  </p>
                </div>
                <BundleCourseActions
                  courseSlug={course.slug}
                  lang={lang}
                  showLearnMore={false}
                  variant="cta"
                  className={styles.ctaActions}
                />
              </>
            ) : (
              <>
                <div>
                  <h2 className={styles.ctaTitle}>{lang === 'ru' ? 'Готовы начать?' : 'Ready to start?'}</h2>
                  <p className={styles.ctaText}>
                    {lang === 'ru' ? `Полный доступ — ${priceEur} €` : `Full access — ${priceEur} €`}
                  </p>
                </div>
                <Link to={`/courses/${course.slug}/buy`} className={styles.ctaBtn}>
                  {lang === 'ru' ? 'Купить курс' : 'Buy course'}
                </Link>
              </>
            )}
          </section>
        </ScrollReveal>
      )}
    </div>
  )
}
