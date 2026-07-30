import { useEffect, useState } from 'react'
import { AuthVisual } from '../components/AuthVisual'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, checkApiOnline } from '../api/client'
import { useLanguage } from '../context/LanguageContext'
import { formatApiError } from '../utils/formatApiError'
import styles from './Login.module.css'

export function ResetPassword() {
  const { t, lang } = useLanguage()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [token] = useState(() => params.get('token') || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError(t('resetPassword.mismatch'))
      return
    }
    if (password.length < 10 || !/[A-Za-zА-Яа-яІіЇїЄє]/.test(password) || !/\d/.test(password)) {
      setError(t('resetPassword.short'))
      return
    }
    if (!token) {
      setError(t('resetPassword.noToken'))
      return
    }
    setLoading(true)
    try {
      const online = await checkApiOnline()
      if (!online) {
        setError(t('resetPassword.offline'))
        return
      }
      await api.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (err) {
      setError(formatApiError(err, lang) || t('resetPassword.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    window.history.replaceState({}, '', window.location.pathname)
  }, [token])

  if (!token) {
    return (
      <div className={styles.page}>
      <AuthVisual />
        <div className={styles.content}>
          <div className={styles.card}>
            <div className={styles.cardInner}>
              <h1 className={styles.title}>{t('resetPassword.title')}</h1>
              <p className={styles.error}>{t('resetPassword.noToken')}</p>
              <Link to="/forgot-password" className={styles.footerAuthLink}>{t('resetPassword.requestAgain')}</Link>
              <Link to="/login" className={styles.backLink}>{t('resetPassword.back')}</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <AuthVisual />
      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <h1 className={styles.title}>{t('resetPassword.title')}</h1>
            <p className={styles.subtitle}>{t('resetPassword.subtitle')}</p>

            {success ? (
              <div className={styles.successBlock}>
                <p>{t('resetPassword.success')}</p>
                <Link to="/login" className={styles.footerAuthLink}>{t('resetPassword.back')}</Link>
              </div>
            ) : (
              <form onSubmit={submit} className={styles.form}>
                {error && <div className={styles.error}>{error}</div>}
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('resetPassword.newPassword')}
                  minLength={10}
                  className={styles.input}
                  required
                  autoComplete="new-password"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('resetPassword.confirmPassword')}
                  minLength={10}
                  className={styles.input}
                  required
                  autoComplete="new-password"
                />
                <button type="submit" className={styles.submit} disabled={loading}>
                  {loading ? t('resetPassword.saving') : t('resetPassword.submit')}
                </button>
              </form>
            )}

            {!success && (
              <Link to="/forgot-password" className={styles.backLink} style={{ marginTop: 12, display: 'inline-block' }}>
                {t('resetPassword.requestAgain')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
