import { Link } from 'react-router-dom'
import {
  VAULT_HUB,
  VAULT_PRODUCTS,
  VAULT_COMPLETE_BUNDLE,
} from '../data/vaultProducts'
import { VaultCatalogCard } from './VaultCatalogCard'
import styles from './VaultSection.module.css'

export function VaultSection({
  lang,
  hasPurchased,
  compact = false,
  hideHeader = false,
  showMoreLink = true,
  showMarketLink = true,
}) {
  const ru = lang === 'ru'
  const audience = ru ? VAULT_HUB.audienceRu : VAULT_HUB.audienceEn
  const benefits = ru ? VAULT_HUB.benefitsRu : VAULT_HUB.benefitsEn
  const stats = VAULT_HUB.stats || []
  const bundle = VAULT_COMPLETE_BUNDLE
  const savings = bundle.oldPriceEur - bundle.priceEur

  return (
    <section
      id="vault"
      className={`${styles.section} ${compact ? styles.compact : ''} ${hideHeader ? styles.noHeader : ''}`}
    >
      {!hideHeader && (
        <div className={styles.sectionHead}>
          <span className={styles.pill}>Vault</span>
          <h2 className={styles.sectionTitle}>
            {ru ? VAULT_HUB.titleRu : VAULT_HUB.titleEn}
          </h2>
          <p className={styles.sectionDesc}>
            {ru ? VAULT_HUB.leadRu : VAULT_HUB.leadEn}
          </p>
        </div>
      )}

      <div className={styles.meta}>
        {stats.length > 0 && (
          <div className={styles.stats}>
            {stats.map((item) => (
              <div key={item.value + item.labelRu} className={styles.stat}>
                <strong>{item.value}</strong>
                <span>{ru ? item.labelRu : item.labelEn}</span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.audience}>
          {audience.map((tag) => (
            <span key={tag} className={styles.audienceTag}>
              {tag}
            </span>
          ))}
        </div>
        <p className={styles.priceHint}>
          {ru
            ? `Отдельные продукты: ${VAULT_HUB.priceFromEur}€–${VAULT_HUB.priceToEur}€`
            : `Individual products: €${VAULT_HUB.priceFromEur}–${VAULT_HUB.priceToEur}`}
        </p>
      </div>

      <ul className={styles.benefits}>
        {benefits.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <article className={styles.bundle}>
        <div className={styles.bundleText}>
          <span className={styles.bundleBadge}>
            {ru ? 'Все Vault' : 'All Vaults'}
          </span>
          <h3 className={styles.bundleTitle}>
            {ru ? bundle.titleRu : bundle.titleEn}
          </h3>
          <p className={styles.bundleDesc}>
            {ru ? bundle.descRu : bundle.descEn}
          </p>
        </div>
        <div className={styles.bundlePriceCol}>
          <div className={styles.bundlePrices}>
            <strong className={styles.bundlePrice}>{bundle.priceEur}€</strong>
            <span className={styles.bundleOld}>{bundle.oldPriceEur}€</span>
          </div>
          <span className={styles.bundleSave}>
            {ru ? `экономия ${savings}€` : `save €${savings}`}
          </span>
          <Link to="/cabinet#support" className={styles.bundleBtn}>
            {ru ? 'Купить bundle' : 'Buy bundle'}
          </Link>
        </div>
      </article>

      <div className={styles.grid}>
        {VAULT_PRODUCTS.map((product) => (
          <VaultCatalogCard
            key={product.id}
            product={product}
            lang={lang}
            purchased={hasPurchased?.(product.id)}
          />
        ))}
      </div>

      <div className={styles.footerLinks}>
        {showMoreLink && (
          <Link to="/vault" className={styles.moreLink}>
            {ru ? 'Все Vault-продукты →' : 'All Vault products →'}
          </Link>
        )}
        {showMarketLink && (
          <Link to="/marketplace" className={styles.marketLink}>
            {ru ? 'Больше шаблонов в Marketplace →' : 'More templates in Marketplace →'}
          </Link>
        )}
      </div>
    </section>
  )
}
