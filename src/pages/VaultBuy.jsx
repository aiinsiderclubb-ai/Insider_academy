import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Circle, CircleCheck, CreditCard, FlaskConical, Landmark, ShieldCheck, WalletCards, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getUserDiscountPercent } from '../api/adminStore'
import { api, checkApiOnline } from '../api/client'
import { getVaultProduct } from '../data/vaultProducts'
import { getCourseTributePaymentUrl } from '../data/tributePayments'
import { ComingSoonPage } from '../components/ComingSoonLock'
import { isComingSoon } from '../config/availability'
import buyStyles from './CourseBuy.module.css'
import styles from './VaultProduct.module.css'

const PAY_METHODS = [
  { id: 'tribute', label: 'Tribute', descRu: 'Карта, СБП, Stars, TON', descEn: 'Card, SBP, Stars, TON', icon: WalletCards },
  { id: 'stripe', label: 'Stripe', descRu: 'Visa, Mastercard', descEn: 'Visa, Mastercard', icon: CreditCard },
  { id: 'liqpay', label: 'LiqPay', descRu: 'Украина', descEn: 'Ukraine', icon: Landmark },
  { id: 'demo', label: 'Demo', descRu: 'Тестовая оплата', descEn: 'Test payment', icon: FlaskConical },
].filter((m) => m.id !== 'demo' || !import.meta.env.PROD || import.meta.env.VITE_ENABLE_DEMO_PAYMENT === '1')

const BENEFITS_RU = [
  'Пожизненный доступ к материалам Vault',
  'Готовые шаблоны и файлы для скачивания',
  'Без прохождения полноценного курса',
  'Доступ в личном кабинете сразу после оплаты',
]
const BENEFITS_EN = [
  'Lifetime access to Vault materials',
  'Ready templates and downloadable files',
  'No full course required',
  'Instant access in your account after payment',
]

export function VaultBuy() {
  const { vaultSlug } = useParams()
  const navigate = useNavigate()
  const product = getVaultProduct(vaultSlug)
  const { user, hasPurchased, login, purchaseCourse, apiMode } = useAuth()
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
          <Link to="/marketplace?tab=vault">{ru ? 'К Vault' : 'To Vault'}</Link>
        </div>
      </div>
    )
  }

  if (isComingSoon('vault')) {
    return <ComingSoonPage kind="vault" lang={lang} backTo="/marketplace?tab=vault" />
  }

  const purchased = hasPurchased(product.id)
  const priceEur = product.priceEur
  const referralDiscountPercent = getUserDiscountPercent(user?.email || email)
  const priceAfterReferral = referralDiscountPercent > 0
    ? Math.max(0, priceEur - Math.round((priceEur * referralDiscountPercent) / 100))
    : priceEur
  const title = ru ? product.titleRu : product.titleEn
  const tributePaymentUrl = getCourseTributePaymentUrl(product.id)
  const benefits = ru ? BENEFITS_RU : BENEFITS_EN

  const ensureAuth = async () => {
    if (user) return
    const emailTrim = email.trim()
    if (!emailTrim || !password || password.length < 6) {
      throw new Error(ru ? 'Введите email и пароль (мин. 6 символов)' : 'Enter email and password (min 6 chars)')
    }
    await login(emailTrim, password, name.trim() || emailTrim)
  }

  const completeDemoPurchase = async () => {
    const payload = { courseId: product.id, courseTitle: title, amount: priceAfterReferral, slug: product.slug }
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
        locale: lang,
      }

      if (method === 'tribute') {
        if (tributePaymentUrl) {
          window.location.href = tributePaymentUrl
          return
        }
        const result = await api.tributeCheckout(payload)
        const payUrl = result.url || result.webappUrl
        if (!payUrl) throw new Error(ru ? 'Tribute не вернул ссылку на оплату' : 'No payment URL from Tribute')
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
      navigate(`/vault/${product.slug}?paid=1`)
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
              {ru ? 'Vault уже куплен' : 'Vault already purchased'}
            </h2>
            <p className={buyStyles.purchasedDesc}>{title}</p>
            <Link to={`/vault/${product.slug}`} className={buyStyles.submit}>
              {ru ? 'Открыть Vault' : 'Open Vault'} <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${buyStyles.wrap} ${styles.buyPage}`} style={{ '--vault-accent': product.accent }}>
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
            <img src={product.coverImage} alt="" className={styles.checkoutProductImage} />
            <div className={styles.checkoutProductCopy}>
              <span>{ru ? product.categoryRu : product.categoryEn}</span>
              <h1>{title}</h1>
              <p>{ru ? product.shortRu : product.shortEn}</p>
            </div>
          </div>
        </header>

        <div className={buyStyles.layout}>
          <div className={buyStyles.leftCol}>
            <section className={buyStyles.sectionCard}>
              <h2 className={buyStyles.sectionTitle}>
                {ru ? 'Что входит' : 'What\'s included'}
              </h2>
              <ul className={buyStyles.benefitsList}>
                {benefits.map((item) => (
                  <li key={item} className={buyStyles.benefitItem}>
                    <Check className={buyStyles.itemIcon} size={15} aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
            <div className={buyStyles.trustRow}>
              <span className={buyStyles.trustBadge}><ShieldCheck size={14} aria-hidden />{ru ? 'Безопасная оплата' : 'Secure payment'}</span>
              <span className={buyStyles.trustBadge}><Zap size={14} aria-hidden />{ru ? 'Мгновенный доступ' : 'Instant access'}</span>
            </div>
          </div>

          <aside className={buyStyles.checkoutCol}>
            <form className={buyStyles.checkoutCard} onSubmit={handleSubmit}>
              <div className={buyStyles.checkoutHeader}>
                <h2 className={buyStyles.checkoutTitle}>{ru ? 'Оформление' : 'Checkout'}</h2>
                <div className={buyStyles.priceBlock}>
                  <span className={buyStyles.price}>{priceAfterReferral} €</span>
                </div>
              </div>

              {referralDiscountPercent > 0 && (
                <div className={buyStyles.discountBanner}>
                  {ru
                    ? `Скидка ${referralDiscountPercent}% по реферальной программе`
                    : `${referralDiscountPercent}% referral discount`}
                </div>
              )}

              {error && <div className={buyStyles.error} role="alert">{error}</div>}

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
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={buyStyles.input} required minLength={6} autoComplete="new-password" />
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

              <button type="submit" className={buyStyles.submit} disabled={loading}>
                {loading ? (
                  <span className={buyStyles.spinner} aria-hidden />
                ) : (
                  ru ? `Оплатить ${priceAfterReferral} €` : `Pay ${priceAfterReferral} €`
                )}
              </button>

              <p className={buyStyles.secureNote}>
                {ru
                  ? 'После оплаты материалы появятся в личном кабинете'
                  : 'Materials appear in your account after payment'}
              </p>
              <Link to={`/vault/${product.slug}`} className={`${buyStyles.secureNote} ${buyStyles.secureLink}`}>
                <ArrowLeft size={13} aria-hidden /> {ru ? 'Назад к описанию' : 'Back to details'}
              </Link>
            </form>
          </aside>
        </div>
      </div>
    </div>
  )
}
