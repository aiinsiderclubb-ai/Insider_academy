import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { formatApiError } from '../utils/formatApiError'
import {
  clearPendingVerifyEmail,
  getPendingVerifyEmail,
  setPendingVerifyEmail,
} from '../utils/pendingVerification'
import { EmailCodeInput } from '../components/EmailCodeInput'
import { NeuronGlow } from '../components/NeuronGlow'
import { AuthVisual } from '../components/AuthVisual'
import styles from './Login.module.css'

export function VerifyEmail() {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const { completeAuthSession } = useAuth()
  const [params] = useSearchParams()
  const tokenFromUrl = params.get('token')
  const emailFromUrl = params.get('email') || getPendingVerifyEmail() || ''
  const devCodeFromUrl = params.get('devCode') || ''

  const [email, setEmail] = useState(emailFromUrl)
  const [code, setCode] = useState('')
  const [status, setStatus] = useState(tokenFromUrl ? 'link-loading' : 'form')
  const [error, setError] = useState('')
  const [devCode, setDevCode] = useState(devCodeFromUrl)
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (emailFromUrl) setPendingVerifyEmail(emailFromUrl)
  }, [emailFromUrl])

  useEffect(() => {
    if (!tokenFromUrl) return
    api.verifyEmail(tokenFromUrl)
      .then(async (res) => {
        if (res.token) await completeAuthSession(res.token, res.user)
        setStatus('ok')
        setTimeout(() => navigate('/onboarding', { replace: true }), 2200)
      })
      .catch(() => setStatus('link-error'))
  }, [tokenFromUrl, completeAuthSession, navigate])

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [resendCooldown])

  const submitCode = async (e) => {
    e.preventDefault()
    if (code.length !== 6) {
      setError(t('register.errorCodeLength'))
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api.verifyEmailCode(email.trim(), code.trim())
      await completeAuthSession(res.token, res.user)
      clearPendingVerifyEmail()
      setStatus('ok')
      setTimeout(() => navigate('/onboarding', { replace: true }), 2200)
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
        <AuthVisual />
        <div className={styles.content}>
          <div className={styles.card}>
            <div className={styles.cardInner}>
              <div className={styles.successBlock}>
                <div className={styles.successIcon} aria-hidden="true">
                  <Check size={22} strokeWidth={2.5} />
                </div>
                <h1 className={styles.title}>{t('register.successTitle')}</h1>
                <p className={styles.subtitle}>{t('register.successSubtitle')}</p>
                <p className={styles.successRedirect}>{t('register.successRedirect')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg}>
        <NeuronGlow className={styles.neuron} />
        <div className={styles.gradientOrb} aria-hidden />
      </div>
      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <div className={styles.logoWrap}>
              <span className={styles.logoText}>AI Insider Academy</span>
            </div>
            <div className={styles.stepBadge}>{t('register.stepVerify')}</div>
            <h1 className={styles.title}>{t('register.verifyTitle')}</h1>
            <p className={styles.subtitle}>
              {t('register.verifySubtitle')}{' '}
              {email.trim() ? (
                <strong className={styles.emailHighlight}>{email.trim()}</strong>
              ) : null}
            </p>

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
              {!emailFromUrl && (
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
              )}

              <span className={styles.labelText}>{t('verifyEmail.code')}</span>
              <EmailCodeInput
                value={code}
                onChange={setCode}
                disabled={loading}
                autoFocus
              />

              <button type="submit" className={styles.submit} disabled={loading || code.length !== 6}>
                {loading ? t('verifyEmail.submitting') : t('verifyEmail.submit')}
              </button>
            </form>

            <button
              type="button"
              className={styles.resendBtn}
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
