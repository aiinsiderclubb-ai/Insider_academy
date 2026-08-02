import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Download,
  Layers,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import { ProductBadge, productHasPublicStats } from '../components/ProductBadge'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { getMarketplaceCategory } from '../data/marketplace/categories'
import { getMarketplaceCreator } from '../data/marketplace/creators'
import { MarketplaceProductCard } from '../components/marketplace/MarketplaceProductCard'
import { MarketplaceFreePreview } from '../components/MarketplaceFreePreview'
import { ScrollReveal } from '../components/ScrollReveal'
import { getMarketplaceCoverImage } from '../utils/marketplaceCover'
import { getMarketplaceProductAbout } from '../utils/marketplaceProductAbout'
import { ComingSoonAction } from '../components/ComingSoonLock'
import { isComingSoon } from '../config/availability'
import styles from './MarketplaceProduct.module.css'

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
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState('')
  const [accessGranted, setAccessGranted] = useState(false)
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { user, hasPurchased } = useAuth()
  const ru = lang === 'ru'

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      api.marketplaceProduct(productSlug),
      api.marketplaceProducts('marketplace'),
    ]).then(async ([detail, catalog]) => {
      if (!active) return
      const nextProduct = detail.product
      setProduct(nextProduct)
      setRelated((catalog.products || []).filter((item) => item.id !== nextProduct.id && item.categoryId === nextProduct.categoryId).slice(0, 3))
      const reviewData = await api.getReviews(nextProduct.id).catch(() => ({ reviews: [] }))
      if (active) setReviews(reviewData.reviews || [])
    }).catch(() => {
      if (active) setProduct(null)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [productSlug])

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

  const about = useMemo(() => {
    if (!product) return { lead: '', body: [], outcomes: [], facts: [] }
    const category = getMarketplaceCategory(product.categoryId)
    return getMarketplaceProductAbout(product, { lang, category })
  }, [product, lang])

  if (loading) return <div className={styles.wrap}><div className={styles.container}>{ru ? 'Загрузка…' : 'Loading…'}</div></div>
  if (!product) return <Navigate to="/marketplace" replace />

  const purchased = hasPurchased(product.id) || accessGranted
  const finalPrice = Number(product.priceEur || 0)
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
  const showPaid = searchParams.get('paid') === '1'
  const activeImage = gallery[Math.min(activeMedia, gallery.length - 1)]
  const comingSoon = isComingSoon('marketplace')

  const claimFree = async () => {
    if (!user) {
      navigate(`/login?returnTo=${encodeURIComponent(`/marketplace/${product.slug}`)}`)
      return
    }
    setClaiming(true)
    setClaimError('')
    try {
      await api.claimMarketplaceProduct(product.id)
      setAccessGranted(true)
      navigate('/cabinet#marketplace')
    } catch (error) {
      setClaimError(error.message || (ru ? 'Не удалось открыть доступ' : 'Could not grant access'))
    } finally {
      setClaiming(false)
    }
  }

  const metadataRequirements = (ru ? product.requirementsRu : product.requirementsEn) || []
  const requirements = [
    ru ? 'Аккаунт AI Insider Academy' : 'AI Insider Academy account',
    ...metadataRequirements,
    product.categoryId === 'n8n-workflows'
      ? (ru ? 'Self-hosted или cloud n8n' : 'Self-hosted or cloud n8n')
      : null,
    product.productType === 'agent-pack'
      ? (ru ? 'API ключ LLM (OpenAI / Anthropic)' : 'LLM API key (OpenAI / Anthropic)')
      : null,
  ].filter(Boolean).filter((item, index, all) => all.indexOf(item) === index)

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
              <section className={styles.detailsSection} aria-label={ru ? 'Детали продукта' : 'Product details'}>
                <article className={`${styles.detailCard} ${styles.detailCardAbout}`}>
                  <header className={styles.detailHead}>
                    <span className={styles.detailEyebrow}>01</span>
                    <h2>{ru ? 'О продукте' : 'About this product'}</h2>
                  </header>

                  <div className={styles.aboutGrid}>
                    <div className={styles.aboutMain}>
                      <p className={styles.aboutLead}>{about.lead}</p>
                      {about.body.map((paragraph) => (
                        <p key={paragraph} className={styles.aboutBody}>{paragraph}</p>
                      ))}

                      <div className={styles.aboutOutcomes}>
                        <span className={styles.aboutOutcomesLabel}>
                          <Sparkles size={13} aria-hidden />
                          {ru ? 'Что вы получите' : 'What you get'}
                        </span>
                        <ul className={styles.aboutOutcomeList}>
                          {about.outcomes.map((item) => (
                            <li key={item}>
                              <span className={styles.aboutOutcomeIcon} aria-hidden>
                                <Zap size={12} strokeWidth={2.4} />
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <aside className={styles.aboutFacts} aria-label={ru ? 'Ключевые параметры' : 'Key specs'}>
                      {about.facts.map((fact) => (
                        <div
                          key={fact.id}
                          className={styles.aboutFact}
                          style={fact.accent ? { '--fact-accent': fact.accent } : undefined}
                        >
                          <span className={styles.aboutFactLabel}>{fact.label}</span>
                          <strong className={styles.aboutFactValue}>{fact.value}</strong>
                        </div>
                      ))}
                      {(product.fileTypes || []).length > 0 && (
                        <div className={styles.aboutFact}>
                          <span className={styles.aboutFactLabel}>
                            <Layers size={12} aria-hidden />
                            {ru ? 'Форматы' : 'Formats'}
                          </span>
                          <div className={styles.aboutFactFormats}>
                            {(product.fileTypes || ['ZIP']).map((type) => (
                              <span key={type} className={styles.formatPill}>{type}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </aside>
                  </div>
                </article>

                <article className={styles.detailCard}>
                  <header className={styles.detailHead}>
                    <span className={styles.detailEyebrow}>02</span>
                    <h2>{ru ? 'Что входит' : 'What is included'}</h2>
                  </header>
                  <ul className={styles.includedGrid}>
                    {included.map((item) => (
                      <li key={item}>
                        <span className={styles.includedIcon} aria-hidden>
                          <Check size={14} strokeWidth={2.4} />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.formatRow}>
                    <span className={styles.formatLabel}>{ru ? 'Форматы' : 'Formats'}</span>
                    {(product.fileTypes || ['ZIP']).map((type) => (
                      <span key={type} className={styles.formatPill}>{type}</span>
                    ))}
                  </div>
                </article>

                <div className={styles.detailSplit}>
                  <article className={`${styles.detailCard} ${styles.detailCardCompact}`}>
                    <header className={styles.detailHead}>
                      <span className={styles.detailEyebrow}>03</span>
                      <h2>{ru ? 'Требования' : 'Requirements'}</h2>
                    </header>
                    <ul className={styles.requirementList}>
                      {requirements.map((item) => (
                        <li key={item}>
                          <span className={styles.requirementIcon} aria-hidden>
                            <ShieldCheck size={14} strokeWidth={2.2} />
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </article>

                  <article className={`${styles.detailCard} ${styles.detailCardCompact}`}>
                    <header className={styles.detailHead}>
                      <span className={styles.detailEyebrow}>04</span>
                      <h2>{ru ? 'Как начать' : 'Get started'}</h2>
                    </header>
                    <ol className={styles.stepList}>
                      {installation.map((item, index) => (
                        <li key={item}>
                          <span className={styles.stepNumber} aria-hidden>{index + 1}</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ol>
                  </article>
                </div>
              </section>
            </ScrollReveal>

            {reviews.length > 0 && <ScrollReveal>
              <section className={styles.blockStack}>
                <div className={styles.sectionHeading}>
                  <span>{ru ? 'Проверено сообществом' : 'Community tested'}</span>
                  <h2>{ru ? 'Отзывы покупателей' : 'Customer reviews'}</h2>
                </div>
                <div className={styles.reviews}>
                  {reviews.map((review) => (
                    <article key={review.name} className={styles.review}>
                      <div className={styles.reviewHead}>
                        <strong>{review.userName}</strong>
                        <LucideStarRating rating={review.rating} className={styles.reviewStars} />
                      </div>
                      <p>{review.text}</p>
                    </article>
                  ))}
                </div>
              </section>
            </ScrollReveal>}

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
            </div>

            <ul className={styles.railPerks}>
              <li><Check size={14} aria-hidden />{ru ? 'Мгновенный доступ' : 'Instant access'}</li>
              <li><Check size={14} aria-hidden />{ru ? 'Коммерческая лицензия' : 'Commercial license'}</li>
              <li><Check size={14} aria-hidden />{ru ? 'Обновления включены' : 'Updates included'}</li>
            </ul>

            {claimError && <p className={styles.discount} role="alert">{claimError}</p>}
            {comingSoon ? (
              <ComingSoonAction kind="marketplace" lang={lang} className={styles.btnPrimary} />
            ) : purchased ? (
              <>
                <Link to="/cabinet#marketplace" className={styles.btnPrimary}>
                  {ru ? 'Скачать продукт' : 'Download product'} <Download size={16} aria-hidden />
                </Link>
                <span className={styles.ownedRail}>{ru ? 'Уже в вашей библиотеке' : 'Already in your library'}</span>
              </>
            ) : product.isFree ? (
              <button type="button" className={styles.btnPrimary} onClick={claimFree} disabled={claiming}>
                {claiming ? (ru ? 'Открываем…' : 'Granting…') : (ru ? 'Получить бесплатно' : 'Get for free')}
                <Download size={16} aria-hidden />
              </button>
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
                    discountPercent={0}
                    purchases={[]}
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
