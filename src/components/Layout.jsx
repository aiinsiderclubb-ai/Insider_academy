import { lazy, Suspense, useState, useRef, useEffect } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { trackVisit } from '../api/adminStore'
import { useUserNotifications } from '../hooks/useUserNotifications'
import { api, checkApiOnline } from '../api/client'
import { ApiStatusBanner } from './ApiStatusBanner'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useCourses } from '../context/CoursesContext'
import { useProgress } from '../context/ProgressContext'
import { ScrollProgressBar } from './ScrollProgressBar'
import { InactivityBanner } from './InactivityBanner'
import { isRegistrationOnboardingDone } from '../utils/onboardingStorage'
import { ProgressRing } from './ProgressRing'
import { UiIcon } from './UiIcon'
import { MAIN_SITE_URL, TELEGRAM_COMMUNITY, TELEGRAM_MANAGER, TELEGRAM_NOTIFY_BOT } from '../data/siteLinks'
import { SITE_VERSION } from '../data/siteMeta'
import { localizePath, stripLocale } from '../routing/locale'
import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  ExternalLink,
  GraduationCap,
  Home as HomeIcon,
  LogIn,
  LogOut,
  Map,
  Menu,
  MessageCircle,
  Send,
  Newspaper,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import styles from './Layout.module.css'

const ChatBot = lazy(() => import('./ChatBot').then((module) => ({ default: module.ChatBot })))

const navItemsKeys = [
  { to: '/', labelKey: 'nav.home', Icon: HomeIcon },
  { to: '/courses', labelKey: 'nav.catalog', Icon: BookOpen },
  { to: '/learning-map', labelRu: 'Программы', labelEn: 'Programs', Icon: Map },
  { to: '/marketplace', labelKey: 'nav.marketplace', Icon: ShoppingBag },
  { to: '/memberships', labelKey: 'nav.memberships', Icon: Sparkles },
  { to: '/events', labelKey: 'nav.giveaway', Icon: Award },
  { to: '/blog', labelKey: 'nav.blog', Icon: Newspaper },
  { to: '/team', labelRu: 'Команда', labelEn: 'Team', Icon: Users },
  { to: '/cabinet', labelKey: 'nav.myCourses', Icon: GraduationCap, auth: true },
  { to: '/calendar', labelKey: 'nav.calendar', Icon: CalendarDays, auth: true },
]

const cabinetMenuKeys = [
  { to: '/account', labelKey: 'nav.accountSettings', icon: 'settings' },
  { to: '/cabinet', labelKey: 'nav.myCourses', icon: 'bookOpen' },
  { to: '/cabinet#certificates', labelKey: 'nav.myCertificates', icon: 'fileText' },
  { to: '/cabinet#challenge', labelKey: 'nav.challenge', icon: 'flag' },
  { to: '/cabinet#awards', labelKey: 'nav.awards', icon: 'trophy' },
  { to: '/cabinet#invite', labelKey: 'nav.inviteFriend', icon: 'gift' },
  { to: '/cabinet#support', labelKey: 'nav.support', icon: 'headphones' },
]

