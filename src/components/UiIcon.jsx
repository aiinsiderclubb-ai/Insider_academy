import Flame from 'lucide-react/dist/esm/icons/flame.mjs'
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up.mjs'
import Sparkles from 'lucide-react/dist/esm/icons/sparkles.mjs'
import Users from 'lucide-react/dist/esm/icons/users.mjs'
import GraduationCap from 'lucide-react/dist/esm/icons/graduation-cap.mjs'
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days.mjs'
import MessagesSquare from 'lucide-react/dist/esm/icons/messages-square.mjs'
import Settings from 'lucide-react/dist/esm/icons/settings.mjs'
import Bot from 'lucide-react/dist/esm/icons/bot.mjs'
import Rocket from 'lucide-react/dist/esm/icons/rocket.mjs'
import Clapperboard from 'lucide-react/dist/esm/icons/clapperboard.mjs'
import Plug from 'lucide-react/dist/esm/icons/plug.mjs'
import Mic from 'lucide-react/dist/esm/icons/mic.mjs'
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list.mjs'
import Target from 'lucide-react/dist/esm/icons/target.mjs'
import Briefcase from 'lucide-react/dist/esm/icons/briefcase.mjs'
import PenLine from 'lucide-react/dist/esm/icons/pen-line.mjs'
import Zap from 'lucide-react/dist/esm/icons/zap.mjs'
import Heart from 'lucide-react/dist/esm/icons/heart.mjs'
import BookOpen from 'lucide-react/dist/esm/icons/book-open.mjs'
import Gift from 'lucide-react/dist/esm/icons/gift.mjs'
import Trophy from 'lucide-react/dist/esm/icons/trophy.mjs'
import Headphones from 'lucide-react/dist/esm/icons/headphones.mjs'
import FileText from 'lucide-react/dist/esm/icons/file-text.mjs'
import Flag from 'lucide-react/dist/esm/icons/flag.mjs'
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard.mjs'
import Brain from 'lucide-react/dist/esm/icons/brain.mjs'
import Keyboard from 'lucide-react/dist/esm/icons/keyboard.mjs'
import Search from 'lucide-react/dist/esm/icons/search.mjs'
import Megaphone from 'lucide-react/dist/esm/icons/megaphone.mjs'
import FolderKanban from 'lucide-react/dist/esm/icons/folder-kanban.mjs'
import Mail from 'lucide-react/dist/esm/icons/mail.mjs'
import Phone from 'lucide-react/dist/esm/icons/phone.mjs'
import Film from 'lucide-react/dist/esm/icons/film.mjs'
import Play from 'lucide-react/dist/esm/icons/play.mjs'
import Palette from 'lucide-react/dist/esm/icons/palette.mjs'
import Shield from 'lucide-react/dist/esm/icons/shield.mjs'
import Building2 from 'lucide-react/dist/esm/icons/building-2.mjs'
import Wrench from 'lucide-react/dist/esm/icons/wrench.mjs'
import Star from 'lucide-react/dist/esm/icons/star.mjs'
import CircleDot from 'lucide-react/dist/esm/icons/circle-dot.mjs'
import LogOut from 'lucide-react/dist/esm/icons/log-out.mjs'
import Bell from 'lucide-react/dist/esm/icons/bell.mjs'
import Lock from 'lucide-react/dist/esm/icons/lock.mjs'
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart.mjs'
import Check from 'lucide-react/dist/esm/icons/check.mjs'
import Home from 'lucide-react/dist/esm/icons/home.mjs'
import KeyRound from 'lucide-react/dist/esm/icons/key-round.mjs'
import Award from 'lucide-react/dist/esm/icons/award.mjs'
import styles from './UiIcon.module.css'

/** @typedef {'box' | 'inline' | 'badge' | 'chip'} UiIconVariant */
/** @typedef {'secondary' | 'accent' | 'inherit' | 'onAccent'} UiIconTone */

export const ICON_MAP = {
  flame: Flame,
  trendingUp: TrendingUp,
  sparkles: Sparkles,
  users: Users,
  graduationCap: GraduationCap,
  calendarDays: CalendarDays,
  messagesSquare: MessagesSquare,
  settings: Settings,
  bot: Bot,
  rocket: Rocket,
  clapperboard: Clapperboard,
  plug: Plug,
  mic: Mic,
  clipboardList: ClipboardList,
  target: Target,
  briefcase: Briefcase,
  penLine: PenLine,
  zap: Zap,
  heart: Heart,
  bookOpen: BookOpen,
  gift: Gift,
  trophy: Trophy,
  headphones: Headphones,
  fileText: FileText,
  flag: Flag,
  layoutDashboard: LayoutDashboard,
  brain: Brain,
  keyboard: Keyboard,
  search: Search,
  megaphone: Megaphone,
  folderKanban: FolderKanban,
  mail: Mail,
  phone: Phone,
  film: Film,
  play: Play,
  palette: Palette,
  shield: Shield,
  building2: Building2,
  wrench: Wrench,
  star: Star,
  circleDot: CircleDot,
  logOut: LogOut,
  bell: Bell,
  lock: Lock,
  shoppingCart: ShoppingCart,
  check: Check,
  home: Home,
  keyRound: KeyRound,
  award: Award,
}

const SIZE = {
  box: 20,
  inline: 16,
  badge: 14,
  chip: 14,
}

/**
 * Lucide icon with Academy sizing rules.
 * box = 40×40 container (features/steps); badge/chip = 14px; inline = 16–20px.
 */
export function UiIcon({
  name,
  icon: IconProp,
  variant = 'inline',
  size,
  tone = 'secondary',
  strokeWidth = 1.5,
  className = '',
  label,
}) {
  const Icon = IconProp || ICON_MAP[name] || CircleDot
  const px = size ?? SIZE[variant] ?? 20
  const toneClass =
    tone === 'accent' ? styles.toneAccent
      : tone === 'onAccent' ? styles.toneOnAccent
        : tone === 'inherit' ? styles.toneInherit
          : styles.toneSecondary

  const iconEl = (
    <Icon
      size={px}
      strokeWidth={strokeWidth}
      className={`${styles.icon} ${toneClass} ${variant !== 'box' ? className : ''}`.trim()}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    />
  )

  if (variant === 'box') {
    return (
      <span className={`${styles.box} ${className}`.trim()} aria-hidden={label ? undefined : true}>
        {iconEl}
      </span>
    )
  }

  return iconEl
}

export function resolveIconName(key) {
  if (!key) return 'circleDot'
  if (ICON_MAP[key]) return key
  return 'circleDot'
}
