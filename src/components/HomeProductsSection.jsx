import { Link } from 'react-router-dom'
import { VAULT_HUB } from '../data/vaultProducts'
import { VaultSection } from './VaultSection'
import styles from './HomeProductsSection.module.css'

export function HomeProductsSection({ lang, hasPurchased }) {
  const ru = lang === 'ru'

  return (
    <section className={styles.section} aria-labelledby="home-products-heading">
      <div className={styles.container}>
        <h2 id="home-products-heading" className={styles.srOnly}>
          {ru ? 'Цифровые продукты' : 'Digital products'}
        </h2>

        <div className={styles.introGrid}>
          <article className={`${styles.introCard} ${styles.introMarket}`}>
            <span className={styles.pillMarket}>Marketplace</span>
            <h3 className={styles.introTitle}>AI Insider Marketplace</h3>
            <p className={styles.introDesc}>
              {ru
                ? 'Промпты, n8n, агенты и SaaS-киты — купите и внедрите за часы.'
                : 'Prompts, n8n, agents and SaaS kits — buy and deploy in hours.'}
            </p>
            <Link to="/marketplace" className={styles.introLink}>
              {ru ? 'Открыть Marketplace' : 'Open Marketplace'} →
            </Link>
          </article>

          <article className={`${styles.introCard} ${styles.introVault}`}>
            <span className={styles.pillVault}>Vault</span>
            <h3 className={styles.introTitle}>
              {ru ? VAULT_HUB.titleRu : VAULT_HUB.titleEn}
            </h3>
            <p className={styles.introDesc}>
              {ru ? VAULT_HUB.leadRu : VAULT_HUB.leadEn}
            </p>
            <Link to="/marketplace?tab=vault" className={styles.introLink}>
              {ru ? 'Все Vault-продукты' : 'All Vault products'} →
            </Link>
          </article>
        </div>

        <VaultSection
          lang={lang}
          hasPurchased={hasPurchased}
          hideHeader
          showMarketLink={false}
        />
      </div>
    </section>
  )
}
