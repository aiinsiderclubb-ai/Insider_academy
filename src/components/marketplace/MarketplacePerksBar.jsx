import { Link } from 'react-router-dom'
import { Gem } from 'lucide-react'
import styles from './MarketplacePerksBar.module.css'

export function MarketplacePerksBar({ lang, discountPercent = 0 }) {
  const ru = lang === 'ru'

  return (
    <div className={styles.bar} role="region" aria-label={ru ? 'Скидки Marketplace' : 'Marketplace discounts'}>
      <Link to="/memberships/club" className={`${styles.chip} ${styles.chipTier}`}>
        <span className={styles.chipLabel}>Club</span>
        <span className={styles.chipValue}>−10%</span>
      </Link>
      <Link to="/memberships/pro" className={`${styles.chip} ${styles.chipTier}`}>
        <span className={styles.chipLabel}>Pro</span>
        <span className={styles.chipValue}>−25%</span>
      </Link>
      {discountPercent > 0 && (
        <span className={`${styles.chip} ${styles.chipActive}`}>
          <span className={styles.chipLabel}>
            {ru ? 'Ваша скидка' : 'Your discount'}
          </span>
          <span className={styles.chipValue}>−{discountPercent}%</span>
        </span>
      )}
      <span className={`${styles.chip} ${styles.chipMuted}`}>
        <Gem className={styles.chipIcon} size={15} aria-hidden />
        {ru ? '70% креатору · 30% платформе' : '70% creator · 30% platform'}
      </span>
    </div>
  )
}
