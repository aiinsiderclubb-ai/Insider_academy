import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Infinity as InfinityIcon } from 'lucide-react'
import { VAULT_HUB } from '../data/vaultProducts'
import { VaultSection } from './VaultSection'
import styles from './HomeProductsSection.module.css'

export function HomeProductsSection({ lang, hasPurchased }) {
  const ru = lang === 'ru'

  return (
    <section className={styles.section} aria-labelledby="home-products-heading">
      <div className={styles.container}>
        <header className={styles.sectionHead}>
          <span className={styles.eyebrow}>{ru ? 'Готово к внедрению' : 'Ready to deploy'}</span>
          <h2 id="home-products-heading" className={styles.sectionTitle}>
            {ru ? 'Не только учитесь — запускайте' : 'Go beyond learning — launch'}
          </h2>
          <p className={styles.sectionDesc}>
            {ru
              ? 'Проверенные промпты, workflow и продуктовые киты для работы и собственного AI-бизнеса.'
              : 'Proven prompts, workflows and product kits for client work and your own AI business.'}
          </p>
        </header>

        <div className={styles.introGrid}>
          <article className={`${styles.introCard} ${styles.introMarket}`}>
            <div className={styles.cardTop}>
              <span className={styles.pillMarket}>Marketplace</span>
              <span className={styles.cardGlyph} aria-hidden>
                <ArrowUpRight size={18} strokeWidth={1.8} />
              </span>
            </div>
            <h3 className={styles.introTitle}>AI Insider Marketplace</h3>
            <p className={styles.introDesc}>
              {ru
                ? 'Промпты, n8n, агенты и SaaS-киты — купите и внедрите за часы.'
                : 'Prompts, n8n, agents and SaaS kits — buy and deploy in hours.'}
            </p>
            <Link to="/marketplace" className={styles.introLink}>
              {ru ? 'Открыть Marketplace' : 'Open Marketplace'}
              <ArrowRight size={14} strokeWidth={1.8} aria-hidden style={{ marginLeft: 6, flexShrink: 0 }} />
            </Link>
          </article>

          <article className={`${styles.introCard} ${styles.introVault}`}>
            <div className={styles.cardTop}>
              <span className={styles.pillVault}>Vault</span>
              <span className={styles.cardGlyph} aria-hidden>
                <InfinityIcon size={18} strokeWidth={1.8} />
              </span>
            </div>
            <h3 className={styles.introTitle}>
              {ru ? VAULT_HUB.titleRu : VAULT_HUB.titleEn}
            </h3>
            <p className={styles.introDesc}>
              {ru ? VAULT_HUB.leadRu : VAULT_HUB.leadEn}
            </p>
            <Link to="/marketplace?tab=vault" className={styles.introLink}>
              {ru ? 'Все Vault-продукты' : 'All Vault products'}
              <ArrowRight size={14} strokeWidth={1.8} aria-hidden style={{ marginLeft: 6, flexShrink: 0 }} />
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
