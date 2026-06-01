import { Link } from 'react-router-dom'
import styles from './VaultCatalogCard.module.css'

export function VaultCatalogCard({ product, lang, purchased = false }) {
  const ru = lang === 'ru'
  const title = ru ? product.titleRu : product.titleEn
  const desc = ru ? product.shortRu : product.shortEn
  const category = ru ? product.categoryRu : product.categoryEn
  const highlight = ru ? product.highlightRu : product.highlightEn

  return (
    <article
      className={styles.card}
      style={{
        '--vault-accent': product.accent,
        '--vault-gradient': product.gradient,
      }}
    >
      <Link to={`/vault/${product.slug}`} className={styles.hero}>
        {product.coverImage ? (
          <img
            src={product.coverImage}
            alt=""
            className={styles.coverImg}
            loading="lazy"
          />
        ) : (
          <span className={styles.icon} aria-hidden>
            {product.icon}
          </span>
        )}
        <div className={styles.heroOverlay} aria-hidden />
        <span className={styles.category}>{category}</span>
        {highlight && <span className={styles.highlight}>{highlight}</span>}
        <h3 className={styles.title}>{title}</h3>
      </Link>
      <div className={styles.body}>
        <p className={styles.desc}>{desc}</p>
        <div className={styles.priceRow}>
          <span className={styles.price}>{product.priceEur}€</span>
          {purchased && (
            <span className={styles.owned}>{ru ? 'В Vault' : 'In Vault'}</span>
          )}
        </div>
        <div className={styles.actions}>
          {purchased ? (
            <Link to={`/vault/${product.slug}`} className={styles.buyBtn}>
              {ru ? 'Открыть' : 'Open'}
            </Link>
          ) : (
            <Link to={`/vault/${product.slug}/buy`} className={styles.buyBtn}>
              {ru ? 'Купить' : 'Buy'}
            </Link>
          )}
          <Link to={`/vault/${product.slug}`} className={styles.detailsBtn}>
            {ru ? 'Подробнее' : 'Details'}
          </Link>
        </div>
      </div>
    </article>
  )
}
