import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { TelegramConnect } from '../components/TelegramConnect'
import styles from './AccountSettings.module.css'

export function AccountSettings() {
  const { user, apiMode, updateProfile, changePassword, changeEmail, uploadAvatar, logout } = useAuth()
  const { t, lang } = useLanguage()
  const fileRef = useRef(null)

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [emailPassword, setEmailPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const showMsg = (text, isError = false) => {
    if (isError) {
      setError(text)
      setSuccess('')
    } else {
      setSuccess(text)
      setError('')
    }
  }

  const formatApiError = (err) => {
    const msg = err?.message || ''
    if (msg === 'Current password is incorrect') return lang === 'ru' ? 'Неверный текущий пароль' : msg
    if (msg === 'Name required') return t('account.errorGeneric')
    if (msg === 'Image too large (max 700 KB)') return lang === 'ru' ? 'Фото слишком большое (макс. 700 КБ)' : msg
    if (msg === 'Image file required') return lang === 'ru' ? 'Выберите файл изображения' : msg
    if (msg === 'Email already in use') return lang === 'ru' ? 'Этот email уже занят' : msg
    return msg || t('account.errorGeneric')
  }

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      await uploadAvatar(file)
      showMsg(t('account.avatarSaved'))
    } catch (err) {
      showMsg(formatApiError(err), true)
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
      showMsg(formatApiError(err), true)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await changeEmail(email.trim(), emailPassword)
      setEmailPassword('')
      showMsg(t('account.emailSaved'))
    } catch (err) {
      showMsg(formatApiError(err), true)
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
    if (newPassword.length < 6) {
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
      showMsg(formatApiError(err), true)
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
            <Link to="/cabinet" className={styles.backLink}>← {t('account.backToCabinet')}</Link>
            <h1 className={styles.title}>{t('account.title')}</h1>
            <p className={styles.subtitle}>{t('account.subtitle')}</p>
          </div>
        </div>

        {(error || success) && (
          <div className={error ? styles.alertError : styles.alertSuccess} role="alert">
            {error || success}
          </div>
        )}

        <div className={styles.grid}>
          <section className={styles.card}>
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
                  <span className={styles.badgeWarn}>{t('account.emailNotVerified')}</span>
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

          <section className={styles.card}>
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

          <section className={styles.card}>
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
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={styles.input} required minLength={6} autoComplete="new-password" />
              </label>
              <label className={styles.label}>
                <span>{t('account.confirmPassword')}</span>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={styles.input} required minLength={6} autoComplete="new-password" />
              </label>
              <button type="submit" className={styles.btnPrimary} disabled={loading}>{t('account.savePassword')}</button>
              <Link to="/forgot-password" className={styles.linkMuted}>{t('account.forgotPassword')}</Link>
            </form>
          </section>

          <section className={styles.card} id="telegram">
            <h2 className={styles.cardTitle}>{t('account.telegramSection')}</h2>
            <p className={styles.hint}>{t('account.telegramHint')}</p>
            <TelegramConnect lang={lang} personalId={user?.personalId} />
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>{t('account.dangerSection')}</h2>
            <p className={styles.hint}>{t('account.logoutHint')}</p>
            <button type="button" className={styles.btnDanger} onClick={logout}>{t('nav.logout')}</button>
          </section>
        </div>
      </div>
    </div>
  )
}
