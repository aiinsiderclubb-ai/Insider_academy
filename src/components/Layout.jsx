import { useState, useRef, useEffect } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { trackVisit } from '../api/adminStore'
import { useUserNotifications } from '../hooks/useUserNotifications'
import { api, checkApiOnline } from '../api/client'
import { ApiStatusBanner } from './ApiStatusBanner'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useCourses } from '../context/CoursesContext'
import { useProgress } from '../context/ProgressContext'
import { IconHome, IconBriefcase, IconVideo, IconCalendar, IconBlog, IconBell, IconMessage, IconUser, IconCart, IconAward } from './Icons'
import { ChatBot } from './ChatBot'
import { ContinueLearningBar } from './ContinueLearningBar'
import { ScrollProgressBar } from './ScrollProgressBar'
import { InactivityBanner } from './InactivityBanner'
import { NeuronGlow } from './NeuronGlow'
import { isRegistrationOnboardingDone } from '../utils/onboardingStorage'
import { ThemeToggle } from './ThemeToggle'
import { ProgressRing } from './ProgressRing'
import { UiIcon } from './UiIcon'
import { MAIN_SITE_COURSES, MAIN_SITE_URL, TELEGRAM_COMMUNITY, TELEGRAM_MANAGER, TELEGRAM_NOTIFY_BOT } from '../data/siteLinks'
import { SITE_VERSION } from '../data/siteMeta'
import styles from './Layout.module.css'

