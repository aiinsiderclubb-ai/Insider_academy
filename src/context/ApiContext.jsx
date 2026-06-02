import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { checkApiOnline, isProductionSite } from '../api/client'

const ApiContext = createContext(null)

function prodApiUiConfig() {
  const prod = typeof window !== 'undefined' && isProductionSite()
  return {
    bannerDelayMs: prod ? 120000 : 15000,
    pollMs: prod ? 60000 : 30000,
    streak: prod ? 3 : 2,
    optimistic: prod,
  }
}

export function ApiProvider({ children }) {
  const cfgRef = useRef(prodApiUiConfig())
  const [online, setOnline] = useState(() => (cfgRef.current.optimistic ? true : null))
  const [showOfflineBanner, setShowOfflineBanner] = useState(false)
  const failStreakRef = useRef(0)
  const mountedAtRef = useRef(Date.now())

  const refresh = useCallback(async ({ wake = false, userRetry = false } = {}) => {
    const ok = await checkApiOnline({ wake })
    if (ok) {
      failStreakRef.current = 0
      setOnline(true)
      setShowOfflineBanner(false)
      return true
    }

    failStreakRef.current += 1
    const elapsed = Date.now() - mountedAtRef.current
    const { streak, bannerDelayMs, optimistic } = cfgRef.current
    const streakEnough = failStreakRef.current >= streak
    const graceOver = elapsed >= bannerDelayMs

    if (userRetry || (streakEnough && graceOver)) {
      setOnline(false)
      setShowOfflineBanner(true)
    } else if (!optimistic) {
      setOnline(false)
      if (graceOver) setShowOfflineBanner(true)
    }
    return false
  }, [])

  useEffect(() => {
    mountedAtRef.current = Date.now()
    refresh({ wake: true })

    const id = setInterval(() => refresh(), cfgRef.current.pollMs)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh({ wake: true })
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  const value = useMemo(
    () => ({ online, showOfflineBanner, refresh }),
    [online, showOfflineBanner, refresh]
  )

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>
}

export function useApi() {
  const ctx = useContext(ApiContext)
  if (!ctx) throw new Error('useApi must be used within ApiProvider')
  return ctx
}
