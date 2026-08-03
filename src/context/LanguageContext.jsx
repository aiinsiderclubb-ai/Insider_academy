import { createContext, useContext, useMemo, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ru from '../i18n/ru.json'
import en from '../i18n/en.json'
import ukr from '../i18n/ukr.json'
import {
  DEFAULT_LOCALE,
  getLocaleFromPath,
  isPublicPath,
  LOCALE_LANGUAGE,
  switchLocalePath,
} from '../routing/locale'

const translations = { ru, en, ukr: { ...ru, ...ukr, nav: { ...ru.nav, ...ukr.nav }, blog: { ...ru.blog, ...ukr.blog }, blogPost: { ...ru.blogPost, ...ukr.blogPost } } }

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [fallbackLocale, setFallbackLocale] = useState(() => {
    try {
      const saved = localStorage.getItem('ai-insider-lang')
      return saved && Object.hasOwn(LOCALE_LANGUAGE, saved) ? saved : DEFAULT_LOCALE
    } catch {
      return DEFAULT_LOCALE
    }
  })
  const lang = getLocaleFromPath(location.pathname) || fallbackLocale

  useEffect(() => {
    try {
      localStorage.setItem('ai-insider-lang', lang)
      document.documentElement.lang = LOCALE_LANGUAGE[lang] || 'ru'
    } catch (_) {}
  }, [lang])

  const t = useMemo(() => {
    const dict = translations[lang] || ru
    return (key, vars) => {
      const keys = key.split('.')
      let v = dict
      for (const k of keys) {
        v = v?.[k]
      }
      let s = typeof v === 'string' ? v : key
      if (vars && typeof s === 'string') {
        Object.entries(vars).forEach(([k, val]) => {
          s = s.replace(new RegExp(`{{${k}}}`, 'g'), val)
        })
      }
      return s
    }
  }, [lang])

  const setLang = (nextLocale) => {
    if (!Object.hasOwn(LOCALE_LANGUAGE, nextLocale)) return
    if (!isPublicPath(location.pathname)) {
      setFallbackLocale(nextLocale)
      return
    }
    const target = switchLocalePath(location.pathname, nextLocale)
    navigate(`${target}${location.search}${location.hash}`)
  }
  const toggleLang = () => setLang(lang === 'ru' ? 'ukr' : lang === 'ukr' ? 'en' : 'ru')

  const value = useMemo(
    () => ({ lang, setLang, t, toggleLang }),
    [lang, t]
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
