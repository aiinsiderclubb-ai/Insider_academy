import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../context/ProgressContext'
import { useLanguage } from '../context/LanguageContext'
import { useCourses } from '../context/CoursesContext'
import { getBlogPosts, fetchBlogPosts } from '../api/blogStore'
import { getBlogPostLocalized } from '../data/blog'
import { localizePath } from '../routing/locale'
import { SOCIAL_PROOF } from '../data/courseLanding'
import { getCourseField, getCourseDescription, formatCourseDuration } from '../data/courses'
import { api, checkApiOnline } from '../api/client'
import { UiIcon } from '../components/UiIcon'
import { ScrollReveal } from '../components/ScrollReveal'
import { StaggerReveal } from '../components/StaggerReveal'
import { CountUp } from '../components/CountUp'
import { TelegramWidget } from '../components/TelegramWidget'
import { CourseCatalogCard } from '../components/CourseCatalogCard'
import { useTheme } from '../context/ThemeContext'
import { HomeSuperOffer } from '../components/HomeSuperOffer'
import { MembershipsSection } from '../components/MembershipsSection'
import { HomeProductsSection } from '../components/HomeProductsSection'
import { HomeCertificatesSection } from '../components/HomeCertificatesSection'
import { HomeReviewsSection } from '../components/HomeReviewsSection'
import { PlatformBridge } from '../components/PlatformBridge'
import { TELEGRAM_COMMUNITY, TELEGRAM_MANAGER } from '../data/siteLinks'
import { PageMeta } from '../components/PageMeta'
import { ContinueLearningPanel } from '../components/ContinueLearningPanel'
import { ActivityFeed } from '../components/ActivityFeed'
import { WeeklyChallenge } from '../components/WeeklyChallenge'
import { RecommendationsStrip } from '../components/RecommendationsStrip'
import { buildCommunityFeed } from '../data/activityFeed'
import { getPersonalUpsells } from '../data/marketplace/recommendations'
import { hasClubMembership } from '../data/club'
import { MARKETPLACE_CREATORS } from '../data/marketplace/creators'
import { HeroShowcase } from '../components/HeroShowcase'
import { EditorialPosts } from '../components/EditorialPosts'
import styles from './Home.module.css'

/** Свежие посты с доступной локализованной метаинформацией. */
function pickBlogPreview(posts, lang) {
  const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date))
  const matched = sorted.filter((post) => {
    const localized = getBlogPostLocalized(post, lang)
    return localized.title && localized.excerpt
  })
  return (matched.length > 0 ? matched : sorted).slice(0, 3)
}

