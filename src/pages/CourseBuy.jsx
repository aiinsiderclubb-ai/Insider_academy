import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCourses } from '../context/CoursesContext'
import { getCourseField } from '../data/courses'
import { getCourseThemeStyle } from '../data/courseThemes'
import { useAuth } from '../context/AuthContext'
import { getUserDiscountPercent } from '../api/adminStore'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { ComparePlans } from '../components/ComparePlans'
import { PromoCodeInput } from '../components/PromoCodeInput'
import { PageMeta } from '../components/PageMeta'
import { VideoPlayer } from '../components/VideoPlayer'
import { getLessonDisplayTitle } from '../data/courses'
import { ScrollReveal } from '../components/ScrollReveal'
import { CourseHero } from '../components/CourseHero'
import { COURSE_FAQ } from '../data/courseLanding'
import { PlatformBridge } from '../components/PlatformBridge'
import { IconChevronDown } from '../components/Icons'
import { api, checkApiOnline } from '../api/client'
import { formatApiError } from '../utils/formatApiError'
import { getCourseTributePaymentUrl } from '../data/tributePayments'
import styles from './CourseBuy.module.css'

const PAY_METHODS = [
  { id: 'tribute', label: 'Tribute', descRu: 'Карта, СБП, Stars, TON', descEn: 'Card, SBP, Stars, TON', icon: '✦' },
  { id: 'stripe', label: 'Stripe', descRu: 'Visa, Mastercard', descEn: 'Visa, Mastercard', icon: '◈' },
  { id: 'liqpay', label: 'LiqPay', descRu: 'Украина', descEn: 'Ukraine', icon: '◉' },
  { id: 'demo', label: 'Demo', descRu: 'Тестовая оплата', descEn: 'Test payment', icon: '◇' },
]

const BENEFITS_RU = [
  'Пожизненный доступ ко всем урокам',
  'Проверка домашних заданий',
  'Сертификат после прохождения',
  'Готовые шаблоны и материалы',
]
const BENEFITS_EN = [
  'Lifetime access to all lessons',
  'Homework review included',
  'Certificate upon completion',
  'Ready-made templates & materials',
]

