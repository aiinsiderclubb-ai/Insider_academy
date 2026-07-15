import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CourseCatalogCard } from './CourseCatalogCard'
import { COURSE_BUNDLES } from '../data/coursePacks'
import { VaultSection } from './VaultSection'
import { getCourseById, getCourseField } from '../data/courses'
import { getCourseDesignCover } from '../utils/designAssets'
import { ComingSoonLock } from './ComingSoonLock'
import { isComingSoon } from '../config/availability'
import styles from './CourseCatalogSections.module.css'

const COURSE_BADGE_LABELS = {
  hit: { ru: 'Хит', en: 'Hit' },
  'trend-2026': { ru: 'Тренд 2026', en: 'Trend 2026' },
  new: { ru: 'Новинка', en: 'New' },
}

function SectionHeader({ pill, title, desc, lang }) {
  return (
    <div className={styles.sectionHead}>
      <span className={styles.pill}>{pill}</span>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {desc && <p className={styles.sectionDesc}>{desc}</p>}
    </div>
  )
}

function CourseGrid({ courses, lang, theme, hasPurchased, getPercent, completedLabel, actionLabel }) {
  if (!courses?.length) return null
  return (
    <div className={styles.grid}>
      {courses.map((course) => {
        const badgeLabel = COURSE_BADGE_LABELS[course.badge]?.[lang]
        const cardCourse = course.badge ? { ...course, badge: null } : course

        return (
          <div className={styles.courseSlot} key={course.id}>
            {badgeLabel && (
              <span className={styles.courseBadge} data-badge={course.badge}>
                {badgeLabel}
              </span>
            )}
            <CourseCatalogCard
              course={cardCourse}
              lang={lang}
              theme={theme}
              purchased={hasPurchased(course.id)}
              percent={getPercent(course.id, course.lessons?.length ?? 0)}
              completedLabel={completedLabel}
              actionLabel={actionLabel}
            />
          </div>
        )
      })}
    </div>
  )
}

