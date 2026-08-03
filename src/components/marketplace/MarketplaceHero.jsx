import styles from './MarketplaceHero.module.css'

export function MarketplaceHero({ lang, query, onQueryChange }) {
  const ru = lang === 'ru'

  const suggestions = [
    { label: 'n8n', query: 'n8n' },
    { label: ru ? 'Лиды' : 'Leads', query: ru ? 'лид' : 'lead' },
    { label: 'Voice Agent', query: 'voice' },
    { label: ru ? 'AI-агентство' : 'AI Agency', query: ru ? 'агентств' : 'agency' },
  ]

  return (
    <header className={styles.hero}>
      <div className={styles.bg} aria-hidden />
      <div className={styles.inner}>
        <span className={styles.pill}>{ru ? 'Marketplace для AI-заработка' : 'Marketplace for AI income'}</span>
        <h1 className={styles.title}>
          {ru ? 'Не просто шаблоны.' : 'Not just templates.'}
          <span>{ru ? ' Готовые AI-системы для результата.' : ' Ready AI systems built for outcomes.'}</span>
        </h1>
        <p className={styles.sub}>
          {ru
            ? 'Выберите нишу или бизнес-задачу, скачайте систему, разверните через n8n и продавайте клиенту как готовое внедрение.'
            : 'Choose a niche or business outcome, download the system, deploy with n8n and sell it as a client-ready implementation.'}
        </p>
        <label className={styles.searchWrap}>
          <span className={styles.searchLabel}>{ru ? 'Что вы хотите автоматизировать?' : 'What do you want to automate?'}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={ru ? 'Например: лиды, салон, контент, CRM…' : 'Try leads, salon, content, CRM…'}
            className={styles.search}
          />
        </label>
        <div className={styles.suggestions}>
          <span>{ru ? 'Популярное:' : 'Popular:'}</span>
          {suggestions.map((suggestion) => (
            <button key={suggestion.label} type="button" onClick={() => onQueryChange(suggestion.query)}>
              {suggestion.label}
            </button>
          ))}
        </div>
        <div className={styles.trust}>
          <span>{ru ? 'Проверенные файлы' : 'Verified files'}</span>
          <span>{ru ? 'Безопасная оплата' : 'Secure checkout'}</span>
          <span>{ru ? 'Лицензия для клиентов' : 'Client-ready licenses'}</span>
          <span>One-click n8n</span>
        </div>
        <div className={styles.proof} aria-label={ru ? 'Преимущества' : 'Benefits'}>
          <span><Check size={14} aria-hidden />{ru ? 'Мгновенный доступ' : 'Instant access'}</span>
          <span><Check size={14} aria-hidden />{ru ? 'Коммерческая лицензия' : 'Commercial license'}</span>
          <span><Check size={14} aria-hidden />{ru ? 'Пожизненные обновления' : 'Lifetime updates'}</span>
        </div>
      </div>

      <div className={styles.visual} aria-label={ru ? 'Популярные продукты' : 'Featured products'}>
        <div className={styles.orbit} aria-hidden />
        {featuredProducts.map((product, index) => {
          const title = ru ? product.titleRu : product.titleEn
          return (
            <Link
              key={product.id}
              to={`/marketplace/${product.slug}`}
              className={`${styles.artCard} ${index === 0 ? styles.artCardLead : ''}`}
              aria-label={title}
            >
              <img src={getMarketplaceCoverImage(product)} alt="" />
              <span className={styles.artMeta}>
                <strong>{title}</strong>
                <span>{product.priceEur}€</span>
              </span>
            </Link>
          )
        })}
        {lead && (
          <span className={styles.dropLabel}>
            {ru ? 'Дроп недели' : 'Drop of the week'}
          </span>
        )}
        {!lead && (
          <div className={styles.dropLabel}>
            {ru ? 'Первые продукты уже в каталоге' : 'First products now available'}
          </div>
        )}
        {comingSoon && (
          <ComingSoonLock
            kind="marketplace"
            lang={lang}
            compact
            className={styles.comingSoonVisual}
          />
        )}
      </div>
    </header>
  )
}
