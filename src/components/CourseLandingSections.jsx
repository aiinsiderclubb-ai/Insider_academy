import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getLessonCountLabel } from '../data/courseLessonPrograms'
import { isAcceleratorCourse } from '../data/courseCatalog'
import { getCourseField, getLessonDisplayTitle, getLessonDescription } from '../data/courses'
import { getAudienceList, COURSE_FAQ } from '../data/courseLanding'
import { CERTIFICATE_INFO, COURSE_DETAIL_SECTIONS, TOOLS_BY_COURSE } from '../data/courseDetailContent'
import { COURSE_BUNDLES } from '../data/coursePacks'
import { ACCELERATOR_OFFER } from '../data/promo'
import { ScrollReveal } from './ScrollReveal'
import { BundleCourseActions } from './BundleCourseActions'
import { CourseBundleOffers } from './CourseCatalogSections'
import { CourseBuyAction } from './CourseBuyAction'
import { IconChevronDown } from './Icons'
import styles from './CourseLandingSections.module.css'

function sectionTitle(key, lang) {
  return lang === 'en' ? COURSE_DETAIL_SECTIONS[key].en : COURSE_DETAIL_SECTIONS[key].ru
}

export function CourseLandingSections({ course, lang, purchased, priceEur }) {
  const [openFaq, setOpenFaq] = useState(null)
  const audience = getAudienceList(course, lang)
  const skillsRaw = getCourseField(course, 'skills', lang) || []
  const goals = getCourseField(course, 'goals', lang) || []
  const skills = skillsRaw.length > 0 ? skillsRaw : goals.slice(0, 8)
  const toolsRaw = getCourseField(course, 'tools', lang) || []
  const tools = toolsRaw.length > 0 ? toolsRaw : (TOOLS_BY_COURSE[course.id] || [])
  const courseIdea = getCourseField(course, 'courseIdea', lang) || getCourseField(course, 'fullDescription', lang)
  const finalProject = getCourseField(course, 'finalProject', lang)
  const programLabel = getLessonCountLabel(course.id, lang)
  const lessons = course.lessons || []
  const isBundle = isAcceleratorCourse(course)
  const isFree = course.isFreeTrial && (course.priceEur ?? 0) === 0
  const cert = lang === 'en' ? CERTIFICATE_INFO.en : CERTIFICATE_INFO.ru
  const showEnroll = !purchased || isFree
  const recommendedBundles = COURSE_BUNDLES.filter((bundle) => bundle.courseIds.includes(course.id))

  return (
    <div className={styles.sections}>
      {courseIdea && (
        <ScrollReveal>
          <section className={styles.sectionCard} id="description">
            <h2 className={styles.sectionTitle}>{sectionTitle('description', lang)}</h2>
            <p className={styles.ideaText}>{courseIdea}</p>
          </section>
        </ScrollReveal>
      )}

      <ScrollReveal delay={40}>
        <section className={styles.sectionCard} id="audience">
          <h2 className={styles.sectionTitle}>{sectionTitle('audience', lang)}</h2>
          <div className={styles.audienceGrid}>
            {audience.map((item) => (
              <span key={item} className={styles.audienceChip}>{item}</span>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {skills.length > 0 && (
        <ScrollReveal delay={60}>
          <section className={styles.sectionCard} id="skills">
            <h2 className={styles.sectionTitle}>{sectionTitle('skills', lang)}</h2>
            <ul className={styles.skillsList}>
              {skills.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </ScrollReveal>
      )}

      {tools.length > 0 && (
        <ScrollReveal delay={80}>
          <section className={styles.sectionCard} id="tools">
            <h2 className={styles.sectionTitle}>{sectionTitle('tools', lang)}</h2>
            <div className={styles.toolsGrid}>
              {tools.map((item) => (
                <span key={item} className={styles.toolChip}>{item}</span>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      <ScrollReveal delay={100}>
        <section className={styles.sectionCard} id="certificate">
          <h2 className={styles.sectionTitle}>{sectionTitle('certificate', lang)}</h2>
          <p className={styles.ideaText}>{cert.text}</p>
          <ul className={styles.certList}>
            {cert.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </ScrollReveal>

      {finalProject && (
        <ScrollReveal delay={120}>
          <section className={styles.sectionCard} id="final-project">
            <h2 className={styles.sectionTitle}>{sectionTitle('finalProject', lang)}</h2>
            <p className={styles.finalProjectBlock}>{finalProject}</p>
          </section>
        </ScrollReveal>
      )}

      {lessons.length > 0 && (
        <ScrollReveal delay={140}>
          <section className={styles.sectionCard} id="curriculum">
            <h2 className={styles.sectionTitle}>{sectionTitle('curriculum', lang)}</h2>
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

      {recommendedBundles.length > 0 && (
        <ScrollReveal delay={160}>
          <CourseBundleOffers
            lang={lang}
            bundles={recommendedBundles}
            compact
            title={lang === 'ru' ? 'Выгоднее взять курс в пакете' : 'This course is better in a bundle'}
            desc={lang === 'ru'
              ? 'Этот курс входит в пакеты со скидкой. Вы можете купить его отдельно или взять вместе с другими программами.'
              : 'This course is included in discounted bundles. Buy it separately or get it with related programs.'}
          />
        </ScrollReveal>
      )}

      <ScrollReveal delay={180}>
        <section className={styles.sectionCard} id="faq">
          <h2 className={styles.sectionTitle}>{sectionTitle('faq', lang)}</h2>
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

      {showEnroll && (
        <ScrollReveal delay={220}>
          <section className={styles.ctaStrip} id="enroll">
            {isBundle ? (
              <>
                <div>
                  <h2 className={styles.ctaTitle}>
                    {lang === 'ru' ? 'Подать заявку на набор' : 'Apply for the cohort'}
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
            ) : isFree ? (
              <>
                <div>
                  <h2 className={styles.ctaTitle}>{sectionTitle('enrollFree', lang)}</h2>
                  <p className={styles.ctaText}>
                    {lang === 'ru' ? 'Бесплатный доступ ко всем урокам курса.' : 'Free access to all course lessons.'}
                  </p>
                </div>
                <Link to={`/courses/${course.slug}?lesson=0`} className={styles.ctaBtn}>
                  {sectionTitle('enrollFree', lang)}
                </Link>
              </>
            ) : (
              <>
                <div>
                  <h2 className={styles.ctaTitle}>{sectionTitle('enroll', lang)}</h2>
                  <p className={styles.ctaText}>
                    {lang === 'ru' ? `Полный доступ — ${priceEur} €` : `Full access — ${priceEur} €`}
                  </p>
                </div>
                <CourseBuyAction
                  course={course}
                  className={styles.ctaBtn}
                  fallbackPath={`/courses/${course.slug}/buy`}
                >
                  {sectionTitle('enroll', lang)}
                </CourseBuyAction>
              </>
            )}
          </section>
        </ScrollReveal>
      )}

      {purchased && !isFree && (
        <ScrollReveal delay={220}>
          <section className={styles.ctaStrip} id="enroll">
            <div>
              <h2 className={styles.ctaTitle}>{sectionTitle('continue', lang)}</h2>
              <p className={styles.ctaText}>
                {lang === 'ru' ? 'Продолжайте с текущего урока в плеере выше.' : 'Continue from your current lesson in the player above.'}
              </p>
            </div>
            <a href="#curriculum" className={styles.ctaBtn}>
              {sectionTitle('continue', lang)}
            </a>
          </section>
        </ScrollReveal>
      )}
    </div>
  )
}
