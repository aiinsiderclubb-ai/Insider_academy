import { useMemo, useState, useCallback } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { MarketplaceHero } from '../components/marketplace/MarketplaceHero'
import { MarketplaceProductCard } from '../components/marketplace/MarketplaceProductCard'
import { MARKETPLACE_CATEGORIES } from '../data/marketplace/categories'
import { FEATURED_SECTIONS, getProductsByBadge } from '../data/marketplace/products'
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
import styles from './Marketplace.module.css'

const SORT_OPTIONS = [
  { id: 'popular', ru: 'Популярные', en: 'Popular' },
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

export function Marketplace() {
  const { lang } = useLanguage()
  const { hasPurchased, purchases } = useAuth()
  const ru = lang === 'ru'

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('popular')
  const [favorites, setFavorites] = useState(() => getMarketplaceFavorites())

  const discountPercent = getMarketplaceDiscountPercent(purchases)

  const recommended = useMemo(
    () => getRecommendedMarketplaceProducts({ purchases, limit: 4 }),
    [purchases]
  )

  const catalogProducts = useMemo(
    () => searchMarketplaceProducts(query, { categoryId: category, sort }),
    [query, category, sort]
  )

  const handleFavorite = useCallback((productId) => {
    setFavorites(toggleMarketplaceFavorite(productId))
  }, [])

  const renderCard = (product) => (
    <MarketplaceProductCard
      key={product.id}
      product={product}
      lang={lang}
      purchased={hasPurchased(product.id)}
      discountPercent={discountPercent}
      purchases={purchases}
      favorite={favorites.includes(product.id)}
      onToggleFavorite={handleFavorite}
    />
  )

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <MarketplaceHero lang={lang} discountPercent={discountPercent} />

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
              <div className={styles.grid}>{recommended.map(renderCard)}</div>
            </section>
          </ScrollReveal>
        )}

        {!query && category === 'all' && (
          <>
            {FEATURED_SECTIONS.map((section) => {
              const items = getProductsByBadge(section.badge).slice(0, 4)
              if (!items.length) return null
              return (
                <ScrollReveal key={section.id}>
                  <section className={styles.section}>
                    <div className={styles.sectionHead}>
                      <h2 className={styles.sectionTitle}>
                        {ru ? section.titleRu : section.titleEn}
                      </h2>
                    </div>
                    <div className={styles.grid}>{items.map(renderCard)}</div>
                  </section>
                </ScrollReveal>
              )
            })}
          </>
        )}

        <section id="catalog" className={styles.section}>
          <ScrollReveal>
            <div className={styles.toolbar}>
              <div className={styles.searchRow}>
                <input
                  type="search"
                  className={styles.search}
                  placeholder={ru ? 'Поиск по Marketplace…' : 'Search marketplace…'}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
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
              </div>
              <div className={styles.categories} role="tablist">
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
                    {cat.icon} {ru ? cat.titleRu : cat.titleEn}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {catalogProducts.length === 0 ? (
            <p className={styles.empty}>{ru ? 'Ничего не найдено' : 'No products found'}</p>
          ) : (
            <div className={styles.grid}>
              {catalogProducts.map(renderCard)}
            </div>
          )}
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
      </div>
    </div>
  )
}
