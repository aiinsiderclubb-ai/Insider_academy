import { Link } from 'react-router-dom'
import { getMarketplaceCategory } from '../../data/marketplace/categories'
import { getMarketplacePrice } from '../../data/marketplace/discounts'
import styles from './MarketplaceProductCard.module.css'

function formatDownloads(n, lang) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`
  return String(n)
}

export function MarketplaceProductCard({
  product,
  lang,
  purchased = false,
  discountPercent = 0,
  purchases = [],
  favorite = false,
  onToggleFavorite,
}) {
  const ru = lang === 'ru'
  const title = ru ? product.titleRu : product.titleEn
  const desc = ru ? product.shortRu : product.shortEn
  const category = getMarketplaceCategory(product.categoryId)
  const categoryLabel = category ? (ru ? category.titleRu : category.titleEn) : product.categoryId
  const finalPrice = getMarketplacePrice(product.priceEur, purchases)
  const hasDiscount = discountPercent > 0 && finalPrice < product.priceEur

  return (
    <article
      className={styles.card}
      style={{ '--mp-cover': product.coverGradient }}
    >
      <Link to={`/marketplace/${product.slug}`} className={styles.cover} aria-label={title}>
        <span className={styles.category}>{categoryLabel}</span>
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
            {favorite ? '♥' : '♡'}
          </button>
        )}
        <span className={styles.coverIcon} aria-hidden>
          {product.coverIcon}
        </span>
      </Link>

      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link to={`/marketplace/${product.slug}`}>{title}</Link>
        </h3>
        <p className={styles.desc}>{desc}</p>
        <div className={styles.meta}>
          <span className={styles.rating}>★ {product.rating}</span>
          <span>({product.reviewCount})</span>
          <span>↓ {formatDownloads(product.downloads, lang)}</span>
        </div>
        <div className={styles.priceRow}>
          <span className={styles.price}>{finalPrice}€</span>
          {hasDiscount && (
            <>
              <span className={styles.oldPrice}>{product.priceEur}€</span>
              <span className={styles.discountBadge}>−{discountPercent}%</span>
            </>
          )}
        </div>
        <div className={styles.actions}>
          {purchased ? (
            <>
              <span className={styles.owned}>{ru ? 'Куплено · в кабинете' : 'Owned · in cabinet'}</span>
              <Link to="/cabinet#marketplace" className={styles.buyBtn}>
                {ru ? 'Скачать' : 'Download'}
              </Link>
            </>
          ) : (
            <>
              <Link to={`/marketplace/${product.slug}`} className={styles.previewBtn}>
                {ru ? 'Превью' : 'Preview'}
              </Link>
              <Link to={`/marketplace/${product.slug}/buy`} className={styles.buyBtn}>
                {ru ? 'Купить' : 'Buy'}
              </Link>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
