import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../context/ProgressContext'
import { useLanguage } from '../context/LanguageContext'
import { useCourses } from '../context/CoursesContext'
import { getBlogPosts, fetchBlogPosts } from '../api/blogStore'
import { SOCIAL_PROOF } from '../data/courseLanding'
import { api, checkApiOnline } from '../api/client'
import { NeuronGlow } from '../components/NeuronGlow'
import { ScrollReveal } from '../components/ScrollReveal'
import { TelegramWidget } from '../components/TelegramWidget'
import { ThemePreview } from '../components/ThemePreview'
import { CourseCatalogCard } from '../components/CourseCatalogCard'
import { useTheme } from '../context/ThemeContext'
import { HomeSuperOffer } from '../components/HomeSuperOffer'
import { MembershipsSection } from '../components/MembershipsSection'
import { HomeProductsSection } from '../components/HomeProductsSection'
import { HomeCertificatesSection } from '../components/HomeCertificatesSection'
import { HomeReviewsSection } from '../components/HomeReviewsSection'
import { PlatformBridge } from '../components/PlatformBridge'
import { TELEGRAM_COMMUNITY } from '../data/siteLinks'
import { IconStar, IconUsers, IconAward } from '../components/Icons'
import { PageMeta } from '../components/PageMeta'
import { ContinueLearningBar } from '../components/ContinueLearningBar'
import styles from './Home.module.css'

