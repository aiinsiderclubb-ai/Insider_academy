import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, BadgeCheck, Store, WalletCards } from 'lucide-react'
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
            <ArrowLeft size={16} aria-hidden />
            {ru ? 'Все креаторы' : 'All creators'}
          </Link>
          <header className={styles.profileHeader}>
            <span
              className={styles.profileAvatar}
              style={{ background: creator.avatarGradient }}
              aria-hidden
            >
              <Store size={30} strokeWidth={1.7} />
            </span>
            <div>
              <h1 className={styles.title}>
                {creator.name}
                {creator.verified && <BadgeCheck className={styles.verifiedIcon} size={24} aria-label={ru ? 'Проверенный креатор' : 'Verified creator'} />}
              </h1>
              <p className={styles.lead}>{bio}</p>
              <p className={styles.creatorMeta}>
                {products.length} {ru ? 'продуктов' : 'products'} · {ru ? 'внутренняя команда Academy' : 'Academy in-house team'}
              </p>
              <p className={styles.creatorMeta}>{creator.operatorName} · {ru ? creator.roleRu : creator.roleEn}</p>
              <ul>{(ru ? creator.proofRu : creator.proofEn).map((item) => <li key={item}>{item}</li>)}</ul>
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
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>{ru ? 'CREATOR PROGRAM' : 'CREATOR PROGRAM'}</span>
              <h1 className={styles.title}>
                {ru ? 'Превратите AI-экспертизу в продукт' : 'Turn AI expertise into a product'}
              </h1>
              <p className={styles.lead}>
                {ru
                  ? 'Публикуйте AI-шаблоны, workflow и агентов для сообщества Academy. Мы берём на себя витрину, оплату и доступ покупателей.'
                  : 'Publish AI templates, workflows and agents for the Academy community. We handle the storefront, payments, and buyer access.'}
              </p>
              <div className={styles.split}>
                <div className={styles.stat}>
                  <WalletCards size={20} aria-hidden />
                  <div>
                    <strong>{CREATOR_REVENUE_SHARE.creator * 100}%</strong>
                    <span>{ru ? 'доход креатору' : 'creator revenue'}</span>
                  </div>
                </div>
                <div className={styles.stat}>
                  <Store size={20} aria-hidden />
                  <div>
                    <strong>{CREATOR_REVENUE_SHARE.platform * 100}%</strong>
                    <span>{ru ? 'сервис платформы' : 'platform service'}</span>
                  </div>
                </div>
              </div>
              <Link to="/cabinet#support" className={styles.ctaLink}>
                {ru ? 'Подать заявку' : 'Apply via support'}
                <ArrowUpRight size={17} aria-hidden />
              </Link>
            </div>
            <div className={styles.heroVisual}>
              <img src="/design/course-ai-content-business.webp" alt="" aria-hidden />
              <span className={styles.visualBadge}>
                <BadgeCheck size={16} aria-hidden />
                {ru ? 'Отборная коллекция' : 'Curated collection'}
              </span>
            </div>
          </header>
        </ScrollReveal>

        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>{ru ? 'MARKETPLACE' : 'MARKETPLACE'}</span>
          <h2>{ru ? 'Креаторы Academy' : 'Academy creators'}</h2>
        </div>
        <div className={styles.creatorGrid}>
          {MARKETPLACE_CREATORS.map((creator) => (
            <article key={creator.id} className={styles.creatorCard}>
              <span
                className={styles.avatar}
                style={{ background: creator.avatarGradient }}
                aria-hidden
              >
                <Store size={22} strokeWidth={1.7} />
              </span>
              <h3 className={styles.creatorName}>
                {creator.name}
                {creator.verified && <BadgeCheck className={styles.verifiedIcon} size={17} aria-label={ru ? 'Проверенный креатор' : 'Verified creator'} />}
              </h3>
              <p className={styles.creatorBio}>{ru ? creator.bioRu : creator.bioEn}</p>
              <p className={styles.creatorMeta}>
                {getProductsByCreator(creator.id).length} {ru ? 'продуктов' : 'products'} · {creator.operatorName}
              </p>
              <Link to={`/marketplace/creators/${creator.slug}`} className={styles.link}>
                {ru ? 'Смотреть магазин' : 'View store'}
                <ArrowUpRight size={15} aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
