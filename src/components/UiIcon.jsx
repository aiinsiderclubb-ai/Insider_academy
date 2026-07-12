import {
  Flame,
  TrendingUp,
  Sparkles,
  Users,
  GraduationCap,
  CalendarDays,
  MessagesSquare,
  Settings,
  Bot,
  Rocket,
  Clapperboard,
  Plug,
  Mic,
  ClipboardList,
  Target,
  Briefcase,
  PenLine,
  Zap,
  Heart,
  BookOpen,
  Gift,
  Trophy,
  Headphones,
  FileText,
  Flag,
  LayoutDashboard,
  Brain,
  Keyboard,
  Search,
  Megaphone,
  FolderKanban,
  Mail,
  Phone,
  Film,
  Play,
  Palette,
  Shield,
  Building2,
  Wrench,
  Star,
  CircleDot,
  LogOut,
  Bell,
  Lock,
  ShoppingCart,
  Check,
  Home,
  KeyRound,
  Award,
} from 'lucide-react'
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
