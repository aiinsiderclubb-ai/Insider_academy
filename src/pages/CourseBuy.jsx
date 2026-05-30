import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCourses } from '../context/CoursesContext'
import { getCourseField } from '../data/courses'
import { useAuth } from '../context/AuthContext'
import { getUserDiscountPercent } from '../api/adminStore'
import { useLanguage } from '../context/LanguageContext'
import { api, checkApiOnline } from '../api/client'
import styles from './CourseBuy.module.css'

export function CourseBuy() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { getCourseBySlug } = useCourses()
  const course = getCourseBySlug(slug)
  const { user, hasPurchased, login, purchaseCourse, apiMode } = useAuth()
  const { t, lang } = useLanguage()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [method, setMethod] = useState('demo')

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
  const fullPriceEur = Math.round(priceEur * 1.15)
  const discount = fullPriceEur - priceAfterReferral
  const courseTitle = getCourseField(course, 'title', lang)
  const shortDesc = getCourseField(course, 'shortDescription', lang)
  const duration = getCourseField(course, 'duration', lang)

  const ensureAuth = async () => {
    if (user) return
    const emailTrim = email.trim()
    if (!emailTrim || !password || password.length < 6) {
      throw new Error(lang === 'ru' ? 'Введите email и пароль (мин. 6 символов)' : 'Enter email and password (min 6 chars)')
    }
    await login(emailTrim, password, name.trim() || emailTrim)
  }

  const completeDemoPurchase = async () => {
    const payload = { courseId: course.id, courseTitle, amount: priceAfterReferral, slug: course.slug }
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
      setError(err.message || (lang === 'ru' ? 'Ошибка оплаты' : 'Payment error'))
    } finally {
      setLoading(false)
    }
  }

  if (purchased) {
    return (
      <div className={styles.wrap}>
        <div className={styles.container}>
          <p>{lang === 'ru' ? 'Курс уже куплен.' : 'Course already purchased.'}</p>
          <Link to={`/courses/${course.slug}`}>{lang === 'ru' ? 'Перейти к курсу' : 'Go to course'}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <Link to={`/courses/${course.slug}`} className={styles.back}>← {courseTitle}</Link>
        <div className={styles.grid}>
          <div className={styles.summary}>
            <img src={course.image} alt="" className={styles.image} />
            <h1 className={styles.title}>{courseTitle}</h1>
            <p className={styles.desc}>{shortDesc}</p>
            <p className={styles.meta}>{duration}</p>
            <div className={styles.priceBlock}>
              {discount > 0 && <span className={styles.oldPrice}>{fullPriceEur} €</span>}
              <span className={styles.price}>{priceAfterReferral} €</span>
            </div>
          </div>
          <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.formTitle}>{lang === 'ru' ? 'Оформление' : 'Checkout'}</h2>
            {error && <div className={styles.error}>{error}</div>}
            {!user && (
              <>
                <label className={styles.label}>{lang === 'ru' ? 'Имя' : 'Name'}<input value={name} onChange={(e) => setName(e.target.value)} className={styles.input} /></label>
                <label className={styles.label}>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} required /></label>
                <label className={styles.label}>{lang === 'ru' ? 'Пароль' : 'Password'}<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={styles.input} required minLength={6} /></label>
              </>
            )}
            <div className={styles.payMethods}>
              <label className={styles.payOption}><input type="radio" name="pay" checked={method === 'demo'} onChange={() => setMethod('demo')} /> Demo</label>
              <label className={styles.payOption}><input type="radio" name="pay" checked={method === 'stripe'} onChange={() => setMethod('stripe')} /> Stripe</label>
              <label className={styles.payOption}><input type="radio" name="pay" checked={method === 'liqpay'} onChange={() => setMethod('liqpay')} /> LiqPay</label>
            </div>
            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? '...' : (lang === 'ru' ? `Оплатить ${priceAfterReferral} €` : `Pay ${priceAfterReferral} €`)}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
