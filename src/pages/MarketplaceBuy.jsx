import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getUserDiscountPercent } from '../api/adminStore'
import { api, checkApiOnline } from '../api/client'
import { getMarketplaceProduct } from '../data/marketplace/products'
import { getMarketplacePrice } from '../data/marketplace/discounts'
import { getCourseTributePaymentUrl } from '../data/tributePayments'
import buyStyles from './CourseBuy.module.css'
import styles from './MarketplaceProduct.module.css'

const PAY_METHODS = [
  { id: 'tribute', label: 'Tribute', descRu: 'Карта, СБП, Stars, TON', descEn: 'Card, SBP, Stars, TON', icon: '✦' },
  { id: 'stripe', label: 'Stripe', descRu: 'Visa, Mastercard', descEn: 'Visa, Mastercard', icon: '◈' },
  { id: 'liqpay', label: 'LiqPay', descRu: 'Украина', descEn: 'Ukraine', icon: '◉' },
  { id: 'demo', label: 'Demo', descRu: 'Тестовая оплата', descEn: 'Test payment', icon: '◇' },
]

export function MarketplaceBuy() {
  const { productSlug } = useParams()
  const navigate = useNavigate()
  const product = getMarketplaceProduct(productSlug)
  const { user, hasPurchased, login, purchaseCourse, purchases, apiMode } = useAuth()
  const { lang } = useLanguage()
  const ru = lang === 'ru'

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [method, setMethod] = useState('tribute')
  const [tributeEnabled, setTributeEnabled] = useState(false)

  useEffect(() => {
    checkApiOnline().then(async (ok) => {
      if (!ok) return
      try {
        const status = await api.tributeStatus()
        setTributeEnabled(Boolean(status.enabled))
        if (status.enabled) setMethod('tribute')
      } catch (_) {}
    })
  }, [])

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
  const membershipPrice = getMarketplacePrice(product.priceEur, purchases)
  const referralDiscountPercent = getUserDiscountPercent(user?.email || email)
  const priceAfterReferral =
    referralDiscountPercent > 0
      ? Math.max(0, membershipPrice - Math.round((membershipPrice * referralDiscountPercent) / 100))
      : membershipPrice
  const title = ru ? product.titleRu : product.titleEn
  const tributePaymentUrl = getCourseTributePaymentUrl(product.id)

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

  const completeDemoPurchase = async () => {
    const payload = {
      courseId: product.id,
      courseTitle: title,
      amount: priceAfterReferral,
      slug: product.slug,
    }
    const online = apiMode || await checkApiOnline()
    if (online) await api.demoPurchase(payload)
    else {
      await purchaseCourse(product.id, {
        recordAdmin: true,
        courseTitle: title,
        amount: priceAfterReferral,
        email: user?.email || email,
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await ensureAuth()
      const payload = {
        courseId: product.id,
        courseTitle: title,
        amount: priceAfterReferral,
        slug: product.slug,
      }

      if (method === 'tribute') {
        if (tributePaymentUrl) {
          window.location.href = tributePaymentUrl
          return
        }
        const result = await api.tributeCheckout(payload)
        const payUrl = result.url || result.webappUrl
        if (!payUrl) throw new Error(ru ? 'Tribute не вернул ссылку' : 'No payment URL')
        window.location.href = payUrl
        return
      }
      if (method === 'stripe') {
        const { url } = await api.stripeCheckout(payload)
        window.location.href = url
        return
      }
      if (method === 'liqpay') {
        const lp = await api.liqpayCreate(payload)
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = 'https://www.liqpay.ua/api/3/checkout'
        form.innerHTML = `<input name="data" value="${lp.data}"/><input name="signature" value="${lp.signature}"/>`
        document.body.appendChild(form)
        form.submit()
        return
      }
      await completeDemoPurchase()
      navigate(`/marketplace/${product.slug}?paid=1`)
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

  return (
    <div
      className={buyStyles.wrap}
      style={{ '--mp-cover': product.coverGradient }}
    >
      <div className={buyStyles.container}>
        <header className={styles.preview} style={{ marginBottom: 24, aspectRatio: 'auto', minHeight: 140 }}>
          <span className={styles.previewIcon}>{product.coverIcon}</span>
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
                  {priceAfterReferral < product.priceEur && (
                    <span className={buyStyles.oldPrice}>{product.priceEur} €</span>
                  )}
                  <span className={buyStyles.price}>{priceAfterReferral} €</span>
                </div>
              </div>
              {error && <div className={buyStyles.error} role="alert">{error}</div>}
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
              <button type="submit" className={buyStyles.submit} disabled={loading}>
                {ru ? `Оплатить ${priceAfterReferral} €` : `Pay ${priceAfterReferral} €`}
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
