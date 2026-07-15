import { useEffect } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Check, ChevronRight, Dot, Plus } from 'lucide-react'
import { Confetti } from '../components/Confetti'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getVaultProduct } from '../data/vaultProducts'
import { getVaultDetails } from '../data/vaultDetails'
import { ScrollReveal } from '../components/ScrollReveal'
import { ComingSoonAction } from '../components/ComingSoonLock'
import { isComingSoon } from '../config/availability'
import styles from './VaultProduct.module.css'

export function VaultProduct() {
  const { vaultSlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { lang } = useLanguage()
  const { hasPurchased } = useAuth()
  const ru = lang === 'ru'
  const showConfetti = searchParams.get('paid') === '1'

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

  const product = getVaultProduct(vaultSlug)
  const details = product ? getVaultDetails(product.id) : null

  if (!product) return <Navigate to="/marketplace?tab=vault" replace />

  const purchased = hasPurchased(product.id)
  const title = ru ? product.titleRu : product.titleEn
  const includes = ru ? product.includesRu : product.includesEn
  const forWho = ru ? product.forWhoRu : product.forWhoEn
  const heroLead = details ? (ru ? details.heroRu : details.heroEn) : (ru ? product.shortRu : product.shortEn)
  const outcomes = details ? (ru ? details.outcomesRu : details.outcomesEn) : []
  const comingSoon = isComingSoon('vault')

  return (
    <div className={styles.wrap} style={{ '--vault-accent': product.accent }}>
      <Confetti active={showConfetti} />
      <div className={styles.container}>
        {showConfetti && (
          <div className={styles.paidNotice} role="status">
            <span className={styles.paidIcon} aria-hidden><Check size={15} strokeWidth={2.4} /></span>
            <strong>{ru ? 'Оплата прошла успешно' : 'Payment complete'}</strong>
            <span>{ru ? 'Материалы уже доступны в вашем Vault.' : 'The materials are now available in your Vault.'}</span>
          </div>
        )}

        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/marketplace?tab=vault">Marketplace</Link>
          <ChevronRight className={styles.breadcrumbIcon} size={14} aria-hidden />
          <Link to="/marketplace?tab=vault">Vault</Link>
          <ChevronRight className={styles.breadcrumbIcon} size={14} aria-hidden />
          <span>{title}</span>
        </nav>

        <div className={styles.layout}>
          <main className={styles.main}>
            <ScrollReveal>
              <figure className={styles.gallery}>
                <img src={product.coverImage} alt={title} className={styles.galleryImage} />
                <figcaption>
                  <span>{ru ? product.categoryRu : product.categoryEn}</span>
                  <strong>{ru ? product.highlightRu : product.highlightEn}</strong>
                </figcaption>
              </figure>
            </ScrollReveal>

            <ScrollReveal>
              <section className={styles.contentBlock}>
                <div className={styles.sectionHeading}>
                  <span>
                    <span>01</span>
                    <Dot size={13} aria-hidden />
                    {ru ? 'Содержание' : 'Contents'}
                  </span>
                  <h2>{ru ? 'Что внутри' : 'What is inside'}</h2>
                </div>
                <div className={styles.accordion}>
                  {includes.map((item, index) => (
                    <details key={item} className={styles.accordionItem} open={index < 2}>
                      <summary>
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        {item}
                        <Plus className={styles.accordionToggle} size={16} aria-hidden />
                      </summary>
                      <p className={styles.accordionBody}>
                        {ru
                          ? 'Материал входит в состав Vault и становится доступен сразу после покупки.'
                          : 'This resource is included in the Vault and unlocks immediately after purchase.'}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            </ScrollReveal>

            {outcomes.length > 0 && (
              <ScrollReveal>
                <section className={styles.contentBlock}>
                  <div className={styles.sectionHeading}>
                    <span>
                      <span>02</span>
                      <Dot size={13} aria-hidden />
                      {ru ? 'Практика' : 'Practical value'}
                    </span>
                    <h2>{ru ? 'Что вы получите' : 'What you will achieve'}</h2>
                  </div>
                  <ul className={styles.outcomes}>
                    {outcomes.map((item) => (
                      <li key={item}>
                        <ArrowUpRight size={14} aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </ScrollReveal>
            )}

            <ScrollReveal>
              <aside className={styles.forWho}>
                <span>{ru ? 'Для кого' : 'Best for'}</span>
                <p>{forWho}</p>
              </aside>
            </ScrollReveal>
          </main>

          <aside className={styles.sidebar}>
            <span className={styles.category}>{ru ? product.categoryRu : product.categoryEn}</span>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.heroLead}>{heroLead}</p>

            <div className={styles.priceRow}>
              <span className={styles.price}>{product.priceEur}€</span>
              <span>{ru ? 'разовая покупка' : 'one-time purchase'}</span>
            </div>

            <ul className={styles.railPerks}>
              <li><Check size={14} aria-hidden />{ru ? 'Мгновенный доступ' : 'Instant access'}</li>
              <li><Check size={14} aria-hidden />{ru ? 'Пожизненные обновления' : 'Lifetime updates'}</li>
              <li><Check size={14} aria-hidden />{ru ? 'Коммерческая лицензия' : 'Commercial license'}</li>
            </ul>

            {comingSoon ? (
              <ComingSoonAction kind="vault" lang={lang} className={styles.btnPrimary} />
            ) : purchased ? (
              <>
                <span className={styles.ownedBadge}>{ru ? 'Уже в вашем Vault' : 'In your Vault'}</span>
                <Link to="/cabinet#vault" className={styles.btnPrimary}>
                  {ru ? 'Открыть в кабинете' : 'Open in cabinet'} <ArrowDownRight size={16} aria-hidden />
                </Link>
              </>
            ) : (
              <Link to={`/vault/${product.slug}/buy`} className={styles.btnPrimary}>
                {ru ? 'Купить сейчас' : 'Buy now'} <ArrowUpRight size={16} aria-hidden />
              </Link>
            )}
            <Link to="/marketplace?tab=vault" className={styles.btnSecondary}>
              {ru ? 'Все Vault-продукты' : 'All Vault products'}
            </Link>
          </aside>
        </div>
      </div>
    </div>
  )
}
