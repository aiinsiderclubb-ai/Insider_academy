import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { api, checkApiOnline } from '../api/client'
import { getMarketplaceProduct } from '../data/marketplace/products'
import buyStyles from './CourseBuy.module.css'
import styles from './MarketplaceProduct.module.css'

const PAY_METHODS = [
  { id: 'tribute', label: 'Tribute', descRu: 'Карта, СБП, Stars, TON', descEn: 'Card, SBP, Stars, TON', icon: '✦' },
  { id: 'stripe', label: 'Stripe', descRu: 'Visa, Mastercard', descEn: 'Visa, Mastercard', icon: '◈' },
  { id: 'liqpay', label: 'LiqPay', descRu: 'Украина', descEn: 'Ukraine', icon: '◉' },
]

const LICENSE_LABELS = {
  personal: { ru: 'Personal — для себя', en: 'Personal — own use' },
  client: { ru: 'Client — до 5 клиентов', en: 'Client — up to 5 clients' },
  agency: { ru: 'Agency — без лимита клиентов', en: 'Agency — unlimited clients' },
}

export function MarketplaceBuy() {
  const { productSlug } = useParams()
  const product = getMarketplaceProduct(productSlug)
  const { user, hasPurchased, login } = useAuth()
  const { lang } = useLanguage()
  const ru = lang === 'ru'

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [method, setMethod] = useState('tribute')
  const [tributeEnabled, setTributeEnabled] = useState(false)
  const [licenseTier, setLicenseTier] = useState('personal')
  const [serverProduct, setServerProduct] = useState(null)
  const [commerceEnabled, setCommerceEnabled] = useState(false)
  const [waitlistDone, setWaitlistDone] = useState(false)

  const joinWaitlist = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await api.marketplaceWaitlist({ email, productId: product.id, locale: lang })
      setWaitlistDone(true)
    } catch (err) {
      setError(err.message || (ru ? 'Не удалось сохранить email' : 'Could not save email'))
    }
  }

  useEffect(() => {
    checkApiOnline().then(async (ok) => {
      if (!ok) return
      try {
        const catalog = await api.marketplaceCatalog()
        setCommerceEnabled(Boolean(catalog.enabled))
        setServerProduct(catalog.products?.find((item) => item.id === product?.id) || null)
        const status = await api.tributeStatus()
        setTributeEnabled(Boolean(status.enabled))
        if (status.enabled) setMethod('tribute')
      } catch (_) {}
    })
  }, [product?.id])

  if (!product) {
    return (
      <div className={buyStyles.wrap}>
        <div className={buyStyles.container}>
          <p>{ru ? 'Продукт не найден' : 'Product not found'}</p>
          <Link to="/marketplace">{ru ? 'В Marketplace' : 'To Marketplace'}</Link>
        </div>
      </div>
    )
  }

  const purchased = hasPurchased(product.id)
  const releasedForSale = product.id === 'mp-voice-beauty-salon'
  const selectedLicense = serverProduct?.licenses?.find((item) => item.id === licenseTier)
  const serverPrice = selectedLicense?.priceEur ?? product.priceEur
  const title = ru ? product.titleRu : product.titleEn

  const benefits = ru
    ? [
        'Пожизненный доступ к файлам продукта',
        'Скачивание в личном кабинете',
        'Обновления в рамках продукта',
        'Коммерческая лицензия на использование',
      ]
    : [
        'Lifetime access to product files',
        'Downloads in your account',
        'Product updates included',
        'Commercial use license',
      ]

  const ensureAuth = async () => {
    if (user) return
    const emailTrim = email.trim()
    if (!emailTrim || !password || password.length < 6) {
      throw new Error(ru ? 'Введите email и пароль (мин. 6 символов)' : 'Enter email and password (min 6 chars)')
    }
    await login(emailTrim, password, name.trim() || emailTrim)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await ensureAuth()
      if (method === 'tribute') {
        const result = await api.marketplaceTributeCheckout(product.id, licenseTier)
        const payUrl = result.url || result.webappUrl
        if (!payUrl) throw new Error(ru ? 'Tribute не вернул ссылку' : 'No payment URL')
        window.location.href = payUrl
        return
      }
      if (method === 'stripe') {
        const { url } = await api.marketplaceStripeCheckout(product.id, licenseTier)
        window.location.href = url
        return
      }
      if (method === 'liqpay') {
        const lp = await api.marketplaceLiqpayCheckout(product.id, licenseTier)
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = 'https://www.liqpay.ua/api/3/checkout'
        form.innerHTML = `<input name="data" value="${lp.data}"/><input name="signature" value="${lp.signature}"/>`
        document.body.appendChild(form)
        form.submit()
        return
      }
      throw new Error(ru ? 'Выберите способ оплаты' : 'Choose a payment method')
    } catch (err) {
      setError(err.message || (ru ? 'Ошибка оплаты' : 'Payment error'))
    } finally {
      setLoading(false)
    }
  }

  if (purchased) {
    return (
      <div className={buyStyles.wrap}>
        <div className={buyStyles.container}>
          <div className={buyStyles.purchasedCard}>
            <div className={buyStyles.purchasedIcon}>✓</div>
            <h2 className={buyStyles.purchasedTitle}>
              {ru ? 'Уже куплено' : 'Already purchased'}
            </h2>
            <Link to="/cabinet#marketplace" className={buyStyles.submit}>
              {ru ? 'Скачать →' : 'Download →'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!releasedForSale) {
    return (
      <div className={buyStyles.wrap}>
        <div className={buyStyles.container}>
          <div className={buyStyles.purchasedCard}>
            <h2 className={buyStyles.purchasedTitle}>{ru ? 'Продукт ещё не выпущен' : 'Product is not released yet'}</h2>
            <p>{ru ? 'Оплата недоступна. Страница оставлена как preview.' : 'Checkout is unavailable. Page remains available as a preview.'}</p>
            {waitlistDone ? <p>{ru ? 'Готово. Сообщим после публикации проверенной версии.' : 'Done. We will notify you after verified release is published.'}</p> : (
              <form onSubmit={joinWaitlist} className={buyStyles.authFields}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={buyStyles.input} placeholder="Email" required />
                <button type="submit" className={buyStyles.submit}>{ru ? 'Сообщить о релизе' : 'Notify me on release'}</button>
              </form>
            )}
            {error && <div className={buyStyles.error}>{error}</div>}
            <Link to={`/marketplace/${product.slug}`} className={buyStyles.submit}>{ru ? 'Назад к продукту' : 'Back to product'}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={buyStyles.wrap}
      style={{ '--mp-cover': product.coverGradient }}
    >
      <div className={buyStyles.container}>
        <header className={styles.preview} style={{ marginBottom: 24, aspectRatio: 'auto', minHeight: 140 }}>
          {product.coverImage ? (
            <img src={product.coverImage} alt="" className={styles.previewCover} />
          ) : (
            <span className={styles.previewIcon}>{product.coverIcon}</span>
          )}
          <div className={styles.previewTint} aria-hidden />
          <div className={styles.previewOverlay} aria-hidden />
        </header>
        <div className={buyStyles.layout}>
          <div className={buyStyles.leftCol}>
            <section className={buyStyles.sectionCard}>
              <h2 className={buyStyles.sectionTitle}>{title}</h2>
              <ul className={buyStyles.benefitsList}>
                {benefits.map((item) => (
                  <li key={item} className={buyStyles.benefitItem}>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <aside className={buyStyles.checkoutCol}>
            <form className={buyStyles.checkoutCard} onSubmit={handleSubmit}>
              <div className={buyStyles.checkoutHeader}>
                <h2 className={buyStyles.checkoutTitle}>{ru ? 'Оформление' : 'Checkout'}</h2>
                <div className={buyStyles.priceBlock}>
                  <span className={buyStyles.price}>{serverPrice} €</span>
                </div>
              </div>
              {error && <div className={buyStyles.error} role="alert">{error}</div>}
              {serverProduct && <div className={buyStyles.payMethods} aria-label={ru ? 'Тип лицензии' : 'License tier'}>
                {Object.entries(LICENSE_LABELS).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`${buyStyles.payCard} ${licenseTier === id ? buyStyles.payCardActive : ''}`}
                    onClick={() => setLicenseTier(id)}
                  >
                    <span className={buyStyles.payName}>{ru ? label.ru : label.en}</span>
                    <span>{serverProduct.licenses.find((item) => item.id === id)?.priceEur} €</span>
                  </button>
                ))}
              </div>}
              {!user && (
                <div className={buyStyles.authFields}>
                  <label className={buyStyles.label}>
                    Email
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={buyStyles.input} required />
                  </label>
                  <label className={buyStyles.label}>
                    {ru ? 'Пароль' : 'Password'}
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={buyStyles.input} required minLength={6} />
                  </label>
                </div>
              )}
              <div className={buyStyles.payMethods}>
                {PAY_METHODS.map((pm) => {
                  const disabled = pm.id === 'tribute' && !tributeEnabled
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      className={`${buyStyles.payCard} ${method === pm.id ? buyStyles.payCardActive : ''}`}
                      onClick={() => !disabled && setMethod(pm.id)}
                      disabled={disabled}
                    >
                      <span className={buyStyles.payName}>{pm.label}</span>
                    </button>
                  )
                })}
              </div>
              {!commerceEnabled && (
                <p className={buyStyles.error}>{ru ? 'Продажи временно закрыты до завершения безопасного запуска.' : 'Sales are paused until the secure rollout is complete.'}</p>
              )}
              <button type="submit" className={buyStyles.submit} disabled={loading || !commerceEnabled || !serverProduct}>
                {ru ? `Оплатить ${serverPrice} €` : `Pay ${serverPrice} €`}
              </button>
              <Link to={`/marketplace/${product.slug}`} className={buyStyles.secureNote}>
                {ru ? '← Назад' : '← Back'}
              </Link>
            </form>
          </aside>
        </div>
      </div>
    </div>
  )
}
