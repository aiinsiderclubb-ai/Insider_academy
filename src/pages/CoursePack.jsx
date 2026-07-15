import { Link, Navigate, useParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { getCourseBundle } from '../data/coursePacks'
import { getCoursePackDetails } from '../data/coursePackDetails'
import { getCourseById, getCourseField } from '../data/courses'
import { ScrollReveal } from '../components/ScrollReveal'
import { getCourseDesignCover } from '../utils/designAssets'
import { ComingSoonAction } from '../components/ComingSoonLock'
import { isComingSoon } from '../config/availability'
import styles from './CoursePack.module.css'

export function CoursePack() {
  const { packId } = useParams()
  const { lang } = useLanguage()
  const ru = lang === 'ru'

  const bundle = getCourseBundle(packId)
  const details = getCoursePackDetails(packId)

  if (!bundle || !details) {
    return <Navigate to="/courses" replace />
  }

  const includes =
    lang === 'en' && bundle.includesEn ? bundle.includesEn : bundle.includes
  const bonuses = ru ? bundle.bonusRu : bundle.bonusEn
  const bundleCourses = bundle.courseIds.map((id) => getCourseById(id)).filter(Boolean)
  const individualTotal = bundleCourses.reduce((sum, c) => sum + (c.priceEur ?? 0), 0)
  const oldPrice = Math.max(bundle.oldPriceEur ?? 0, individualTotal)
  const savings = Math.max(0, oldPrice - bundle.priceEur)
  const comingSoon = isComingSoon('courses')

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <ScrollReveal>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/courses">{ru ? 'Курсы' : 'Courses'}</Link>
            <span aria-hidden>/</span>
            <span>{bundle.title}</span>
          </nav>
        </ScrollReveal>

        <ScrollReveal>
          <header
            className={`${styles.hero} ${bundle.featured ? styles.heroFeatured : ''}`}
          >
            {bundle.featured && (
              <span className={styles.heroBadge}>
                {ru ? 'Лучшее предложение' : 'Best value'}
              </span>
            )}
            <h1 className={styles.title}>{bundle.title}</h1>
            <p className={styles.heroLead}>{ru ? details.heroRu : details.heroEn}</p>
            <p className={styles.lead}>{ru ? details.leadRu : details.leadEn}</p>
          </header>
        </ScrollReveal>

        <ScrollReveal>
          <div className={styles.coverRow} aria-hidden>
            {bundleCourses.map((course, index) => (
              <img
                key={course.id}
                src={getCourseDesignCover(course)}
                alt=""
                className={styles.coverThumb}
                style={{ '--thumb-index': index }}
              />
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <article className={styles.priceCard}>
            <div className={styles.priceRow}>
              <strong className={styles.price}>{bundle.priceEur}€</strong>
              {oldPrice > bundle.priceEur && (
                <span className={styles.oldPrice}>{oldPrice}€</span>
              )}
              {savings > 0 && (
                <span className={styles.save}>
                  {ru ? `экономия ${savings}€` : `save €${savings}`}
                </span>
              )}
            </div>
            {individualTotal > 0 && (
              <p className={styles.priceHint}>
                {ru
                  ? `Отдельно курсы: ${individualTotal}€`
                  : `Courses bought separately: €${individualTotal}`}
              </p>
            )}
            <div className={styles.priceActions}>
              {comingSoon ? (
                <ComingSoonAction kind="courses" lang={lang} className={styles.btnBuy} />
              ) : (
                <Link to="/cabinet#support" className={styles.btnBuy}>
                  {ru ? 'Купить пакет' : 'Buy pack'}
                </Link>
              )}
              <Link to="/courses" className={styles.btnSecondary}>
                {ru ? 'Все курсы' : 'All courses'}
              </Link>
            </div>
            <p className={styles.priceNote}>
              {ru
                ? 'Доступ к курсам пакета открывается после подтверждения оплаты.'
                : 'Pack course access opens after payment confirmation.'}
            </p>
          </article>
        </ScrollReveal>

        <div className={styles.grid}>
          <ScrollReveal>
            <section className={styles.block}>
              <h2>{ru ? 'Для кого' : 'Who it is for'}</h2>
              <ul className={styles.list}>
                {(ru ? details.forWhoRu : details.forWhoEn).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={40}>
            <section className={styles.block}>
              <h2>{ru ? 'Результат' : 'Outcomes'}</h2>
              <ul className={styles.list}>
                {(ru ? details.outcomesRu : details.outcomesEn).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <section className={styles.block}>
            <h2>{ru ? 'Курсы в пакете' : 'Courses in this pack'}</h2>
            <div className={styles.courseList}>
              {bundleCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.slug}`}
                  className={styles.courseCard}
                >
                  <img src={getCourseDesignCover(course)} alt="" className={styles.courseImg} />
                  <div>
                    <strong>{getCourseField(course, 'title', lang)}</strong>
                    <span>{course.priceEur}€</span>
                  </div>
                </Link>
              ))}
            </div>
            <ul className={styles.tagList}>
              {includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </ScrollReveal>

        {bonuses?.length > 0 && (
          <ScrollReveal>
            <section className={styles.bonusBlock}>
              <h2>{ru ? 'Бонусы при покупке пакета' : 'Bundle purchase bonuses'}</h2>
              <ul>
                {bonuses.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </ScrollReveal>
        )}

        <ScrollReveal>
          <section className={styles.block}>
            <h2>{ru ? 'Частые вопросы' : 'FAQ'}</h2>
            <div className={styles.faq}>
              {(ru ? details.faqRu : details.faqEn).map((item) => (
                <details key={item.q} className={styles.faqItem}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <footer className={styles.footerCta}>
            <p>
              {ru
                ? `Готовы начать с ${bundle.title}?`
                : `Ready to start with ${bundle.title}?`}
            </p>
            <div className={styles.priceActions}>
              {comingSoon ? (
                <ComingSoonAction kind="courses" lang={lang} className={styles.btnBuy} />
              ) : (
                <Link to="/cabinet#support" className={styles.btnBuy}>
                  {ru ? 'Купить' : 'Buy'}
                </Link>
              )}
              <Link to="/courses#packs" className={styles.btnSecondary}>
                {ru ? 'Другие пакеты' : 'Other packs'}
              </Link>
            </div>
          </footer>
        </ScrollReveal>
      </div>
    </div>
  )
}
