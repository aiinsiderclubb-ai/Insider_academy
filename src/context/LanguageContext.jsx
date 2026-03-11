import { createContext, useContext, useState, useMemo, useEffect } from 'react'
import ru from '../i18n/ru.json'
import en from '../i18n/en.json'

const translations = { ru, en }

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('ai-insider-lang') || 'ru'
    } catch {
      return 'ru'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('ai-insider-lang', lang)
      document.documentElement.lang = lang === 'en' ? 'en' : 'ru'
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

  const toggleLang = () => setLang((l) => (l === 'ru' ? 'en' : 'ru'))

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