export function Home() {
  const { user, hasPurchased, purchases } = useAuth()
  const { getPercent } = useProgress()
  const { t, lang } = useLanguage()
  const { theme } = useTheme()
  const { courses, freeCourses, paidCourses, acceleratorCourse, loading } = useCourses()
  const [userStats, setUserStats] = useState(null)
  const [blogPreview, setBlogPreview] = useState(() =>
    [...getBlogPosts()].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3)
  )

  useEffect(() => {
    fetchBlogPosts().then((posts) => {
      setBlogPreview([...posts].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3))
    })
  }, [])

  useEffect(() => {
    if (!user) return
    checkApiOnline().then(async (ok) => {
      if (!ok) return
      try {
        setUserStats(await api.getStats())
      } catch (_) {}
    })
  }, [user])

  const getPostTitle = (post) => (lang === 'en' && post.titleEn ? post.titleEn : post.title)
  const getPostExcerpt = (post) => (lang === 'en' && post.excerptEn ? post.excerptEn : post.excerpt)
  const getPostCategory = (post) => (lang === 'en' && post.categoryEn ? post.categoryEn : post.category)

  const streakCurrent = userStats?.streak?.current || 0
  const streakGoal = 7
  const streakProgress = Math.min(100, Math.round((streakCurrent / streakGoal) * 100))
  const activeCourses = purchases?.filter((p) => {
    const course = courses.find((c) => c.id === p.id)
    const pct = getPercent(p.id, course?.lessons?.length ?? 0)
    return pct > 0 && pct < 100
  }).length || 0
  const avgProgress = userStats?.chart?.length
    ? Math.round(userStats.chart.reduce((s, r) => s + r.percent, 0) / userStats.chart.length)
    : null
  const achievementsCount = userStats?.achievements?.length || 0

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
          <p className={styles.heroDescNote}>{t('home.heroDescNote')}</p>
          <div className={styles.heroActions}>
            <Link to="/courses" className={styles.ctaPrimary}>
              {t('home.toCatalog')}
              <span className={styles.ctaArrow} aria-hidden>→</span>
            </Link>
            <Link to="/courses" className={styles.ctaSecondary}>
              {t('home.learnMore')}
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
          <a href={TELEGRAM_COMMUNITY} target="_blank" rel="noreferrer noopener" className={styles.telegramCta}>
            {t('home.telegramSubscribe')}
          </a>
        </div>
      </section>

      <HomeSuperOffer course={acceleratorCourse} lang={lang} />

      <section className={styles.statsStrip}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <IconUsers />
              <span className={styles.statValue}>{SOCIAL_PROOF.students}+</span>
              <span className={styles.statLabel}>{lang === 'ru' ? 'Студентов' : 'Students'}</span>
            </div>
            <div className={styles.statCard}>
              <IconStar />
              <span className={styles.statValue}>{SOCIAL_PROOF.rating}</span>
              <span className={styles.statLabel}>{lang === 'ru' ? 'Средний рейтинг' : 'Avg. rating'}</span>
            </div>
            <div className={styles.statCard}>
              <IconAward />
              <span className={styles.statValue}>{SOCIAL_PROOF.certificates}+</span>
              <span className={styles.statLabel}>{lang === 'ru' ? 'Сертификатов' : 'Certificates'}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{courses.length}</span>
              <span className={styles.statLabel}>{lang === 'ru' ? 'Курсов' : 'Courses'}</span>
            </div>
          </div>
        </div>
      </section>

      {user && (
        <section className={styles.continueSection}>
          <div className={styles.container}>
            <ContinueLearningBar />
          </div>
        </section>
      )}

      <HomeReviewsSection lang={lang} />

      {user && userStats && (
        <ScrollReveal>
          <section className={styles.userStatsSection}>
            <div className={styles.container}>
              <div className={styles.progressPanel}>
                <div className={styles.progressPanelHead}>
                  <div>
                    <h2 className={styles.progressPanelTitle}>
                      {lang === 'ru' ? 'Ваш прогресс' : 'Your progress'}
                    </h2>
                    <p className={styles.progressPanelDesc}>
                      {lang === 'ru'
                        ? 'Серия входов, курсы и награды — в одном месте'
                        : 'Streak, courses and achievements at a glance'}
                    </p>
                  </div>
                  <Link to="/cabinet" className={styles.progressPanelLink}>
                    {lang === 'ru' ? 'Кабинет →' : 'Dashboard →'}
                  </Link>
                </div>

                <div className={styles.progressPanelGrid}>
                  <article className={styles.streakCard}>
                    <div className={styles.streakCardVisual}>
                      <div
                        className={styles.streakRing}
                        style={{ '--streak-pct': `${streakProgress}%` }}
                        aria-hidden
                      >
                        <span className={styles.streakRingEmoji}>🔥</span>
                      </div>
                      <div className={styles.streakCardMain}>
                        <span className={styles.streakCardValue}>{streakCurrent}</span>
                        <span className={styles.streakCardLabel}>
                          {lang === 'ru' ? 'дней подряд' : 'day streak'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.streakCardGoal}>
                      <div className={styles.streakBarTrack}>
                        <div className={styles.streakBarFill} style={{ width: `${streakProgress}%` }} />
                      </div>
                      <span className={styles.streakGoalText}>
                        {streakCurrent >= streakGoal
                          ? (lang === 'ru' ? 'Цель 7 дней достигнута!' : '7-day goal reached!')
                          : (lang === 'ru'
                            ? `До цели 7 дней: ${streakGoal - streakCurrent}`
                            : `${streakGoal - streakCurrent} days to 7-day goal`)}
                      </span>
                    </div>
                  </article>

                  <div className={styles.progressMetrics}>
                    <article className={styles.metricCard}>
                      <span className={styles.metricIcon} aria-hidden>📚</span>
                      <span className={styles.metricValue}>{activeCourses}</span>
                      <span className={styles.metricLabel}>
                        {lang === 'ru' ? 'курсов в процессе' : 'courses in progress'}
                      </span>
                    </article>
                    <article className={styles.metricCard}>
                      <span className={styles.metricIcon} aria-hidden>📈</span>
                      <span className={styles.metricValue}>{avgProgress ?? 0}%</span>
                      <span className={styles.metricLabel}>
                        {lang === 'ru' ? 'средний прогресс' : 'avg. progress'}
                      </span>
                    </article>
                    <article className={styles.metricCard}>
                      <span className={styles.metricIcon} aria-hidden>🏆</span>
                      <span className={styles.metricValue}>{achievementsCount}</span>
                      <span className={styles.metricLabel}>
                        {lang === 'ru' ? 'наград' : 'achievements'}
                      </span>
                    </article>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      <section className={styles.whatIncluded}>
        <div className={styles.container}>
          <div className={styles.whatIncludedHead}>
            <span className={styles.sectionPill}>{lang === 'ru' ? 'Learning flow' : 'Learning flow'}</span>
            <h2 className={styles.sectionTitle}>{t('home.whatIncludedTitle')}</h2>
            <p className={styles.sectionDesc}>
              {lang === 'ru'
                ? 'От урока к практике, проверке и сертификату — всё собрано в понятный путь обучения.'
                : 'From lesson to practice, review and certificate — a clear learning path in one place.'}
            </p>
          </div>
          <div className={styles.whatIncludedGrid}>
            <div className={`${styles.whatIncludedCard} ${styles.whatIncludedCardActive}`}>
              <span className={`${styles.whatIncludedIcon} ${styles.whatIncludedIconSupport}`} aria-hidden />
              <span className={styles.flowStep}>01</span>
              <h3 className={styles.whatIncludedCardTitle}>{t('home.support247')}</h3>
              <p className={styles.whatIncludedCardText}>{t('home.support247Desc')}</p>
            </div>
            <div className={styles.whatIncludedCard}>
              <span className={`${styles.whatIncludedIcon} ${styles.whatIncludedIconCheck}`} aria-hidden />
              <span className={styles.flowStep}>02</span>
              <h3 className={styles.whatIncludedCardTitle}>{t('home.checkingTasks')}</h3>
              <p className={styles.whatIncludedCardText}>{t('home.checkingTasksDesc')}</p>
            </div>
            <div className={styles.whatIncludedCard}>
              <span className={`${styles.whatIncludedIcon} ${styles.whatIncludedIconCertificate}`} aria-hidden />
              <span className={styles.flowStep}>03</span>
              <h3 className={styles.whatIncludedCardTitle}>{t('home.certificates')}</h3>
              <p className={styles.whatIncludedCardText}>{t('home.certificatesDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      <HomeCertificatesSection lang={lang} />

      <section className={`${styles.courses} ${styles.animateSection}`}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionPillPaid}>{lang === 'ru' ? 'Pro' : 'Pro'}</span>
            <h2 className={styles.sectionTitle}>{lang === 'ru' ? 'Платные программы' : 'Paid programs'}</h2>
          </div>
          <p className={styles.sectionDesc}>
            {lang === 'ru' ? 'Видео, домашние задания и сертификат.' : 'Video lessons, homework, and certificate.'}
          </p>
          <div className={styles.cards}>
            {(loading ? [] : paidCourses).map((course) => (
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
          <div className={styles.moreWrap}>
            <Link to="/courses" className={styles.moreLink}>
              {t('home.allCourses')}
            </Link>
          </div>
        </div>
      </section>

      <HomeProductsSection lang={lang} hasPurchased={hasPurchased} />

      <MembershipsSection lang={lang} compact />

      <section className={`${styles.tryNow} ${styles.animateSection}`}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionPill}>{lang === 'ru' ? 'Бесплатно' : 'Free'}</span>
            <h2 className={styles.sectionTitle}>{lang === 'ru' ? 'Начните бесплатно' : 'Start for free'}</h2>
          </div>
          <p className={styles.sectionDesc}>{t('home.tryNowDesc')}</p>
          <div className={styles.cards}>
            {(loading ? [] : freeCourses).map((course) => (
              <CourseCatalogCard
                key={course.id}
                course={course}
                lang={lang}
                theme={theme}
                actionLabel={t('home.tryNowWatch')}
              />
            ))}
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

      <PlatformBridge lang={lang} />

      <div className={styles.container}>
        <TelegramWidget lang={lang} />
      </div>

      <ScrollReveal>
      <section className={styles.ctaBlock}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>{t('home.ctaTitle')}</h2>
          <p className={styles.ctaText}>{t('home.ctaText')}</p>
          <Link to="/courses" className={styles.ctaButtonGradient}>
            {t('home.toCatalog')}
          </Link>
        </div>
      </section>
      </ScrollReveal>
    </>
  )
}
