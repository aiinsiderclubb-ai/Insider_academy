import { Link, Navigate, useParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getMarketplaceProduct, getRelatedProducts } from '../data/marketplace/products'
import { getMarketplaceCategory } from '../data/marketplace/categories'
import { getMarketplaceCreator } from '../data/marketplace/creators'
import {
  getMarketplaceDiscountPercent,
  getMarketplacePrice,
  isMarketplaceProductIncludedForUser,
} from '../data/marketplace/discounts'
import { MarketplaceProductCard } from '../components/marketplace/MarketplaceProductCard'
import { ScrollReveal } from '../components/ScrollReveal'
import styles from './MarketplaceProduct.module.css'

const MOCK_REVIEWS_RU = [
  { name: 'Алексей М.', rating: 5, text: 'Сэкономил неделю настройки — всё по инструкции.' },
  { name: 'Maria K.', rating: 5, text: 'Качество шаблонов на уровне, рекомендую агентствам.' },
  { name: 'Dev Studio', rating: 4, text: 'Отличная база, доработал под клиента за день.' },
]
const MOCK_REVIEWS_EN = [
  { name: 'Alexey M.', rating: 5, text: 'Saved a week of setup — clear instructions.' },
  { name: 'Maria K.', rating: 5, text: 'Template quality is top tier for agencies.' },
  { name: 'Dev Studio', rating: 4, text: 'Great base, customized for a client in one day.' },
]

