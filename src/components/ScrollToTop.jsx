import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Прокрутка в начало при смене маршрута */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [pathname, search, hash])

  return null
}
