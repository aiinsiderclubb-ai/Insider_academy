import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../context/ProgressContext'
import { useLanguage } from '../context/LanguageContext'
import { useCourses } from '../context/CoursesContext'
import { getCourseField } from '../data/courses'
import { LoadingSpinner } from '../components/LoadingSpinner'
import styles from './Courses.module.css'

export function Courses() {
  const { hasPurchased } = useAuth()
  const { getPercent } = useProgress()
  const { t, lang } = useLanguage()
  const { courses, loading } = useCourses()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const categories = useMemo(() => {
    const set = new Set(courses.map((c) => getCourseField(c, 'category', lang)).filter(Boolean))
    return ['all', ...set]
  }, [courses, lang])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return courses.filter((course) => {
      const cat = getCourseField(course, 'category', lang)
      if (category !== 'all' && cat !== category) return false
      if (!q) return true
      const title = getCourseField(course, 'title', lang).toLowerCase()
      const desc = getCourseField(course, 'shortDescription', lang).toLowerCase()
      return title.includes(q) || desc.includes(q)
    })
  }, [courses, query, category, lang])

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('courses.title')}</h1>
        <p className={styles.desc}>{t('courses.desc')}</p>

        <div className={styles.toolbar}>
          <input
            type="search"
            className={styles.search}
            placeholder={lang === 'ru' ? 'Поиск по курсам…' : 'Search courses…'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className={styles.filters}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`${styles.filterBtn} ${category === cat ? styles.filterBtnActive : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat === 'all' ? (lang === 'ru' ? 'Все' : 'All') : cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label={lang === 'ru' ? 'Загружаем каталог…' : 'Loading catalog…'} />
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>{lang === 'ru' ? 'Курсы не найдены' : 'No courses found'}</p>
        ) : (
          <div className={styles.grid}>
            {filtered.map((course) => {
              const purchased = hasPurchased(course.id)
              const isFreeTrial = course.isFreeTrial === true
              const percent = getPercent(course.id, course.lessons?.length ?? 0)
              const title = getCourseField(course, 'title', lang)
              const shortDesc = getCourseField(course, 'shortDescription', lang)
              const catLabel = getCourseField(course, 'category', lang)
              const duration = getCourseField(course, 'duration', lang)
              return (
                <Link to={`/courses/${course.slug}`} key={course.id} className={styles.card}>
                  <div className={styles.cardImageWrap}>
                    <img src={course.image} alt="" className={styles.cardImage} loading="lazy" />
                    <span className={styles.cardCategory}>{catLabel}</span>
                    {isFreeTrial && <span className={styles.cardFreeBadge}>{lang === 'ru' ? 'Бесплатно' : 'Free'}</span>}
                    {purchased && !isFreeTrial && <span className={styles.cardPercent}>{percent}% {t('courses.completed')}</span>}
                  </div>
                  <h2 className={styles.cardTitle}>{title}</h2>
                  <p className={styles.cardDesc}>{shortDesc}</p>
                  <div className={styles.cardMeta}>
                    <span>{duration}</span>
                    {isFreeTrial ? (
                      <span className={styles.cardPriceFree}>{lang === 'ru' ? 'Бесплатно' : 'Free'}</span>
                    ) : (
                      <span className={styles.cardPrice}>{(course.priceEur ?? Math.round(course.price / 100))} €</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
