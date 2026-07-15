import { Link } from 'react-router-dom'
import { ArrowDownRight, Check, Circle } from 'lucide-react'
import { MARKETPLACE_PRODUCTS } from '../../data/marketplace/products'
import { getMarketplaceCoverImage } from '../../utils/marketplaceCover'
import styles from './MarketplaceHero.module.css'

const FEATURED_SLUGS = [
  'ai-voice-agent-saas',
  'content-automation-workflow',
  'ai-research-agent',
]

export function MarketplaceHero({ lang }) {
  const ru = lang === 'ru'
  const products = FEATURED_SLUGS
    .map((slug) => MARKETPLACE_PRODUCTS.find((product) => product.slug === slug))
    .filter(Boolean)
  const lead = products[0] || MARKETPLACE_PRODUCTS[0]

  return (
    <header className={styles.hero}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>
          <Circle size={8} fill="currentColor" aria-hidden /> AI Insider Marketplace
        </span>
        <h1 className={styles.title}>
          {ru ? 'Готовые AI-системы.' : 'Production-ready AI.'}
          <span>{ru ? ' Запускайте быстрее.' : ' Ship faster.'}</span>
        </h1>
        <p className={styles.sub}>
          {ru
            ? 'Проверенные агенты, автоматизации и рабочие шаблоны для реального бизнеса — с файлами, инструкциями и обновлениями.'
            : 'Proven agents, automations and working templates for real businesses — complete with files, guides and updates.'}
        </p>
        <div className={styles.actions}>
          <a href="#catalog" className={styles.btnPrimary}>
            {ru ? 'Открыть каталог' : 'Explore catalog'}
            <ArrowDownRight size={17} aria-hidden />
          </a>
          <Link to="/marketplace/creators" className={styles.btnSecondary}>
            {ru ? 'Стать креатором' : 'Become a creator'}
          </Link>
        </div>
        <div className={styles.proof} aria-label={ru ? 'Преимущества' : 'Benefits'}>
          <span><Check size={14} aria-hidden />{ru ? 'Мгновенный доступ' : 'Instant access'}</span>
          <span><Check size={14} aria-hidden />{ru ? 'Коммерческая лицензия' : 'Commercial license'}</span>
          <span><Check size={14} aria-hidden />{ru ? 'Пожизненные обновления' : 'Lifetime updates'}</span>
        </div>
      </div>

      <div className={styles.visual} aria-label={ru ? 'Популярные продукты' : 'Featured products'}>
        <div className={styles.orbit} aria-hidden />
        {products.map((product, index) => {
          const title = ru ? product.titleRu : product.titleEn
          return (
            <Link
              key={product.id}
              to={`/marketplace/${product.slug}`}
              className={`${styles.artCard} ${index === 0 ? styles.artCardLead : ''}`}
              aria-label={title}
            >
              <img src={getMarketplaceCoverImage(product)} alt="" />
              <span className={styles.artMeta}>
                <strong>{title}</strong>
                <span>{product.priceEur}€</span>
              </span>
            </Link>
          )
        })}
        {lead && (
          <span className={styles.dropLabel}>
            {ru ? 'Дроп недели' : 'Drop of the week'}
          </span>
        )}
      </div>
    </header>
  )
}
