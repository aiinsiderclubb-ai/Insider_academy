import styles from '../../pages/Admin.module.css'
import { canAccessTab } from '../../utils/adminAuth'
import { ACCELERATOR_ADMIN_TAB } from '../../data/acceleratorApplication'
import {
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  CreditCard,
  FileText,
  Flag,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Link2,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Star,
  UserRound,
  Wrench,
} from 'lucide-react'

const navGroups = [
  {
    label: 'Обзор',
    items: [
      { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
      { id: 'inbox', label: 'Модерация', icon: Inbox, roles: ['admin', 'moderator'] },
      { id: 'roadmap', label: 'Роадмап', icon: Map, roles: ['admin'] },
      { id: 'analytics', label: 'Аналитика', icon: ChartNoAxesCombined, roles: ['admin'] },
      { id: 'settings', label: 'Настройки', icon: Settings, roles: ['admin'] },
      { id: 'tools', label: 'Операции', icon: Wrench, roles: ['admin'] },
    ],
  },
  {
    label: 'Отбор',
    roles: ['admin', 'moderator'],
    items: [
      { id: ACCELERATOR_ADMIN_TAB, label: 'Отборочный курс', icon: Flag },
    ],
  },
  {
    label: 'Пользователи',
    roles: ['admin', 'moderator'],
    items: [
      { id: 'registrations', label: 'Регистрации', icon: UserRound },
      { id: 'purchases', label: 'Покупки', icon: CreditCard },
      { id: 'referrals', label: 'Рефералы', icon: Link2, roles: ['admin'] },
    ],
  },
  {
    label: 'Контент',
    items: [
      { id: 'homework', label: 'ДЗ', icon: ClipboardCheck, roles: ['admin', 'moderator'] },
      { id: 'reviews', label: 'Отзывы', icon: Star, roles: ['admin', 'moderator'] },
      { id: 'certificates', label: 'Сертификаты', icon: GraduationCap, roles: ['admin', 'moderator'] },
      { id: 'courses', label: 'Курсы', icon: BookOpen, roles: ['admin', 'editor'] },
      { id: 'blog', label: 'Блог', icon: FileText, roles: ['admin', 'editor'] },
      { id: 'calendar', label: 'Календарь', icon: CalendarDays, roles: ['admin', 'editor'] },
    ],
  },
]

function itemVisible(item, role) {
  if (!item.roles) return canAccessTab(role, item.id)
  return item.roles.includes(role)
}

export function AdminSidebar({ activeTab, onTabChange, unreadByTab, online, collapsed, onToggleCollapse, adminRole = 'admin', roleLabel }) {
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.sidebarBrand}>
        <span className={styles.sidebarLogo}>IA</span>
        {!collapsed && (
          <div>
            <strong>Insider Admin</strong>
            <span className={`${styles.statusDot} ${online ? styles.statusOnline : styles.statusOffline}`}>
              {online ? 'API онлайн' : 'Локальный режим'}
            </span>
            {roleLabel && <span className={styles.roleBadge}>{roleLabel}</span>}
          </div>
        )}
      </div>

      <nav className={styles.sidebarNav}>
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => itemVisible(item, adminRole))
          if (group.roles && !group.roles.includes(adminRole)) return null
          if (visibleItems.length === 0) return null
          return (
            <div key={group.label} className={styles.navGroup}>
              {!collapsed && <span className={styles.navGroupLabel}>{group.label}</span>}
              {visibleItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.navItem} ${activeTab === item.id ? styles.navItemActive : ''}`}
                    onClick={() => onTabChange(item.id)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={styles.navIcon}><Icon size={17} strokeWidth={1.8} aria-hidden /></span>
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && unreadByTab[item.id] > 0 && (
                      <span className={styles.navBadge}>{unreadByTab[item.id]}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      <button type="button" className={styles.sidebarToggle} onClick={onToggleCollapse}>
        {collapsed ? <PanelLeftOpen size={17} aria-label="Развернуть меню" /> : <><PanelLeftClose size={17} aria-hidden /><span>Свернуть</span></>}
      </button>
    </aside>
  )
}