export function Home() {
  const { user, hasPurchased, purchases } = useAuth()
  const { getPercent } = useProgress()
  const { t, lang } = useLanguage()
  const { theme } = useTheme()
  const { courses, freeCourses, paidCourses, acceleratorCourse, loading } = useCourses()
  const [userStats, setUserStats] = useState(null)
  const [feedItems, setFeedItems] = useState(() => buildCommunityFeed({ lang }))
  const [blogPreview, setBlogPreview] = useState(() => pickBlogPreview(getBlogPosts(), lang))

  useEffect(() => {
    fetchBlogPosts().then((posts) => {
      setBlogPreview(pickBlogPreview(posts, lang))
    })
  }, [lang])

  useEffect(() => {
    checkApiOnline().then(async (ok) => {
      if (!ok) {
        setFeedItems(buildCommunityFeed({ lang }))
        return
      }
      try {
        const list = await api.getGiveaways()
        const map = {}
        list.forEach((g) => { map[g.slug] = g.participantCount })
        setFeedItems(buildCommunityFeed({ giveawayCounts: map, lang }))
      } catch (_) {
        setFeedItems(buildCommunityFeed({ lang }))
      }
    })
  }, [lang])

  useEffect(() => {
    if (!user) return
    checkApiOnline().then(async (ok) => {
      if (!ok) return
      try {
        setUserStats(await api.getStats())
      } catch (_) {}
    })
  }, [user])

  const streakCurrent = userStats?.streak?.current || 0
  const activeCourses = purchases?.filter((p) => {
    const course = courses.find((c) => c.id === p.id)
    const pct = getPercent(p.id, course?.lessons?.length ?? 0)
    return pct > 0 && pct < 100
  }).length || 0
  const avgProgress = userStats?.chart?.length
    ? Math.round(userStats.chart.reduce((s, r) => s + r.percent, 0) / userStats.chart.length)
    : null
  const achievementsCount = userStats?.achievements?.length || 0
  const flagshipCourse = (paidCourses || []).find((c) => c.id === 'ai-agent-engineer')
    || (paidCourses || [])[0]
    || null
  const otherPaid = (paidCourses || []).filter((c) => c.id !== flagshipCourse?.id)
  const flagshipLesson = flagshipCourse?.lessons?.[0]

  return (
    <div className={styles.page}>
      <PageMeta
        title={lang === 'ru' ? 'AI Insider Academy' : 'AI Insider Academy'}
        description={t('home.heroDesc')}
        path="/"
      />

      <section className={`${styles.hero} ${styles.bandBase} ${styles.stage}`}>
        <div className={styles.heroBg} />
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <div className={styles.stageBadge}>
              <span className={styles.stageBadgeMain}>
                <UiIcon name="sparkles" size={14} />
                {lang === 'ru' ? 'Academy' : 'Academy'}
              </span>
              <span className={styles.stageBadgeMeta}>{t('home.heroPill')}</span>
            </div>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroLine} style={{ '--line-delay': '0ms' }}>
                <span className={styles.heroTitleWhite}>{t('home.heroTitle1')}</span>
              </span>
              <span className={styles.heroLine} style={{ '--line-delay': '80ms' }}>
                <span className={styles.heroTitleAccent}>{t('home.heroTitle2')}</span>
              </span>
            </h1>
            <p className={`${styles.heroDesc} ${styles.heroEnter} ${styles.heroEnterDelay2}`}>
              {t('home.heroDesc')}
            </p>
            <p className={`${styles.heroDescNote} ${styles.heroEnter} ${styles.heroEnterDelay2}`}>
              {t('home.heroDescNote')}
            </p>
            <div className={`${styles.heroActions} ${styles.heroEnter} ${styles.heroEnterDelay3}`}>
              <Link to="/courses" className={styles.ctaPrimary}>
                {t('home.toCatalog')}
              </Link>
              <Link to="/courses" className={styles.ctaSecondary}>
                <UiIcon name="play" size={14} />
                {t('home.learnMore')}
              </Link>
            </div>
            <ul className={`${styles.heroBenefits} ${styles.heroEnter} ${styles.heroEnterDelay3}`}>
              <li className={styles.benefitItem}>
                <UiIcon name="check" size={14} tone="accent" />
                <span>{t('home.benefit1')}</span>
              </li>
              <li className={styles.benefitItem}>
                <UiIcon name="check" size={14} tone="accent" />
                <span>{t('home.benefit2')}</span>
              </li>
              <li className={styles.benefitItem}>
                <UiIcon name="check" size={14} tone="accent" />
                <span>{t('home.benefit3')}</span>
              </li>
            </ul>
            <a
              href={TELEGRAM_COMMUNITY}
              target="_blank"
              rel="noreferrer noopener"
              className={`${styles.telegramCta} ${styles.heroEnter} ${styles.heroEnterDelay3}`}
            >
              {t('home.telegramSubscribe')}
            </a>
          </div>
          <div className={`${styles.heroPreview} ${styles.heroEnter} ${styles.heroEnterDelay2}`}>
            <HeroShowcase lang={lang} />
          </div>
        </div>
      </section>

      <ScrollReveal as="section" className={`${styles.statsStrip} ${styles.bandSurface} ${styles.stage}`}>
        <div className={styles.container}>
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <CountUp value={SOCIAL_PROOF.courses} className={styles.statValue} />
              <span className={styles.statLabel}>{lang === 'ru' ? 'курсов' : 'courses'}</span>
            </div>
            <div className={styles.statItem}>
              <CountUp value={SOCIAL_PROOF.lessons} className={styles.statValue} />
              <span className={styles.statLabel}>{lang === 'ru' ? 'уроков' : 'lessons'}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{SOCIAL_PROOF.community}</span>
              <span className={styles.statLabel}>
                {lang === 'ru' ? SOCIAL_PROOF.communityLabelRu : SOCIAL_PROOF.communityLabelEn}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{lang === 'ru' ? '24ч' : '24h'}</span>
              <span className={styles.statLabel}>
                {lang === 'ru' ? 'выдача сертификата после Pro-курса' : 'certificate issued after a Pro course'}
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <HomeSuperOffer course={acceleratorCourse} lang={lang} />

      {user && (
        <section className={`${styles.continueSection} ${styles.bandBase} ${styles.stage}`}>
          <div className={styles.container}>
            <ContinueLearningPanel streakCurrent={streakCurrent} />
          </div>
        </section>
      )}

      {user && userStats && (
        <ScrollReveal>
          <section className={`${styles.userStatsSection} ${styles.bandSurface} ${styles.stage}`}>
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
                    {lang === 'ru' ? 'Кабинет' : 'Dashboard'}
                    <ArrowRight size={14} strokeWidth={1.8} aria-hidden style={{ marginLeft: 6, verticalAlign: '-0.15em' }} />
                  </Link>
                </div>

                <div className={styles.progressPanelGrid}>
                  <div className={styles.progressMetrics}>
                    <article className={styles.metricCard}>
                      <span className={styles.metricIcon} aria-hidden>
                        <UiIcon name="bookOpen" variant="box" tone="accent" />
                      </span>
                      <span className={styles.metricValue}>{activeCourses}</span>
                      <span className={styles.metricLabel}>
                        {lang === 'ru' ? 'курсов в процессе' : 'courses in progress'}
                      </span>
                    </article>
                    <article className={styles.metricCard}>
                      <span className={styles.metricIcon} aria-hidden>
                        <UiIcon name="trendingUp" variant="box" tone="accent" />
                      </span>
                      <span className={styles.metricValue}>{avgProgress ?? 0}%</span>
                      <span className={styles.metricLabel}>
                        {lang === 'ru' ? 'средний прогресс' : 'avg. progress'}
                      </span>
                    </article>
                    <article className={styles.metricCard}>
                      <span className={styles.metricIcon} aria-hidden>
                        <UiIcon name="trophy" variant="box" tone="accent" />
                      </span>
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

      <ScrollReveal as="section" className={`${styles.whatIncluded} ${user && userStats ? styles.bandBase : styles.bandSurface} ${styles.stage}`}>
        <div className={styles.container}>
          <div className={styles.stageIntro}>
            <div className={styles.stageBadge}>
              <span className={styles.stageBadgeMain}>
                <UiIcon name="sparkles" size={14} />
                Learning flow
              </span>
              <span className={styles.stageBadgeMeta}>
                {lang === 'ru' ? '3 шага до результата' : '3 steps to results'}
              </span>
            </div>
            <h2 className={styles.stageTitle}>{t('home.whatIncludedTitle')}</h2>
            <p className={styles.stageDesc}>
              {lang === 'ru'
                ? 'От урока к практике, проверке и сертификату — всё собрано в понятный путь обучения.'
                : 'From lesson to practice, review and certificate — a clear learning path in one place.'}
            </p>
          </div>
          <StaggerReveal as="ol" className={`${styles.stepper} ${styles.featureGrid}`} stagger={60}>
            <li className={`${styles.step} ${styles.featureCard}`}>
              <div className={styles.featureCardTop}>
                <span className={styles.featureIcon} aria-hidden>
                  <UiIcon name="check" size={14} />
                </span>
                <span className={styles.featureLabel}>{lang === 'ru' ? 'Шаг 01' : 'Step 01'}</span>
              </div>
              <h3 className={styles.featureTitle}>{t('home.support247')}</h3>
              <p className={styles.featureText}>{t('home.support247Desc')}</p>
            </li>
            <li className={`${styles.step} ${styles.featureCard}`}>
              <div className={styles.featureCardTop}>
                <span className={styles.featureIcon} aria-hidden>
                  <UiIcon name="check" size={14} />
                </span>
                <span className={styles.featureLabel}>{lang === 'ru' ? 'Шаг 02' : 'Step 02'}</span>
              </div>
              <h3 className={styles.featureTitle}>{t('home.checkingTasks')}</h3>
              <p className={styles.featureText}>{t('home.checkingTasksDesc')}</p>
            </li>
            <li className={`${styles.step} ${styles.featureCard}`}>
              <div className={styles.featureCardTop}>
                <span className={styles.featureIcon} aria-hidden>
                  <UiIcon name="check" size={14} />
                </span>
                <span className={styles.featureLabel}>{lang === 'ru' ? 'Шаг 03' : 'Step 03'}</span>
              </div>
              <h3 className={styles.featureTitle}>{t('home.certificates')}</h3>
              <p className={styles.featureText}>{t('home.certificatesDesc')}</p>
            </li>
          </StaggerReveal>

          <div className={styles.supportStrip}>
            <span className={styles.supportIcon} aria-hidden>
              <UiIcon name="headphones" tone="inherit" />
            </span>
            <div className={styles.supportBody}>
              <strong>{t('home.support247')}</strong>
              <span>{t('home.support247Desc')}</span>
            </div>
            <a
              className={styles.supportBtn}
              href={TELEGRAM_MANAGER}
              target="_blank"
              rel="noreferrer noopener"
            >
              {lang === 'ru' ? 'Задать вопрос' : 'Ask a question'}
            </a>
          </div>
        </div>
      </ScrollReveal>

      <HomeCertificatesSection lang={lang} />

      <ScrollReveal as="section" className={`${styles.courses} ${styles.bandSurface} ${styles.stage}`}>
        <div className={styles.container}>
          <div className={styles.stageIntro}>
            <div className={styles.stageBadge}>
              <span className={styles.stageBadgeMain}>
                <UiIcon name="sparkles" size={14} />
                Pro
              </span>
              <span className={styles.stageBadgeMeta}>
                {lang === 'ru' ? 'Платные программы' : 'Paid programs'}
              </span>
            </div>
            <h2 className={styles.stageTitle}>
              {lang === 'ru' ? 'Платные программы' : 'Paid programs'}
            </h2>
            <p className={styles.stageDesc}>
              {lang === 'ru' ? 'Видео, домашние задания и сертификат.' : 'Video lessons, homework, and certificate.'}
            </p>
          </div>
          <StaggerReveal className={styles.bento} stagger={60}>
            {flagshipCourse && (
              <article className={styles.bentoFeatured}>
                <div className={styles.bentoFeaturedMedia}>
                  <CourseCatalogCard
                    course={flagshipCourse}
                    lang={lang}
                    theme={theme}
                    purchased={hasPurchased(flagshipCourse.id)}
                    percent={getPercent(flagshipCourse.id, flagshipCourse.lessons?.length ?? 0)}
                    completedLabel={t('courses.completed')}
                    featured
                    mediaOnly
                  />
                </div>
                <div className={styles.bentoFeaturedCopy}>
                  <span className={styles.bentoEyebrow}>{lang === 'ru' ? 'Флагман' : 'Flagship'}</span>
                  <h3 className={styles.bentoTitle}>{getCourseField(flagshipCourse, 'title', lang)}</h3>
                  <p className={styles.bentoDesc}>{getCourseDescription(flagshipCourse, lang)}</p>
                  {flagshipLesson && (
                    <div className={styles.lessonPreview}>
                      <span className={styles.lessonPreviewLabel}>
                        {lang === 'ru' ? 'Превью урока' : 'Lesson preview'}
                      </span>
                      <strong>
                        1. {lang === 'en' && flagshipLesson.titleEn ? flagshipLesson.titleEn : flagshipLesson.title}
                      </strong>
                      <span className={styles.lessonPreviewMeta}>{formatCourseDuration(flagshipCourse, lang)}</span>
                    </div>
                  )}
                  <Link to={`/courses/${flagshipCourse.slug}`} className={styles.ctaPrimary}>
                    {lang === 'ru' ? 'Смотреть программу' : 'View program'}
                  </Link>
                </div>
              </article>
            )}
            {(loading ? [] : otherPaid).map((course) => (
              <div key={course.id} className={styles.bentoCell}>
                <CourseCatalogCard
                  course={course}
                  lang={lang}
                  theme={theme}
                  purchased={hasPurchased(course.id)}
                  percent={getPercent(course.id, course.lessons?.length ?? 0)}
                  completedLabel={t('courses.completed')}
                />
              </div>
            ))}
          </StaggerReveal>
          <div className={styles.moreWrap}>
            <Link to="/courses" className={styles.moreLink}>
              {t('home.allCourses')}
            </Link>
          </div>
        </div>
      </ScrollReveal>

      <HomeReviewsSection lang={lang} />

      <section className={`${styles.communitySection} ${styles.bandSurface} ${styles.stage}`}>
        <div className={styles.container}>
          <div className={styles.communityGrid}>
            <ActivityFeed items={feedItems} lang={lang} />
            <WeeklyChallenge
              lang={lang}
              email={user?.email}
              hasPriority={hasClubMembership(purchases)}
            />
          </div>
        </div>
      </section>

      <HomeProductsSection lang={lang} hasPurchased={hasPurchased} />

      {user && (() => {
        const { products: recs, seed } = getPersonalUpsells({ purchases, limit: 4 })
        if (!recs.length) return null
        const reason = seed
          ? (lang === 'ru'
            ? `Раз вы смотрите «${seed.titleRu}» — усильте результат этими пакетами${hasClubMembership(purchases) ? ' (−10% Club)' : ''}`
            : `Since you explore “${seed.titleEn}” — amplify with these packs${hasClubMembership(purchases) ? ' (Club −10%)' : ''}`)
          : (lang === 'ru'
            ? 'Подборка под ваши курсы и покупки'
            : 'Picked for your courses and purchases')
        return (
          <section className={`${styles.recsSection} ${styles.stage}`}>
            <div className={styles.container}>
              <RecommendationsStrip
                products={recs}
                lang={lang}
                purchases={purchases}
                hasPurchased={hasPurchased}
                reason={reason}
              />
            </div>
          </section>
        )
      })()}

      <MembershipsSection lang={lang} compact />

      <ScrollReveal as="section" className={`${styles.tryNow} ${styles.bandBase} ${styles.stage}`}>
        <div className={styles.container}>
          <div className={styles.stageIntro}>
            <div className={styles.stageBadge}>
              <span className={styles.stageBadgeMain}>
                <UiIcon name="sparkles" size={14} />
                {lang === 'ru' ? 'Бесплатно' : 'Free'}
              </span>
              <span className={styles.stageBadgeMeta}>
                {lang === 'ru' ? '3 вводных урока' : '3 intro lessons'}
              </span>
            </div>
            <h2 className={styles.stageTitle}>{lang === 'ru' ? 'Начните бесплатно' : 'Start for free'}</h2>
            <p className={styles.stageDesc}>{t('home.tryNowDesc')}</p>
          </div>
          <StaggerReveal className={styles.cards} stagger={60}>
            {(loading ? [] : freeCourses).map((course) => (
              <CourseCatalogCard
                key={course.id}
                course={course}
                lang={lang}
                theme={theme}
                actionLabel={t('home.tryNowWatch')}
              />
            ))}
          </StaggerReveal>
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className={`${styles.blog} ${styles.bandSurface} ${styles.stage}`}>
        <div className={styles.container}>
          <div className={styles.stageIntro}>
            <div className={styles.stageBadge}>
              <span className={styles.stageBadgeMain}>
                <UiIcon name="sparkles" size={14} />
                Blog
              </span>
              <span className={styles.stageBadgeMeta}>
                {lang === 'ru' ? 'Свежие материалы' : 'Fresh reads'}
              </span>
            </div>
            <h2 className={styles.stageTitle}>{t('home.blogTitle')}</h2>
            <p className={styles.stageDesc}>{t('home.blogDesc')}</p>
          </div>
          {blogPreview.length > 0 && (
            <StaggerReveal className={styles.blogGrid} stagger={60}>
              {blogPreview.map((post) => (
                <Link to={`/blog/${post.slug}`} key={post.id} className={styles.blogCard}>
                  <span className={styles.blogCategory}>{getPostCategory(post)}</span>
                  <h3 className={styles.blogCardTitle}>{getPostTitle(post)}</h3>
                  <p className={styles.blogExcerpt}>{getPostExcerpt(post)}</p>
                  <span className={styles.blogLink}>{t('home.readMore')}</span>
                </Link>
              ))}
            </StaggerReveal>
          )}
          <div className={styles.moreWrap}>
            <Link to="/blog" className={styles.moreLink}>{t('home.allBlogPosts')}</Link>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className={`${styles.teamSection} ${styles.bandBase} ${styles.stage}`}>
        <div className={styles.container}>
          <div className={styles.stageIntro}>
            <div className={styles.stageBadge}>
              <span className={styles.stageBadgeMain}>
                <UiIcon name="sparkles" size={14} />
                {lang === 'ru' ? 'Команда' : 'Team'}
              </span>
              <span className={styles.stageBadgeMeta}>
                {lang === 'ru' ? 'Кто ведёт Academy' : 'Who runs Academy'}
              </span>
            </div>
            <h2 className={styles.stageTitle}>{t('home.teamTitle')}</h2>
          </div>
          <StaggerReveal className={`${styles.teamGrid} ${styles.featureGrid}`} stagger={60}>
            <div className={`${styles.teamCard} ${styles.featureCard}`}>
              <div className={styles.featureCardTop}>
                <span className={styles.featureIcon} aria-hidden>
                  <UiIcon name="check" size={14} />
                </span>
                <span className={styles.featureLabel}>{lang === 'ru' ? 'Роль 01' : 'Role 01'}</span>
              </div>
              <h3 className={styles.featureTitle}>{t('home.teamCreators')}</h3>
              <p className={styles.featureText}>{t('home.teamCreatorsDesc')}</p>
            </div>
            <div className={`${styles.teamCard} ${styles.featureCard}`}>
              <div className={styles.featureCardTop}>
                <span className={styles.featureIcon} aria-hidden>
                  <UiIcon name="check" size={14} />
                </span>
                <span className={styles.featureLabel}>{lang === 'ru' ? 'Роль 02' : 'Role 02'}</span>
              </div>
              <h3 className={styles.featureTitle}>{t('home.teamSeo')}</h3>
              <p className={styles.featureText}>{t('home.teamSeoDesc')}</p>
            </div>
            <div className={`${styles.teamCard} ${styles.featureCard}`}>
              <div className={styles.featureCardTop}>
                <span className={styles.featureIcon} aria-hidden>
                  <UiIcon name="check" size={14} />
                </span>
                <span className={styles.featureLabel}>{lang === 'ru' ? 'Роль 03' : 'Role 03'}</span>
              </div>
              <h3 className={styles.featureTitle}>{t('home.teamMentors')}</h3>
              <p className={styles.featureText}>{t('home.teamMentorsDesc')}</p>
            </div>
          </StaggerReveal>
        </div>
      </ScrollReveal>

      <PlatformBridge lang={lang} />

      <div className={styles.container}>
        <TelegramWidget lang={lang} />
      </div>

      <ScrollReveal>
      <section className={`${styles.ctaBlock} ${styles.bandSurface} ${styles.stage}`}>
        <div className={styles.container}>
          <div className={styles.stageIntro}>
            <div className={styles.stageBadge}>
              <span className={styles.stageBadgeMain}>
                <UiIcon name="sparkles" size={14} />
                Start
              </span>
              <span className={styles.stageBadgeMeta}>
                {lang === 'ru' ? 'Готовы начать?' : 'Ready to start?'}
              </span>
            </div>
            <h2 className={styles.stageTitle}>{t('home.ctaTitle')}</h2>
            <p className={styles.stageDesc}>{t('home.ctaText')}</p>
            <div className={styles.stageActions}>
              <Link to="/courses" className={styles.ctaPrimary}>
                {t('home.toCatalog')}
              </Link>
            </div>
          </div>
        </div>
      </section>
      </ScrollReveal>
    </div>
  )
}
