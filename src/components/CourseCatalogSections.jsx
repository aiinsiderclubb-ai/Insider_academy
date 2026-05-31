import { Link } from 'react-router-dom'
import { CourseCatalogCard } from './CourseCatalogCard'
import { COURSE_BUNDLES, COURSE_LEVEL_PACKS } from '../data/coursePacks'
import styles from './CourseCatalogSections.module.css'

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
      {courses.map((course) => (
        <CourseCatalogCard
          key={course.id}
          course={course}
          lang={lang}
          theme={theme}
          purchased={hasPurchased(course.id)}
          percent={getPercent(course.id, course.lessons?.length ?? 0)}
          completedLabel={completedLabel}
          actionLabel={actionLabel}
        />
      ))}
    </div>
  )
}

function LevelsAndBundles({ lang }) {
  const ru = lang === 'ru'

  return (
    <section className={styles.section}>
      <SectionHeader
        pill={ru ? 'Паки' : 'Packs'}
        title={ru ? 'Курсы по уровням и выгодные пакеты' : 'Courses by level and bundle offers'}
        desc={ru
          ? 'Выберите отдельный курс по уровню или заберите набор со скидкой.'
          : 'Choose a course by level or get a discounted bundle.'}
        lang={lang}
      />

      <div className={styles.levelGrid}>
        {COURSE_LEVEL_PACKS.map((level) => (
          <article className={styles.levelCard} key={level.id}>
            <span className={styles.levelPill}>{ru ? level.titleRu : level.titleEn}</span>
            <p className={styles.levelDesc}>{ru ? level.descRu : level.descEn}</p>
            <ul className={styles.levelList}>
              {level.courses.map((course) => (
                <li key={course.title}>
                  <Link to={`/courses/${course.courseId}`}>{course.title}</Link>
                  <strong>{course.priceEur}€</strong>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className={styles.bundleGrid}>
        {COURSE_BUNDLES.map((bundle) => {
          const includes = lang === 'en' && bundle.includesEn ? bundle.includesEn : bundle.includes
          return (
            <article
              className={`${styles.bundleCard} ${bundle.featured ? styles.bundleCardFeatured : ''}`}
              key={bundle.id}
            >
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
              <div className={styles.bundlePriceRow}>
                <span className={styles.bundlePrice}>{bundle.priceEur}€</span>
                <span className={styles.bundleOldPrice}>{bundle.oldPriceEur}€</span>
                <span className={styles.bundleSave}>
                  {ru ? `экономия ${bundle.oldPriceEur - bundle.priceEur}€` : `save €${bundle.oldPriceEur - bundle.priceEur}`}
                </span>
              </div>
              <Link to="/cabinet#support" className={styles.bundleCta}>
                {ru ? 'Получить пакет →' : 'Get bundle →'}
              </Link>
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
          actionLabel={ru ? 'Начать бесплатно →' : 'Start free →'}
        />
      </section>

      <LevelsAndBundles lang={lang} />

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

      <aside className={styles.mapCta}>
        <div>
          <h3>{ru ? 'Карта обучения' : 'Learning map'}</h3>
          <p>{ru ? 'Все этапы от бесплатного старта до AI-агентства.' : 'All stages from free start to AI agency.'}</p>
        </div>
        <Link to="/learning-map" className={styles.mapLink}>
          {ru ? 'Открыть карту →' : 'Open map →'}
        </Link>
      </aside>
    </div>
  )
}
