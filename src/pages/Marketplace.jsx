import { useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { VaultSection } from '../components/VaultSection'
import { MarketplaceHero } from '../components/marketplace/MarketplaceHero'
import { MarketplacePerksBar } from '../components/marketplace/MarketplacePerksBar'
import { MarketplaceProductCard } from '../components/marketplace/MarketplaceProductCard'
import { MARKETPLACE_CATEGORIES } from '../data/marketplace/categories'
import { AI_INCOME_COLLECTION, MARKETPLACE_PRODUCTS } from '../data/marketplace/products'
import { UiIcon } from '../components/UiIcon'
import {
  getRecommendedMarketplaceProducts,
  searchMarketplaceProducts,
} from '../data/marketplace/recommendations'
import { getMarketplaceDiscountPercent } from '../data/marketplace/discounts'
import {
  getMarketplaceFavorites,
  toggleMarketplaceFavorite,
} from '../utils/marketplaceFavorites'
import { ScrollReveal } from '../components/ScrollReveal'
import { StaggerReveal } from '../components/StaggerReveal'
import { EmptyState } from '../components/EmptyState'
import styles from './Marketplace.module.css'

const SORT_OPTIONS = [
  { id: 'popular', ru: 'Популярные', en: 'Popular' },
  { id: 'trending', ru: 'В тренде', en: 'Trending' },
  { id: 'price-asc', ru: 'Цена ↑', en: 'Price ↑' },
  { id: 'price-desc', ru: 'Цена ↓', en: 'Price ↓' },
]

const FUTURE_RU = [
  'Интерактивные live demo перед покупкой',
  'Новые вертикальные системы для стоматологий и недвижимости',
  'Партнёрская программа для внедренцев',
  'Ежемесячные drops проверенных workflow',
]
const FUTURE_EN = [
  'Interactive live demos before purchase',
  'New vertical systems for dental and real estate teams',
  'Implementation partner program',
  'Monthly drops of verified workflows',
]

const TABS = [
  { id: 'catalog', ru: 'Каталог', en: 'Catalog' },
  { id: 'vault', ru: 'Vault', en: 'Vault' },
]

export function Marketplace() {
  const { lang } = useLanguage()
  const { hasPurchased, purchases } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const ru = lang === 'ru'

  const activeTab = searchParams.get('tab') === 'vault' ? 'vault' : 'catalog'

  const setActiveTab = useCallback(
    (tabId) => {
      if (tabId === 'catalog') {
        setSearchParams({}, { replace: true })
      } else {
        setSearchParams({ tab: tabId }, { replace: true })
      }
    },
    [setSearchParams]
  )

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('popular')
  const [favorites, setFavorites] = useState(() => getMarketplaceFavorites())

  const discountPercent = getMarketplaceDiscountPercent(purchases)

  const recommended = useMemo(
    () => getRecommendedMarketplaceProducts({ purchases, limit: 4 }),
    [purchases]
  )

  const featuredHits = useMemo(
    () => MARKETPLACE_PRODUCTS.filter((p) => p.badge === 'hit').slice(0, 2),
    []
  )

  const incomeProducts = useMemo(
    () => AI_INCOME_COLLECTION
      .map((meta) => ({
        meta,
        product: MARKETPLACE_PRODUCTS.find((product) => product.id === meta.productId),
      }))
      .filter((item) => item.product),
    []
  )

  const showFeatured = !query && category === 'all'

  const featuredIds = useMemo(
    () => (showFeatured ? featuredHits.map((p) => p.id) : []),
    [showFeatured, featuredHits]
  )

  const catalogProducts = useMemo(() => {
    const list = searchMarketplaceProducts(query, { categoryId: category, sort })
    if (!featuredIds.length) return list
    const exclude = new Set(featuredIds)
    return list.filter((p) => !exclude.has(p.id))
  }, [query, category, sort, featuredIds])

  const resultCount = useMemo(
    () => searchMarketplaceProducts(query, { categoryId: category, sort }).length,
    [query, category, sort]
  )

  const handleFavorite = useCallback((productId) => {
    setFavorites(toggleMarketplaceFavorite(productId))
  }, [])

  const renderCard = (product, featured = false, outcomeMeta = null) => (
    <MarketplaceProductCard
      key={product.id}
      product={product}
      lang={lang}
      purchased={hasPurchased(product.id)}
      discountPercent={discountPercent}
      purchases={purchases}
      favorite={favorites.includes(product.id)}
      onToggleFavorite={handleFavorite}
      featured={featured}
      outcomeMeta={outcomeMeta}
    />
  )

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        {activeTab === 'catalog' && (
          <MarketplaceHero lang={lang} query={query} onQueryChange={setQuery} />
        )}

        <nav
          className={`${styles.tabs} ${activeTab === 'vault' ? styles.tabsVaultFirst : ''}`}
          aria-label={ru ? 'Разделы Marketplace' : 'Marketplace sections'}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
            >
              {ru ? tab.ru : tab.en}
            </button>
          ))}
        </nav>

        <MarketplacePerksBar lang={lang} discountPercent={discountPercent} />

        {activeTab === 'vault' ? (
          <VaultSection
            lang={lang}
            hasPurchased={hasPurchased}
            showMoreLink={false}
            showMarketLink={false}
          />
        ) : (
          <>
            {!query && category === 'all' && (
              <section className={`${styles.section} ${styles.incomeSection}`}>
                <div className={styles.incomeHead}>
                  <div>
                    <span className={styles.eyebrow}>{ru ? 'AI Income Collection · 2026' : 'AI Income Collection · 2026'}</span>
                    <h2 className={styles.incomeTitle}>
                      {ru ? 'Системы, на которых можно строить AI-услугу' : 'Systems you can turn into an AI service'}
                    </h2>
                    <p className={styles.sectionDesc}>
                      {ru
                        ? 'Не обещание дохода, а готовая основа: deliverables, лицензия, внедрение и модель услуги для клиента.'
                        : 'Not an income promise—a client-ready foundation with deliverables, licensing, deployment and service model.'}
                    </p>
                  </div>
                  <a href="#catalog" className={styles.incomeCta}>{ru ? 'Весь каталог ↓' : 'Full catalog ↓'}</a>
                </div>
                <StaggerReveal className={styles.incomeGrid} stagger={45}>
                  {incomeProducts.map(({ product, meta }) => renderCard(product, false, meta))}
                </StaggerReveal>
              </section>
            )}

            {recommended.length > 0 && !query && category === 'all' && (
              <ScrollReveal>
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <div>
                      <h2 className={styles.sectionTitle}>
                        {ru ? 'Рекомендуем для вас' : 'Recommended for you'}
                      </h2>
                      <p className={styles.sectionDesc}>
                        {ru
                          ? 'На основе ваших курсов и покупок'
                          : 'Based on your courses and purchases'}
                      </p>
                    </div>
                  </div>
                  <StaggerReveal className={styles.grid} stagger={60}>
                    {recommended.map((p) => renderCard(p))}
                  </StaggerReveal>
                </section>
              </ScrollReveal>
            )}

            <section id="catalog" className={styles.section}>
              <div className={styles.toolbar}>
                <div className={styles.toolbarRow}>
                  <input
                    type="search"
                    className={styles.search}
                    placeholder={ru ? 'Поиск…' : 'Search…'}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label={ru ? 'Поиск по Marketplace' : 'Search marketplace'}
                  />

                  <div className={styles.chips} role="tablist" aria-label={ru ? 'Категории' : 'Categories'}>
                    <button
                      type="button"
                      className={`${styles.catBtn} ${category === 'all' ? styles.catActive : ''}`}
                      onClick={() => setCategory('all')}
                    >
                      {ru ? 'Все' : 'All'}
                    </button>
                    {MARKETPLACE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`${styles.catBtn} ${category === cat.id ? styles.catActive : ''}`}
                        onClick={() => setCategory(cat.id)}
                      >
                        <UiIcon
                          name={cat.icon}
                          variant="chip"
                          tone={category === cat.id ? 'accent' : 'secondary'}
                        />
                        {ru ? cat.titleRu : cat.titleEn}
                      </button>
                    ))}
                  </div>

                  <select
                    className={styles.sort}
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    aria-label={ru ? 'Сортировка' : 'Sort'}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {ru ? opt.ru : opt.en}
                      </option>
                    ))}
                  </select>

                  <span className={styles.resultCount}>
                    {resultCount}{' '}
                    {ru
                      ? resultCount === 1
                        ? 'товар'
                        : resultCount < 5
                          ? 'товара'
                          : 'товаров'
                      : resultCount === 1
                        ? 'product'
                        : 'products'}
                  </span>
                </div>
              </div>

              {showFeatured && featuredHits.length > 0 && (
                <StaggerReveal className={styles.featuredRow} stagger={60}>
                  {featuredHits.map((p) => renderCard(p, true))}
                </StaggerReveal>
              )}

              {catalogProducts.length === 0 && !(showFeatured && featuredHits.length) ? (
                <EmptyState
                  message={ru ? 'Ничего не найдено по текущим фильтрам' : 'No results for current filters'}
                  actionLabel={ru ? 'Сбросить фильтры' : 'Reset filters'}
                  onAction={() => {
                    setQuery('')
                    setCategory('all')
                    setSort('popular')
                  }}
                />
              ) : catalogProducts.length > 0 ? (
                <StaggerReveal className={styles.grid} stagger={60}>
                  {catalogProducts.map((p) => renderCard(p))}
                </StaggerReveal>
              ) : null}
            </section>

            <ScrollReveal>
              <aside className={styles.future}>
                <h3>{ru ? 'Скоро в Marketplace' : 'Coming soon'}</h3>
                <ul>
                  {(ru ? FUTURE_RU : FUTURE_EN).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </aside>
            </ScrollReveal>
          </>
        )}
      </div>
    </div>
  )
}