const navItemsKeys = [
  { to: '/', labelKey: 'nav.home', Icon: IconHome },
  { to: '/courses', labelKey: 'nav.catalog', Icon: IconVideo },
  {
    to: '/marketplace',
    labelKey: 'nav.marketplace',
    Icon: IconCart,
    children: [
      { to: '/marketplace', labelKey: 'nav.marketplaceCatalog', section: 'catalog' },
      { to: '/marketplace?tab=vault', labelKey: 'nav.vault', section: 'vault' },
    ],
  },
  { to: '/memberships', labelKey: 'nav.memberships', Icon: IconUser },
  { to: '/events', labelKey: 'nav.giveaway', Icon: IconAward },
  { to: '/cabinet', labelKey: 'nav.myCourses', Icon: IconBriefcase, auth: true },
  { to: '/calendar', labelKey: 'nav.calendar', Icon: IconCalendar },
  { to: '/blog', labelKey: 'nav.blog', Icon: IconBlog },
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
  const { t, lang, toggleLang } = useLanguage()
  const { courses } = useCourses()
  const { getPercent } = useProgress()
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const [chatOpen, setChatOpen] = useState(false)
  const [chatTab, setChatTab] = useState('ai')
  const [cabinetOpen, setCabinetOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const [, forceUpdate] = useState(0)
  const cabinetRef = useRef(null)
  const notifRef = useRef(null)
  const { notifications, unreadCount: notifCount, markRead: markNotificationReadApi, markAllRead: markAllNotificationsReadApi } = useUserNotifications(user?.email)

  const navItems = navItemsKeys.map(({ labelKey, ...rest }) => ({ ...rest, label: t(labelKey) }))
  const cabinetMenuItems = cabinetMenuKeys.map(({ labelKey, ...rest }) => ({ ...rest, label: t(labelKey) }))

  const [searchParams] = useSearchParams()

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

  const isAdminPage = location.pathname === '/admin'

  const isMarketplaceSection =
    location.pathname.startsWith('/marketplace') || location.pathname.startsWith('/vault')
  const isMarketplaceVaultActive =
    (location.pathname === '/marketplace' && searchParams.get('tab') === 'vault')
    || location.pathname.startsWith('/vault/')
  const isMarketplaceCatalogActive = isMarketplaceSection && !isMarketplaceVaultActive

  const openChat = (tab = 'ai') => {
    setChatTab(tab)
    setChatOpen(true)
  }

  const userInitial = user?.name?.[0] || user?.email?.[0] || '?'

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
    if (notification.targetPath) return notification.targetPath
    const course = courses.find((item) =>
      item.id === notification.courseId
      || item.slug === notification.courseSlug
      || item.title === notification.courseTitle
      || item.titleEn === notification.courseTitle
    )
    if (course) {
      const lessonPart = Number.isInteger(notification.lessonIndex) ? `?lesson=${notification.lessonIndex}` : ''
      return `/courses/${course.slug}${lessonPart}`
    }
    return '/cabinet'
  }

  const handleNotificationClick = async (notification) => {
    await markNotificationReadApi(notification.id)
    setNotifOpen(false)
    navigate(resolveNotificationTarget(notification))
    window.dispatchEvent(new Event('lms-homework-refresh'))
  }

  const needsOnboarding = Boolean(
    user
    && !isRegistrationOnboardingDone()
    && !['/onboarding', '/login', '/register', '/verify-email'].includes(location.pathname)
  )

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className={`${styles.wrapper} ${!user ? styles.guestLayout : ''} ${isAdminPage ? styles.adminLayout : ''}`}>
      {user && !isAdminPage && (
      <aside className={styles.sidebar}>
        <Link to="/" className={styles.sidebarLogo}>
          <span className={styles.logoText}>AI Insider Academy</span>
        </Link>
        <nav className={styles.sidebarNav}>
          {navItems.map(({ to, label, Icon, auth, children }) => {
            if (auth && !user) return null

            if (children?.length) {
              return (
                <div key={to + label} className={styles.sidebarGroup}>
                  <Link
                    to={to}
                    className={`${styles.sidebarLink} ${isMarketplaceSection ? styles.sidebarLinkActive : ''}`}
                  >
                    <span className={styles.sidebarIcon}><Icon /></span>
                    <span className={styles.sidebarLabel}>{label}</span>
                  </Link>
                  <div className={styles.sidebarSubNav}>
                    {children.map((child) => {
                      const childLabel = t(child.labelKey)
                      const childActive =
                        child.section === 'vault' ? isMarketplaceVaultActive : isMarketplaceCatalogActive
                      return (
                        <Link
                          key={child.to + childLabel}
                          to={child.to}
                          className={`${styles.sidebarSubLink} ${childActive ? styles.sidebarSubLinkActive : ''}`}
                        >
                          {childLabel}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            }

            const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
            return (
              <Link
                key={to + label}
                to={to}
                className={`${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`}
              >
                <span className={styles.sidebarIcon}><Icon /></span>
                <span className={styles.sidebarLabel}>{label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
      )}

      <div className={styles.mainWrap}>
        <ApiStatusBanner />
        <InactivityBanner lang={lang} />
        <div className={styles.neuronBg} aria-hidden><NeuronGlow /></div>
        <header className={`${styles.header} ${headerScrolled ? styles.headerScrolled : ''}`}>
          <Link to="/" className={styles.logo}>AI Insider Academy</Link>
          {!user && (
            <nav className={styles.guestNav}>
              <Link to="/">{t('nav.school')}</Link>
              <Link to="/courses">{t('nav.catalog')}</Link>
              <Link to="/marketplace">{t('nav.marketplace')}</Link>
              <Link to="/events">{t('nav.giveaway')}</Link>
              <Link to="/blog">{t('nav.blog')}</Link>
              <a href={MAIN_SITE_COURSES} target="_blank" rel="noreferrer noopener">
                {lang === 'ru' ? 'Курсы на сайте' : 'Website courses'} ↗
              </a>
            </nav>
          )}
          <div className={styles.headerRight}>
            <ThemeToggle darkLabel={t('common.themeDark')} lightLabel={t('common.themeLight')} />
            <button
              type="button"
              className={styles.langToggle}
              onClick={toggleLang}
              title={lang === 'ru' ? 'English' : 'Русский'}
              aria-label={lang === 'ru' ? 'Switch to English' : 'Переключить на русский'}
            >
              <span className={lang === 'ru' ? styles.langActive : ''}>{t('common.langRu')}</span>
              <span className={styles.langDivider}>/</span>
              <span className={lang === 'en' ? styles.langActive : ''}>{t('common.langEn')}</span>
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              title={t('nav.messages')}
              aria-label={t('nav.messages')}
              onClick={() => openChat('ai')}
            >
              <IconMessage />
            </button>
            <div className={styles.notifWrap} ref={notifRef}>
              <button type="button" className={styles.iconBtn} title={t('nav.notifications')} onClick={() => setNotifOpen((v) => !v)} aria-expanded={notifOpen}>
                <IconBell />
                {notifCount > 0 && <span className={styles.badge}>{notifCount > 99 ? '99+' : notifCount}</span>}
              </button>
              {notifOpen && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifDropdownHead}>
                    <span className={styles.notifDropdownTitle}>{t('nav.notifications')}</span>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        className={styles.notifMarkAll}
                        onClick={handleMarkAllNotificationsRead}
                        disabled={notifCount === 0}
                      >
                        {lang === 'ru' ? 'Все прочитано' : 'Mark all read'}
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className={styles.notifEmpty}>{lang === 'ru' ? 'Нет уведомлений' : 'No notifications'}</div>
                  ) : (
                    <div className={styles.notifList}>
                      {notifications.map((n) => {
                        const body = getNotificationBody(n)
                        return (
                          <button
                            key={n.id}
                            type="button"
                            className={`${styles.notifItem} ${!n.read ? styles.notifItemUnread : ''}`}
                            onClick={() => handleNotificationClick(n)}
                          >
                            <span className={styles.notifItemIcon} aria-hidden>
                              <UiIcon name={getNotificationIcon(n)} size={16} tone="accent" />
                            </span>
                            <span className={styles.notifItemBody}>
                              <span className={styles.notifItemTop}>
                                <span className={styles.notifItemTitle}>{getNotificationTitle(n)}</span>
                                {n.date && (
                                  <span className={styles.notifItemTime}>{formatNotificationTime(n.date)}</span>
                                )}
                              </span>
                              {body && <span className={styles.notifItemText}>{body}</span>}
                            </span>
                            {!n.read && <span className={styles.notifUnreadDot} aria-hidden />}
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
                <button
                  type="button"
                  className={styles.avatar}
                  onClick={() => setCabinetOpen((v) => !v)}
                  title={t('nav.cabinet')}
                  aria-expanded={cabinetOpen}
                  aria-haspopup="true"
                >
                  <ProgressRing percent={overallProgress} size={40} stroke={2.5}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className={styles.avatarImg} />
                    ) : (
                      <span className={styles.avatarInitial}>{userInitial.toUpperCase()}</span>
                    )}
                  </ProgressRing>
                </button>
                {cabinetOpen && (
                  <div className={styles.cabinetDropdown}>
                    <div className={styles.cabinetDropdownUser}>
                      <span className={styles.cabinetDropdownName}>{user.name || user.email}</span>
                      <span className={styles.cabinetDropdownEmail}>{user.email}</span>
                    </div>
                    {cabinetMenuItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={styles.cabinetDropdownItem}
                        onClick={() => setCabinetOpen(false)}
                      >
                        <span className={styles.cabinetDropdownIcon}>
                          <UiIcon name={item.icon} size={16} tone="secondary" />
                        </span>
                        {item.label}
                      </Link>
                    ))}
                    <button type="button" className={styles.cabinetDropdownLogout} onClick={() => { setCabinetOpen(false); setChatOpen(false); logout(); }}>
                      <span className={styles.cabinetDropdownIcon}>
                        <UiIcon name="logOut" size={16} tone="secondary" />
                      </span>
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.authLinks}>
                <Link to="/register" className={styles.registerLink}>{t('nav.register')}</Link>
                <Link to="/login" className={styles.avatarLink}>{t('nav.login')}</Link>
              </div>
            )}
          </div>
        </header>

        <ScrollProgressBar />
        <main className={isHome ? styles.mainHero : styles.main}>
          {user
            && !location.pathname.startsWith('/admin')
            && !['/', '/cabinet', '/onboarding'].includes(location.pathname)
            && (
            <div className={styles.continueWrap}>
              <ContinueLearningBar />
            </div>
          )}
          {children}
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={styles.footerGrid}>
              <div className={styles.footerCol}>
                <span className={styles.footerLabel}>{lang === 'ru' ? 'Продукт' : 'Product'}</span>
                <Link to="/courses">{lang === 'ru' ? 'Курсы' : 'Courses'}</Link>
                <Link to="/marketplace">{lang === 'ru' ? 'Marketplace' : 'Marketplace'}</Link>
                <Link to="/memberships">{lang === 'ru' ? 'Подписки' : 'Memberships'}</Link>
                <Link to="/events">{lang === 'ru' ? 'Ивенты' : 'Events'}</Link>
              </div>
              <div className={styles.footerCol}>
                <span className={styles.footerLabel}>{lang === 'ru' ? 'Ресурсы' : 'Resources'}</span>
                <Link to="/blog">{lang === 'ru' ? 'Блог' : 'Blog'}</Link>
                <Link to="/learning-map">{lang === 'ru' ? 'Карта обучения' : 'Learning map'}</Link>
                <a href={MAIN_SITE_URL} target="_blank" rel="noreferrer noopener">
                  {lang === 'ru' ? 'Сайт AI Insider' : 'AI Insider site'}
                </a>
                <a href={MAIN_SITE_COURSES} target="_blank" rel="noreferrer noopener">
                  {lang === 'ru' ? 'Курсы на сайте' : 'Website courses'}
                </a>
              </div>
              <div className={styles.footerCol}>
                <span className={styles.footerLabel}>{lang === 'ru' ? 'Правовое' : 'Legal'}</span>
                <Link to="/oferta">{t('footer.offer')}</Link>
                <Link to="/privacy">{t('footer.privacy')}</Link>
                <Link to="/refund">{t('footer.refund')}</Link>
                <Link to="/giveaway-rules">{lang === 'ru' ? 'Правила розыгрышей' : 'Giveaway rules'}</Link>
              </div>
              <div className={styles.footerCol}>
                <span className={styles.footerLabel}>{lang === 'ru' ? 'Соцсети' : 'Social'}</span>
                <a href={TELEGRAM_COMMUNITY} target="_blank" rel="noreferrer noopener">
                  {t('footer.telegram')}
                </a>
                <a href={TELEGRAM_MANAGER} target="_blank" rel="noreferrer noopener">
                  @vladyslavarcher
                </a>
                {TELEGRAM_NOTIFY_BOT && (
                  <a href={TELEGRAM_NOTIFY_BOT} target="_blank" rel="noreferrer noopener">
                    {lang === 'ru' ? 'Бот уведомлений' : 'Notify bot'}
                  </a>
                )}
                <Link to="/admin">{lang === 'ru' ? 'Админ' : 'Admin'}</Link>
              </div>
            </div>
            <div className={styles.footerBottom}>
              <span>{t('footer.copyright')}</span>
              <span className={styles.footerMade}>
                {lang === 'ru' ? 'Сделано AI Insider' : 'Made by AI Insider'}
              </span>
              <span className={styles.footerVersion}>v{SITE_VERSION}</span>
            </div>
          </div>
        </footer>

        <button
          type="button"
          className={`${styles.callFab} ${chatOpen ? styles.callFabOpen : ''}`}
          onClick={() => (chatOpen ? setChatOpen(false) : openChat('ai'))}
          title={t('chatbot.title')}
          aria-label={t('chatbot.title')}
          aria-expanded={chatOpen}
        >
          <span className={styles.callFabInner}>
            {chatOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </svg>
            )}
          </span>
        </button>
        <ChatBot open={chatOpen} onClose={() => setChatOpen(false)} initialTab={chatTab} />
      </div>
    </div>
  )
}
