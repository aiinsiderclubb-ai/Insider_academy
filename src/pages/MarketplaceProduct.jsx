import { useEffect, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { ProductBadge } from '../components/ProductBadge'
import { StarRating } from '../components/StarRating'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { AI_INCOME_COLLECTION, getMarketplaceProduct, getRelatedProducts } from '../data/marketplace/products'
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
import { UiIcon } from '../components/UiIcon'
import { getMarketplaceCoverImage } from '../utils/marketplaceCover'
import styles from './MarketplaceProduct.module.css'
import { api } from '../api/client'
import { getDemoProofCases } from '../data/marketplace/proofCases'

export function MarketplaceProduct() {
  const { productSlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { lang } = useLanguage()
  const { hasPurchased, purchases } = useAuth()
  const ru = lang === 'ru'
  const [marketplaceData, setMarketplaceData] = useState(null)
  const [activeTab, setActiveTab] = useState('preview')

  const product = getMarketplaceProduct(productSlug)
  if (!product) return <Navigate to="/marketplace" replace />

  const purchased =
    hasPurchased(product.id) || isMarketplaceProductIncludedForUser(product.id, purchases)
  const discountPercent = getMarketplaceDiscountPercent(purchases)
  const finalPrice = getMarketplacePrice(product.priceEur, purchases)
  const title = ru ? product.titleRu : product.titleEn
  const short = ru ? product.shortRu : product.shortEn
  const included = (ru ? product.includedRu : product.includedEn) || []
  const faq = (ru ? product.faqRu : product.faqEn) || []
  const category = getMarketplaceCategory(product.categoryId)
  const creator = getMarketplaceCreator(product.creatorId)
  const related = getRelatedProducts(product)
  const incomeMeta = AI_INCOME_COLLECTION.find((item) => item.productId === product.id)
  const isPreviewRelease = product.releaseStatus === 'preview'
  const reviews = marketplaceData?.reviews || []
  const demoCases = getDemoProofCases(product.categoryId)

  useEffect(() => {
    let cancelled = false
    api.marketplaceProduct(product.id)
      .then((data) => { if (!cancelled) setMarketplaceData(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [product.id])

  useEffect(() => {
    if (searchParams.get('paid') !== '1') return
    const t = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('paid')
        return next
      }, { replace: true })
    }, 4000)
    return () => clearTimeout(t)
  }, [searchParams, setSearchParams])

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

  const installRu = isPreviewRelease
    ? ['Мы завершаем файлы и тестовые сценарии', 'Проверяем инструкции и безопасность deploy', 'Продажи откроются только после публикации версии']
    : ['Оплатите продукт', 'Откройте Личный кабинет → Marketplace', 'Скачайте ZIP и следуйте PDF-гайду']
  const installEn = isPreviewRelease
    ? ['We are finalizing files and test scenarios', 'Deployment instructions and security are being verified', 'Sales open only after a version is published']
    : ['Purchase the product', 'Open Account → Marketplace', 'Download ZIP and follow the PDF guide']
  const install = ru ? installRu : installEn

  const tabs = [
    { id: 'preview', label: ru ? 'Превью' : 'Preview', icon: 'shield-check' },
    { id: 'inside', label: ru ? 'Что внутри' : 'What is inside', icon: 'package' },
    { id: 'integrations', label: ru ? 'Интеграции' : 'Integrations', icon: 'workflow' },
    { id: 'changelog', label: 'Changelog', icon: 'clock' },
  ]
  const version = product.version || '1.0.0-preview'
  const formats = product.fileTypes || []
  const integrations = product.testedIntegrations || []
  const changelog = (ru ? product.changelogRu : product.changelogEn) || []
  const releaseLabel = isPreviewRelease ? (ru ? 'Готовится' : 'In preparation') : version
  const coverImage = getMarketplaceCoverImage(product)

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

        <section className={styles.heroGrid}>
          <div className={styles.coverStage}>
            <img src={coverImage} alt="" className={`${styles.coverImage} ${coverImage.endsWith('.svg') ? styles.coverContain : ''}`} />
            <span className={styles.coverFormat}>{formats.slice(0, 3).join(' · ')}</span>
          </div>

          <div className={styles.heroCopy}>
            <div className={styles.heroBadgeRow}>
              {product.badge && <ProductBadge type={product.badge} lang={lang} variant="inline" />}
              <span className={styles.versionChip}>{releaseLabel}</span>
            </div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.heroSub}>{short}</p>

            {incomeMeta && (
              <div className={styles.outcomeLine}>
                <UiIcon name="chart" size={19} />
                <div>
                  <span>{ru ? 'Результат продукта' : 'Product outcome'}</span>
                  <strong>{ru ? incomeMeta.outcomeRu : incomeMeta.outcomeEn}</strong>
                </div>
              </div>
            )}

            <div className={styles.heroFacts}>
              <div><UiIcon name="clock" size={18} /><span><small>{ru ? 'Запуск' : 'Launch'}</small><strong>{incomeMeta ? (ru ? incomeMeta.launchRu : incomeMeta.launchEn) : (ru ? 'По инструкции' : 'Guided setup')}</strong></span></div>
              <div><UiIcon name="package" size={18} /><span><small>{ru ? 'Материалы' : 'Assets'}</small><strong>{included.length || formats.length}</strong></span></div>
              <div><UiIcon name="shield-check" size={18} /><span><small>{ru ? 'Лицензия' : 'License'}</small><strong>{ru ? 'Коммерческая' : 'Commercial'}</strong></span></div>
              <div><UiIcon name="workflow" size={18} /><span><small>{ru ? 'Интеграции' : 'Integrations'}</small><strong>{integrations.length || '—'}</strong></span></div>
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.priceRow}>
              <span className={styles.price}>{finalPrice}€</span>
              {discountPercent > 0 && finalPrice < product.priceEur && <span className={styles.oldPrice}>{product.priceEur}€</span>}
            </div>
            <ul className={styles.purchaseProof}>
              <li>{isPreviewRelease ? (ru ? 'Checkout закрыт до проверенного релиза' : 'Checkout closed until verified release') : (ru ? 'Доступ после подтверждённой оплаты' : 'Access after verified payment')}</li>
              <li>{ru ? 'Без скрытых платежей' : 'No hidden fees'}</li>
              <li>{ru ? 'Коммерческая лицензия включена' : 'Commercial license included'}</li>
            </ul>

            {isPreviewRelease ? (
              <span className={`${styles.btnPrimary} ${styles.releasePending}`}>{ru ? 'Готовим проверенный релиз' : 'Verified release in progress'}</span>
            ) : purchased ? (
              <Link to="/cabinet#marketplace" className={styles.btnPrimary}>{ru ? 'Скачать продукт' : 'Download product'}</Link>
            ) : (
              <Link to={`/marketplace/${product.slug}/buy`} className={styles.btnPrimary}>{ru ? 'Купить и получить доступ' : 'Purchase and get access'}</Link>
            )}

            <dl className={styles.commerceMeta}>
              <div><dt>{ru ? 'Версия' : 'Version'}</dt><dd>{version}</dd></div>
              <div><dt>{ru ? 'Формат' : 'Format'}</dt><dd>{formats.join(', ') || '—'}</dd></div>
              <div><dt>{ru ? 'Лицензия' : 'License'}</dt><dd>{ru ? 'Коммерческая' : 'Commercial'}</dd></div>
              <div><dt>{ru ? 'Доступ' : 'Access'}</dt><dd>{isPreviewRelease ? (ru ? 'После релиза' : 'After release') : (ru ? 'Через кабинет' : 'Via account')}</dd></div>
            </dl>

            {creator && (
              <Link to={`/marketplace/creators/${creator.slug}`} className={styles.creator}>
                <span className={styles.creatorAvatar} style={{ background: creator.avatarGradient }} aria-hidden />
                <span><span className={styles.creatorName}>{creator.name}</span><small>{creator.verified ? (ru ? 'Внутренняя команда Academy' : 'Academy in-house team') : (ru ? 'Автор продукта' : 'Product creator')}</small></span>
              </Link>
            )}
          </aside>
        </section>

        <div className={styles.productTabs} role="tablist" aria-label={ru ? 'Материалы продукта' : 'Product materials'}>
          {tabs.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={activeTab === tab.id ? styles.tabActive : ''} onClick={() => setActiveTab(tab.id)}>
              <UiIcon name={tab.icon} size={17} />{tab.label}
            </button>
          ))}
        </div>

        <section className={styles.proofPanel} role="tabpanel">
          {activeTab === 'preview' && (
            <div className={styles.previewGrid}>
              <article className={styles.archiveCard}>
                <h2>{ru ? 'Структура пакета' : 'Package structure'}</h2>
                <div className={styles.archiveRoot}><span>📦</span><strong>{product.slug}-{version}.{formats.includes('ZIP') ? 'zip' : 'pack'}</strong></div>
                <ul>{included.map((item, index) => <li key={item}><span>📁</span><strong>{String(index + 1).padStart(2, '0')}_{item}</strong><small>{formats[index % Math.max(formats.length, 1)] || 'FILE'}</small></li>)}</ul>
              </article>

              <article className={styles.sampleCard}>
                <h2>{ru ? 'Пример материала' : 'Material sample'}</h2>
                {product.freePreview ? (
                  <div className={styles.sampleDocument}>
                    <span>AI INSIDER · {formats[0] || 'PREVIEW'}</span>
                    <strong>{ru ? product.freePreview.titleRu : product.freePreview.titleEn}</strong>
                    <p>{ru ? product.freePreview.contentRu : product.freePreview.contentEn}</p>
                  </div>
                ) : product.screenshots?.[0] ? <img src={product.screenshots[0]} alt="" /> : <div className={styles.sampleEmpty}><UiIcon name={category?.icon || 'sparkles'} size={38} /><span>{ru ? 'Preview включён в релиз' : 'Preview included in release'}</span></div>}
              </article>

              <article className={styles.flowCard}>
                <h2>{ru ? 'Как работает' : 'How it works'}</h2>
                <div className={styles.flow}>
                  {install.map((item, index) => <div key={item}><span>{index + 1}</span><strong>{item}</strong></div>)}
                </div>
              </article>

              <article className={styles.integrationCard}>
                <h2>{ru ? 'Проверяемые интеграции' : 'Integration targets'}</h2>
                <ul>{integrations.map((item) => <li key={item}><span>{item.slice(0, 1)}</span><strong>{item}</strong><b>✓</b></li>)}</ul>
                {integrations.length === 0 && <p>{ru ? 'Интеграции не требуются.' : 'No integrations required.'}</p>}
              </article>
            </div>
          )}

          {activeTab === 'inside' && <div className={styles.tabList}><h2>{ru ? 'В комплекте' : 'Included'}</h2><ul className={styles.list}>{included.map((item) => <li key={item}>{item}</li>)}</ul><p>{ru ? 'Форматы: ' : 'Formats: '}{formats.join(', ') || '—'}</p></div>}
          {activeTab === 'integrations' && <div className={styles.tabList}><h2>{ru ? 'Интеграции и требования' : 'Integrations and requirements'}</h2><ul className={styles.list}>{[...integrations, ...requirements].map((item) => <li key={item}>{item}</li>)}</ul></div>}
          {activeTab === 'changelog' && <div className={styles.tabList}><h2>Changelog · {version}</h2><ul className={styles.list}>{changelog.map((item) => <li key={item}>{item}</li>)}</ul></div>}
        </section>

        <div className={styles.lowerGrid}>
          <div>
            <ScrollReveal>
              <section className={styles.block}>
                <h2>{ru ? 'Обзор' : 'Overview'}</h2>
                <p>{short}</p>
              </section>
            </ScrollReveal>

            <ScrollReveal>
              <section className={styles.block}>
                <h2>{ru ? 'Демонстрационные кейсы' : 'Demonstration cases'}</h2>
                <p>{ru ? 'Тестовые сценарии продукта — не клиентские отзывы и не обещание результата.' : 'Product test scenarios—not customer testimonials or outcome promises.'}</p>
                {demoCases.map((item) => <div className={styles.faqItem} key={item.id}><strong>{item.id} · {ru ? item.titleRu : item.evidence}</strong><p>{ru ? item.resultRu : item.evidence}</p></div>)}
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
        </div>
      </div>
    </div>
  )
}
