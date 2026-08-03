import { useEffect, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { ProductBadge } from '../components/ProductBadge'
import { StarRating } from '../components/StarRating'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { AI_INCOME_COLLECTION, getMarketplaceProduct, getRelatedProducts } from '../data/marketplace/products'
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
import { api } from '../api/client'

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
  const [marketplaceData, setMarketplaceData] = useState(null)

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
  const incomeMeta = AI_INCOME_COLLECTION.find((item) => item.productId === product.id)
  const isPreviewRelease = product.releaseStatus === 'preview'
  const reviews = marketplaceData?.reviews || []

  useEffect(() => {
    let cancelled = false
    api.marketplaceProduct(product.id)
      .then((data) => { if (!cancelled) setMarketplaceData(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [product.id])

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

  const installRu = isPreviewRelease
    ? ['Мы завершаем файлы и тестовые сценарии', 'Проверяем инструкции и безопасность deploy', 'Продажи откроются только после публикации версии']
    : ['Оплатите продукт', 'Откройте Личный кабинет → Marketplace', 'Скачайте ZIP и следуйте PDF-гайду']
  const installEn = isPreviewRelease
    ? ['We are finalizing files and test scenarios', 'Deployment instructions and security are being verified', 'Sales open only after a version is published']
    : ['Purchase the product', 'Open Account → Marketplace', 'Download ZIP and follow the PDF guide']
  const install = ru ? installRu : installEn

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
                    <article key={r.id} className={styles.review}>
                      <div className={styles.reviewHead}>
                        <strong>{r.userName || (ru ? 'Покупатель' : 'Customer')}</strong>
                        <StarRating rating={r.rating} className={styles.reviewStars} />
                      </div>
                      <p>{r.text}</p>
                    </article>
                  ))}
                  {reviews.length === 0 && (
                    <p>{ru ? 'Пока нет подтверждённых отзывов.' : 'No verified reviews yet.'}</p>
                  )}
                </div>
              </section>
            </ScrollReveal>

            {!isPreviewRelease && (
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
            )}

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
            <span className={styles.categoryLabel}>
              {category ? (ru ? category.titleRu : category.titleEn) : product.productType}
            </span>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.short}>{short}</p>

            <div className={styles.meta}>
              {marketplaceData?.product?.reviewCount > 0 ? (
                <>
                  <span className={styles.reviewStars}>★ {marketplaceData.product.rating}</span>
                  <span>({marketplaceData.product.reviewCount})</span>
                </>
              ) : product.badge ? (
                <ProductBadge type={product.badge} lang={lang} variant="inline" />
              ) : null}
            </div>
            {incomeMeta && (
              <div className={styles.outcomePanel}>
                <span>{ru ? 'Что вы сможете продавать' : 'What you can sell'}</span>
                <strong>{ru ? incomeMeta.outcomeRu : incomeMeta.outcomeEn}</strong>
                <div>
                  <small>{ru ? 'Запуск' : 'Launch'} · {ru ? incomeMeta.launchRu : incomeMeta.launchEn}</small>
                  <small>{ru ? incomeMeta.serviceRu : incomeMeta.serviceEn}</small>
                </div>
              </div>
            )}
            <div>
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

            {isPreviewRelease ? (
              <>
                <span className={`${styles.btnPrimary} ${styles.releasePending}`}>
                  {ru ? 'Готовим проверенный релиз' : 'Verified release in progress'}
                </span>
                <Link to="/marketplace#catalog" className={styles.btnSecondary}>
                  {ru ? 'Посмотреть доступные системы' : 'Browse available systems'}
                </Link>
              </>
            ) : purchased ? (
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
