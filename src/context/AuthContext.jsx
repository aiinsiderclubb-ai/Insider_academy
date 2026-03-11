import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  recordRegistration,
  recordPurchase,
  recordReferral,
  addReferralDiscount,
  markReferredPurchased,
} from '../api/adminStore'

const REF_STORAGE = 'lms_pending_ref'

const AuthContext = createContext(null)

const STORAGE_KEY = 'lms_user'
const PURCHASES_KEY = 'lms_purchases'

function loadUser() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

function loadPurchases() {
  try {
    const data = localStorage.getItem(PURCHASES_KEY)
    if (!data) return []
    const parsed = JSON.parse(data)
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (typeof parsed[0] === 'object' && parsed[0].id != null) {
        return parsed
      }
      return parsed.map((id) => ({ id, purchasedAt: new Date().toISOString() }))
    }
    return []
  } catch {
    return []
  }
}

function saveUser(user) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  else localStorage.removeItem(STORAGE_KEY)
}

function savePurchases(list) {
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(list))
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(loadUser)
  const [purchases, setPurchases] = useState(loadPurchases)

  const setUser = useCallback((u) => {
    setUserState(u)
    saveUser(u)
  }, [])

  const login = useCallback((email, name) => {
    const u = { email, name: name || email }
    setUser(u)
    recordRegistration({ email, name: u.name })
    try {
      const refCode = sessionStorage.getItem(REF_STORAGE)
      if (refCode) {
        try {
          const referrerEmail = atob(refCode)
          if (referrerEmail && referrerEmail !== email) {
            recordReferral({
              referrerCode: refCode,
              referrerEmail,
              referredEmail: email,
            })
            addReferralDiscount(referrerEmail, 1)
          }
        } catch (_) {}
        sessionStorage.removeItem(REF_STORAGE)
      }
    } catch (_) {}
    return u
  }, [setUser])

  const logout = useCallback(() => {
    setUser(null)
  }, [setUser])

  const purchaseCourse = useCallback((courseId, meta = {}) => {
    const buyerEmail = user?.email || meta.email || ''
    setPurchases((prev) => {
      if (prev.some((p) => p.id === courseId)) return prev
      const next = [...prev, { id: courseId, purchasedAt: new Date().toISOString() }]
      savePurchases(next)
      return next
    })
    if (meta.recordAdmin && buyerEmail) {
      recordPurchase({
        email: buyerEmail,
        courseId,
        courseTitle: meta.courseTitle,
        amount: meta.amount,
      })
      markReferredPurchased(buyerEmail)
    }
  }, [user])

  const hasPurchased = useCallback((courseId) => purchases.some((p) => p.id === courseId), [purchases])

  const getPurchaseDate = useCallback(
    (courseId) => {
      const p = purchases.find((x) => x.id === courseId)
      return p?.purchasedAt ? new Date(p.purchasedAt) : null
    },
    [purchases]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        purchaseCourse,
        hasPurchased,
        getPurchaseDate,
        purchases,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