export function CourseBundleOffers({ lang, bundles = COURSE_BUNDLES, title, desc, compact = false }) {
  const ru = lang === 'ru'
  const comingSoon = isComingSoon('courses')

  if (!bundles?.length) return null

  return (
    <section
      id="packs"
      className={`${styles.section} ${compact ? styles.bundleSectionCompact : ''}`}
    >
      <SectionHeader
        pill={ru ? 'Пакеты' : 'Bundles'}
        title={title || (ru ? 'Выгодные пакеты курсов' : 'Discounted course bundles')}
        desc={desc || (ru
          ? 'Заберите несколько программ вместе и сэкономьте на обучении.'
          : 'Get several programs together and save on your learning path.')}
        lang={lang}
      />

      <div className={styles.bundleGrid}>
        {bundles.map((bundle) => {
          const includes = lang === 'en' && bundle.includesEn ? bundle.includesEn : bundle.includes
          const bonuses = lang === 'en' && bundle.bonusEn ? bundle.bonusEn : bundle.bonusRu
          const bundleCourses = bundle.courseIds
            .map((courseId) => getCourseById(courseId))
            .filter(Boolean)
          return (
            <article
              className={`${styles.bundleCard} ${bundle.featured ? styles.bundleCardFeatured : ''}`}
              key={bundle.id}
            >
              <div className={styles.bundleImages} aria-label={ru ? 'Курсы в пакете' : 'Courses in bundle'}>
                {bundleCourses.slice(0, 5).map((course, index) => (
                  <img
                    key={course.id}
                    src={getCourseDesignCover(course)}
                    alt={getCourseField(course, 'title', lang)}
                    className={styles.bundleImage}
                    style={{ '--image-index': index }}
                    loading="lazy"
                  />
                ))}
                {bundleCourses.length > 5 && (
                  <span className={styles.bundleImageMore}>+{bundleCourses.length}</span>
                )}
              </div>
              <span className={styles.bundleBadge}>
                {bundle.featured ? (ru ? 'Лучшее предложение' : 'Best value') : (ru ? 'Пакет' : 'Bundle')}
              </span>
              <h3>{bundle.title}</h3>
              <p>{ru ? bundle.descRu : bundle.descEn}</p>
              <ul>
                {includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {bonuses?.length > 0 && (
                <div className={styles.bundleBonus}>
                  <strong>{ru ? 'Бонусы при покупке пакета:' : 'Bundle purchase bonuses:'}</strong>
                  <ul>
                    {bonuses.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className={styles.bundlePriceRow}>
                <span className={styles.bundlePrice}>{bundle.priceEur}€</span>
                <span className={styles.bundleOldPrice}>{bundle.oldPriceEur}€</span>
                <span className={styles.bundleSave}>
                  {ru ? `экономия ${bundle.oldPriceEur - bundle.priceEur}€` : `save €${bundle.oldPriceEur - bundle.priceEur}`}
                </span>
              </div>
              <div className={styles.bundleActions}>
                <Link to="/cabinet#support" className={styles.bundleBuyBtn}>
                  {ru ? 'Купить' : 'Buy'}
                </Link>
                <Link to={`/packs/${bundle.id}`} className={styles.bundleDetailsBtn}>
                  {ru ? 'Подробнее' : 'Details'}
                </Link>
              </div>
              {comingSoon && <ComingSoonLock kind="courses" lang={lang} compact />}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function CourseCatalogSections({
  lang,
  theme,
  acceleratorCourse,
  freeCourses,
  paidCourses,
  hasPurchased,
  getPercent,
  completedLabel,
}) {
  const ru = lang === 'ru'

  return (
    <div className={styles.sections}>
      <section className={styles.section}>
        <SectionHeader
          pill="Pro"
          title={ru ? 'Платные программы' : 'Paid programs'}
          desc={ru
            ? 'Видео, домашние задания, сертификат и поддержка.'
            : 'Video lessons, homework, certificates and community support.'}
          lang={lang}
        />
        <CourseGrid
          courses={paidCourses}
          lang={lang}
          theme={theme}
          hasPurchased={hasPurchased}
          getPercent={getPercent}
          completedLabel={completedLabel}
        />
      </section>

      <section className={styles.section}>
        <SectionHeader
          pill={ru ? 'Бесплатно' : 'Free'}
          title={ru ? 'Начните без оплаты' : 'Start at zero cost'}
          desc={ru
            ? 'Три бесплатных программы — регистрация и сразу к урокам.'
            : 'Three free programs — register and start learning.'}
          lang={lang}
        />
        <CourseGrid
          courses={freeCourses}
          lang={lang}
          theme={theme}
          hasPurchased={hasPurchased}
          getPercent={getPercent}
          completedLabel={completedLabel}
          actionLabel={(
            <>
              {ru ? 'Начать бесплатно' : 'Start free'}
              <ArrowRight size={14} strokeWidth={1.8} aria-hidden style={{ marginLeft: 6, flexShrink: 0 }} />
            </>
          )}
        />
      </section>

      {acceleratorCourse && (
        <section className={styles.section}>
          <SectionHeader
            pill={ru ? 'Набор' : 'Enrollment'}
            title={ru ? 'Открытый intake-программа' : 'Open intake program'}
            desc={ru
              ? 'Начните здесь — анкета, тест и выбор специализации в AI.'
              : 'Start here — apply, pass the test and choose your AI path.'}
            lang={lang}
          />
          <CourseGrid
            courses={[acceleratorCourse]}
            lang={lang}
            theme={theme}
            hasPurchased={hasPurchased}
            getPercent={getPercent}
            completedLabel={completedLabel}
          />
        </section>
      )}

      <CourseBundleOffers lang={lang} />

      <VaultSection lang={lang} hasPurchased={hasPurchased} compact showMoreLink />

      <aside className={styles.mapCta}>
        <div>
          <h3>{ru ? 'Карта обучения' : 'Learning map'}</h3>
          <p>{ru ? 'Все этапы от бесплатного старта до AI-агентства.' : 'All stages from free start to AI agency.'}</p>
        </div>
        <Link to="/learning-map" className={styles.mapLink}>
          {ru ? 'Открыть карту' : 'Open map'}
          <ArrowRight size={14} strokeWidth={1.8} aria-hidden style={{ marginLeft: 6, flexShrink: 0 }} />
        </Link>
      </aside>
    </div>
  )
}
