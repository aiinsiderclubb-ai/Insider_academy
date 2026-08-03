import { getCoursePromoVideo } from '../data/promo'
import { getCourseDesignCover } from '../utils/designAssets'
import { PromoVideo } from './PromoVideo'
import styles from './CoursePromoSection.module.css'

export function CoursePromoSection({ course, lang, title }) {
  const url = getCoursePromoVideo(course?.id)
  if (!url) return null

  const heading =
    lang === 'ru' ? 'Промо-видео курса' : 'Course promo video'

  return (
    <section className={styles.section} aria-label={heading}>
      <h2 className={styles.title}>{heading}</h2>
      <PromoVideo url={url} poster={getCourseDesignCover(course)} title={title} />
    </section>
  )
}
