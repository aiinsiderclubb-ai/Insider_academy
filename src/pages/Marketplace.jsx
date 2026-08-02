import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { VaultSection } from '../components/VaultSection'
import { MarketplaceHero } from '../components/marketplace/MarketplaceHero'
import { MarketplacePerksBar } from '../components/marketplace/MarketplacePerksBar'
import { MarketplaceProductCard } from '../components/marketplace/MarketplaceProductCard'
import { MARKETPLACE_CATEGORIES } from '../data/marketplace/categories'
import { api } from '../api/client'
import { UiIcon } from '../components/UiIcon'
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
  { id: 'rating', ru: 'Рейтинг', en: 'Rating' },
  { id: 'downloads', ru: 'Скачивания', en: 'Downloads' },
  { id: 'price-asc', ru: 'Цена ↑', en: 'Price ↑' },
  { id: 'price-desc', ru: 'Цена ↓', en: 'Price ↓' },
]

const FUTURE_RU = [
  'Рейтинги Marketplace',
  'Лидерборд креаторов',
  'Партнёрская программа',
  'Конструктор бандлов',
  'One-Click Deploy n8n',
  'Ежемесячные дропы',
]
const FUTURE_EN = [
  'Marketplace rankings',
  'Creator leaderboards',
  'Affiliate program',
  'Bundle builder',
  'One-click n8n deploy',
  'Monthly drops',
]

const TABS = [
  { id: 'catalog', ru: 'Каталог', en: 'Catalog' },
  { id: 'vault', ru: 'Vault', en: 'Vault' },
]

const INDUSTRIES = [
  { id: 'beauty', ru: 'Beauty & Wellness', en: 'Beauty & Wellness' },
  { id: 'clinics', ru: 'Клиники', en: 'Clinics' },
  { id: 'real-estate', ru: 'Недвижимость', en: 'Real Estate' },
  { id: 'restaurants', ru: 'Рестораны', en: 'Restaurants' },
  { id: 'legal', ru: 'Юридические услуги', en: 'Legal' },
  { id: 'ecommerce', ru: 'E-commerce', en: 'E-commerce' },
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
  const [industry, setIndustry] = useState(() => searchParams.get('industry') || 'all')
  const [sort, setSort] = useState('popular')
  const [favorites, setFavorites] = useState(() => getMarketplaceFavorites())
  const [products, setProducts] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')

  useEffect(() => {
    let active = true
    setCatalogLoading(true)
    api.marketplaceProducts('marketplace')
      .then((response) => {
        if (active) setProducts(response.products || [])
      })
      .catch((error) => {
        if (active) setCatalogError(error.message || 'Marketplace unavailable')
      })
      .finally(() => {
        if (active) setCatalogLoading(false)
      })
    return () => { active = false }
  }, [])

  const discountPercent = 0

  const recommended = useMemo(() => purchases.length > 0 ? products.slice(0, 3) : [], [products, purchases])

  const featuredHits = useMemo(
    () => products.filter((p) => p.badge === 'hit' || p.badges?.includes('hit')).slice(0, 2),
    [products]
  )

  const showFeatured = !query && category === 'all' && industry === 'all'

  const featuredIds = useMemo(
    () => (showFeatured ? featuredHits.map((p) => p.id) : []),
    [showFeatured, featuredHits]
  )

  const catalogProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const list = products.filter((product) => {
      const categoryMatch = category === 'all' || product.categoryId === category
      const industryMatch = industry === 'all' || product.industry === industry
      const queryMatch = !normalizedQuery || [product.titleRu, product.titleEn, product.shortRu, product.shortEn, product.sku]
        .some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
      return categoryMatch && industryMatch && queryMatch
    }).sort((a, b) => {
      if (sort === 'price-asc') return Number(a.priceEur) - Number(b.priceEur)
      if (sort === 'price-desc') return Number(b.priceEur) - Number(a.priceEur)
      if (sort === 'rating') return Number(b.rating || 0) - Number(a.rating || 0)
      if (sort === 'downloads') return Number(b.downloads || 0) - Number(a.downloads || 0)
      if (sort === 'trending') return String(b.publishedAt || '').localeCompare(String(a.publishedAt || ''))
      return Number(b.downloads || 0) - Number(a.downloads || 0)
    })
    if (!featuredIds.length) return list
    const exclude = new Set(featuredIds)
    return list.filter((p) => !exclude.has(p.id))
  }, [products, query, category, industry, sort, featuredIds])

  const resultCount = useMemo(
    () => catalogProducts.length + featuredIds.length,
    [catalogProducts, featuredIds]
  )

  const handleFavorite = useCallback((productId) => {
    setFavorites(toggleMarketplaceFavorite(productId))
  }, [])

  const renderCard = (product, featured = false) => (
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
    />
  )

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        {activeTab === 'catalog' && (
          <MarketplaceHero lang={lang} products={products} />
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
            {recommended.length > 0 && !query && category === 'all' && industry === 'all' && (
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

                  <div className={styles.industryFilter}>
                    <span className={styles.industryLabel}>{ru ? 'Решения по нише' : 'Solutions by industry'}</span>
                    <div className={styles.industryChips} aria-label={ru ? 'Отрасли' : 'Industries'}>
                      <button
                        type="button"
                        className={`${styles.industryBtn} ${industry === 'all' ? styles.industryActive : ''}`}
                        onClick={() => setIndustry('all')}
                      >
                        {ru ? 'Все ниши' : 'All industries'}
                      </button>
                      {INDUSTRIES.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`${styles.industryBtn} ${industry === item.id ? styles.industryActive : ''}`}
                          onClick={() => setIndustry(item.id)}
                        >
                          {ru ? item.ru : item.en}
                        </button>
                      ))}
                    </div>
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

              {catalogLoading ? (
                <p className={styles.resultCount}>{ru ? 'Загружаем каталог…' : 'Loading catalog…'}</p>
              ) : catalogError ? (
                <EmptyState message={catalogError} />
              ) : showFeatured && featuredHits.length > 0 && (
                <StaggerReveal className={styles.featuredRow} stagger={60}>
                  {featuredHits.map((p) => renderCard(p, true))}
                </StaggerReveal>
              )}

              {!catalogLoading && !catalogError && catalogProducts.length === 0 && !(showFeatured && featuredHits.length) ? (
                <EmptyState
                  message={ru ? 'Ничего не найдено по текущим фильтрам' : 'No results for current filters'}
                  actionLabel={ru ? 'Сбросить фильтры' : 'Reset filters'}
                  onAction={() => {
                    setQuery('')
                    setCategory('all')
                    setIndustry('all')
                    setSort('popular')
                  }}
                />
              ) : !catalogLoading && !catalogError && catalogProducts.length > 0 ? (
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