export function CourseBuy() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { getCourseBySlug } = useCourses()
  const course = getCourseBySlug(slug)
  const { user, hasPurchased, login, purchaseCourse, apiMode } = useAuth()
  const { t, lang } = useLanguage()
  const { theme } = useTheme()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [method, setMethod] = useState('tribute')
  const [tributeEnabled, setTributeEnabled] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [promoApplied, setPromoApplied] = useState(null)
  const [promoCode, setPromoCode] = useState('')

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

  if (!course) {
    return (
      <div className={styles.wrap}>
        <div className={styles.container}>
          <p>{t('courseBuy.notFound')}</p>
          <Link to="/courses">{t('courseBuy.toCatalog')}</Link>
        </div>
      </div>
    )
  }

  const purchased = hasPurchased(course.id)
  const priceEur = course.priceEur ?? Math.round(course.price / 100)
  const referralDiscountPercent = getUserDiscountPercent(user?.email || email)
  const priceAfterReferral = referralDiscountPercent > 0
    ? Math.max(0, priceEur - Math.round((priceEur * referralDiscountPercent) / 100))
    : priceEur
  const checkoutPrice = promoApplied?.valid ? promoApplied.finalEur : priceAfterReferral
  const fullPriceEur = Math.round(priceEur * 1.15)
  const discount = fullPriceEur - priceAfterReferral
  const courseTitle = getCourseField(course, 'title', lang)
  const tributePaymentUrl = getCourseTributePaymentUrl(course.id)
  const goalsList = getCourseField(course, 'goals', lang) || []
  const benefits = lang === 'ru' ? BENEFITS_RU : BENEFITS_EN
  const themeStyle = getCourseThemeStyle(course.id, theme)

  const ensureAuth = async () => {
    if (user) return
    const emailTrim = email.trim()
    if (!emailTrim || !password || password.length < 6) {
      throw new Error(lang === 'ru' ? 'Введите email и пароль (мин. 6 символов)' : 'Enter email and password (min 6 chars)')
    }
    await login(emailTrim, password, name.trim() || emailTrim)
  }

  const completeDemoPurchase = async () => {
    const payload = { courseId: course.id, courseTitle, amount: checkoutPrice, slug: course.slug, promoCode: promoCode || undefined }
    const online = apiMode || await checkApiOnline()
    if (online) await api.demoPurchase(payload)
    else await purchaseCourse(course.id, { recordAdmin: true, courseTitle, amount: priceAfterReferral, email: user?.email || email })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await ensureAuth()
      const payload = { courseId: course.id, courseTitle, amount: priceAfterReferral, slug: course.slug }

      if (method === 'tribute') {
        if (tributePaymentUrl) {
          window.location.href = tributePaymentUrl
          return
        }
        const result = await api.tributeCheckout(payload)
        const payUrl = result.url || result.webappUrl
        if (!payUrl) throw new Error(lang === 'ru' ? 'Tribute не вернул ссылку на оплату' : 'No payment URL from Tribute')
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
      navigate(`/courses/${course.slug}?paid=1`)
    } catch (err) {
      if (err?.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(err.email || email)}`)
        return
      }
      setError(formatApiError(err, lang) || (lang === 'ru' ? 'Ошибка оплаты' : 'Payment error'))
    } finally {
      setLoading(false)
    }
  }

  if (purchased) {
    return (
      <div className={styles.wrap} style={themeStyle}>
        <div className={styles.container}>
          <div className={styles.purchasedCard}>
            <div className={styles.purchasedIcon}>✓</div>
            <h2 className={styles.purchasedTitle}>
              {lang === 'ru' ? 'Курс уже куплен' : 'Course already purchased'}
            </h2>
            <p className={styles.purchasedDesc}>{courseTitle}</p>
            <Link to={`/courses/${course.slug}`} className={styles.submit}>
              {lang === 'ru' ? 'Перейти к курсу →' : 'Go to course →'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const previewLesson = course.lessons?.[0]
  const showLessonPreview = Boolean(
    previewLesson?.videoUrl && (course.isFreeTrial || course.priceEur === 0)
  )

  return (
    <div className={styles.wrap} style={themeStyle}>
      <PageMeta title={courseTitle} description={getCourseField(course, 'shortDescription', lang)} />
      <div className={styles.container}>
        <CourseHero
          course={course}
          lang={lang}
          backTo={`/courses/${course.slug}`}
          backLabel={courseTitle}
          compact
        />

        <div className={styles.layout}>
          <div className={styles.leftCol}>
            <section className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                {lang === 'ru' ? 'Что входит в курс' : 'What\'s included'}
              </h2>
              <ul className={styles.benefitsList}>
                {benefits.map((item) => (
                  <li key={item} className={styles.benefitItem}>{item}</li>
                ))}
              </ul>
            </section>

            {goalsList.length > 0 && (
              <section className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>
                  {lang === 'ru' ? 'После курса вы' : 'After this course you will'}
                </h2>
                <ul className={styles.goalsList}>
                  {goalsList.slice(0, 4).map((goal, i) => (
                    <li key={i} className={styles.goalItem}>{goal}</li>
                  ))}
                </ul>
              </section>
            )}

            <div className={styles.trustRow}>
              <span className={styles.trustBadge}>🔒 {lang === 'ru' ? 'Безопасная оплата' : 'Secure payment'}</span>
              <span className={styles.trustBadge}>⚡ {lang === 'ru' ? 'Мгновенный доступ' : 'Instant access'}</span>
            </div>

            {showLessonPreview && (
              <section className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>
                  {lang === 'ru' ? 'Превью: первый урок (~1 мин)' : 'Preview: first lesson (~1 min)'}
                </h2>
                <VideoPlayer
                  lesson={previewLesson}
                  title={getLessonDisplayTitle(previewLesson, lang)}
                  locked={false}
                />
              </section>
            )}

            <ComparePlans course={course} lang={lang} coursePriceEur={priceAfterReferral} />

            <ScrollReveal>
              <section className={styles.faqSection}>
                <h2 className={styles.sectionTitle}>FAQ</h2>
                <div className={styles.faqList}>
                  {COURSE_FAQ.map((item, i) => {
                    const open = openFaq === i
                    return (
                      <div key={i} className={styles.faqItem}>
                        <button
                          type="button"
                          className={styles.faqQuestion}
                          onClick={() => setOpenFaq(open ? null : i)}
                          aria-expanded={open}
                        >
                          {lang === 'ru' ? item.q : item.qEn}
                          <span className={`${styles.faqChevron} ${open ? styles.faqChevronOpen : ''}`}>
                            <IconChevronDown />
                          </span>
                        </button>
                        {open && (
                          <p className={styles.faqAnswer}>{lang === 'ru' ? item.a : item.aEn}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            </ScrollReveal>

            <PlatformBridge lang={lang} />
          </div>

          <aside className={styles.checkoutCol}>
            <form className={styles.checkoutCard} onSubmit={handleSubmit}>
              <div className={styles.checkoutHeader}>
                <h2 className={styles.checkoutTitle}>
                  {lang === 'ru' ? 'Оформление' : 'Checkout'}
                </h2>
                <div className={styles.priceBlock}>
                  {discount > 0 && (
                    <span className={styles.oldPrice}>{fullPriceEur} €</span>
                  )}
                  <span className={styles.price}>{checkoutPrice} €</span>
                </div>
              </div>

              <PromoCodeInput
                courseId={course.id}
                amountEur={priceAfterReferral}
                lang={lang}
                onApplied={(result) => {
                  setPromoApplied(result)
                  setPromoCode(result?.code || '')
                }}
              />

              {referralDiscountPercent > 0 && (
                <div className={styles.discountBanner}>
                  {lang === 'ru' ? `Скидка ${referralDiscountPercent}% по реферальной программе` : `${referralDiscountPercent}% referral discount`}
                </div>
              )}

              {error && <div className={styles.error} role="alert">{error}</div>}

              {!user && (
                <div className={styles.authFields}>
                  <label className={styles.label}>
                    {lang === 'ru' ? 'Имя' : 'Name'}
                    <input value={name} onChange={(e) => setName(e.target.value)} className={styles.input} autoComplete="name" />
                  </label>
                  <label className={styles.label}>
                    Email
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} required autoComplete="email" />
                  </label>
                  <label className={styles.label}>
                    {lang === 'ru' ? 'Пароль' : 'Password'}
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={styles.input} required minLength={6} autoComplete="new-password" />
                  </label>
                </div>
              )}

              <p className={styles.payLabel}>{lang === 'ru' ? 'Способ оплаты' : 'Payment method'}</p>
              <div className={styles.payMethods}>
                {PAY_METHODS.map((pm) => {
                  const disabled = pm.id === 'tribute' && !tributeEnabled
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      className={`${styles.payCard} ${method === pm.id ? styles.payCardActive : ''} ${disabled ? styles.payCardDisabled : ''}`}
                      onClick={() => !disabled && setMethod(pm.id)}
                      disabled={disabled}
                      aria-pressed={method === pm.id}
                    >
                      <span className={styles.payIcon} aria-hidden>{pm.icon}</span>
                      <span className={styles.payInfo}>
                        <span className={styles.payName}>
                          {pm.label}
                          {pm.id === 'tribute' && !tributeEnabled && (
                            <span className={styles.payNote}> ({lang === 'ru' ? 'скоро' : 'soon'})</span>
                          )}
                        </span>
                        <span className={styles.payDesc}>{lang === 'ru' ? pm.descRu : pm.descEn}</span>
                      </span>
                      <span className={styles.payRadio} aria-hidden />
                    </button>
                  )
                })}
              </div>

              {tributeEnabled && method === 'tribute' && (
                <p className={styles.tributeHint}>
                  {lang === 'ru'
                    ? 'Оплата через Tribute: карта, СБП, Telegram Stars, TON'
                    : 'Pay via Tribute: card, SBP, Telegram Stars, TON'}
                </p>
              )}

              <button type="submit" className={styles.submit} disabled={loading}>
                {loading ? (
                  <span className={styles.spinner} aria-hidden />
                ) : (
                  lang === 'ru' ? `Оплатить ${priceAfterReferral} €` : `Pay ${priceAfterReferral} €`
                )}
              </button>

              <p className={styles.secureNote}>
                {lang === 'ru'
                  ? 'Нажимая «Оплатить», вы соглашаетесь с условиями доступа к курсу'
                  : 'By clicking Pay, you agree to the course access terms'}
              </p>
            </form>
          </aside>
        </div>
      </div>
    </div>
  )
}
