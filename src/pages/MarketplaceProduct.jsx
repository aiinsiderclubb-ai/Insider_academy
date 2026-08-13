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
import { ScrollReveal } from '../components/ScrollReveal'
import { UiIcon } from '../components/UiIcon'
import { getMarketplaceCoverImage } from '../utils/marketplaceCover'
import styles from './MarketplaceProduct.module.css'
import { api } from '../api/client'
import { getDemoProofCases } from '../data/marketplace/proofCases'
import { getMarketplacePresentation } from '../data/marketplace/presentation'

const HERO_ART = {
  'prompt-packs': '/marketplace/hero-art/prompt-packs.webp',
  'n8n-workflows': '/marketplace/hero-art/n8n-workflows.webp',
  'ai-agents': '/marketplace/hero-art/ai-agents.webp',
  'business-templates': '/marketplace/hero-art/business-templates.webp',
  'saas-kits': '/marketplace/hero-art/ai-saas-kits.webp',
  'creator-resources': '/marketplace/hero-art/creator-resources.webp',
  'mcp-skills': '/marketplace/hero-art/mcp-skills.webp',
  'voice-agents': '/marketplace/hero-art/voice-agents.webp',
}

const INTEGRATION_LOGOS = {
  notion: { src: '/integrations/notion.svg', color: '#f7f7f5' },
  make: { src: '/integrations/make.svg', color: '#b77aff' },
  zapier: { src: '/integrations/zapier.svg', color: '#ff4f00' },
  'google docs': { src: '/integrations/google-docs.svg', color: '#4285f4' },
  slack: { src: '/integrations/slack.svg', color: '#36c5f0' },
  stripe: { src: '/integrations/stripe.svg', color: '#635bff' },
  openai: { src: '/integrations/openai.svg', color: '#74e3c2' },
  chatgpt: { src: '/integrations/openai.svg', color: '#74e3c2' },
  anthropic: { src: '/integrations/anthropic.svg', color: '#d9b99b' },
  claude: { src: '/integrations/claude.svg', color: '#d97757' },
  n8n: { src: '/integrations/n8n.svg', color: '#ea4b71' },
  mcp: { src: '/integrations/mcp.svg', color: '#d7dcff' },
  canva: { src: '/integrations/canva.svg', color: '#7d5cff' },
  gemini: { src: '/integrations/gemini.svg', color: '#8ab4f8' },
  'google calendar': { src: '/integrations/google-calendar.svg', color: '#4285f4' },
  'google calendar-compatible api': { src: '/integrations/google-calendar.svg', color: '#4285f4' },
  'google sheets': { src: '/integrations/google-sheets.svg', color: '#34a853' },
  elevenlabs: { src: '/integrations/elevenlabs.svg', color: '#f5f5f5' },
  'elevenlabs conversational ai': { src: '/integrations/elevenlabs.svg', color: '#f5f5f5' },
  'http api': { icon: 'workflow', color: '#60a5fa' },
  'rest api': { icon: 'workflow', color: '#60a5fa' },
  webhook: { icon: 'zap', color: '#f59e0b' },
  oauth: { icon: 'keyRound', color: '#a78bfa' },
  pdf: { icon: 'fileText', color: '#ef4444' },
  vapi: { icon: 'phone', color: '#8b5cf6' },
  retell: { icon: 'mic', color: '#22d3ee' },
  'retell ai': { icon: 'mic', color: '#22d3ee' },
}

