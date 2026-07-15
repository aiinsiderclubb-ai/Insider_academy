import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useCourses } from '../context/CoursesContext'
import { HOME_DIRECTIONS } from '../data/homeDirections'
import { CourseCatalogCard } from './CourseCatalogCard'
import { ScrollReveal } from './ScrollReveal'
import styles from './HomeDirectionsSection.module.css'

export function HomeDirectionsSection({ lang, theme }) {
  const { courses } = useCourses()
  const [activeId, setActiveId] = useState(HOME_DIRECTIONS[0].id)
  const active = HOME_DIRECTIONS.find((d) => d.id === activeId) || HOME_DIRECTIONS[0]
  const activeCourses = active.courseIds
    .map((id) => courses.find((c) => c.id === id))
    .filter(Boolean)

  return (
    <ScrollReveal
      as="section"
      className={styles.section}
      aria-label={lang === 'ru' ? 'Направления обучения' : 'Learning tracks'}
    >
      <div className={styles.container}>
        <div className={styles.head}>
          <span className={styles.pill}>{lang === 'ru' ? 'Направления' : 'Tracks'}</span>
          <h2 className={styles.title}>
            {lang === 'ru' ? 'Выберите направление' : 'Choose your track'}
          </h2>
          <p className={styles.desc}>
            {lang === 'ru'
              ? 'Четыре пути в AI — от первой автоматизации до собственного бизнеса. К каждому — рекомендуемые курсы.'
              : 'Four paths into AI — from your first automation to your own business, with recommended courses for each.'}
          </p>
        </div>

        <div className={styles.tabs} role="tablist">
          {HOME_DIRECTIONS.map((dir, index) => (
            <button
              key={dir.id}
              type="button"
              role="tab"
              aria-selected={dir.id === activeId}
              className={`${styles.tab} ${dir.id === activeId ? styles.tabActive : ''}`}
              onClick={() => setActiveId(dir.id)}
            >
              <span className={styles.tabNum}>0{index + 1}</span>
              <span>{lang === 'ru' ? dir.labelRu : dir.labelEn}</span>
            </button>
          ))}
        </div>

        <div className={styles.panel} key={active.id}>
          <div className={styles.panelAside}>
            <span className={styles.panelKicker}>
              {lang === 'ru' ? 'Ваш маршрут' : 'Your route'} / {lang === 'ru' ? active.labelRu : active.labelEn}
            </span>
            <p className={styles.panelDesc}>{lang === 'ru' ? active.descRu : active.descEn}</p>
            <blockquote className={styles.quote}>
              <p className={styles.quoteText}>
                {lang === 'ru' ? active.quote.textRu : active.quote.textEn}
              </p>
              <footer className={styles.quoteMeta}>
                <strong>{active.quote.name}</strong>
                <span>{lang === 'ru' ? active.quote.roleRu : active.quote.roleEn}</span>
              </footer>
            </blockquote>
            <div className={styles.panelFooter}>
              <span>{activeCourses.length} {lang === 'ru' ? 'курса в маршруте' : 'courses in route'}</span>
              <Link to="/courses" className={styles.allLink}>
                {lang === 'ru' ? 'Все курсы' : 'All courses'}
                <ArrowRight size={14} strokeWidth={1.8} aria-hidden style={{ marginLeft: 6, flexShrink: 0 }} />
              </Link>
            </div>
          </div>
          <div className={styles.panelCourses}>
            {activeCourses.map((course) => (
              <CourseCatalogCard key={course.id} course={course} lang={lang} theme={theme} />
            ))}
          </div>
        </div>
      </div>
    </ScrollReveal>
  )
}
