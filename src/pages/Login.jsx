import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { NeuronGlow } from '../components/NeuronGlow'
import styles from './Login.module.css'

export function Login() {
  const { user, login } = useAuth()
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
      await login(emailTrim, password)
      navigate(from, { replace: true })
    } catch {
      setError(t('login.errorGeneric'))
    } finally {
      setLoading(false)
    }
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
        <Link to="/" className={styles.backLink}>
          <span className={styles.backArrow}>←</span>
          {t('login.back')}
        </Link>

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

            <p className={styles.demoHint}>{t('login.demoHint')}</p>
            <Link to="/forgot-password" className={styles.backLink} style={{ marginTop: 12, display: 'inline-block' }}>
              {lang === 'ru' ? 'Забыли пароль?' : 'Forgot password?'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
