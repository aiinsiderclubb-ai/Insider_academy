import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { trackVisit, getNotifications, getUnreadCount, markNotificationRead } from '../api/adminStore'
import { api, checkApiOnline } from '../api/client'
import { ApiStatusBanner } from './ApiStatusBanner'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useCourses } from '../context/CoursesContext'
import { useProgress } from '../context/ProgressContext'
import { IconHome, IconBriefcase, IconVideo, IconCalendar, IconBlog, IconBell, IconMessage, IconUser } from './Icons'
import { ChatBot } from './ChatBot'
import { FloatingHotOffer } from './FloatingHotOffer'
import { NeuronGlow } from './NeuronGlow'
import { ThemeToggle } from './ThemeToggle'
import { ProgressRing } from './ProgressRing'
import styles from './Layout.module.css'

const navItemsKeys = [
  { to: '/', labelKey: 'nav.home', Icon: IconHome },
  { to: '/courses', labelKey: 'nav.catalog', Icon: IconVideo },
  { to: '/club', labelKey: 'nav.club', Icon: IconUser },
  { to: '/cabinet', labelKey: 'nav.myCourses', Icon: IconBriefcase, auth: true },
  { to: '/calendar', labelKey: 'nav.calendar', Icon: IconCalendar },
  { to: '/blog', labelKey: 'nav.blog', Icon: IconBlog },
]

const cabinetMenuKeys = [
  { to: '/account', labelKey: 'nav.accountSettings', icon: '⚙️' },
  { to: '/cabinet', labelKey: 'nav.myCourses', icon: '📚' },
  { to: '/cabinet#certificates', labelKey: 'nav.myCertificates', icon: '📄' },
  { to: '/cabinet#awards', labelKey: 'nav.awards', icon: '🏆' },
  { to: '/cabinet#invite', labelKey: 'nav.inviteFriend', icon: '🎁' },
  { to: '/cabinet#support', labelKey: 'nav.support', icon: '🎧' },
]

export function Layout({ children }) {
  const { user, logout, purchases } = useAuth()
  const { t, lang, toggleLang } = useLanguage()
  const { courses, acceleratorCourse } = useCourses()
  const { getPercent } = useProgress()
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const [chatOpen, setChatOpen] = useState(false)
  const [chatTab, setChatTab] = useState('ai')
  const [cabinetOpen, setCabinetOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [, forceUpdate] = useState(0)
  const cabinetRef = useRef(null)
  const notifRef = useRef(null)
  const notifCount = user ? getUnreadCount(user.email) : 0
  const notifications = user ? getNotifications().filter((n) => n.email === user.email || n.userId === user.email).slice(0, 15) : []

  const navItems = navItemsKeys.map(({ labelKey, ...rest }) => ({ ...rest, label: t(labelKey) }))
  const cabinetMenuItems = cabinetMenuKeys.map(({ labelKey, ...rest }) => ({ ...rest, label: t(labelKey) }))

  const [searchParams] = useSearchParams()
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
    return notification.type
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

  const handleNotificationClick = (notification) => {
    markNotificationRead(notification.id)
    setNotifOpen(false)
    navigate(resolveNotificationTarget(notification))
  }

  return (
    <div className={`${styles.wrapper} ${!user ? styles.guestLayout : ''} ${isAdminPage ? styles.adminLayout : ''}`}>
      {user && !isAdminPage && (
      <aside className={styles.sidebar}>
        <Link to="/" className={styles.sidebarLogo}>
          <span className={styles.logoText}>AI Insider Academy</span>
        </Link>
        <nav className={styles.sidebarNav}>
          {navItems.map(({ to, label, Icon, auth }) => {
            if (auth && !user) return null
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
        <div className={styles.neuronBg} aria-hidden><NeuronGlow /></div>
        <header className={styles.header}>
          <Link to="/" className={styles.logo}>AI Insider Academy</Link>
          {!user && (
            <nav className={styles.guestNav}>
              <Link to="/">{t('nav.school')}</Link>
              <Link to="/courses">{t('nav.catalog')}</Link>
              <Link to="/blog">{t('nav.blog')}</Link>
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
                  <div className={styles.notifDropdownTitle}>{t('nav.notifications')}</div>
                  {notifications.length === 0 ? (
                    <div className={styles.notifEmpty}>{lang === 'ru' ? 'Нет уведомлений' : 'No notifications'}</div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        className={styles.notifItem}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <span className={styles.notifItemTitle}>{getNotificationTitle(n)}</span>
                        <span className={styles.notifItemText}>{n.courseTitle} {n.lessonTitle ? `— ${n.lessonTitle}` : ''}</span>
                        {n.message && <span className={styles.notifItemMsg}>{n.message.slice(0, 80)}{n.message.length > 80 ? '…' : ''}</span>}
                      </button>
                    ))
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
                        <span className={styles.cabinetDropdownIcon}>{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                    <button type="button" className={styles.cabinetDropdownLogout} onClick={() => { logout(); setCabinetOpen(false); }}>
                      <span className={styles.cabinetDropdownIcon}>🚪</span>
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

        <main className={isHome ? styles.mainHero : styles.main}>
          {children}
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <p>{t('footer.tagline')}</p>
            <p className={styles.footerMuted}>
              <a href="https://t.me/your_channel" target="_blank" rel="noreferrer noopener" className={styles.telegramLink}>{t('footer.telegram')}</a>
              {' · '}{t('footer.copyright')}
              {' · '}<Link to="/admin" className={styles.telegramLink}>Админ</Link>
            </p>
          </div>
        </footer>

        <button type="button" className={styles.callFab} onClick={() => openChat('ai')} title={t('chatbot.title')} aria-label={t('chatbot.title')}>
          <span className={styles.callFabIcon} aria-hidden>💬</span>
        </button>
        {location.pathname !== '/admin' && acceleratorCourse && (
          <FloatingHotOffer lang={lang} courseSlug={acceleratorCourse.slug} />
        )}
        <ChatBot open={chatOpen} onClose={() => setChatOpen(false)} initialTab={chatTab} />
      </div>
    </div>
  )
}
