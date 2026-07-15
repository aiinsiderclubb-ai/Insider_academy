import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Dot,
  Download,
  Plus,
  Star,
} from 'lucide-react'
import { ProductBadge, productHasPublicStats } from '../components/ProductBadge'
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
import { MarketplaceFreePreview } from '../components/MarketplaceFreePreview'
import { ScrollReveal } from '../components/ScrollReveal'
import { getMarketplaceCoverImage } from '../utils/marketplaceCover'
import { ComingSoonAction } from '../components/ComingSoonLock'
import { isComingSoon } from '../config/availability'
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

function LucideStarRating({ rating, className = '' }) {
  const filled = Math.floor(Math.min(5, Math.max(0, Number(rating) || 0)))

  return (
    <span className={className} aria-label={`${filled}/5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={index < filled ? '' : styles.starDim}
          size={12}
          fill={index < filled ? 'currentColor' : 'none'}
          aria-hidden
        />
      ))}
    </span>
  )
}

export function MarketplaceProduct() {
  const { productSlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeMedia, setActiveMedia] = useState(0)
  const { lang } = useLanguage()
  const { hasPurchased, purchases } = useAuth()
  const ru = lang === 'ru'
  const product = getMarketplaceProduct(productSlug)

  useEffect(() => {
    setActiveMedia(0)
  }, [productSlug])

  useEffect(() => {
    if (searchParams.get('paid') !== '1') return undefined
    const timer = setTimeout(() => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous)
        next.delete('paid')
        return next
      }, { replace: true })
    }, 4000)
    return () => clearTimeout(timer)
  }, [searchParams, setSearchParams])

  const gallery = useMemo(() => {
    if (!product) return []
    return [...new Set([getMarketplaceCoverImage(product), ...(product.screenshots || [])])]
  }, [product])

  if (!product) return <Navigate to="/marketplace" replace />

  const purchased =
    hasPurchased(product.id) || isMarketplaceProductIncludedForUser(product.id, purchases)
  const discountPercent = getMarketplaceDiscountPercent(purchases)
  const finalPrice = getMarketplacePrice(product.priceEur, purchases)
  const title = ru ? product.titleRu : product.titleEn
  const short = ru ? product.shortRu : product.shortEn
  const productIncluded = (ru ? product.includedRu : product.includedEn) || []
  const included = productIncluded.length > 0
    ? productIncluded
    : (ru
        ? [
            `Файлы продукта (${(product.fileTypes || ['ZIP']).join(', ')})`,
            'Пошаговая инструкция по внедрению',
            'Коммерческая лицензия и обновления',
          ]
        : [
            `Product files (${(product.fileTypes || ['ZIP']).join(', ')})`,
            'Step-by-step implementation guide',
            'Commercial license and updates',
          ])
  const faq = (ru ? product.faqRu : product.faqEn) || []
  const category = getMarketplaceCategory(product.categoryId)
  const creator = getMarketplaceCreator(product.creatorId)
  const related = getRelatedProducts(product)
  const reviews = ru ? MOCK_REVIEWS_RU : MOCK_REVIEWS_EN
  const showPaid = searchParams.get('paid') === '1'
  const activeImage = gallery[Math.min(activeMedia, gallery.length - 1)]
  const comingSoon = isComingSoon('marketplace')

  const requirements = [
    ru ? 'Аккаунт AI Insider Academy' : 'AI Insider Academy account',
    product.categoryId === 'n8n-workflows'
      ? (ru ? 'Self-hosted или cloud n8n' : 'Self-hosted or cloud n8n')
      : null,
    product.productType === 'agent-pack'
      ? (ru ? 'API ключ LLM (OpenAI / Anthropic)' : 'LLM API key (OpenAI / Anthropic)')
      : null,
  ].filter(Boolean)

  const installation = ru
    ? ['Оплатите продукт', 'Откройте раздел Marketplace в Личном кабинете', 'Скачайте ZIP и следуйте PDF-гайду']
    : ['Purchase the product', 'Open the Marketplace section in Account', 'Download ZIP and follow the PDF guide']

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        {showPaid && (
          <div className={styles.paidNotice} role="status">
            <span className={styles.paidIcon} aria-hidden><Check size={15} strokeWidth={2.4} /></span>
            <strong>{ru ? 'Оплата прошла успешно' : 'Payment complete'}</strong>
            <span>{ru ? 'Продукт уже доступен в личном кабинете.' : 'Your product is ready in the cabinet.'}</span>
          </div>
        )}

        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/marketplace">Marketplace</Link>
          <ChevronRight className={styles.breadcrumbIcon} size={14} aria-hidden />
          {category && <span>{ru ? category.titleRu : category.titleEn}</span>}
          <ChevronRight className={styles.breadcrumbIcon} size={14} aria-hidden />
          <span>{title}</span>
        </nav>

        <div className={styles.layout}>
          <main className={styles.main}>
            <section className={styles.gallery} aria-label={ru ? 'Галерея продукта' : 'Product gallery'}>
              <div className={styles.preview}>
                <img src={activeImage} alt={title} className={styles.previewCover} />
                <span className={styles.previewTag}>
                  {ru ? 'Реальный файл продукта' : 'Actual product artwork'}
                </span>
              </div>
              {gallery.length > 1 && (
                <div className={styles.shots}>
                  {gallery.map((src, index) => (
                    <button
                      key={src}
                      type="button"
                      className={`${styles.shotButton} ${index === activeMedia ? styles.shotActive : ''}`}
                      onClick={() => setActiveMedia(index)}
                      aria-label={`${ru ? 'Открыть изображение' : 'Open image'} ${index + 1}`}
                    >
                      <img src={src} alt="" className={styles.shot} loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {!purchased && product.freePreview && (
              <ScrollReveal>
                <MarketplaceFreePreview preview={product.freePreview} lang={lang} productTitle={title} />
              </ScrollReveal>
            )}

            <ScrollReveal>
              <section className={styles.block}>
                <span className={styles.blockIndex}>01</span>
                <div>
                  <h2>{ru ? 'О продукте' : 'About this product'}</h2>
                  <p className={styles.lead}>{short}</p>
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal>
              <section className={styles.block}>
                <span className={styles.blockIndex}>02</span>
                <div>
                  <h2>{ru ? 'Что входит' : 'What is included'}</h2>
                  <ul className={styles.list}>
                    {included.map((item) => (
                      <li key={item}>
                        <Check className={styles.listIcon} size={14} aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className={styles.formats}>
                    <span>{ru ? 'Форматы' : 'Formats'}</span>
                    {(product.fileTypes || ['ZIP']).map((type) => (
                      <span key={type} className={styles.formatType}>
                        <Dot size={13} aria-hidden />
                        {type}
                      </span>
                    ))}
                  </p>
                </div>
              </section>
            </ScrollReveal>

            <div className={styles.splitBlocks}>
              <ScrollReveal>
                <section className={styles.miniBlock}>
                  <span>03</span>
                  <h2>{ru ? 'Требования' : 'Requirements'}</h2>
                  <ul className={styles.compactList}>
                    {requirements.map((item) => (
                      <li key={item}>
                        <Dot className={styles.listIcon} size={16} aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </ScrollReveal>
              <ScrollReveal>
                <section className={styles.miniBlock}>
                  <span>04</span>
                  <h2>{ru ? 'Как начать' : 'Get started'}</h2>
                  <ol className={styles.compactList}>
                    {installation.map((item) => (
                      <li key={item}>
                        <Dot className={styles.listIcon} size={16} aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              </ScrollReveal>
            </div>

            <ScrollReveal>
              <section className={styles.blockStack}>
                <div className={styles.sectionHeading}>
                  <span>{ru ? 'Проверено сообществом' : 'Community tested'}</span>
                  <h2>{ru ? 'Отзывы покупателей' : 'Customer reviews'}</h2>
                </div>
                <div className={styles.reviews}>
                  {reviews.map((review) => (
                    <article key={review.name} className={styles.review}>
                      <div className={styles.reviewHead}>
                        <strong>{review.name}</strong>
                        <LucideStarRating rating={review.rating} className={styles.reviewStars} />
                      </div>
                      <p>{review.text}</p>
                    </article>
                  ))}
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal>
              <section className={styles.blockStack}>
                <div className={styles.sectionHeading}>
                  <span>{ru ? 'Перед покупкой' : 'Before you buy'}</span>
                  <h2>FAQ</h2>
                </div>
                <div className={styles.faq}>
                  {faq.map((item, index) => (
                    <details key={item.q} className={styles.faqItem} open={index === 0}>
                      <summary>{item.q}<Plus size={17} aria-hidden /></summary>
                      <p>{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          </main>

          <aside className={styles.sidebar}>
            <span className={styles.categoryLabel}>
              {category ? (ru ? category.titleRu : category.titleEn) : product.productType}
            </span>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.short}>{short}</p>

            <div className={styles.meta}>
              {productHasPublicStats(product) ? (
                <>
                  <span className={styles.reviewStars}>
                    <Star size={13} fill="currentColor" aria-hidden />
                    {product.rating}
                  </span>
                  <span>{product.reviewCount} {ru ? 'отзывов' : 'reviews'}</span>
                  <span className={styles.metaItem}>
                    <Download size={13} aria-hidden />
                    {product.downloads.toLocaleString()}
                  </span>
                </>
              ) : product.badge ? (
                <ProductBadge type={product.badge} lang={lang} variant="inline" />
              ) : null}
            </div>

            <div className={styles.priceRow}>
              <span className={styles.price}>{finalPrice}€</span>
              {discountPercent > 0 && finalPrice < product.priceEur && (
                <span className={styles.oldPrice}>{product.priceEur}€</span>
              )}
            </div>
            {discountPercent > 0 && finalPrice < product.priceEur && (
              <p className={styles.discount}>
                {ru ? `Ваша скидка по подписке −${discountPercent}%` : `Your membership discount −${discountPercent}%`}
              </p>
            )}

            <ul className={styles.railPerks}>
              <li><Check size={14} aria-hidden />{ru ? 'Мгновенный доступ' : 'Instant access'}</li>
              <li><Check size={14} aria-hidden />{ru ? 'Коммерческая лицензия' : 'Commercial license'}</li>
              <li><Check size={14} aria-hidden />{ru ? 'Обновления включены' : 'Updates included'}</li>
            </ul>

            {comingSoon ? (
              <ComingSoonAction kind="marketplace" lang={lang} className={styles.btnPrimary} />
            ) : purchased ? (
              <>
                <Link to="/cabinet#marketplace" className={styles.btnPrimary}>
                  {ru ? 'Скачать продукт' : 'Download product'} <Download size={16} aria-hidden />
                </Link>
                <span className={styles.ownedRail}>{ru ? 'Уже в вашей библиотеке' : 'Already in your library'}</span>
              </>
            ) : (
              <Link to={`/marketplace/${product.slug}/buy`} className={styles.btnPrimary}>
                {ru ? 'Купить сейчас' : 'Buy now'} <ArrowUpRight size={16} aria-hidden />
              </Link>
            )}

            {creator && (
              <Link to={`/marketplace/creators/${creator.slug}`} className={styles.creator}>
                <span className={styles.creatorAvatar} style={{ background: creator.avatarGradient }} aria-hidden />
                <span>
                  <span className={styles.creatorOverline}>{ru ? 'Автор продукта' : 'Created by'}</span>
                  <strong className={styles.creatorName}>
                    {creator.name}
                    {creator.verified && <BadgeCheck size={14} aria-label={ru ? 'Проверенный автор' : 'Verified creator'} />}
                  </strong>
                </span>
              </Link>
            )}
          </aside>
        </div>

        {related.length > 0 && (
          <ScrollReveal>
            <section className={styles.relatedSection}>
              <div className={styles.sectionHeading}>
                <span>{ru ? 'Продолжить собирать стек' : 'Keep building your stack'}</span>
                <h2>{ru ? 'Похожие продукты' : 'Related products'}</h2>
              </div>
              <div className={styles.relatedGrid}>
                {related.map((relatedProduct) => (
                  <MarketplaceProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                    lang={lang}
                    purchased={hasPurchased(relatedProduct.id)}
                    discountPercent={discountPercent}
                    purchases={purchases}
                  />
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}
      </div>
    </div>
  )
}
