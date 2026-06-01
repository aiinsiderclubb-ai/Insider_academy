import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, checkApiOnline } from '../api/client'
import { useLanguage } from '../context/LanguageContext'
import { formatApiError } from '../utils/formatApiError'
import styles from './Login.module.css'

export function ForgotPassword() {
  const { t, lang } = useLanguage()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [resetLink, setResetLink] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const online = await checkApiOnline()
      if (!online) {
        setError(t('forgotPassword.offline'))
        return
      }
      const res = await api.forgotPassword(email.trim())
      setSent(true)
      if (res?.resetLink) setResetLink(res.resetLink)
    } catch (err) {
      setError(formatApiError(err, lang) || t('forgotPassword.error'))
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async () => {
    if (!resetLink) return
    try {
      await navigator.clipboard.writeText(resetLink)
    } catch (_) {}
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <h1 className={styles.title}>{t('forgotPassword.title')}</h1>
            <p className={styles.subtitle}>{t('forgotPassword.subtitle')}</p>

            {sent ? (
              <div className={styles.successBlock}>
                <p>{t('forgotPassword.sent')}</p>
                {resetLink && (
                  <div className={styles.devResetBox}>
                    <p className={styles.devResetHint}>{t('forgotPassword.devLinkHint')}</p>
                    <code className={styles.devResetCode}>{resetLink}</code>
                    <button type="button" className={styles.submit} onClick={copyLink}>
                      {t('forgotPassword.copyLink')}
                    </button>
                    <Link
                      to={(() => {
                        try {
                          const u = new URL(resetLink)
                          return `${u.pathname}${u.search}`
                        } catch {
                          return '/reset-password'
                        }
                      })()}
                      className={styles.footerAuthLink}
                    >
                      {t('forgotPassword.openLink')}
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={submit} className={styles.form}>
                {error && <div className={styles.error}>{error}</div>}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('forgotPassword.email')}
                  className={styles.input}
                  required
                  autoComplete="email"
                />
                <button type="submit" className={styles.submit} disabled={loading}>
                  {loading ? t('forgotPassword.sending') : t('forgotPassword.submit')}
                </button>
              </form>
            )}

            <Link to="/login" className={styles.backLink}>{t('forgotPassword.back')}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
