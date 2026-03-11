import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../context/ProgressContext'
import { useLanguage } from '../context/LanguageContext'
import { useCourses } from '../context/CoursesContext'
import { getCourseField } from '../data/courses'
import styles from './Courses.module.css'

export function Courses() {
  const { hasPurchased } = useAuth()
  const { getPercent } = useProgress()
  const { t, lang } = useLanguage()
  const { courses } = useCourses()

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('courses.title')}</h1>
        <p className={styles.desc}>{t('courses.desc')}</p>
        <div className={styles.grid}>
          {courses.map((course) => {
            const purchased = hasPurchased(course.id)
            const isFreeTrial = course.isFreeTrial === true
            const percent = getPercent(course.id, course.lessons?.length ?? 0)
            const title = getCourseField(course, 'title', lang)
            const shortDesc = getCourseField(course, 'shortDescription', lang)
            const category = getCourseField(course, 'category', lang)
            const duration = getCourseField(course, 'duration', lang)
            return (
              <Link to={`/courses/${course.slug}`} key={course.id} className={styles.card}>
                <div className={styles.cardImageWrap}>
                  <img src={course.image} alt="" className={styles.cardImage} />
                  <span className={styles.cardCategory}>{category}</span>
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
      </div>
    </div>
  )
}
