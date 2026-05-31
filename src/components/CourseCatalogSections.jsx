import { Link } from 'react-router-dom'
import { CourseCatalogCard } from './CourseCatalogCard'
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
