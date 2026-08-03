import { Link } from 'react-router-dom'
import Heart from 'lucide-react/dist/esm/icons/heart.mjs'
import { getMarketplaceCategory } from '../../data/marketplace/categories'
import { getMarketplacePrice } from '../../data/marketplace/discounts'
import { getMarketplaceCoverStyle } from '../../utils/marketplaceCover'
import { ProductBadge } from '../ProductBadge'
import { UiIcon } from '../UiIcon'
import styles from './MarketplaceProductCard.module.css'

export function MarketplaceProductCard({
  product,
  lang,
  purchased = false,
  discountPercent = 0,
  purchases = [],
  favorite = false,
  onToggleFavorite,
  featured = false,
  outcomeMeta = null,
}) {
  const ru = lang === 'ru'
  const title = ru ? product.titleRu : product.titleEn
  const desc = ru ? product.shortRu : product.shortEn
  const category = getMarketplaceCategory(product.categoryId)
  const categoryLabel = category ? (ru ? category.titleRu : category.titleEn) : product.categoryId
  const finalPrice = getMarketplacePrice(product.priceEur, purchases)
  const hasDiscount = discountPercent > 0 && finalPrice < product.priceEur
  const coverStyle = getMarketplaceCoverStyle(title || product.id)

  return (
    <article className={`${styles.card} ${featured ? styles.featured : ''}`}>
      <div className={styles.cover} style={coverStyle}>
        <Link to={`/marketplace/${product.slug}`} className={styles.coverHit} aria-label={title} />

        <span className={styles.coverIcon} aria-hidden>
          <UiIcon name={category?.icon || 'sparkles'} size={32} tone="onAccent" />
        </span>

        {product.badge && <ProductBadge type={product.badge} lang={lang} />}

        {onToggleFavorite && (
          <button
            type="button"
            className={`${styles.favBtn} ${favorite ? styles.favActive : ''}`}
            aria-label={ru ? 'В избранное' : 'Add to favorites'}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite(product.id)
            }}
          >
            <Heart size={16} strokeWidth={1.5} fill={favorite ? 'currentColor' : 'none'} aria-hidden />
          </button>
        )}

        {!purchased && (
          <div className={styles.previewOverlay}>
            <Link to={`/marketplace/${product.slug}`} className={styles.previewBtn}>
              {ru ? 'Превью' : 'Preview'}
            </Link>
          </div>
        )}
      </div>

      <div className={styles.body}>
        <span className={styles.category}>{categoryLabel}</span>

        <h3 className={styles.title}>
          <Link to={`/marketplace/${product.slug}`}>{title}</Link>
        </h3>

        <p className={styles.desc}>{desc}</p>

        {outcomeMeta && (
          <div className={styles.outcome}>
            <span className={styles.outcomeLabel}>{ru ? 'Результат' : 'Outcome'}</span>
            <strong>{ru ? outcomeMeta.outcomeRu : outcomeMeta.outcomeEn}</strong>
            <div className={styles.outcomeMeta}>
              <span>{ru ? outcomeMeta.launchRu : outcomeMeta.launchEn}</span>
              <span>{ru ? outcomeMeta.serviceRu : outcomeMeta.serviceEn}</span>
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.priceBlock}>
            <span className={styles.price}>{finalPrice}€</span>
            {hasDiscount && (
              <>
                <span className={styles.oldPrice}>{product.priceEur}€</span>
                <span className={styles.discountBadge}>−{discountPercent}%</span>
              </>
            )}
          </div>

          {product.releaseStatus === 'preview' ? (
            <Link to={`/marketplace/${product.slug}`} className={`${styles.buyBtn} ${styles.previewRelease}`}>
              {ru ? 'Скоро' : 'Preview'}
            </Link>
          ) : purchased ? (
            <Link to="/cabinet#marketplace" className={styles.buyBtn}>
              {ru ? 'Скачать' : 'Download'}
            </Link>
          ) : (
            <Link to={`/marketplace/${product.slug}/buy`} className={styles.buyBtn}>
              {ru ? 'Купить' : 'Buy'}
            </Link>
          )}
        </div>

        {purchased && (
          <span className={styles.owned}>{ru ? 'Куплено · в кабинете' : 'Owned · in cabinet'}</span>
        )}
      </div>
    </article>
  )
}
