import { Flame, TrendingUp, Sparkles } from 'lucide-react'
import styles from './ProductBadge.module.css'

/** @typedef {'hit' | 'trend-2026' | 'new'} ProductBadgeType */

const BADGE_CONFIG = {
  hit: {
    Icon: Flame,
    labelRu: 'Хит',
    labelEn: 'Hit',
    variant: 'hit',
  },
  'trend-2026': {
    Icon: TrendingUp,
    labelRu: 'Тренд 2026',
    labelEn: 'Trend 2026',
    variant: 'trend2026',
  },
  new: {
    Icon: Sparkles,
    labelRu: 'Новинка',
    labelEn: 'New',
    variant: 'new',
  },
}

export function getProductBadgeLabel(type, lang = 'ru') {
  const cfg = BADGE_CONFIG[type]
  if (!cfg) return ''
  return lang === 'en' ? cfg.labelEn : cfg.labelRu
}

/**
 * Бейдж на обложке карточки (левый верхний угол).
 * @param {Object} props
 * @param {ProductBadgeType} props.type
 * @param {'ru' | 'en'} [props.lang]
 * @param {'overlay' | 'inline'} [props.variant]
 */
export function ProductBadge({ type, lang = 'ru', variant = 'overlay' }) {
  const cfg = BADGE_CONFIG[type]
  if (!cfg) return null
  const label = lang === 'en' ? cfg.labelEn : cfg.labelRu
  const { Icon } = cfg

  return (
    <span
      className={`${styles.badge} ${styles[cfg.variant]} ${variant === 'inline' ? styles.inline : styles.overlay}`}
    >
      <Icon className={styles.icon} size={14} strokeWidth={1.5} aria-hidden />
      {label}
    </span>
  )
}

export function productHasPublicStats(product) {
  return product?.rating != null && (product.reviewCount ?? 0) > 0
}
