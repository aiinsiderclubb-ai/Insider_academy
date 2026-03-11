import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCourses } from '../context/CoursesContext'
import { getCourseField } from '../data/courses'
import { useAuth } from '../context/AuthContext'
import { getUserDiscountPercent } from '../api/adminStore'
import { useLanguage } from '../context/LanguageContext'
import styles from './CourseBuy.module.css'

export function CourseBuy() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { getCourseBySlug } = useCourses()
  const course = getCourseBySlug(slug)
  const { user, hasPurchased, purchaseCourse, login } = useAuth()
  const { t, lang } = useLanguage()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const emailTrim = email.trim()
    const nameTrim = name.trim()
    if (!emailTrim) {
      setError(lang === 'ru' ? 'Введите email.' : 'Enter email.')
      return
    }
    if (!nameTrim) {
      setError(lang === 'ru' ? 'Введите имя.' : 'Enter name.')
      return
    }
    if (!user) {
      login(emailTrim, nameTrim)
    }
    setLoading(true)
    setTimeout(() => {
      purchaseCourse(course.id, {
        recordAdmin: true,
        courseTitle,
        amount: priceAfterReferral,
        email: emailTrim,
      })
      setLoading(false)
      navigate(`/courses/${course.slug}`)
    }, 600)
  }

  if (purchased) {
    return (
      <div className={styles.wrap}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.title}>{t('courseBuy.alreadyPurchased')}</h1>
            <p className={styles.desc}>{t('courseBuy.alreadyPurchasedDesc', { title: courseTitle })}</p>
            <Link to={`/courses/${course.slug}`} className={styles.primaryBtn}>{t('courseBuy.toCourse')}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <Link to={`/courses/${slug}`} className={styles.back}>{t('courseBuy.backToCourse')}</Link>
        <div className={styles.grid}>
          <div className={styles.main}>
            <h1 className={styles.pageTitle}>{t('courseBuy.title')}</h1>
            <div className={styles.coursePreview}>
              <img src={course.image} alt="" className={styles.previewImage} />
              <div className={styles.previewInfo}>
                <h2 className={styles.courseTitle}>{courseTitle}</h2>
                <p className={styles.courseDesc}>{shortDesc}</p>
                <p className={styles.courseMeta}>{course.lessons.length} {lang === 'ru' ? 'уроков' : 'lessons'} · {duration}</p>
              </div>
            </div>

            <form id="course-buy-form" onSubmit={handleSubmit} className={styles.paymentForm}>
              <h3 className={styles.formSectionTitle}>{lang === 'ru' ? 'Данные для доступа и сертификата' : 'Details for access & certificate'}</h3>
              {error && <div className={styles.formError}>{error}</div>}
              <label className={styles.formLabel}>
                <span>{lang === 'ru' ? 'Имя' : 'Name'}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'ru' ? 'Как к вам обращаться' : 'Your name'}
                  className={styles.formInput}
                  disabled={loading}
                />
              </label>
              <label className={styles.formLabel}>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={styles.formInput}
                  disabled={loading}
                />
              </label>

              <h3 className={styles.formSectionTitle}>{lang === 'ru' ? 'Данные карты' : 'Card details'}</h3>
              <label className={styles.formLabel}>
                <span>{lang === 'ru' ? 'Номер карты' : 'Card number'}</span>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 19))}
                  placeholder="4242 4242 4242 4242"
                  className={styles.formInput}
                  maxLength={19}
                  disabled={loading}
                />
              </label>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>
                  <span>{lang === 'ru' ? 'Срок' : 'Expiry'}</span>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className={styles.formInput}
                    maxLength={5}
                    disabled={loading}
                  />
                </label>
                <label className={styles.formLabel}>
                  <span>CVC</span>
                  <input
                    type="text"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    className={styles.formInput}
                    maxLength={4}
                    disabled={loading}
                  />
                </label>
              </div>
              <p className={styles.formHint}>{lang === 'ru' ? 'Демо: ввод любых данных. Оплата не списывается.' : 'Demo: any data. No real charge.'}</p>
            </form>
          </div>

          <aside className={styles.orderCard}>
            <h3 className={styles.orderTitle}>{t('courseBuy.total')}</h3>
            <div className={styles.priceRows}>
              <div className={styles.priceRow}>
                <span>{t('courseBuy.fullPrice')}</span>
                <span className={styles.priceOld}>{fullPriceEur} €</span>
              </div>
              {referralDiscountPercent > 0 && (
                <div className={styles.priceRow}>
                  <span>{lang === 'ru' ? 'Реферальная скидка' : 'Referral discount'}</span>
                  <span className={styles.priceDiscount}>−{referralDiscountPercent}%</span>
                </div>
              )}
              {discount > 0 && !referralDiscountPercent && (
                <div className={styles.priceRow}>
                  <span>{t('courseBuy.discount')}</span>
                  <span className={styles.priceDiscount}>−{discount} €</span>
                </div>
              )}
              <div className={styles.priceRowTotal}>
                <span>{t('courseBuy.toPay')}</span>
                <span className={styles.priceCurrent}>{priceAfterReferral} €</span>
              </div>
            </div>
            <p className={styles.installment}>{t('courseBuy.installment')}</p>
            <button type="submit" form="course-buy-form" className={styles.buyBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : t('courseBuy.payAndAccess')}
            </button>
            <Link to={`/courses/${slug}`} className={styles.cancelLink}>{t('courseBuy.cancel')}</Link>
          </aside>
        </div>
      </div>
    </div>
  )
}
