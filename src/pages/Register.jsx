import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { mapAuthApiError } from '../utils/authErrors'
import { formatApiError } from '../utils/formatApiError'
import { getPendingVerifyEmail } from '../utils/pendingVerification'
import { NeuronGlow } from '../components/NeuronGlow'
import { SocialAuthButtons } from '../components/SocialAuthButtons'
import styles from './Login.module.css'

export function Register() {
  const { user, register, loading: authLoading } = useAuth()
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/onboarding'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const formRef = useRef(null)

  useEffect(() => {
    if (authLoading) return
    if (user?.emailVerified) {
      navigate(from, { replace: true })
      return
    }
    const pending = getPendingVerifyEmail()
    if (pending) {
      navigate(`/verify-email?email=${encodeURIComponent(pending)}`, { replace: true })
    }
  }, [user, from, navigate, authLoading])

  const syncAutofill = (e) => {
    const { name: field, value } = e.target
    if (field === 'name') setName(value)
    if (field === 'email') setEmail(value)
    if (field === 'password') setPassword(value)
    if (field === 'confirmPassword') setConfirmPassword(value)
  }

  const goToVerifyEmail = (emailAddr, devCode) => {
    const q = new URLSearchParams({ email: emailAddr })
    if (devCode) q.set('devCode', devCode)
    navigate(`/verify-email?${q.toString()}`, { replace: true })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    const form = formRef.current
    const fd = form ? new FormData(form) : null
    const nameTrim = (name || fd?.get('name') || '').toString().trim()
    const emailTrim = (email || fd?.get('email') || '').toString().trim()
    const passwordValue = (password || fd?.get('password') || '').toString()
    const confirmValue = (confirmPassword || fd?.get('confirmPassword') || '').toString()

    if (!nameTrim) {
      setError(t('register.errorName'))
      return
    }
    if (!emailTrim) {
      setError(t('register.errorEmail'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setError(t('register.errorEmailInvalid'))
      return
    }
    if (!passwordValue) {
      setError(t('register.errorPassword'))
      return
    }
    if (passwordValue.length < 6) {
      setError(t('register.errorPasswordShort'))
      return
    }
    if (passwordValue !== confirmValue) {
      setError(t('register.errorPasswordMatch'))
      return
    }

    setLoading(true)
    try {
      const result = await register(emailTrim, passwordValue.trim(), nameTrim)
      if (result?.requiresVerification) {
        goToVerifyEmail(result.email || emailTrim, result.devCode)
        return
      }
      navigate(from, { replace: true })
    } catch (err) {
      const mapped = mapAuthApiError(err, lang, 'register.errorGeneric')
      setError(mapped || formatApiError(err, lang) || t('register.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <p className={styles.subtitle}>{lang === 'ru' ? 'Загрузка…' : 'Loading…'}</p>
        </div>
      </div>
    )
  }

  if (user?.emailVerified) return null

  const pending = getPendingVerifyEmail()
  if (pending) return null

  return (
    <div className={styles.page}>
      <div className={styles.bg}>
        <NeuronGlow className={styles.neuron} />
        <div className={styles.gradientOrb} aria-hidden />
        <div className={styles.gradientOrb2} aria-hidden />
      </div>

      <div className={styles.content}>
        <div className={styles.topBar}>
          <Link to="/" className={styles.backLink}>
            <ArrowLeft className={styles.backArrow} size={17} aria-hidden="true" />
            {t('login.back')}
          </Link>
          <Link
            to="/login"
            state={{ from: location.state?.from }}
            className={styles.loginTopBtn}
          >
            {t('register.loginLink')}
          </Link>
        </div>

        <div className={styles.card}>
          <div className={styles.cardGlow} />
          <div className={styles.cardInner}>
            <div className={styles.logoWrap}>
              <span className={styles.logoText}>AI Insider Academy</span>
            </div>

            <h1 className={styles.title}>{t('register.title')}</h1>
            <p className={styles.subtitle}>{t('register.subtitle')}</p>

            {error && (
              <div className={styles.error} role="alert">
                {error}
              </div>
            )}

            <SocialAuthButtons
              mode="register"
              onError={setError}
              onSuccess={() => navigate(from, { replace: true })}
            />

            <form ref={formRef} onSubmit={handleRegister} className={styles.form}>
              <label className={styles.label}>
                <span className={styles.labelText}>{t('register.name')}</span>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onInput={syncAutofill}
                  placeholder={t('register.namePlaceholder')}
                  className={styles.input}
                  disabled={loading}
                />
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>{t('register.email')}</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onInput={syncAutofill}
                  placeholder="you@example.com"
                  className={styles.input}
                  disabled={loading}
                />
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>{t('register.password')}</span>
                <input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onInput={syncAutofill}
                  placeholder="••••••••"
                  className={styles.input}
                  disabled={loading}
                />
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>{t('register.confirmPassword')}</span>
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onInput={syncAutofill}
                  placeholder="••••••••"
                  className={styles.input}
                  disabled={loading}
                />
              </label>

              <button type="submit" className={styles.submit} disabled={loading}>
                {loading ? (
                  <span className={styles.spinner} aria-hidden />
                ) : (
                  t('register.submit')
                )}
              </button>
            </form>

            <p className={styles.footerAuth}>
              {t('register.hasAccount')}{' '}
              <Link
                to="/login"
                state={{ from: location.state?.from }}
                className={styles.footerAuthLink}
              >
                {t('register.loginLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
