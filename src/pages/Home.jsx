import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../context/ProgressContext'
import { useLanguage } from '../context/LanguageContext'
import { useCourses } from '../context/CoursesContext'
import { getCourseField } from '../data/courses'
import { getBlogPosts, fetchBlogPosts } from '../api/blogStore'
import { NeuronGlow } from '../components/NeuronGlow'
import styles from './Home.module.css'

export function Home() {
  const { user, hasPurchased } = useAuth()
  const { getPercent } = useProgress()
  const { t, lang } = useLanguage()
  const { courses, freeTrialCourses } = useCourses()
  const featured = courses.filter((c) => !c.isFreeTrial).slice(0, 4)
  const [blogPreview, setBlogPreview] = useState(() =>
    [...getBlogPosts()].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3)
  )

  useEffect(() => {
    fetchBlogPosts().then((posts) => {
      setBlogPreview([...posts].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3))
    })
  }, [])

  const getPostTitle = (post) => (lang === 'en' && post.titleEn ? post.titleEn : post.title)
  const getPostExcerpt = (post) => (lang === 'en' && post.excerptEn ? post.excerptEn : post.excerpt)
  const getPostCategory = (post) => (lang === 'en' && post.categoryEn ? post.categoryEn : post.category)

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <NeuronGlow className={styles.neuronHero} />
        <div className={styles.container}>
          <span className={styles.heroPill}>{t('home.heroPill')}</span>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleWhite}>{t('home.heroTitle1')}</span>{' '}
            <span className={styles.heroTitleAccent}>{t('home.heroTitle2')}</span>
          </h1>
          <p className={styles.heroDesc}>{t('home.heroDesc')}</p>
          <div className={styles.heroActions}>
            <Link to="/courses" className={styles.ctaPrimary}>
              {t('home.learnMore')}
              <span className={styles.ctaArrow} aria-hidden>→</span>
            </Link>
            {!user && (
              <Link to="/login" className={styles.ctaSecondary}>
                {t('home.enterCabinet')}
              </Link>
            )}
            {user && (
              <Link to="/cabinet" className={styles.ctaSecondary}>
                {t('home.myCabinet')}
              </Link>
            )}
          </div>
          <div className={styles.heroBenefits}>
            <span className={styles.benefitItem}>{t('home.benefit1')}</span>
            <span className={styles.benefitItem}>{t('home.benefit2')}</span>
            <span className={styles.benefitItem}>{t('home.benefit3')}</span>
          </div>
          <a href="https://t.me/your_channel" target="_blank" rel="noreferrer noopener" className={styles.telegramCta}>
            {t('home.telegramSubscribe')}
          </a>
        </div>
      </section>

      <section className={styles.statsStrip}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{courses.length}</span>
              <span className={styles.statLabel}>{lang === 'ru' ? 'Курсов в каталоге' : 'Courses'}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{freeTrialCourses.length}</span>
              <span className={styles.statLabel}>{lang === 'ru' ? 'Бесплатных пробных' : 'Free trials'}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>24/7</span>
              <span className={styles.statLabel}>{lang === 'ru' ? 'Доступ к материалам' : 'Access to materials'}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>RU/EN</span>
              <span className={styles.statLabel}>{lang === 'ru' ? 'Два языка платформы' : 'Two languages'}</span>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.whatIncluded} ${styles.animateSection}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>{t('home.whatIncludedTitle')}</h2>
          <div className={styles.whatIncludedGrid}>
            <div className={styles.whatIncludedCard}>
              <span className={styles.whatIncludedIcon}>🕐</span>
              <h3 className={styles.whatIncludedCardTitle}>{t('home.support247')}</h3>
              <p className={styles.whatIncludedCardText}>{t('home.support247Desc')}</p>
            </div>
            <div className={styles.whatIncludedCard}>
              <span className={styles.whatIncludedIcon}>✓</span>
              <h3 className={styles.whatIncludedCardTitle}>{t('home.checkingTasks')}</h3>
              <p className={styles.whatIncludedCardText}>{t('home.checkingTasksDesc')}</p>
            </div>
            <div className={styles.whatIncludedCard}>
              <span className={styles.whatIncludedIcon}>📜</span>
              <h3 className={styles.whatIncludedCardTitle}>{t('home.certificates')}</h3>
              <p className={styles.whatIncludedCardText}>{t('home.certificatesDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.promotions} ${styles.animateSection}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>{t('home.promo')}</h2>
          <div className={styles.promoCards}>
            <div className={styles.promoCard}>
              <span className={styles.promoCardTag}>{t('home.promoDiscount')}</span>
              <h3 className={styles.promoCardTitle}>{t('home.promoDiscountTitle')}</h3>
              <p className={styles.promoCardText}>{t('home.promoDiscountText')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.tryNow} ${styles.animateSection}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>{t('home.tryNowTitle')}</h2>
          <p className={styles.sectionDesc}>{t('home.tryNowDesc')}</p>
          <div className={styles.cards}>
            {freeTrialCourses.map((course) => {
              const title = getCourseField(course, 'title', lang)
              const shortDesc = getCourseField(course, 'shortDescription', lang)
              const category = getCourseField(course, 'category', lang)
              const duration = getCourseField(course, 'duration', lang)
              return (
                <Link
                  to={`/courses/${course.slug}`}
                  key={course.id}
                  className={styles.card}
                >
                  <div className={styles.cardImageWrap}>
                    <img src={course.image} alt="" className={styles.cardImage} />
                    <span className={styles.cardCategory}>{category}</span>
                    <span className={styles.cardFreeBadge}>{lang === 'ru' ? 'Бесплатно' : 'Free'}</span>
                  </div>
                  <h3 className={styles.cardTitle}>{title}</h3>
                  <p className={styles.cardDesc}>{shortDesc}</p>
                  <div className={styles.cardMeta}>
                    <span>{duration}</span>
                    <span className={styles.tryNowLink}>{t('home.tryNowWatch')}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className={`${styles.courses} ${styles.animateSection}`}>
        <div className={styles.container}>
          <div className={styles.coursesHeader}>
            <h2 className={styles.sectionTitle}>{t('home.catalogTitle')}</h2>
          </div>
          <div className={styles.cards}>
            {featured.map((course) => {
              const purchased = hasPurchased(course.id)
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
                    {purchased && <span className={styles.cardPercent}>{percent}% {t('courses.completed')}</span>}
                  </div>
                  <h3 className={styles.cardTitle}>{title}</h3>
                  <p className={styles.cardDesc}>{shortDesc}</p>
                  <div className={styles.cardMeta}>
                    <span>{duration}</span>
                    <span className={styles.cardPrice}>{(course.priceEur ?? Math.round(course.price / 100))} €</span>
                  </div>
                </Link>
              )
            })}
          </div>
          <div className={styles.moreWrap}>
            <Link to="/courses" className={styles.moreLink}>
              {t('home.allCourses')}
            </Link>
          </div>
        </div>
      </section>

      <section className={`${styles.blog} ${styles.animateSection}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>{t('home.blogTitle')}</h2>
          <p className={styles.sectionDesc}>{t('home.blogDesc')}</p>
          <div className={styles.blogGrid}>
            {blogPreview.map((post) => (
              <Link to={`/blog/${post.slug}`} key={post.id} className={styles.blogCard}>
                <span className={styles.blogCategory}>{getPostCategory(post)}</span>
                <h3 className={styles.blogCardTitle}>{getPostTitle(post)}</h3>
                <p className={styles.blogExcerpt}>{getPostExcerpt(post)}</p>
                <span className={styles.blogLink}>{t('home.readMore')}</span>
              </Link>
            ))}
          </div>
          <div className={styles.moreWrap}>
            <Link to="/blog" className={styles.moreLink}>{t('home.allBlogPosts')}</Link>
          </div>
        </div>
      </section>

      <section className={`${styles.teamSection} ${styles.animateSection}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>{t('home.teamTitle')}</h2>
          <div className={styles.teamGrid}>
            <div className={styles.teamCard}>
              <span className={styles.teamCardIcon}>👨‍💻</span>
              <h3 className={styles.teamCardTitle}>{t('home.teamCreators')}</h3>
              <p className={styles.teamCardText}>{t('home.teamCreatorsDesc')}</p>
            </div>
            <div className={styles.teamCard}>
              <span className={styles.teamCardIcon}>📈</span>
              <h3 className={styles.teamCardTitle}>{t('home.teamSeo')}</h3>
              <p className={styles.teamCardText}>{t('home.teamSeoDesc')}</p>
            </div>
            <div className={styles.teamCard}>
              <span className={styles.teamCardIcon}>🎓</span>
              <h3 className={styles.teamCardTitle}>{t('home.teamMentors')}</h3>
              <p className={styles.teamCardText}>{t('home.teamMentorsDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.ctaBlock} ${styles.animateSection}`}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>{t('home.ctaTitle')}</h2>
          <p className={styles.ctaText}>{t('home.ctaText')}</p>
          <Link to="/courses" className={styles.ctaButtonGradient}>
            {t('home.toCatalog')}
          </Link>
        </div>
      </section>
    </>
  )
}
