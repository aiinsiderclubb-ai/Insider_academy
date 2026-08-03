import { Link } from 'react-router-dom'
import Heart from 'lucide-react/dist/esm/icons/heart.mjs'
import { getMarketplaceCategory } from '../../data/marketplace/categories'
import { getMarketplaceCoverImage } from '../../utils/marketplaceCover'
import { ProductBadge } from '../ProductBadge'
import { ComingSoonLock } from '../ComingSoonLock'
import { isComingSoon } from '../../config/availability'
import styles from './MarketplaceProductCard.module.css'

export function MarketplaceProductCard({
  product,
  lang,
  purchased = false,
  discountPercent = 0,
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
  const finalPrice = Number(product.priceEur || 0)
  const hasDiscount = false
  const coverImage = getMarketplaceCoverImage(product)
  const comingSoon = isComingSoon('marketplace')

  return (
    <article className={`${styles.card} ${featured ? styles.featured : ''}`}>
      <div className={styles.cover}>
        <img className={styles.coverImage} src={coverImage} alt="" loading="lazy" />
        <Link to={`/marketplace/${product.slug}`} className={styles.coverHit} aria-label={title} />

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

        <span className={styles.previewLabel}>
          {ru ? 'Открыть' : 'View'} <ArrowUpRight size={13} aria-hidden />
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.kickerRow}>
          <span className={styles.category}>{categoryLabel}</span>
          {product.rating > 0 && (
            <span className={styles.rating}>
              <Star size={12} fill="currentColor" aria-hidden />
              {product.rating}
            </span>
          )}
        </div>

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
            <span className={styles.price}>{product.isFree ? (ru ? 'Бесплатно' : 'Free') : `${finalPrice}€`}</span>
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
            <Link to={product.isFree ? `/marketplace/${product.slug}` : `/marketplace/${product.slug}/buy`} className={styles.buyBtn}>
              {product.isFree ? (ru ? 'Получить' : 'Get') : (ru ? 'Купить' : 'Buy')}
            </Link>
          )}
        </div>

        {purchased && (
          <span className={styles.owned}>
            <CircleCheck size={13} aria-hidden />
            {ru ? 'Куплено, в кабинете' : 'Owned, in cabinet'}
          </span>
        )}
      </div>
      {comingSoon && <ComingSoonLock kind="marketplace" lang={lang} compact />}
    </article>
  )
}
