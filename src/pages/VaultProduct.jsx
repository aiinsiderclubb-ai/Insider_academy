import { useEffect } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { Confetti } from '../components/Confetti'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getVaultProduct } from '../data/vaultProducts'
import { getVaultDetails } from '../data/vaultDetails'
import { ScrollReveal } from '../components/ScrollReveal'
import styles from './VaultProduct.module.css'

export function VaultProduct() {
  const { vaultSlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { lang } = useLanguage()
  const { hasPurchased } = useAuth()
  const ru = lang === 'ru'
  const showConfetti = searchParams.get('paid') === '1'

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

  const product = getVaultProduct(vaultSlug)
  const details = product ? getVaultDetails(product.id) : null

  if (!product) {
    return <Navigate to="/vault" replace />
  }

  const purchased = hasPurchased(product.id)
  const title = ru ? product.titleRu : product.titleEn
  const includes = ru ? product.includesRu : product.includesEn
  const forWho = ru ? product.forWhoRu : product.forWhoEn
  const heroLead = details ? (ru ? details.heroRu : details.heroEn) : (ru ? product.shortRu : product.shortEn)
  const outcomes = details ? (ru ? details.outcomesRu : details.outcomesEn) : []

  return (
    <div className={styles.wrap}>
      <Confetti active={showConfetti} />
      <div
        className={styles.container}
        style={{
          '--vault-accent': product.accent,
          '--vault-gradient': product.gradient,
        }}
      >
        <ScrollReveal>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/vault">{ru ? 'Vault' : 'Vault'}</Link>
            <span aria-hidden>/</span>
            <span>{title}</span>
          </nav>
        </ScrollReveal>

        <ScrollReveal>
          <header className={styles.hero}>
            {product.coverImage ? (
              <img src={product.coverImage} alt="" className={styles.heroCover} />
            ) : (
              <span className={styles.heroIcon} aria-hidden>
                {product.icon}
              </span>
            )}
            <div className={styles.heroOverlay} aria-hidden />
            <span className={styles.category}>
              {ru ? product.categoryRu : product.categoryEn}
            </span>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.heroLead}>{heroLead}</p>
          </header>
        </ScrollReveal>

        <div className={styles.grid}>
          <ScrollReveal className={styles.main}>
            <h2>{ru ? 'Что внутри' : 'What\'s inside'}</h2>
            <div className={styles.accordion}>
              {includes.map((item, i) => (
                <details key={item} className={styles.accordionItem} open={i < 3}>
                  <summary>{item}</summary>
                  <p className={styles.accordionBody}>
                    {ru
                      ? 'Материал входит в состав Vault и доступен после покупки.'
                      : 'Included in Vault — available after purchase.'}
                  </p>
                </details>
              ))}
            </div>

            {outcomes.length > 0 && (
              <>
                <h2>{ru ? 'Результат' : 'Outcomes'}</h2>
                <ul className={styles.outcomes}>
                  {outcomes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            )}

            <p className={styles.forWho}>
              <strong>{ru ? 'Кому подходит: ' : 'Best for: '}</strong>
              {forWho}
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <aside className={styles.sidebar}>
              {purchased && (
                <span className={styles.ownedBadge}>
                  {ru ? 'Уже в вашем Vault' : 'In your Vault'}
                </span>
              )}
              <span className={styles.price}>{product.priceEur}€</span>
              <p className={styles.priceNote}>
                {ru
                  ? 'Разовая покупка · доступ в личном кабинете'
                  : 'One-time purchase · access in your account'}
              </p>
              {purchased ? (
                <Link to="/cabinet#vault" className={styles.btnPrimary}>
                  {ru ? 'Открыть в кабинете →' : 'Open in cabinet →'}
                </Link>
              ) : (
                <Link to={`/vault/${product.slug}/buy`} className={styles.btnPrimary}>
                  {ru ? 'Купить' : 'Buy'}
                </Link>
              )}
              <Link to="/vault" className={styles.btnSecondary}>
                {ru ? 'Все Vault-продукты' : 'All Vault products'}
              </Link>
            </aside>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
