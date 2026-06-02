import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { api } from '../api/client'
import { mapAuthApiError } from '../utils/authErrors'
import { formatApiError } from '../utils/formatApiError'
import { EmailCodeInput } from '../components/EmailCodeInput'
import { NeuronGlow } from '../components/NeuronGlow'
import styles from './Login.module.css'

export function Register() {
  const { user, register, completeAuthSession, loading: authLoading } = useAuth()
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/cabinet'

  const [step, setStep] = useState('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verifyEmail, setVerifyEmail] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const formRef = useRef(null)

  useEffect(() => {
    if (user && step === 'success') navigate(from, { replace: true })
  }, [user, from, navigate, step])

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [resendCooldown])

  const syncAutofill = (e) => {
    const { name: field, value } = e.target
    if (field === 'name') setName(value)
    if (field === 'email') setEmail(value)
    if (field === 'password') setPassword(value)
    if (field === 'confirmPassword') setConfirmPassword(value)
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
        setVerifyEmail(result.email || emailTrim)
        setDevCode(result.devCode || '')
        setCode('')
        setStep('verify')
        setResendCooldown(60)
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

  const handleVerify = async (e) => {
    e.preventDefault()
    if (code.length !== 6) {
      setError(t('register.errorCodeLength'))
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api.verifyEmailCode(verifyEmail.trim(), code.trim())
      await completeAuthSession(res.token, res.user)
      setStep('success')
      setTimeout(() => navigate(from, { replace: true }), 2200)
    } catch (err) {
      setError(formatApiError(err, lang) || t('verifyEmail.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!verifyEmail.trim() || resendCooldown > 0 || loading) return
    setError('')
    setLoading(true)
    try {
      const res = await api.resendVerificationCode(verifyEmail.trim())
      if (res.devCode) setDevCode(res.devCode)
      setResendCooldown(60)
    } catch (err) {
      setError(formatApiError(err, lang) || t('verifyEmail.resendError'))
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

  if (user && step !== 'verify') return null

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
          {step === 'form' && (
            <Link
              to="/login"
              state={{ from: location.state?.from }}
              className={styles.loginTopBtn}
            >
              {t('register.loginLink')}
            </Link>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardGlow} />
          <div className={styles.cardInner}>
            <div className={styles.logoWrap}>
              <span className={styles.logoText}>AI Insider Academy</span>
            </div>

            {step === 'form' && (
              <>
                <h1 className={styles.title}>{t('register.title')}</h1>
                <p className={styles.subtitle}>{t('register.subtitle')}</p>

                <form ref={formRef} onSubmit={handleRegister} className={styles.form}>
                  {error && (
                    <div className={styles.error} role="alert">
                      {error}
                    </div>
                  )}

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
              </>
            )}

            {step === 'verify' && (
              <>
                <div className={styles.stepBadge}>{t('register.stepVerify')}</div>
                <h1 className={styles.title}>{t('register.verifyTitle')}</h1>
                <p className={styles.subtitle}>
                  {t('register.verifySubtitle')}{' '}
                  <strong className={styles.emailHighlight}>{verifyEmail}</strong>
                </p>

                {error && (
                  <div className={styles.error} role="alert">
                    {error}
                  </div>
                )}

                {devCode && (
                  <div className={styles.successBlock}>
                    <p className={styles.devResetHint}>{t('verifyEmail.devCodeHint')}</p>
                    <code className={styles.devResetCode}>{devCode}</code>
                  </div>
                )}

                <form onSubmit={handleVerify} className={styles.form}>
                  <EmailCodeInput
                    value={code}
                    onChange={setCode}
                    disabled={loading}
                    autoFocus
                  />

                  <button
                    type="submit"
                    className={styles.submit}
                    disabled={loading || code.length !== 6}
                  >
                    {loading ? (
                      <span className={styles.spinner} aria-hidden />
                    ) : (
                      t('register.verifySubmit')
                    )}
                  </button>
                </form>

                <button
                  type="button"
                  className={styles.resendBtn}
                  disabled={loading || resendCooldown > 0}
                  onClick={handleResend}
                >
                  {resendCooldown > 0
                    ? `${t('verifyEmail.resendWait')} (${resendCooldown}s)`
                    : t('verifyEmail.resend')}
                </button>

                <button
                  type="button"
                  className={styles.backLink}
                  style={{ marginTop: 12, border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}
                  onClick={() => {
                    setStep('form')
                    setError('')
                    setCode('')
                  }}
                >
                  {t('register.backToForm')}
                </button>
              </>
            )}

            {step === 'success' && (
              <div className={styles.successBlock}>
                <div className={styles.successIcon} aria-hidden>✓</div>
                <h1 className={styles.title}>{t('register.successTitle')}</h1>
                <p className={styles.subtitle}>{t('register.successSubtitle')}</p>
                <p className={styles.successRedirect}>{t('register.successRedirect')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