export function MarketplaceProduct() {
  const { productSlug } = useParams()
  const { lang } = useLanguage()
  const { hasPurchased, purchases } = useAuth()
  const ru = lang === 'ru'

  const product = getMarketplaceProduct(productSlug)
  if (!product) return <Navigate to="/marketplace" replace />

  const purchased =
    hasPurchased(product.id) || isMarketplaceProductIncludedForUser(product.id, purchases)
  const discountPercent = getMarketplaceDiscountPercent(purchases)
  const finalPrice = getMarketplacePrice(product.priceEur, purchases)
  const title = ru ? product.titleRu : product.titleEn
  const short = ru ? product.shortRu : product.shortEn
  const included = ru ? product.includedRu : product.includedEn
  const faq = ru ? product.faqRu : product.faqEn
  const category = getMarketplaceCategory(product.categoryId)
  const creator = getMarketplaceCreator(product.creatorId)
  const related = getRelatedProducts(product)
  const reviews = ru ? MOCK_REVIEWS_RU : MOCK_REVIEWS_EN

  const requirementsRu = [
    'Аккаунт AI Insider Academy',
    product.categoryId === 'n8n-workflows' ? 'Self-hosted или cloud n8n' : null,
    product.productType === 'agent-pack' ? 'API ключ LLM (OpenAI / Anthropic)' : null,
  ].filter(Boolean)
  const requirementsEn = [
    'AI Insider Academy account',
    product.categoryId === 'n8n-workflows' ? 'Self-hosted or cloud n8n' : null,
    product.productType === 'agent-pack' ? 'LLM API key (OpenAI / Anthropic)' : null,
  ].filter(Boolean)
  const requirements = ru ? requirementsRu : requirementsEn

  const installRu = [
    'Оплатите продукт',
    'Откройте Личный кабинет → Marketplace',
    'Скачайте ZIP и следуйте PDF-гайду',
  ]
  const installEn = ['Purchase the product', 'Open Account → Marketplace', 'Download ZIP and follow the PDF guide']
  const install = ru ? installRu : installEn

  return (
    <div className={styles.wrap}>
      <div
        className={styles.container}
        style={{ '--mp-cover': product.coverGradient }}
      >
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/marketplace">Marketplace</Link>
          <span aria-hidden>/</span>
          {category && (
            <>
              <span>{ru ? category.titleRu : category.titleEn}</span>
              <span aria-hidden>/</span>
            </>
          )}
          <span>{title}</span>
        </nav>

        <div className={styles.layout}>
          <div>
            <div className={styles.preview}>
              <span className={styles.previewIcon} aria-hidden>
                {product.coverIcon}
              </span>
            </div>

            <ScrollReveal>
              <section className={styles.block}>
                <h2>{ru ? 'Обзор' : 'Overview'}</h2>
                <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>{short}</p>
              </section>
            </ScrollReveal>

            <ScrollReveal>
              <section className={styles.block}>
                <h2>{ru ? 'Что входит' : 'What\'s included'}</h2>
                <ul className={styles.list}>
                  {included.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p style={{ margin: '12px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {ru ? 'Форматы: ' : 'Formats: '}
                  {product.fileTypes.join(', ')}
                </p>
              </section>
            </ScrollReveal>

            <ScrollReveal>
              <section className={styles.block}>
                <h2>{ru ? 'Требования' : 'Requirements'}</h2>
                <ul className={styles.list}>
                  {requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </ScrollReveal>

            <ScrollReveal>
              <section className={styles.block}>
                <h2>{ru ? 'Установка' : 'Installation'}</h2>
                <ul className={styles.list}>
                  {install.map((item, i) => (
                    <li key={item}>
                      {i + 1}. {item}
                    </li>
                  ))}
                </ul>
              </section>
            </ScrollReveal>

            <ScrollReveal>
              <section className={styles.block}>
                <h2>{ru ? 'Отзывы' : 'Reviews'}</h2>
                <div className={styles.reviews}>
                  {reviews.map((r) => (
                    <article key={r.name} className={styles.review}>
                      <div className={styles.reviewHead}>
                        <strong>{r.name}</strong>
                        <span className={styles.reviewStars}>{'★'.repeat(r.rating)}</span>
                      </div>
                      <p>{r.text}</p>
                    </article>
                  ))}
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal>
              <section className={styles.block}>
                <h2>FAQ</h2>
                {faq.map((item) => (
                  <div key={item.q} className={styles.faqItem}>
                    <strong>{item.q}</strong>
                    <p>{item.a}</p>
                  </div>
                ))}
              </section>
            </ScrollReveal>

            {related.length > 0 && (
              <ScrollReveal>
                <section className={styles.block}>
                  <h2>{ru ? 'Похожие продукты' : 'Related products'}</h2>
                  <div className={styles.relatedGrid}>
                    {related.map((p) => (
                      <MarketplaceProductCard
                        key={p.id}
                        product={p}
                        lang={lang}
                        purchased={hasPurchased(p.id)}
                        discountPercent={discountPercent}
                        purchases={purchases}
                      />
                    ))}
                  </div>
                </section>
              </ScrollReveal>
            )}
          </div>

          <aside className={styles.sidebar}>
            <h1 className={styles.title}>{title}</h1>
            <div className={styles.meta}>
              <span className={styles.reviewStars}>★ {product.rating}</span>
              <span>({product.reviewCount})</span>
              <span>↓ {product.downloads.toLocaleString()}</span>
            </div>
            <div>
              <span className={styles.price}>{finalPrice}€</span>
              {discountPercent > 0 && finalPrice < product.priceEur && (
                <span className={styles.oldPrice}>{product.priceEur}€</span>
              )}
            </div>
            {discountPercent > 0 && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--accent-orange)', margin: '8px 0 0' }}>
                {ru ? `Скидка подписки −${discountPercent}%` : `Membership discount −${discountPercent}%`}
              </p>
            )}

            {creator && (
              <Link to={`/marketplace/creators/${creator.slug}`} className={styles.creator}>
                <span
                  className={styles.creatorAvatar}
                  style={{ background: creator.avatarGradient }}
                  aria-hidden
                />
                <span>
                  <span className={styles.creatorName}>{creator.name}</span>
                  {creator.verified && (
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ✓ {ru ? 'Проверенный креатор' : 'Verified creator'}
                    </span>
                  )}
                </span>
              </Link>
            )}

            {purchased ? (
              <>
                <Link to="/cabinet#marketplace" className={styles.btnPrimary}>
                  {ru ? 'Скачать →' : 'Download →'}
                </Link>
                <Link to={`/marketplace/${product.slug}`} className={styles.btnSecondary}>
                  {ru ? 'Уже куплено' : 'Already owned'}
                </Link>
              </>
            ) : (
              <>
                <Link to={`/marketplace/${product.slug}/buy`} className={styles.btnPrimary}>
                  {ru ? 'Купить' : 'Purchase'}
                </Link>
                <Link to={`/marketplace/${product.slug}`} className={styles.btnSecondary}>
                  {ru ? 'Превью описания' : 'Preview details'}
                </Link>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
