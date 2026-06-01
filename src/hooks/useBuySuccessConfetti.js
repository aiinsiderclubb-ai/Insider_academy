import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useBuySuccessConfetti(param = 'paid') {
  const [searchParams, setSearchParams] = useSearchParams()
  const [active, setActive] = useState(searchParams.get(param) === '1')

  useEffect(() => {
    if (searchParams.get(param) !== '1') return
    setActive(true)
    const t = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete(param)
          return next
        },
        { replace: true }
      )
    }, 4000)
    return () => clearTimeout(t)
  }, [param, searchParams, setSearchParams])

  return active
}
