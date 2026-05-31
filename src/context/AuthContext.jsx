import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api, setToken, checkApiOnline } from '../api/client'
import {
  recordRegistration,
  recordPurchase,
  recordReferral,
  addReferralDiscount,
  markReferredPurchased,
} from '../api/adminStore'
import { AI_INSIDER_CLUB, courseUnlockedByClub, hasClubMembership } from '../data/club'
import {
  isTestAccountEmail,
  TEST_ACCOUNT_PASSWORD,
  TEST_ACCOUNT_NAME,
  getTestAccountPurchases,
  canLeaveCourseReview,
} from '../data/testAccount'

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
      if (typeof parsed[0] === 'object' && parsed[0].id != null) return parsed
      return parsed.map((id) => ({ id, purchasedAt: new Date().toISOString() }))
    }
    return []
  } catch {
    return []
  }
}

function saveUserLocal(user) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  else localStorage.removeItem(STORAGE_KEY)
}

function savePurchasesLocal(list) {
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(list))
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null)
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiMode, setApiMode] = useState(false)

  const applyReferral = useCallback(async (email) => {
    try {
      const refCode = sessionStorage.getItem(REF_STORAGE)
      if (!refCode) return
      const referrerEmail = atob(refCode)
      if (referrerEmail && referrerEmail !== email) {
        if (apiMode) {
          await api.recordReferral({ referrerCode: refCode, referrerEmail })
        } else {
          recordReferral({ referrerCode: refCode, referrerEmail, referredEmail: email })
          addReferralDiscount(referrerEmail, 1)
        }
      }
      sessionStorage.removeItem(REF_STORAGE)
    } catch (_) {}
  }, [apiMode])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const online = await checkApiOnline()
      if (cancelled) return
      setApiMode(online)
      if (online) {
        try {
          const me = await api.getMe()
          if (cancelled) return
          setUserState(me.user)
          setPurchases(me.purchases || [])
          savePurchasesLocal(me.purchases || [])
        } catch {
          setUserState(loadUser())
          setPurchases(loadPurchases())
        }
      } else {
        const localUser = loadUser()
        setUserState(localUser)
        if (localUser && isTestAccountEmail(localUser.email)) {
          const testPurchases = getTestAccountPurchases()
          setPurchases(testPurchases)
          savePurchasesLocal(testPurchases)
        } else {
          setPurchases(loadPurchases())
        }
      }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const setUser = useCallback((u) => {
    setUserState(u)
    if (!apiMode) saveUserLocal(u)
  }, [apiMode])

  const login = useCallback(async (email, password, name) => {
    const emailTrim = email.trim()
    if (apiMode) {
      try {
        const { token, user: u } = await api.login(emailTrim, password)
        setToken(token)
        setUserState(u)
        const me = await api.getMe()
        setPurchases(me.purchases || [])
        savePurchasesLocal(me.purchases || [])
        await applyReferral(emailTrim)
        return u
      } catch (err) {
        if (err.status === 401) {
          const { token, user: u } = await api.register(emailTrim, password, name || emailTrim)
          setToken(token)
          setUserState(u)
          setPurchases([])
          await applyReferral(emailTrim)
          return u
        }
        throw err
      }
    }

    if (isTestAccountEmail(emailTrim)) {
      if (password !== TEST_ACCOUNT_PASSWORD) {
        const err = new Error('Invalid credentials')
        err.status = 401
        throw err
      }
      const u = { email: emailTrim, name: TEST_ACCOUNT_NAME }
      const testPurchases = getTestAccountPurchases()
      setUser(u)
      setPurchases(testPurchases)
      savePurchasesLocal(testPurchases)
      recordRegistration({ email: emailTrim, name: u.name })
      await applyReferral(emailTrim)
      return u
    }

    const u = { email: emailTrim, name: name || emailTrim }
    setUser(u)
    recordRegistration({ email: emailTrim, name: u.name })
    await applyReferral(emailTrim)
    return u
  }, [apiMode, setUser, applyReferral])

  const logout = useCallback(() => {
    setUserState(null)
    setPurchases([])
    setToken(null)
    if (!apiMode) saveUserLocal(null)
  }, [apiMode])

  const purchaseCourse = useCallback(async (courseId, meta = {}) => {
    const buyerEmail = user?.email || meta.email || ''
    if (apiMode && user) {
      const result = await api.purchaseCourse({
        courseId,
        courseTitle: meta.courseTitle,
        amount: meta.amount,
      })
      setPurchases(result.purchases || [])
      savePurchasesLocal(result.purchases || [])
      return
    }

    setPurchases((prev) => {
      if (prev.some((p) => p.id === courseId)) return prev
      const next = [...prev, { id: courseId, purchasedAt: new Date().toISOString() }]
      savePurchasesLocal(next)
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
  }, [user, apiMode])

  const hasPurchased = useCallback(
    (courseId) => courseUnlockedByClub(courseId, purchases) || purchases.some((p) => p.id === courseId),
    [purchases]
  )

  const hasClub = useCallback(() => hasClubMembership(purchases), [purchases])

  const canReviewCourse = useCallback(
    (courseId) => canLeaveCourseReview(courseId, purchases),
    [purchases]
  )

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
        hasClub,
        canReviewCourse,
        getPurchaseDate,
        purchases,
        loading,
        apiMode,
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
