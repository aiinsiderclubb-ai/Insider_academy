import { Link } from 'react-router-dom'
import { MarketplaceProductCard } from './marketplace/MarketplaceProductCard'
import { getMarketplaceDiscountPercent } from '../data/marketplace/discounts'
import styles from './RecommendationsStrip.module.css'

export function RecommendationsStrip({
  products = [],
  lang,
  purchases = [],
  hasPurchased,
  title,
  subtitle,
  reason,
}) {
  const ru = lang === 'ru'
  if (!products.length) return null

  const discountPercent = getMarketplaceDiscountPercent(purchases)

  return (
    <section className={styles.wrap} aria-label={ru ? 'Рекомендации' : 'Recommendations'}>
      <div className={styles.head}>
        <div>
          <h2 className={styles.title}>
            {title || (ru ? 'Вам подойдёт' : 'Recommended for you')}
          </h2>
          {(subtitle || reason) && (
            <p className={styles.sub}>{subtitle || reason}</p>
          )}
        </div>
        <Link to="/marketplace" className={styles.allLink}>
          {ru ? 'Весь Marketplace →' : 'All Marketplace →'}
        </Link>
      </div>
      <div className={styles.grid}>
        {products.map((product) => (
          <MarketplaceProductCard
            key={product.id}
            product={product}
            lang={lang}
            purchased={hasPurchased?.(product.id)}
            discountPercent={discountPercent}
            purchases={purchases}
          />
        ))}
      </div>
    </section>
  )
}

/** Текст причины рекомендации по купленным продуктам */
export function buildRecommendationReason(purchases = [], lang = 'ru') {
  const ru = lang === 'ru'
  const owned = purchases.find((p) => String(p.id).startsWith('mp-'))
  if (!owned) {
    return ru
      ? 'На основе ваших курсов и интересов'
      : 'Based on your courses and interests'
  }
  const name = owned.courseTitle || owned.id
  const disc = ru ? 'Club −10% / Pro −25%' : 'Club −10% / Pro −25%'
  return ru
    ? `Раз у вас есть похожие покупки — вот что усилит результат (${disc})`
    : `Since you own related products — these amplify the result (${disc})`
}
