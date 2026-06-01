import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../context/ProgressContext'
import { useLanguage } from '../context/LanguageContext'
import { useCourses } from '../context/CoursesContext'
import { getCourseField } from '../data/courses'
import { useTheme } from '../context/ThemeContext'
import { CourseGridSkeleton } from '../components/SkeletonLoader'
import { CourseCatalogCard } from '../components/CourseCatalogCard'
import { CourseBundleOffers, CourseCatalogSections } from '../components/CourseCatalogSections'
import { VaultSection } from '../components/VaultSection'
import styles from './Courses.module.css'

const SEGMENTS = [
  { id: 'all', ru: 'Все', en: 'All' },
  { id: 'free', ru: 'Бесплатные', en: 'Free' },
  { id: 'paid', ru: 'Платные', en: 'Paid' },
  { id: 'packs', ru: 'Пакеты', en: 'Bundles' },
  { id: 'vault', ru: 'Vault', en: 'Vault' },
  { id: 'bundle', ru: 'Набор', en: 'Bundle' },
]

export function Courses() {
  const { hasPurchased } = useAuth()
  const { getPercent } = useProgress()
  const { t, lang } = useLanguage()
  const { theme } = useTheme()
  const { courses, freeCourses, paidCourses, acceleratorCourse, loading } = useCourses()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [segment, setSegment] = useState('all')

  const segmentCourses = useMemo(() => {
    if (segment === 'free') return freeCourses
    if (segment === 'paid') return paidCourses
    if (segment === 'packs' || segment === 'vault') return []
    if (segment === 'bundle') return acceleratorCourse ? [acceleratorCourse] : []
    return courses
  }, [segment, courses, freeCourses, paidCourses, acceleratorCourse])

  const categories = useMemo(() => {
    const set = new Set(segmentCourses.map((c) => getCourseField(c, 'category', lang)).filter(Boolean))
    return ['all', ...set]
  }, [segmentCourses, lang])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return segmentCourses.filter((course) => {
      const cat = getCourseField(course, 'category', lang)
      if (category !== 'all' && cat !== category) return false
      if (!q) return true
      const title = getCourseField(course, 'title', lang).toLowerCase()
      const desc = getCourseField(course, 'shortDescription', lang).toLowerCase()
      return title.includes(q) || desc.includes(q)
    })
  }, [segmentCourses, query, category, lang])

  const showSectionedCatalog = segment === 'all' && !query.trim() && category === 'all'

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <span className={styles.heroPill}>AI Insider Academy</span>
        <h1 className={styles.title}>{t('courses.title')}</h1>
        <p className={styles.desc}>{t('courses.desc')}</p>

        <div className={styles.segmentRow}>
          {SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              type="button"
              className={`${styles.segmentBtn} ${segment === seg.id ? styles.segmentBtnActive : ''}`}
              onClick={() => { setSegment(seg.id); setCategory('all') }}
            >
              {lang === 'en' ? seg.en : seg.ru}
            </button>
          ))}
          <Link to="/memberships" className={styles.clubLink}>
            {lang === 'ru' ? 'Memberships →' : 'Memberships →'}
          </Link>
        </div>

        {!showSectionedCatalog && segment !== 'packs' && segment !== 'vault' && (
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
        )}

        {loading && segment !== 'packs' && segment !== 'vault' ? (
          <CourseGridSkeleton count={6} />
        ) : segment === 'packs' ? (
          <CourseBundleOffers lang={lang} />
        ) : segment === 'vault' ? (
          <VaultSection lang={lang} hasPurchased={hasPurchased} showMoreLink={false} />
        ) : showSectionedCatalog ? (
          <CourseCatalogSections
            lang={lang}
            theme={theme}
            acceleratorCourse={acceleratorCourse}
            freeCourses={freeCourses}
            paidCourses={paidCourses}
            hasPurchased={hasPurchased}
            getPercent={getPercent}
            completedLabel={t('courses.completed')}
          />
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>{lang === 'ru' ? 'Курсы не найдены' : 'No courses found'}</p>
        ) : (
          <div className={styles.grid}>
            {filtered.map((course) => (
              <CourseCatalogCard
                key={course.id}
                course={course}
                lang={lang}
                theme={theme}
                purchased={hasPurchased(course.id)}
                percent={getPercent(course.id, course.lessons?.length ?? 0)}
                completedLabel={t('courses.completed')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