export function Layout({ children }) {
  const { user, logout, purchases } = useAuth()
  const { t, lang, setLang } = useLanguage()
  const { courses } = useCourses()
  const { getPercent } = useProgress()
  const location = useLocation()
  const navigate = useNavigate()
  const publicPath = stripLocale(location.pathname)
  const isHome = publicPath === '/'
  const [chatOpen, setChatOpen] = useState(false)
  const [chatTab, setChatTab] = useState('ai')
  const [cabinetOpen, setCabinetOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const [, forceUpdate] = useState(0)
  const cabinetRef = useRef(null)
  const notifRef = useRef(null)
  const { notifications, unreadCount: notifCount, markRead: markNotificationReadApi, markAllRead: markAllNotificationsReadApi } = useUserNotifications(user?.email)

  const navItems = navItemsKeys.map(({ labelKey, labelRu, labelEn, ...rest }) => ({
    ...rest,
    label: labelKey ? t(labelKey) : (lang === 'ru' ? labelRu : labelEn),
  }))
  const cabinetMenuItems = cabinetMenuKeys.map(({ labelKey, ...rest }) => ({ ...rest, label: t(labelKey) }))

  const [searchParams] = useSearchParams()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => setMobileNavOpen(false), [location.pathname, location.search])

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    checkApiOnline().then((ok) => {
      if (ok) api.trackVisit().catch(() => {})
      else trackVisit()
    })
  }, [])
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      try {
        sessionStorage.setItem('lms_pending_ref', ref)
      } catch (_) {}
    }
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
    const utm = {}
    utmKeys.forEach((k) => {
      const v = searchParams.get(k)
      if (v) utm[k] = v
    })
    if (Object.keys(utm).length) {
      try {
        sessionStorage.setItem('lms_utm', JSON.stringify(utm))
      } catch (_) {}
    }
  }, [searchParams])
  useEffect(() => {
    const close = (e) => {
      if (cabinetRef.current && !cabinetRef.current.contains(e.target)) setCabinetOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    if (cabinetOpen || notifOpen) {
      document.addEventListener('click', close)
      return () => document.removeEventListener('click', close)
    }
  }, [cabinetOpen, notifOpen])
  useEffect(() => {
    const syncAdminData = () => forceUpdate((v) => v + 1)
    window.addEventListener('lms-admin-data-updated', syncAdminData)
    window.addEventListener('storage', syncAdminData)
    return () => {
      window.removeEventListener('lms-admin-data-updated', syncAdminData)
      window.removeEventListener('storage', syncAdminData)
    }
  }, [])

  const overallProgress = user && purchases?.length
    ? Math.round(
        purchases.reduce((sum, p) => {
          const c = courses.find((x) => x.id === p.id)
          return sum + getPercent(p.id, c?.lessons?.length ?? 0)
        }, 0) / purchases.length
      )
    : 0

  const isAdminPage = publicPath === '/admin'
  const isAuthPage = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/onboarding'].includes(publicPath)
  const isLessonPage = /^\/courses\/[^/]+$/.test(publicPath) && searchParams.has('lesson')
  const isImmersive = isAdminPage || isAuthPage || isLessonPage
  const isMarketplaceProductShowcase = /^\/marketplace\/[^/]+$/.test(publicPath)
    && !publicPath.startsWith('/marketplace/creators')
  // Главная рисует собственный полноширинный канвас — убираем рамку паддингов main
  const isFullBleed = publicPath === '/'

  const isMarketplaceSection =
    publicPath.startsWith('/marketplace') || publicPath.startsWith('/vault')
  const isMarketplaceVaultActive =
    (publicPath === '/marketplace' && searchParams.get('tab') === 'vault')
    || publicPath.startsWith('/vault/')
  const isMarketplaceCatalogActive = isMarketplaceSection && !isMarketplaceVaultActive

  const openChat = (tab = 'ai') => {
    setChatTab(tab)
    setChatOpen(true)
  }

  const userInitial = user?.name?.[0] || user?.email?.[0] || '?'
  const pageTitle = (() => {
    if (publicPath === '/') return lang === 'ru' ? 'Школа AI-систем' : lang === 'ukr' ? 'Школа AI-систем' : 'AI systems school'
    if (publicPath.startsWith('/courses')) return lang === 'ru' ? 'Каталог курсов' : lang === 'ukr' ? 'Каталог курсів' : 'Course catalog'
    if (publicPath.startsWith('/marketplace') || publicPath.startsWith('/vault')) return 'Marketplace'
    if (publicPath.startsWith('/memberships')) return lang === 'ru' ? 'Подписки' : lang === 'ukr' ? 'Підписки' : 'Memberships'
    if (publicPath.startsWith('/cabinet')) return lang === 'ru' ? 'Панель обучения' : lang === 'ukr' ? 'Панель навчання' : 'Learning dashboard'
    if (publicPath.startsWith('/learning-map')) return lang === 'ru' ? 'Карта обучения' : lang === 'ukr' ? 'Карта навчання' : 'Learning map'
    if (publicPath.startsWith('/calendar')) return lang === 'ru' ? 'Календарь' : lang === 'ukr' ? 'Календар' : 'Calendar'
    if (publicPath.startsWith('/events')) return lang === 'ru' ? 'События' : lang === 'ukr' ? 'Події' : 'Events'
    if (publicPath.startsWith('/blog')) return t('blog.title')
    if (publicPath.startsWith('/account')) return lang === 'ru' ? 'Настройки профиля' : lang === 'ukr' ? 'Налаштування профілю' : 'Profile settings'
    return 'AI Insider Academy'
  })()

  const getNotificationTitle = (notification) => {
    if (notification.type === 'certificate_added') {
      return lang === 'ru' ? 'Сертификат добавлен' : 'Certificate added'
    }
    if (notification.type === 'homework_feedback') {
      if (notification.status === 'accepted') return lang === 'ru' ? 'ДЗ принято' : 'Homework accepted'
      if (notification.status === 'resubmit') return lang === 'ru' ? 'ДЗ на доработку' : 'Homework revision requested'
      return lang === 'ru' ? 'Ответ по ДЗ' : 'Homework feedback'
    }
    if (notification.type === 'review_status') {
      if (notification.status === 'approved') return lang === 'ru' ? 'Отзыв опубликован' : 'Review published'
      if (notification.status === 'rejected') return lang === 'ru' ? 'Отзыв отклонён' : 'Review declined'
      return lang === 'ru' ? 'Статус отзыва' : 'Review status'
    }
    if (notification.type === 'password_changed') {
      return lang === 'ru' ? 'Пароль изменён' : 'Password changed'
    }
    if (notification.type === 'application_status') {
      if (notification.status === 'accepted') return lang === 'ru' ? 'Заявка одобрена' : 'Application accepted'
      if (notification.status === 'rejected') return lang === 'ru' ? 'Заявка отклонена' : 'Application declined'
      if (notification.status === 'reviewed') return lang === 'ru' ? 'Заявка просмотрена' : 'Application reviewed'
      return lang === 'ru' ? 'Заявка на курс' : 'Course application'
    }
    if (notification.type === 'lesson_stale') {
      return lang === 'ru' ? 'Урок ждёт вас' : 'Lesson waiting'
    }
    if (notification.type === 'product_new') {
      return lang === 'ru' ? 'Новый продукт' : 'New product'
    }
    if (notification.type === 'giveaway_ending') {
      return lang === 'ru' ? 'Розыгрыш заканчивается' : 'Giveaway ending'
    }
    if (notification.type === 'certificate_ready') {
      return lang === 'ru' ? 'Сертификат готов' : 'Certificate ready'
    }
    return notification.type
  }

  const getNotificationIcon = (notification) => {
    if (notification.type === 'certificate_added' || notification.type === 'certificate_ready') return 'fileText'
    if (notification.type === 'homework_feedback') return 'penLine'
    if (notification.type === 'review_status') return 'star'
    if (notification.type === 'password_changed') return 'keyRound'
    if (notification.type === 'application_status') return 'graduationCap'
    if (notification.type === 'lesson_stale') return 'play'
    if (notification.type === 'product_new') return 'shoppingCart'
    if (notification.type === 'giveaway_ending') return 'gift'
    return 'bell'
  }

  const getNotificationBody = (notification) => {
    if (notification.message?.trim()) return notification.message.trim()
    const parts = [notification.courseTitle, notification.lessonTitle].filter(Boolean)
    return parts.join(' — ')
  }

  const formatNotificationTime = (dateStr) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return lang === 'ru' ? 'только что' : 'just now'
    if (mins < 60) return lang === 'ru' ? `${mins} мин назад` : `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return lang === 'ru' ? `${hours} ч назад` : `${hours}h ago`
    const days = Math.floor(hours / 24)
    return lang === 'ru' ? `${days} дн назад` : `${days}d ago`
  }

  const handleMarkAllNotificationsRead = async () => {
    await markAllNotificationsReadApi()
  }

  const resolveNotificationTarget = (notification) => {
    if (notification.targetPath) return notification.targetPath.startsWith('/courses') ? localizePath(notification.targetPath, lang) : notification.targetPath
    const course = courses.find((item) =>
      item.id === notification.courseId
      || item.slug === notification.courseSlug
      || item.title === notification.courseTitle
      || item.titleEn === notification.courseTitle
    )
    if (course) {
      const lessonPart = Number.isInteger(notification.lessonIndex) ? `?lesson=${notification.lessonIndex}` : ''
      return localizePath(`/courses/${course.slug}${lessonPart}`, lang)
    }
    return '/cabinet'
  }

  const handleNotificationClick = async (notification) => {
    await markNotificationReadApi(notification.id)
    setNotifOpen(false)
    navigate(resolveNotificationTarget(notification))
    window.dispatchEvent(new Event('lms-homework-refresh'))
  }

  const isOnboardingExemptPath = [
    '/onboarding',
    '/login',
    '/register',
    '/verify-email',
  ].includes(publicPath) || publicPath.startsWith('/giveaway/')

  const needsOnboarding = Boolean(
    user
    && !isRegistrationOnboardingDone()
    && !isOnboardingExemptPath
  )

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className={`${styles.wrapper} ${isImmersive ? styles.immersive : ''} ${isAdminPage ? styles.adminLayout : ''} ${isMarketplaceProductShowcase ? styles.productShowcaseLayout : ''}`}>
      {!isImmersive && (
        <>
          <button
            type="button"
            className={`${styles.mobileOverlay} ${mobileNavOpen ? styles.mobileOverlayVisible : ''}`}
            aria-label={lang === 'ru' ? 'Закрыть меню' : 'Close menu'}
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className={`${styles.sidebar} ${mobileNavOpen ? styles.sidebarOpen : ''}`}>
            <Link to={localizePath('/', lang)} className={styles.sidebarLogo} aria-label="AI Insider Academy">
              <span className={styles.brandMark}>AI</span>
              <span className={styles.brandName}>INSIDER<br />ACADEMY</span>
            </Link>
            <div className={styles.sidebarEyebrow}>{lang === 'ru' ? 'Платформа' : 'Platform'}</div>
            <nav className={styles.sidebarNav} aria-label={lang === 'ru' ? 'Основная навигация' : 'Main navigation'}>
              {navItems.map(({ to, label, Icon, auth }) => {
                if (auth && !user) return null
                const target = auth ? to : localizePath(to, lang)
                const isActive = to === '/'
                  ? publicPath === '/'
                  : publicPath.startsWith(to)
                return (
                  <Link key={to} to={target} className={`${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`}>
                    <span className={styles.sidebarIcon}><Icon size={19} strokeWidth={1.8} /></span>
                    <span className={styles.sidebarLabel}>{label}</span>
                    {isActive && <ChevronRight className={styles.activeArrow} size={15} />}
                  </Link>
                )
              })}
            </nav>

            <div className={styles.sidebarBottom}>
              <a className={styles.supportLink} href={TELEGRAM_MANAGER} target="_blank" rel="noreferrer noopener">
                <MessageCircle size={18} />
                <span>{lang === 'ru' ? 'Поддержка' : 'Support'}</span>
              </a>
              {user ? (
                <Link to="/account" className={styles.sidebarProfile}>
                  <span className={styles.sidebarAvatar}>{userInitial.toUpperCase()}</span>
                  <span className={styles.sidebarUserText}>
                    <strong>{user.name || (lang === 'ru' ? 'Мой профиль' : 'My profile')}</strong>
                    <small>{user.email}</small>
                  </span>
                  <Settings size={16} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className={styles.sidebarCta}>
                    {lang === 'ru' ? 'Начать бесплатно' : 'Start free'}
                    <ChevronRight size={17} />
                  </Link>
                  <Link to="/login" className={styles.sidebarLogin}>
                    <LogIn size={17} />
                    {t('nav.login')}
                  </Link>
                </>
              )}
              <div className={styles.sidebarProof}>
                <span className={styles.proofFaces} aria-hidden>
                  <i /><i /><i /><i />
                </span>
                <span><strong>6 000+</strong>{lang === 'ru' ? ' учатся с AI Insider' : ' learn with AI Insider'}</span>
              </div>
            </div>
          </aside>
        </>
      )}

      <div className={styles.mainWrap}>
        <ApiStatusBanner />
        {!isImmersive && <InactivityBanner lang={lang} />}
        {!isImmersive && (
          <header className={`${styles.header} ${headerScrolled ? styles.headerScrolled : ''} ${isMarketplaceProductShowcase ? styles.productShowcaseHeader : ''}`}>
            <span className={styles.headerGlowClip} aria-hidden>
              <span className={styles.headerGlow} />
            </span>
            <button type="button" className={styles.mobileMenu} onClick={() => setMobileNavOpen((value) => !value)} aria-expanded={mobileNavOpen}>
              {mobileNavOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
            <div className={styles.pageIdentity}>
              <span className={styles.pageIdentityEyebrow}>
                <span className={styles.pageIdentityDot} aria-hidden />
                {isMarketplaceProductShowcase ? 'AI INSIDER / MARKETPLACE' : (lang === 'ru' ? 'AI INSIDER / ОБУЧЕНИЕ' : 'AI INSIDER / LEARNING')}
              </span>
              {!isMarketplaceProductShowcase && <strong className={styles.pageIdentityTitle}>{pageTitle}</strong>}
            </div>
            <div className={styles.headerRight}>
              <div className={styles.langToggle} aria-label="Language">
                <button type="button" onClick={() => setLang('ru')} className={`${styles.langOption} ${lang === 'ru' ? styles.langActive : ''}`} aria-label="Русский">RU</button>
                <span className={styles.langDivider}>/</span>
                <button type="button" onClick={() => setLang('ukr')} className={`${styles.langOption} ${lang === 'ukr' ? styles.langActive : ''}`} aria-label="Українська">UKR</button>
                <span className={styles.langDivider}>/</span>
                <button type="button" onClick={() => setLang('en')} className={`${styles.langOption} ${lang === 'en' ? styles.langActive : ''}`} aria-label="English">EN</button>
              </div>
              <button type="button" className={styles.iconBtn} onClick={() => openChat('ai')} aria-label={t('nav.messages')}>
                <MessageCircle size={19} />
              </button>
              <div className={styles.notifWrap} ref={notifRef}>
                <button type="button" className={styles.iconBtn} onClick={() => setNotifOpen((value) => !value)} aria-label={t('nav.notifications')} aria-expanded={notifOpen}>
                  <Bell size={19} />
                  {notifCount > 0 && <span className={styles.badge}>{notifCount > 99 ? '99+' : notifCount}</span>}
                </button>
                {notifOpen && (
                  <div className={styles.notifDropdown}>
                    <div className={styles.notifDropdownHead}>
                      <span className={styles.notifDropdownTitle}>{t('nav.notifications')}</span>
                      {notifications.length > 0 && (
                        <button type="button" className={styles.notifMarkAll} onClick={handleMarkAllNotificationsRead} disabled={notifCount === 0}>
                          {lang === 'ru' ? 'Прочитать все' : 'Mark all read'}
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className={styles.notifEmpty}>{lang === 'ru' ? 'Пока нет уведомлений' : 'No notifications yet'}</div>
                    ) : (
                      <div className={styles.notifList}>
                        {notifications.map((notification) => {
                          const body = getNotificationBody(notification)
                          return (
                            <button key={notification.id} type="button" className={`${styles.notifItem} ${!notification.read ? styles.notifItemUnread : ''}`} onClick={() => handleNotificationClick(notification)}>
                              <span className={styles.notifItemIcon}><UiIcon name={getNotificationIcon(notification)} size={16} tone="accent" /></span>
                              <span className={styles.notifItemBody}>
                                <span className={styles.notifItemTop}>
                                  <span className={styles.notifItemTitle}>{getNotificationTitle(notification)}</span>
                                  {notification.date && <span className={styles.notifItemTime}>{formatNotificationTime(notification.date)}</span>}
                                </span>
                                {body && <span className={styles.notifItemText}>{body}</span>}
                              </span>
                              {!notification.read && <span className={styles.notifUnreadDot} />}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {user ? (
                <div className={styles.avatarWrap} ref={cabinetRef}>
                  <button type="button" className={styles.avatar} onClick={() => setCabinetOpen((value) => !value)} aria-expanded={cabinetOpen} aria-label={t('nav.cabinet')}>
                    <ProgressRing percent={overallProgress} size={40} stroke={2.5}>
                      {user.avatarUrl ? <img src={user.avatarUrl} alt="" className={styles.avatarImg} /> : <span className={styles.avatarInitial}>{userInitial.toUpperCase()}</span>}
                    </ProgressRing>
                  </button>
                  {cabinetOpen && (
                    <div className={styles.cabinetDropdown}>
                      <div className={styles.cabinetDropdownUser}>
                        <span className={styles.cabinetDropdownName}>{user.name || user.email}</span>
                        <span className={styles.cabinetDropdownEmail}>{user.email}</span>
                      </div>
                      {cabinetMenuItems.map((item) => (
                        <Link key={item.to} to={item.to} className={styles.cabinetDropdownItem} onClick={() => setCabinetOpen(false)}>
                          <UiIcon name={item.icon} size={16} tone="secondary" />
                          {item.label}
                        </Link>
                      ))}
                      <button type="button" className={styles.cabinetDropdownLogout} onClick={() => { setCabinetOpen(false); setChatOpen(false); logout() }}>
                        <LogOut size={16} />
                        {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className={styles.headerLogin}><CircleUserRound size={18} />{t('nav.login')}</Link>
              )}
            </div>
          </header>
        )}

        {!isAdminPage && <ScrollProgressBar />}
        <main className={`${styles.main} ${isImmersive ? styles.mainImmersive : ''} ${(isFullBleed || isMarketplaceProductShowcase) ? styles.mainFullBleed : ''}`}>{children}</main>

        {!isImmersive && (
          <footer className={styles.footer}>
            <div className={styles.footerGlow} aria-hidden />
            <div className={styles.footerTop}>
              <div className={styles.footerBrandCol}>
                <div className={styles.footerBrand}>
                  <span className={styles.brandMark}>AI</span>
                  <span className={styles.brandName}>INSIDER<br />ACADEMY</span>
                </div>
                <p className={styles.footerTagline}>
                  {lang === 'ru'
                    ? 'Школа AI-систем: автоматизация, чат-боты, голосовые агенты и разработка с AI — без воды.'
                    : 'School of AI systems: automation, chatbots, voice agents and building with AI — no fluff.'}
                </p>
                <a
                  className={styles.footerTgCta}
                  href={TELEGRAM_COMMUNITY}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Send size={15} strokeWidth={2} aria-hidden />
                  {lang === 'ru' ? 'Сообщество в Telegram' : 'Telegram community'}
                </a>
              </div>

              <nav className={styles.footerCol} aria-label={lang === 'ru' ? 'Обучение' : 'Learning'}>
                <h4 className={styles.footerColTitle}>{lang === 'ru' ? 'Обучение' : 'Learning'}</h4>
                <Link to="/courses">{lang === 'ru' ? 'Курсы' : 'Courses'}</Link>
                <Link to="/marketplace">Marketplace</Link>
                <Link to="/memberships">{lang === 'ru' ? 'Подписки' : 'Memberships'}</Link>
                <Link to="/blog">{lang === 'ru' ? 'Блог' : 'Blog'}</Link>
              </nav>

              <nav className={styles.footerCol} aria-label={lang === 'ru' ? 'Экосистема' : 'Ecosystem'}>
                <h4 className={styles.footerColTitle}>{lang === 'ru' ? 'Экосистема' : 'Ecosystem'}</h4>
                <a href={MAIN_SITE_URL} target="_blank" rel="noreferrer noopener">
                  insiderai.it.com
                  <ExternalLink size={11} strokeWidth={1.9} aria-hidden />
                </a>
                <a href={TELEGRAM_COMMUNITY} target="_blank" rel="noreferrer noopener">
                  Telegram<ExternalLink size={11} strokeWidth={1.9} aria-hidden />
                </a>
                {TELEGRAM_NOTIFY_BOT && (
                  <a href={TELEGRAM_NOTIFY_BOT} target="_blank" rel="noreferrer noopener">
                    Notify bot<ExternalLink size={11} strokeWidth={1.9} aria-hidden />
                  </a>
                )}
              </nav>

              <nav className={styles.footerCol} aria-label={lang === 'ru' ? 'Правовое' : 'Legal'}>
                <h4 className={styles.footerColTitle}>{lang === 'ru' ? 'Правовое' : 'Legal'}</h4>
                <Link to="/oferta">{t('footer.offer')}</Link>
                <Link to="/privacy">{t('footer.privacy')}</Link>
                <Link to="/refund">{t('footer.refund')}</Link>
              </nav>
            </div>

            <div className={styles.footerWordmark} aria-hidden="true">
              <span>AI INSIDER</span>{' '}<span>ACADEMY</span>
            </div>

            <div className={styles.footerMeta}>
              <span>{t('footer.copyright')}</span>
              <span className={styles.footerVer}>v{SITE_VERSION}</span>
            </div>
          </footer>
        )}

        {!isAdminPage && !isAuthPage && (
          <>
            <button type="button" className={`${styles.callFab} ${chatOpen ? styles.callFabOpen : ''}`} onClick={() => (chatOpen ? setChatOpen(false) : openChat('ai'))} aria-label={t('chatbot.title')} aria-expanded={chatOpen}>
              {chatOpen ? <X size={21} /> : <MessageCircle size={22} />}
            </button>
            {chatOpen && (
              <Suspense fallback={null}>
                <ChatBot open={chatOpen} onClose={() => setChatOpen(false)} initialTab={chatTab} />
              </Suspense>
            )}
          </>
        )}
      </div>
    </div>
  )
}
