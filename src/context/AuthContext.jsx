import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api, setToken, checkApiOnline } from '../api/client'
import {
  recordRegistration,
  recordPurchase,
  recordReferral,
  addReferralDiscount,
  markReferredPurchased,
} from '../api/adminStore'
import { AI_INSIDER_CLUB, courseUnlockedByClub, courseUnlockedByPack, hasClubMembership } from '../data/club'
import { purchaseIdsForCourse } from '../data/courseAliases'
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
const AVATAR_KEY = 'lms_avatar'

function avatarStorageKey(email) {
  return `${AVATAR_KEY}_${String(email || '').toLowerCase()}`
}

export function getStoredAvatar(email) {
  try {
    return localStorage.getItem(avatarStorageKey(email)) || null
  } catch {
    return null
  }
}

function saveStoredAvatar(email, dataUrl) {
  try {
    if (dataUrl) localStorage.setItem(avatarStorageKey(email), dataUrl)
    else localStorage.removeItem(avatarStorageKey(email))
  } catch (_) {}
}

function withLocalAvatar(user) {
  if (!user) return null
  if (user.avatarUrl) return user
  const localAvatar = getStoredAvatar(user.email)
  return localAvatar ? { ...user, avatarUrl: localAvatar } : user
}

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
          setUserState(withLocalAvatar(me.user))
          setPurchases(me.purchases || [])
          savePurchasesLocal(me.purchases || [])
        } catch {
          setUserState(withLocalAvatar(loadUser()))
          setPurchases(loadPurchases())
        }
      } else {
        const localUser = loadUser()
        setUserState(withLocalAvatar(localUser))
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
    const next = withLocalAvatar(u)
    setUserState(next)
    if (!apiMode) saveUserLocal(next)
  }, [apiMode])

  const refreshUser = useCallback(async () => {
    if (apiMode) {
      const me = await api.getMe()
      setUserState(withLocalAvatar(me.user))
      setPurchases(me.purchases || [])
      savePurchasesLocal(me.purchases || [])
      return me.user
    }
    const localUser = withLocalAvatar(loadUser())
    setUserState(localUser)
    return localUser
  }, [apiMode])

  const updateProfile = useCallback(async (name) => {
    const nameTrim = String(name || '').trim()
    if (!nameTrim) throw new Error('Name required')
    if (apiMode) {
      const { user: u } = await api.updateProfile({ name: nameTrim })
      setUserState(withLocalAvatar(u))
      return u
    }
    const next = { ...user, name: nameTrim }
    setUser(next)
    return next
  }, [apiMode, user, setUser])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (apiMode) {
      const res = await api.changePassword({ currentPassword, newPassword })
      if (res?.user) {
        setUserState(withLocalAvatar(res.user))
      } else if (res?.passwordChangedAt) {
        setUserState((prev) => (prev ? { ...prev, passwordChangedAt: res.passwordChangedAt } : prev))
      } else {
        await refreshUser()
      }
      window.dispatchEvent(new Event('lms-notifications-refresh'))
      return res
    }
    if (isTestAccountEmail(user?.email)) {
      throw new Error('Test account password cannot be changed offline')
    }
  }, [apiMode, user, refreshUser])

  const changeEmail = useCallback(async (email, currentPassword) => {
    const emailTrim = email.trim().toLowerCase()
    if (apiMode) {
      const { token, user: u } = await api.updateEmail({ email: emailTrim, currentPassword })
      setToken(token)
      setUserState(withLocalAvatar(u))
      return u
    }
    const prevEmail = user?.email
    const next = { ...user, email: emailTrim }
    if (prevEmail && getStoredAvatar(prevEmail)) {
      saveStoredAvatar(emailTrim, getStoredAvatar(prevEmail))
      saveStoredAvatar(prevEmail, null)
    }
    setUser(next)
    return next
  }, [apiMode, user, setUser])

  const uploadAvatar = useCallback(async (file) => {
    if (!file) throw new Error('File required')
    if (apiMode) {
      const form = new FormData()
      form.append('avatar', file)
      const { user: u } = await api.uploadAvatar(form)
      setUserState(withLocalAvatar(u))
      return u
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    saveStoredAvatar(user.email, dataUrl)
    const next = { ...user, avatarUrl: dataUrl }
    setUser(next)
    return next
  }, [apiMode, user, setUser])

  const login = useCallback(async (email, password, name) => {
    const emailTrim = email.trim()
    const passwordTrim = String(password || '').trim()
    if (apiMode) {
      try {
        const { token, user: u } = await api.login(emailTrim, passwordTrim)
        setToken(token)
        setUserState(u)
        try {
          const me = await api.getMe()
          setPurchases(me.purchases || [])
          savePurchasesLocal(me.purchases || [])
        } catch {
          if (isTestAccountEmail(emailTrim)) {
            const testPurchases = getTestAccountPurchases()
            setPurchases(testPurchases)
            savePurchasesLocal(testPurchases)
          }
        }
        await applyReferral(emailTrim)
        return u
      } catch (err) {
        if (err.status === 401 && isTestAccountEmail(emailTrim)) {
          const hint = new Error('Invalid test account password')
          hint.status = 401
          hint.code = 'TEST_ACCOUNT_PASSWORD'
          throw hint
        }
        throw err
      }
    }

    if (isTestAccountEmail(emailTrim)) {
      if (passwordTrim !== TEST_ACCOUNT_PASSWORD) {
        const err = new Error('Invalid credentials')
        err.status = 401
        err.code = 'TEST_ACCOUNT_PASSWORD'
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

  const register = useCallback(async (email, password, name) => {
    const emailTrim = email.trim()
    const passwordTrim = String(password || '').trim()
    const nameTrim = String(name || emailTrim).trim()

    if (apiMode) {
      const { token, user: u } = await api.register(emailTrim, passwordTrim, nameTrim)
      setToken(token)
      setUserState(u)
      setPurchases([])
      savePurchasesLocal([])
      await applyReferral(emailTrim)
      return u
    }

    const u = { email: emailTrim, name: nameTrim }
    setUser(u)
    recordRegistration({ email: emailTrim, name: nameTrim })
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
    (courseId) => {
      const ids = purchaseIdsForCourse(courseId)
      return ids.some(
        (id) =>
          purchases.some((p) => p.id === id) ||
          courseUnlockedByClub(id, purchases) ||
          courseUnlockedByPack(id, purchases)
      )
    },
    [purchases]
  )

  const hasClub = useCallback(() => hasClubMembership(purchases), [purchases])

  const canReviewCourse = useCallback(
    (courseId) => canLeaveCourseReview(courseId, purchases),
    [purchases]
  )

  const getPurchaseDate = useCallback(
    (courseId) => {
      const ids = purchaseIdsForCourse(courseId)
      const p = purchases.find((x) => ids.includes(x.id))
      return p?.purchasedAt ? new Date(p.purchasedAt) : null
    },
    [purchases]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        changePassword,
        changeEmail,
        uploadAvatar,
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