function IntegrationMark({ name }) {
  const logo = INTEGRATION_LOGOS[name.toLowerCase()]
  if (logo?.icon) return <span className={styles.integrationFallback} style={{ color: logo.color }}><UiIcon name={logo.icon} size={17} tone="inherit" /></span>
  if (!logo) return <span className={styles.integrationFallback}><UiIcon name="plug" size={17} tone="inherit" /></span>
  return <span className={styles.integrationLogo} style={{ '--logo': `url(${logo.src})`, '--logo-color': logo.color }} aria-hidden />
}

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
  const presentation = getMarketplacePresentation(product, ru)

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
  const exactAgencyMockup = product.slug === 'ai-automation-agency-os'
  const heroArtwork = exactAgencyMockup ? '/marketplace/hero-art/agency-os.webp' : HERO_ART[product.categoryId] || coverImage
  const outcome = incomeMeta ? (ru ? incomeMeta.outcomeRu : incomeMeta.outcomeEn) : short

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
            <div className={styles.coverOrbit} aria-hidden />
            <img src={heroArtwork} alt={`${title} — product artwork`} className={styles.coverImage} />
            {!exactAgencyMockup && <div className={styles.coverIdentity}><span>{ru ? category?.titleRu : category?.titleEn}</span><strong>{title}</strong></div>}
          </div>

          <div className={styles.heroCopy}>
            <div className={styles.heroBadgeRow}>
              {product.badge && <ProductBadge type={product.badge} lang={lang} variant="inline" />}
              <span className={styles.versionChip}>{releaseLabel}</span>
            </div>
            <p className={styles.categoryEyebrow}>{ru ? category?.titleRu : category?.titleEn}</p>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.heroKicker}>{presentation.kicker}</p>
            <p className={styles.heroSub}>{outcome}</p>
            <div className={styles.heroEssentials}>
              <span><strong>{included.length}</strong>{ru ? ' материалов' : ' assets'}</span>
              <span><strong>{formats.length}</strong>{ru ? ' формата' : ' formats'}</span>
              <span><strong>{integrations.length}</strong>{ru ? ' интеграций' : ' integrations'}</span>
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

            <p className={styles.paymentNote}>{isPreviewRelease ? (ru ? 'Продажи откроются после проверки комплекта.' : 'Sales open after package verification.') : (ru ? 'Без подписки. Платите один раз — используйте навсегда.' : 'No subscription. Pay once — use forever.')}</p>
            <div className={styles.paymentMarks} aria-label={ru ? 'Способы оплаты' : 'Payment methods'}><span>VISA</span><span>● ●</span><span> Pay</span><span>G Pay</span><span>•••</span></div>

            <dl className={styles.commerceMeta}>
              <div><dt>{ru ? 'Версия' : 'Version'}</dt><dd>{version}</dd></div>
              <div><dt>{ru ? 'Формат' : 'Format'}</dt><dd>{formats.join(', ') || '—'}</dd></div>
              <div><dt>{ru ? 'Лицензия' : 'License'}</dt><dd>{ru ? 'Коммерческая' : 'Commercial'}</dd></div>
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
              <article className={styles.sampleCard}>
                <header><span>{ru ? 'Фрагмент продукта' : 'Product fragment'}</span><h2>{ru ? 'Посмотрите до покупки' : 'Inspect before purchase'}</h2></header>
                {product.freePreview ? (
                  <div className={styles.sampleDocument}>
                    <span>AI INSIDER · {formats[0] || 'PREVIEW'}</span>
                    <strong>{ru ? product.freePreview.titleRu : product.freePreview.titleEn}</strong>
                    <p>{ru ? product.freePreview.contentRu : product.freePreview.contentEn}</p>
                  </div>
                ) : product.screenshots?.[0] ? <img src={product.screenshots[0]} alt="" /> : <div className={styles.sampleEmpty}><UiIcon name={category?.icon || 'sparkles'} size={38} /><span>{ru ? 'Preview включён в релиз' : 'Preview included in release'}</span></div>}
              </article>

              <article className={styles.flowCard}>
                <header><span>{ru ? 'Рабочий сценарий' : 'Working scenario'}</span><h2>{ru ? 'От входа до результата' : 'From input to result'}</h2></header>
                <div className={styles.scenarioFlow}>
                  {presentation.steps.map(([step, detail], index) => <div key={step}><span>{String(index + 1).padStart(2, '0')}</span><section><strong>{step}</strong><small>{detail}</small></section></div>)}
                </div>
              </article>

              <article className={styles.acceptanceCard}>
                <header><span>{ru ? 'Что получите' : 'What you get'}</span><h2>{ru ? 'Проверяемый результат' : 'Verifiable output'}</h2></header>
                <ul>{included.slice(0, 4).map((item) => <li key={item}><UiIcon name="circle-check" size={15} /><strong>{item}</strong></li>)}</ul>
                <footer><UiIcon name="shield-check" size={16} /><span>{ru ? 'Границы, setup и QA входят в комплект' : 'Boundaries, setup and QA included'}</span></footer>
              </article>
            </div>
          )}

          {activeTab === 'inside' && (
            <div className={styles.insidePanel}>
              <header className={styles.panelHeader}>
                <div><span>{ru ? 'Состав релиза' : 'Release inventory'}</span><h2>{ru ? 'Что лежит внутри — без повторения превью' : 'Inside the package — beyond the preview'}</h2></div>
                <div className={styles.formatRail}>{formats.map((item) => <span key={item}>{item}</span>)}</div>
              </header>
              <div className={styles.insideLayout}>
                <section className={styles.inventoryGrid}>
                  {included.map((item, index) => <article className={styles.inventoryItem} key={item}><span className={styles.fileIndex}>{String(index + 1).padStart(2, '0')}</span><span className={styles.fileMark}>{formats[index % Math.max(formats.length, 1)] || 'FILE'}</span><strong>{item}</strong><small>{ru ? 'Готовый материал · можно адаптировать' : 'Ready asset · editable for your use case'}</small></article>)}
                </section>
                <aside className={styles.usePlan}>
                  <span>{ru ? 'Порядок внедрения' : 'Implementation order'}</span>
                  <h3>{ru ? 'Из архива — в рабочий процесс' : 'From package to production'}</h3>
                  <ol>{install.map((item, index) => <li key={item}><span>{index + 1}</span><strong>{item}</strong></li>)}</ol>
                  <div><UiIcon name="users" size={17} /><p><strong>{ru ? 'Для кого' : 'Best for'}</strong>{presentation.audience}</p></div>
                </aside>
              </div>
              <footer className={styles.packageFooter}>
                <span><UiIcon name="package" size={17} />{product.slug}-{version}</span>
                <strong>{included.length} {ru ? 'материалов' : 'assets'} · {formats.length} {ru ? 'форматов' : 'formats'}</strong>
              </footer>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className={styles.integrationsPanel}>
              <header className={styles.panelHeader}>
                <div><span>{ru ? 'Совместимость' : 'Compatibility'}</span><h2>{ru ? 'Интеграции и требования' : 'Integrations and requirements'}</h2></div>
                <span className={styles.verifiedLabel}><UiIcon name="shield-check" size={15} />{ru ? 'Проверяется перед релизом' : 'Verified before release'}</span>
              </header>
              <div className={styles.integrationTiles}>
                {integrations.map((item) => (
                  <article key={item}>
                    <IntegrationMark name={item} />
                    <div><strong>{item}</strong><small>{ru ? 'Инструкция подключения включена' : 'Setup guide included'}</small></div>
                    <span className={styles.integrationState}><b>✓</b>{ru ? 'Совместимо' : 'Compatible'}</span>
                  </article>
                ))}
              </div>
              <div className={styles.requirementsStrip}>
                <span>{ru ? 'Перед запуском понадобится' : 'Required before launch'}</span>
                <div>{requirements.map((item) => <strong key={item}><UiIcon name="circle-check" size={14} />{item}</strong>)}</div>
              </div>
            </div>
          )}

          {activeTab === 'changelog' && (
            <div className={styles.changelogPanel}>
              <header className={styles.panelHeader}>
                <div><span>{ru ? 'История продукта' : 'Product history'}</span><h2>Changelog</h2></div>
                <span className={`${styles.releaseStatus} ${isPreviewRelease ? styles.releaseStatusPreview : ''}`}>{isPreviewRelease ? (ru ? 'Preview' : 'Preview') : (ru ? 'Опубликован' : 'Published')}</span>
              </header>
              <div className={styles.releaseTimeline}>
                <aside><strong>{version}</strong><span>{isPreviewRelease ? (ru ? 'Текущая подготовка' : 'Current preparation') : (ru ? 'Текущий релиз' : 'Current release')}</span></aside>
                <ol>{changelog.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></li>)}</ol>
              </div>
              <footer className={styles.releaseFooter}><UiIcon name="shield-check" size={17} /><span>{ru ? 'Каждая опубликованная версия сохраняет инструкции, changelog и границы совместимости.' : 'Every published version keeps setup guidance, changelog and compatibility boundaries.'}</span></footer>
            </div>
          )}
        </section>

        <div className={styles.lowerGrid}>
          <div>
            <ScrollReveal>
              <section className={`${styles.block} ${styles.overviewBlock}`}>
                <div><span>{ru ? 'О продукте' : 'About the product'}</span><h2>{ru ? 'Коротко: задача, результат, применение' : 'Purpose, outcome and usage'}</h2></div>
                <div className={styles.overviewCopy}><p>{short}</p><p>{outcome}</p></div>
                <aside><UiIcon name="users" size={19} /><div><strong>{ru ? 'Кому подходит' : 'Best for'}</strong><p>{presentation.audience}</p></div></aside>
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
                    <div className={styles.reviewEmpty}>
                      <span><UiIcon name="shield-check" size={22} /></span>
                      <div><strong>{ru ? 'Только подтверждённые покупатели' : 'Verified customers only'}</strong><p>{isPreviewRelease ? (ru ? 'Отзывы откроются после публикации проверенного релиза.' : 'Reviews open after verified release is published.') : (ru ? 'Первый подтверждённый отзыв появится после покупки и проверки заказа.' : 'First verified review appears after purchase and order verification.')}</p></div>
                    </div>
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
                    {related.map((p) => {
                      const relatedTitle = ru ? p.titleRu : p.titleEn
                      const relatedCategory = getMarketplaceCategory(p.categoryId)
                      const relatedPrice = getMarketplacePrice(p.priceEur, purchases)
                      return (
                        <article key={p.id} className={styles.relatedCard}>
                          <Link to={`/marketplace/${p.slug}`} className={styles.relatedCover}>
                            <img src={getMarketplaceCoverImage(p)} alt="" />
                            {p.badge && <ProductBadge type={p.badge} lang={lang} variant="inline" />}
                          </Link>
                          <div className={styles.relatedBody}>
                            <span>{ru ? relatedCategory?.titleRu : relatedCategory?.titleEn}</span>
                            <h3><Link to={`/marketplace/${p.slug}`}>{relatedTitle}</Link></h3>
                            <p>{ru ? p.shortRu : p.shortEn}</p>
                            <footer><strong>{relatedPrice}€</strong><Link to={p.releaseStatus === 'preview' ? `/marketplace/${p.slug}` : `/marketplace/${p.slug}/buy`}>{p.releaseStatus === 'preview' ? (ru ? 'Превью' : 'Preview') : (ru ? 'Открыть' : 'Open')}</Link></footer>
                          </div>
                        </article>
                      )
                    })}
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
