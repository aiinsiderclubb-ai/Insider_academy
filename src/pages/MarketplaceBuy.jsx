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

  if (productLoading) {
    return <div className={buyStyles.wrap}><div className={buyStyles.container}>{ru ? 'Загрузка…' : 'Loading…'}</div></div>
  }

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

  if (product.isFree) {
    return <Navigate to={`/marketplace/${product.slug}`} replace />
  }

  if (isComingSoon('marketplace')) {
    return <ComingSoonPage kind="marketplace" lang={lang} backTo="/marketplace" />
  }

  const purchased = hasPurchased(product.id)
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
    if (!emailTrim || !password || password.length < 10 || !/[A-Za-zА-Яа-яІіЇїЄє]/.test(password) || !/\d/.test(password)) {
      throw new Error(ru ? 'Введите email и пароль (мин. 10 символов, буква и цифра)' : 'Enter email and password (10+ chars, letter and number)')
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
        for (const [name, value] of [['data', lp.data], ['signature', lp.signature]]) {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = name
          input.value = String(value || '')
          form.appendChild(input)
        }
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
            <div className={buyStyles.purchasedIcon}><Check size={26} strokeWidth={2.2} aria-hidden /></div>
            <h2 className={buyStyles.purchasedTitle}>
              {ru ? 'Уже куплено' : 'Already purchased'}
            </h2>
            <Link to="/cabinet#marketplace" className={buyStyles.submit}>
              {ru ? 'Скачать' : 'Download'} <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${buyStyles.wrap} ${styles.buyPage}`}>
      <div className={buyStyles.container}>
        <header className={styles.checkoutIntro}>
          <div className={styles.checkoutSteps} aria-label={ru ? 'Этапы оформления' : 'Checkout steps'}>
            <span className={`${styles.checkoutStep} ${styles.checkoutStepDone}`}>
              <strong>1</strong>{ru ? 'Детали заказа' : 'Order details'}
            </span>
            <span className={`${styles.checkoutStep} ${styles.checkoutStepActive}`} aria-current="step">
              <strong>2</strong>{ru ? 'Оплата' : 'Payment'}
            </span>
            <span className={styles.checkoutStep}>
              <strong>3</strong>{ru ? 'Доступ' : 'Access'}
            </span>
          </div>
          <div className={styles.checkoutProduct}>
            <img src={getMarketplaceCoverImage(product)} alt="" className={styles.checkoutProductImage} />
            <div className={styles.checkoutProductCopy}>
              <span>AI Insider Marketplace</span>
              <h1>{title}</h1>
              <p>{ru ? product.shortRu : product.shortEn}</p>
            </div>
          </div>
        </header>
        <div className={buyStyles.layout}>
          <div className={buyStyles.leftCol}>
            <section className={buyStyles.sectionCard}>
              <h2 className={buyStyles.sectionTitle}>{title}</h2>
              <ul className={buyStyles.benefitsList}>
                {benefits.map((item) => (
                  <li key={item} className={buyStyles.benefitItem}>
                    <Check className={buyStyles.itemIcon} size={15} aria-hidden />
                    <span>{item}</span>
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
              <div className={buyStyles.payMethods} aria-label={ru ? 'Тип лицензии' : 'License tier'}>
                {Object.entries(LICENSE_LABELS).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`${buyStyles.payCard} ${licenseTier === id ? buyStyles.payCardActive : ''}`}
                    onClick={() => setLicenseTier(id)}
                  >
                    <span className={buyStyles.payName}>{ru ? label.ru : label.en}</span>
                    <span>{serverProduct?.licenses?.find((item) => item.id === id)?.priceEur ?? '—'} €</span>
                  </button>
                ))}
              </div>
              {!user && (
                <div className={buyStyles.authFields}>
                  <label className={buyStyles.label}>
                    {ru ? 'Имя' : 'Name'}
                    <input value={name} onChange={(e) => setName(e.target.value)} className={buyStyles.input} autoComplete="name" />
                  </label>
                  <label className={buyStyles.label}>
                    Email
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={buyStyles.input} required autoComplete="email" />
                  </label>
                  <label className={buyStyles.label}>
                    {ru ? 'Пароль' : 'Password'}
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={buyStyles.input} required minLength={10} autoComplete="new-password" />
                  </label>
                </div>
              )}
              <p className={buyStyles.payLabel}>{ru ? 'Способ оплаты' : 'Payment method'}</p>
              <div className={buyStyles.payMethods}>
                {PAY_METHODS.map((pm) => {
                  const disabled = pm.id === 'tribute' && !tributeEnabled
                  const PayIcon = pm.icon
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      className={`${buyStyles.payCard} ${method === pm.id ? buyStyles.payCardActive : ''} ${disabled ? buyStyles.payCardDisabled : ''}`}
                      onClick={() => !disabled && setMethod(pm.id)}
                      disabled={disabled}
                      aria-pressed={method === pm.id}
                    >
                      <span className={buyStyles.payIcon} aria-hidden><PayIcon size={16} strokeWidth={1.8} /></span>
                      <span className={buyStyles.payInfo}>
                        <span className={buyStyles.payName}>{pm.label}</span>
                        <span className={buyStyles.payDesc}>{ru ? pm.descRu : pm.descEn}</span>
                      </span>
                      {method === pm.id
                        ? <CircleCheck className={`${buyStyles.payRadio} ${buyStyles.payRadioActive}`} size={16} aria-hidden />
                        : <Circle className={buyStyles.payRadio} size={16} aria-hidden />}
                    </button>
                  )
                })}
              </div>
              {!commerceEnabled && (
                <p className={buyStyles.error}>{ru ? 'Продажи временно закрыты до завершения безопасного запуска.' : 'Sales are paused until the secure rollout is complete.'}</p>
              )}
              <button type="submit" className={buyStyles.submit} disabled={loading || !commerceEnabled}>
                {ru ? `Оплатить ${serverPrice} €` : `Pay ${serverPrice} €`}
              </button>
              <p className={buyStyles.secureNote}>
                {ru ? 'После оплаты продукт появится в личном кабинете' : 'Your product appears in the cabinet after payment'}
              </p>
              <Link to={`/marketplace/${product.slug}`} className={`${buyStyles.secureNote} ${buyStyles.secureLink}`}>
                <ArrowLeft size={13} aria-hidden /> {ru ? 'Назад' : 'Back'}
              </Link>
            </form>
          </aside>
        </div>
      </div>
    </div>
  )
}
