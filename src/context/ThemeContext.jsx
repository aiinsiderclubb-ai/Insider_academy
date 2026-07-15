import { createContext, useContext, useEffect, useMemo } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
    try { localStorage.setItem('lms_theme', 'dark') } catch (_) {}
  }, [])

  const value = useMemo(
    () => ({ theme: 'dark', setTheme: () => {}, toggleTheme: () => {} }),
    []
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
