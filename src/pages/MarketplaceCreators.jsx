import { Link, Navigate, useParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import {
  MARKETPLACE_CREATORS,
  CREATOR_REVENUE_SHARE,
  getMarketplaceCreator,
} from '../data/marketplace/creators'
import { getProductsByCreator } from '../data/marketplace/products'
import { MarketplaceProductCard } from '../components/marketplace/MarketplaceProductCard'
import { getMarketplaceDiscountPercent } from '../data/marketplace/discounts'
import { ScrollReveal } from '../components/ScrollReveal'
import styles from './MarketplaceCreators.module.css'

export function MarketplaceCreators() {
  const { creatorSlug } = useParams()
  const { lang } = useLanguage()
  const { hasPurchased, purchases } = useAuth()
  const ru = lang === 'ru'
  const discountPercent = getMarketplaceDiscountPercent(purchases)

  if (creatorSlug) {
    const creator = getMarketplaceCreator(creatorSlug)
    if (!creator) return <Navigate to="/marketplace/creators" replace />

    const products = getProductsByCreator(creator.id)
    const bio = ru ? creator.bioRu : creator.bioEn

    return (
      <div className={styles.wrap}>
        <div className={styles.container}>
          <Link to="/marketplace/creators" className={styles.link}>
            {ru ? '← Все креаторы' : '← All creators'}
          </Link>
          <header className={styles.profileHeader}>
            <span
              className={styles.profileAvatar}
              style={{ background: creator.avatarGradient }}
              aria-hidden
            />
            <div>
              <h1 className={styles.title} style={{ WebkitTextFillColor: 'unset', color: 'var(--text)' }}>
                {creator.name}
                {creator.verified && ' ✓'}
              </h1>
              <p className={styles.lead}>{bio}</p>
              <p className={styles.creatorMeta}>
                {creator.salesCount.toLocaleString()} {ru ? 'продаж' : 'sales'} ·{' '}
                {products.length} {ru ? 'продуктов' : 'products'}
              </p>
            </div>
          </header>
          <div className={styles.creatorGrid}>
            {products.map((product) => (
              <MarketplaceProductCard
                key={product.id}
                product={product}
                lang={lang}
                purchased={hasPurchased(product.id)}
                discountPercent={discountPercent}
                purchases={purchases}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <ScrollReveal>
          <header className={styles.hero}>
            <h1 className={styles.title}>
              {ru ? 'Стать креатором Marketplace' : 'Become a Marketplace Creator'}
            </h1>
            <p className={styles.lead}>
              {ru
                ? 'Продавайте AI-шаблоны, workflow и агентов студентам Academy. Выбранные партнёры и выпускники Accelerator получают доступ к публикации.'
                : 'Sell AI templates, workflows and agents to Academy students. Selected partners and Accelerator graduates can publish.'}
            </p>
            <div className={styles.split}>
              <div className={styles.stat}>
                <strong>{CREATOR_REVENUE_SHARE.creator * 100}%</strong>
                <span>{ru ? 'доход креатору' : 'creator revenue'}</span>
              </div>
              <div className={styles.stat}>
                <strong>{CREATOR_REVENUE_SHARE.platform * 100}%</strong>
                <span>{ru ? 'платформа AI Insider' : 'AI Insider platform'}</span>
              </div>
            </div>
            <Link to="/cabinet#support" className={styles.link}>
              {ru ? 'Подать заявку в поддержку →' : 'Apply via support →'}
            </Link>
          </header>
        </ScrollReveal>

        <h2 className={styles.title} style={{ fontSize: '1.25rem', marginBottom: 20 }}>
          {ru ? 'Креаторы' : 'Creators'}
        </h2>
        <div className={styles.creatorGrid}>
          {MARKETPLACE_CREATORS.map((creator) => (
            <article key={creator.id} className={styles.creatorCard}>
              <span
                className={styles.avatar}
                style={{ background: creator.avatarGradient }}
                aria-hidden
              />
              <h3 className={styles.creatorName}>{creator.name}</h3>
              <p className={styles.creatorBio}>{ru ? creator.bioRu : creator.bioEn}</p>
              <p className={styles.creatorMeta}>
                {creator.productCount} {ru ? 'продуктов' : 'products'} ·{' '}
                {creator.salesCount.toLocaleString()} {ru ? 'продаж' : 'sales'}
              </p>
              <Link to={`/marketplace/creators/${creator.slug}`} className={styles.link}>
                {ru ? 'Смотреть магазин →' : 'View store →'}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
