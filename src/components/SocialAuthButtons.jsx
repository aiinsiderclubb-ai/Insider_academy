import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { api } from '../api/client'
import { formatApiError } from '../utils/formatApiError'
import styles from '../pages/Login.module.css'

const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client'
const APPLE_SCRIPT = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'

function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve()
      return
    }
    const el = document.createElement('script')
    el.id = id
    el.src = src
    el.async = true
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(el)
  })
}

/**
 * Google / Apple buttons. Shown when client IDs exist (VITE_* or /auth/oauth/config).
 */
export function SocialAuthButtons({ onError, onSuccess, mode = 'login' }) {
  const { loginWithOAuth } = useAuth()
  const { lang } = useLanguage()
  const [providers, setProviders] = useState({
    google: Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID),
    apple: Boolean(import.meta.env.VITE_APPLE_CLIENT_ID),
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    appleClientId: import.meta.env.VITE_APPLE_CLIENT_ID || '',
  })
  const [busy, setBusy] = useState('')
  const googleBtnRef = useRef(null)
  const finishRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const cfg = await api.oauthConfig()
        if (cancelled || !cfg) return
        setProviders((prev) => ({
          google: Boolean(cfg.google && (cfg.googleClientId || prev.googleClientId)),
          apple: Boolean(cfg.apple && (cfg.appleClientId || prev.appleClientId)),
          googleClientId: cfg.googleClientId || prev.googleClientId || '',
          appleClientId: cfg.appleClientId || prev.appleClientId || '',
        }))
      } catch {
        /* keep Vite env defaults */
      }
    })()
    return () => { cancelled = true }
  }, [])

  const finish = useCallback(async (provider, idToken, fullName) => {
    setBusy(provider)
    try {
      const user = await loginWithOAuth(provider, idToken, fullName)
      onSuccess?.(user)
      return user
    } catch (err) {
      onError?.(formatApiError(err, lang) || (lang === 'ru'
        ? 'Не удалось войти через соцсеть'
        : 'Social sign-in failed'))
      throw err
    } finally {
      setBusy('')
    }
  }, [loginWithOAuth, onSuccess, onError, lang])

  finishRef.current = finish

  useEffect(() => {
    if (!providers.google || !providers.googleClientId || !googleBtnRef.current) return
    let cancelled = false
    ;(async () => {
      try {
        await loadScript(GOOGLE_SCRIPT, 'google-gsi')
        if (cancelled || !window.google?.accounts?.id) return
        window.google.accounts.id.initialize({
          client_id: providers.googleClientId,
          callback: (response) => {
            if (response?.credential) {
              finishRef.current?.('google', response.credential).catch(() => {})
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        })
        googleBtnRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: mode === 'register' ? 'signup_with' : 'signin_with',
          width: Math.min(Math.max(googleBtnRef.current.offsetWidth || 320, 280), 400),
          logo_alignment: 'left',
        })
      } catch (err) {
        console.warn('[SocialAuth] Google init:', err.message)
      }
    })()
    return () => { cancelled = true }
  }, [providers.google, providers.googleClientId, mode])

  useEffect(() => {
    if (!providers.apple || !providers.appleClientId) return
    let cancelled = false
    ;(async () => {
      try {
        await loadScript(APPLE_SCRIPT, 'apple-auth')
        if (cancelled || !window.AppleID?.auth) return
        window.AppleID.auth.init({
          clientId: providers.appleClientId,
          scope: 'name email',
          redirectURI: `${window.location.origin}/login`,
          usePopup: true,
        })
      } catch (err) {
        console.warn('[SocialAuth] Apple init:', err.message)
      }
    })()
    return () => { cancelled = true }
  }, [providers.apple, providers.appleClientId])

  const handleApple = async () => {
    if (!window.AppleID?.auth) {
      onError?.(lang === 'ru' ? 'Apple Sign In не загрузился. Обновите страницу.' : 'Apple Sign In failed to load.')
      return
    }
    try {
      const result = await window.AppleID.auth.signIn()
      const idToken = result?.authorization?.id_token
      if (!idToken) throw new Error('No Apple id_token')
      const fullName = result?.user?.name
        ? { firstName: result.user.name.firstName, lastName: result.user.name.lastName }
        : null
      await finish('apple', idToken, fullName)
    } catch (err) {
      if (err?.error === 'popup_closed_by_user') return
      onError?.(formatApiError(err, lang) || (lang === 'ru'
        ? 'Не удалось войти через Apple'
        : 'Apple sign-in failed'))
    }
  }

  if (!providers.google && !providers.apple) return null

  return (
    <div className={styles.socialWrap}>
      {providers.google && (
        <div
          ref={googleBtnRef}
          className={styles.googleBtnHost}
          aria-label={lang === 'ru' ? 'Войти через Google' : 'Sign in with Google'}
        />
      )}
      {providers.apple && (
        <button
          type="button"
          className={styles.appleBtn}
          onClick={handleApple}
          disabled={Boolean(busy)}
        >
          <AppleIcon />
          {busy === 'apple'
            ? (lang === 'ru' ? 'Вход…' : 'Signing in…')
            : (lang === 'ru' ? 'Продолжить с Apple' : 'Continue with Apple')}
        </button>
      )}
      <p className={styles.socialHint}>
        {lang === 'ru'
          ? 'Быстрый вход без пароля — email подтверждается автоматически.'
          : 'Quick sign-in — email is verified automatically.'}
      </p>
      <div className={styles.socialDivider}>
        <span>{lang === 'ru' ? 'или через email' : 'or continue with email'}</span>
      </div>
    </div>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}
