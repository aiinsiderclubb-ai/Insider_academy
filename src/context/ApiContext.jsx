import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { checkApiOnline } from '../api/client'

const ApiContext = createContext(null)

export function ApiProvider({ children }) {
  const [online, setOnline] = useState(null)

  const refresh = useCallback(async () => {
    const ok = await checkApiOnline()
    setOnline(ok)
    return ok
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 30000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  const value = useMemo(() => ({ online, refresh }), [online, refresh])

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>
}

export function useApi() {
  const ctx = useContext(ApiContext)
  if (!ctx) throw new Error('useApi must be used within ApiProvider')
  return ctx
}
