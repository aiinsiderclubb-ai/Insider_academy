import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, setToken } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { formatApiError } from '../utils/formatApiError'
import styles from './Login.module.css'

export function VerifyEmail() {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const { applyAuthSession } = useAuth()
  const [params] = useSearchParams()
  const tokenFromUrl = params.get('token')
  const emailFromUrl = params.get('email') || ''
  const devCodeFromUrl = params.get('devCode') || ''

  const [email, setEmail] = useState(emailFromUrl)
  const [code, setCode] = useState('')
  const [status, setStatus] = useState(tokenFromUrl ? 'link-loading' : 'form')
  const [error, setError] = useState('')
  const [devCode, setDevCode] = useState(devCodeFromUrl)
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (!tokenFromUrl) return
    api.verifyEmail(tokenFromUrl)
      .then((res) => {
        if (res.token) {
          setToken(res.token)
          applyAuthSession(res.token, res.user)
        }
        setStatus('ok')
      })
      .catch(() => setStatus('link-error'))
  }, [tokenFromUrl, applyAuthSession])

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [resendCooldown])

  const submitCode = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.verifyEmailCode(email.trim(), code.trim())
      if (res.token) {
        setToken(res.token)
        applyAuthSession(res.token, res.user)
      }
      setStatus('ok')
      setTimeout(() => navigate('/cabinet', { replace: true }), 1500)
    } catch (err) {
      setError(formatApiError(err, lang) || t('verifyEmail.error'))
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (!email.trim() || resendCooldown > 0) return
    setError('')
    setLoading(true)
    try {
      const res = await api.resendVerificationCode(email.trim())
      if (res.devCode) setDevCode(res.devCode)
      setResendCooldown(60)
    } catch (err) {
      setError(formatApiError(err, lang) || t('verifyEmail.resendError'))
    } finally {
      setLoading(false)
    }
  }

  if (status === 'link-loading') {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <div className={styles.card}><div className={styles.cardInner}>
            <p>{t('verifyEmail.checking')}</p>
          </div></div>
        </div>
      </div>
    )
  }

  if (status === 'ok') {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <div className={styles.card}><div className={styles.cardInner}>
            <h1 className={styles.title}>{t('verifyEmail.successTitle')}</h1>
            <p className={styles.subtitle}>{t('verifyEmail.successSubtitle')}</p>
            <Link to="/cabinet" className={styles.submit} style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}>
              {t('verifyEmail.toCabinet')}
            </Link>
          </div></div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <h1 className={styles.title}>{t('verifyEmail.title')}</h1>
            <p className={styles.subtitle}>{t('verifyEmail.subtitle')}</p>

            {status === 'link-error' && (
              <div className={styles.error} role="alert">{t('verifyEmail.linkError')}</div>
            )}
            {error && <div className={styles.error} role="alert">{error}</div>}

            {devCode && (
              <div className={styles.successBlock}>
                <p className={styles.devResetHint}>{t('verifyEmail.devCodeHint')}</p>
                <code className={styles.devResetCode}>{devCode}</code>
              </div>
            )}

            <form onSubmit={submitCode} className={styles.form}>
              <label className={styles.label}>
                <span className={styles.labelText}>{t('verifyEmail.email')}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </label>
              <label className={styles.label}>
                <span className={styles.labelText}>{t('verifyEmail.code')}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={styles.input}
                  placeholder="000000"
                  required
                  autoComplete="one-time-code"
                  disabled={loading}
                />
              </label>
              <button type="submit" className={styles.submit} disabled={loading || code.length !== 6}>
                {loading ? t('verifyEmail.submitting') : t('verifyEmail.submit')}
              </button>
            </form>

            <button
              type="button"
              className={styles.backLink}
              style={{ marginTop: 16, border: 'none', background: 'none', cursor: 'pointer' }}
              disabled={loading || resendCooldown > 0 || !email.trim()}
              onClick={resend}
            >
              {resendCooldown > 0
                ? `${t('verifyEmail.resendWait')} (${resendCooldown}s)`
                : t('verifyEmail.resend')}
            </button>

            <Link to="/login" className={styles.backLink} style={{ display: 'block', marginTop: 12 }}>
              {t('verifyEmail.backLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
