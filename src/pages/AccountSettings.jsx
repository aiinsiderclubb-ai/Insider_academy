import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, LogOut, Monitor, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { api, setToken } from '../api/client'
import { formatApiError } from '../utils/formatApiError'
import { TelegramConnect } from '../components/TelegramConnect'
import styles from './AccountSettings.module.css'

const RESEND_COOLDOWN_SEC = 60

export function AccountSettings() {
  const { user, apiMode, updateProfile, changePassword, changeEmail, uploadAvatar, logout, refreshUser } = useAuth()
  const { t, lang } = useLanguage()
  const fileRef = useRef(null)
  const autoSentRef = useRef(false)

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [emailPassword, setEmailPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [devCode, setDevCode] = useState('')
  const [verifySending, setVerifySending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const needsVerification = apiMode && user?.email && !user?.emailVerified

  const showMsg = (text, isError = false) => {
    if (isError) {
      setError(text)
      setSuccess('')
    } else {
      setSuccess(text)
      setError('')
    }
  }

  const formatLocalApiError = (err) => formatApiError(err, lang) || t('account.errorGeneric')

  const startResendCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN_SEC)
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [resendCooldown])

  const sendVerificationCode = useCallback(async () => {
    if (!user?.email || user.emailVerified) return
    setVerifySending(true)
    try {
      const res = await api.resendVerificationCode(user.email.trim())
      if (res.devCode) setDevCode(res.devCode)
      startResendCooldown()
      showMsg(t('account.verifyCodeSent'))
    } catch (err) {
      showMsg(formatLocalApiError(err), true)
    } finally {
      setVerifySending(false)
    }
  }, [user?.email, user?.emailVerified, lang, t, startResendCooldown])

  useEffect(() => {
    if (!needsVerification || autoSentRef.current) return
    autoSentRef.current = true
    sendVerificationCode()
  }, [needsVerification, sendVerificationCode])

  useEffect(() => {
    setName(user?.name || '')
    setEmail(user?.email || '')
  }, [user?.name, user?.email])

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    if (!user?.email || verifyCode.length !== 6) return
    setLoading(true)
    try {
      const res = await api.verifyEmailCode(user.email.trim(), verifyCode.trim())
      if (res.token) setToken(res.token)
      await refreshUser()
      setVerifyCode('')
      setDevCode('')
      showMsg(t('account.verifySuccess'))
    } catch (err) {
      showMsg(formatLocalApiError(err), true)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      await uploadAvatar(file)
      showMsg(t('account.avatarSaved'))
    } catch (err) {
      showMsg(formatLocalApiError(err), true)
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  const handleNameSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(name.trim())
      showMsg(t('account.nameSaved'))
    } catch (err) {
      showMsg(formatLocalApiError(err), true)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await changeEmail(email.trim(), emailPassword)
      setEmailPassword('')
      autoSentRef.current = false
      if (res?.devCode) {
        setDevCode(res.devCode)
        startResendCooldown()
      } else if (apiMode) {
        await sendVerificationCode()
      }
      showMsg(t('account.emailSaved'))
    } catch (err) {
      showMsg(formatLocalApiError(err), true)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showMsg(t('account.passwordMismatch'), true)
      return
    }
    if (newPassword.length < 10 || !/[A-Za-zА-Яа-яІіЇїЄє]/.test(newPassword) || !/\d/.test(newPassword)) {
      showMsg(t('account.passwordShort'), true)
      return
    }
    setLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showMsg(t('account.passwordSaved'))
    } catch (err) {
      showMsg(formatLocalApiError(err), true)
    } finally {
      setLoading(false)
    }
  }

  const initial = user?.name?.[0] || user?.email?.[0] || '?'

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div>
            <Link to="/cabinet" className={styles.backLink}>
              <ArrowLeft size={16} aria-hidden="true" />
              {t('account.backToCabinet')}
            </Link>
            <h1 className={styles.title}>{t('account.title')}</h1>
            <p className={styles.subtitle}>{t('account.subtitle')}</p>
          </div>
          <div className={styles.headerIdentity}>
            <span className={styles.headerAvatar}>{initial.toUpperCase()}</span>
            <span>
              <strong>{user?.name || user?.email}</strong>
              <small>{user?.emailVerified ? (lang === 'ru' ? 'Профиль подтверждён' : 'Verified profile') : (lang === 'ru' ? 'Требуется подтверждение' : 'Verification required')}</small>
            </span>
          </div>
        </div>

        {(error || success) && (
          <div className={error ? styles.alertError : styles.alertSuccess} role="alert">
            {error || success}
          </div>
        )}

        <nav className={styles.sectionNav} aria-label={lang === 'ru' ? 'Разделы профиля' : 'Profile sections'}>
          <a href="#profile">{lang === 'ru' ? 'Профиль' : 'Profile'}</a>
          <a href="#email">Email</a>
          <a href="#security">{lang === 'ru' ? 'Безопасность' : 'Security'}</a>
          <a href="#telegram">Telegram</a>
        </nav>

        {needsVerification && (
          <section className={`${styles.card} ${styles.verifyCard}`} id="verify-email">
            <h2 className={styles.cardTitle}>{t('account.verifyEmailSection')}</h2>
            <p className={styles.verifyHint}>{t('account.verifyEmailHint')}</p>
            <p className={styles.verifyHint}>
              <strong>{user.email}</strong>
            </p>
            {devCode && (
              <>
                <p className={styles.verifyHint}>{t('account.verifyDevCodeHint')}</p>
                <code className={styles.verifyDevCode}>{devCode}</code>
              </>
            )}
            <form onSubmit={handleVerifyCode} className={styles.form}>
              <label className={styles.label}>
                <span>{t('account.verifyCode')}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={styles.input}
                  placeholder="000000"
                  autoComplete="one-time-code"
                  disabled={loading || verifySending}
                  required
                />
              </label>
              <div className={styles.verifyActions}>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={loading || verifyCode.length !== 6}
                >
                  {loading ? t('account.verifySubmitting') : t('account.verifySubmit')}
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={verifySending || resendCooldown > 0 || loading}
                  onClick={sendVerificationCode}
                >
                  {verifySending
                    ? t('account.resendSending')
                    : resendCooldown > 0
                      ? `${t('account.verifyResendWait')} ${resendCooldown}s`
                      : t('account.resendCode')}
                </button>
                <Link to={`/verify-email?email=${encodeURIComponent(user.email)}`} className={styles.linkMuted}>
                  {lang === 'ru' ? 'Открыть на отдельной странице' : 'Open full verification page'}
                </Link>
              </div>
            </form>
          </section>
        )}

        <div className={styles.grid}>
          <section className={`${styles.card} ${styles.profileCard}`} id="profile">
            <h2 className={styles.cardTitle}>{t('account.profileSection')}</h2>
            <div className={styles.avatarBlock}>
              <button type="button" className={styles.avatarBtn} onClick={() => fileRef.current?.click()} disabled={loading}>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className={styles.avatarImg} />
                ) : (
                  <span className={styles.avatarInitial}>{initial.toUpperCase()}</span>
                )}
                <span className={styles.avatarOverlay}>{t('account.changePhoto')}</span>
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={handleAvatar} />
              <div className={styles.avatarMeta}>
                <strong>{user?.name || user?.email}</strong>
                <span>{user?.email}</span>
                {user?.personalId && (
                  <span className={styles.personalIdBadge}>
                    {t('account.personalId')}: <code>{user.personalId}</code>
                  </span>
                )}
                {user?.emailVerified ? (
                  <span className={styles.badgeOk}>{t('account.emailVerified')}</span>
                ) : (
                  <button
                    type="button"
                    className={`${styles.badgeWarn} ${styles.badgeWarnBtn}`}
                    title={t('account.badgeResendHint')}
                    disabled={verifySending}
                    onClick={sendVerificationCode}
                  >
                    {verifySending ? t('account.resendSending') : t('account.emailNotVerified')}
                  </button>
                )}
                <button type="button" className={styles.uploadBtn} onClick={() => fileRef.current?.click()} disabled={loading}>
                  {t('account.uploadPhoto')}
                </button>
              </div>
            </div>

            <form onSubmit={handleNameSave} className={styles.form}>
              <label className={styles.label}>
                <span>{t('account.name')}</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className={styles.input} required />
              </label>
              <button type="submit" className={styles.btnPrimary} disabled={loading}>{t('account.save')}</button>
            </form>
          </section>

          <section className={styles.card} id="email">
            <h2 className={styles.cardTitle}>{t('account.emailSection')}</h2>
            <form onSubmit={handleEmailSave} className={styles.form}>
              <label className={styles.label}>
                <span>{t('account.email')}</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} required />
              </label>
              <label className={styles.label}>
                <span>{t('account.currentPassword')}</span>
                <input type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} className={styles.input} required autoComplete="current-password" />
              </label>
              <button type="submit" className={styles.btnPrimary} disabled={loading}>{t('account.saveEmail')}</button>
            </form>
          </section>

          <section className={styles.card} id="security">
            <h2 className={styles.cardTitle}>{t('account.passwordSection')}</h2>
            <p className={user?.passwordChangedAt ? styles.passwordStatusChanged : styles.passwordStatusDefault}>
              {user?.passwordChangedAt
                ? `${t('account.passwordChangedAt')}: ${new Date(user.passwordChangedAt).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}`
                : t('account.passwordNeverChanged')}
            </p>
            <form onSubmit={handlePasswordSave} className={styles.form}>
              <label className={styles.label}>
                <span>{t('account.currentPassword')}</span>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={styles.input} required autoComplete="current-password" />
              </label>
              <label className={styles.label}>
                <span>{t('account.newPassword')}</span>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={styles.input} required minLength={10} autoComplete="new-password" />
              </label>
              <label className={styles.label}>
                <span>{t('account.confirmPassword')}</span>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={styles.input} required minLength={10} autoComplete="new-password" />
              </label>
              <button type="submit" className={styles.btnPrimary} disabled={loading}>{t('account.savePassword')}</button>
              <Link to="/forgot-password" className={styles.linkMuted}>{t('account.forgotPassword')}</Link>
            </form>
          </section>

          <section className={styles.card} id="telegram">
            <h2 className={styles.cardTitle}>{t('account.telegramSection')}</h2>
            <p className={styles.hint}>{t('account.telegramHint')}</p>
            <TelegramConnect lang={lang} personalId={user?.personalId} variant="settings" />
          </section>

          <section className={`${styles.card} ${styles.sessionCard}`}>
            <div className={styles.sessionIcon}><Monitor size={22} aria-hidden="true" /></div>
            <p className={styles.sessionEyebrow}><ShieldCheck size={14} aria-hidden="true" />{lang === 'ru' ? 'Текущая сессия защищена' : 'Current session is secure'}</p>
            <h2 className={styles.cardTitle}>{t('account.dangerSection')}</h2>
            <p className={styles.hint}>{t('account.logoutHint')}</p>
            <button type="button" className={styles.btnDanger} onClick={logout}>
              {t('nav.logout')}<LogOut size={16} aria-hidden="true" />
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
