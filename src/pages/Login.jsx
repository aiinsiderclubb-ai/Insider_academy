import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { isTestAccountEmail } from '../data/testAccount'
import { formatApiError } from '../utils/formatApiError'
import { NeuronGlow } from '../components/NeuronGlow'
import styles from './Login.module.css'

export function Login() {
  const { user, login, loading: authLoading } = useAuth()
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/cabinet'

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, from, navigate])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const emailTrim = email.trim()
    if (!emailTrim) {
      setError(t('login.errorEmail'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setError(t('login.errorEmailInvalid'))
      return
    }
    if (!password) {
      setError(t('login.errorPassword'))
      return
    }
    if (password.length < 6) {
      setError(t('login.errorPasswordShort'))
      return
    }

    setLoading(true)
    try {
      await login(emailTrim, password.trim())
      navigate(from, { replace: true })
    } catch (err) {
      if (err?.requiresVerification || err?.data?.requiresVerification) {
        const q = new URLSearchParams({ email: err.email || err.data?.email || emailTrim })
        if (err.devCode || err.data?.devCode) q.set('devCode', err.devCode || err.data.devCode)
        navigate(`/verify-email?${q.toString()}`, { replace: true })
        return
      }
      if (err?.code === 'TEST_ACCOUNT_PASSWORD' || (isTestAccountEmail(emailTrim) && err?.status === 401)) {
        setError(lang === 'ru'
          ? 'Неверный пароль тестового аккаунта. Используйте: TestAll2026!'
          : 'Wrong test account password. Use: TestAll2026!')
      } else if (err?.network) {
        setError(formatApiError(err, lang))
      } else {
        setError(formatApiError(err, lang) || t('login.errorGeneric'))
      }
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

  if (user) return null

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
            <span className={styles.backArrow}>←</span>
            {t('login.back')}
          </Link>
          <Link
            to="/register"
            state={{ from: location.state?.from }}
            className={styles.registerTopBtn}
          >
            {t('register.topBtn')}
          </Link>
        </div>

        <div className={styles.card}>
          <div className={styles.cardGlow} />
          <div className={styles.cardInner}>
            <div className={styles.logoWrap}>
              <span className={styles.logoText}>AI Insider Academy</span>
            </div>
            <h1 className={styles.title}>{t('login.title')}</h1>
            <p className={styles.subtitle}>{t('login.subtitle')}</p>

            <form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <div className={styles.error} role="alert">
                  {error}
                </div>
              )}

              <label className={styles.label}>
                <span className={styles.labelText}>{t('login.email')}</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={styles.input}
                  disabled={loading}
                />
              </label>

              <label className={styles.label}>
                <span className={styles.labelText}>{t('login.password')}</span>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={styles.input}
                  disabled={loading}
                />
              </label>

              <button
                type="submit"
                className={styles.submit}
                disabled={loading}
              >
                {loading ? (
                  <span className={styles.spinner} aria-hidden />
                ) : (
                  t('login.submit')
                )}
              </button>
            </form>

            <p className={styles.footerAuth}>
              {t('login.noAccount')}{' '}
              <Link
                to="/register"
                state={{ from: location.state?.from }}
                className={styles.footerAuthLink}
              >
                {t('login.registerLink')}
              </Link>
            </p>

            <p className={styles.demoHint}>{t('login.demoHint')}</p>
            <Link to="/forgot-password" className={styles.backLink} style={{ marginTop: 12, display: 'inline-block' }}>
              {t('login.forgotPassword')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
