import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useAuth, LOGOUT_EVENT } from './AuthContext'
import { api } from '../api/client'
import { touchLearningActivity } from '../utils/smartNotifications'

const STORAGE_KEY = 'lms_progress'

function loadLocal() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

function saveLocal(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const ProgressContext = createContext(null)

export function ProgressProvider({ children }) {
  const { user, apiMode, loading: authLoading } = useAuth()
  const [state, setState] = useState(loadLocal)
  const syncTimer = useRef(null)

  useEffect(() => {
    const resetProgress = () => setState({})
    window.addEventListener(LOGOUT_EVENT, resetProgress)
    return () => window.removeEventListener(LOGOUT_EVENT, resetProgress)
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setState(loadLocal())
      return
    }
    if (!apiMode) return
    let cancelled = false
    ;(async () => {
      try {
        const me = await api.getMe()
        if (!cancelled && me.progress) {
          setState((prev) => ({ ...prev, ...me.progress }))
        }
      } catch (_) {}
    })()
    return () => { cancelled = true }
  }, [user, apiMode, authLoading])

  const syncToApi = useCallback((courseId, data) => {
    if (!apiMode || !user) return
    clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => {
      api.saveProgress(courseId, data).catch(() => {})
    }, 400)
  }, [apiMode, user])

  const setProgress = useCallback((courseId, updater) => {
    setState((prev) => {
      const next = { ...prev }
      const course = next[courseId] || { watched: [], homeworkSubmitted: [], homeworkChecked: [] }
      const updated = updater(course)
      next[courseId] = updated
      if (!apiMode) saveLocal(next)
      else syncToApi(courseId, updated)
      return next
    })
  }, [apiMode, syncToApi])

  const markWatched = useCallback((courseId, lessonIndex) => {
    touchLearningActivity()
    setProgress(courseId, (c) => {
      const watched = c.watched || []
      if (watched.includes(lessonIndex)) return c
      return { ...c, watched: [...watched, lessonIndex].sort((a, b) => a - b) }
    })
  }, [setProgress])

  const submitHomework = useCallback((courseId, lessonIndex) => {
    setProgress(courseId, (c) => {
      const submitted = c.homeworkSubmitted || []
      if (submitted.includes(lessonIndex)) return c
      return { ...c, homeworkSubmitted: [...submitted, lessonIndex].sort((a, b) => a - b) }
    })
  }, [setProgress])

  const checkHomework = useCallback((courseId, lessonIndex) => {
    setProgress(courseId, (c) => {
      const checked = c.homeworkChecked || []
      if (checked.includes(lessonIndex)) return c
      return { ...c, homeworkChecked: [...checked, lessonIndex].sort((a, b) => a - b) }
    })
  }, [setProgress])

  const getProgress = useCallback((courseId) => {
    return state[courseId] || { watched: [], homeworkSubmitted: [], homeworkChecked: [] }
  }, [state])

  const syncHomeworkAccepted = useCallback((courseId, lessonIndexes = []) => {
    const accepted = lessonIndexes.filter((i) => Number.isInteger(i) && i >= 0)
    if (!accepted.length) return
    setProgress(courseId, (c) => {
      const prevChecked = c.homeworkChecked || []
      const missing = accepted.filter((i) => !prevChecked.includes(i))
      if (!missing.length) return c
      const checked = new Set([...prevChecked, ...accepted])
      const watched = new Set([...(c.watched || []), ...accepted])
      return {
        ...c,
        homeworkChecked: [...checked].sort((a, b) => a - b),
        watched: [...watched].sort((a, b) => a - b),
      }
    })
  }, [setProgress])

  const getCompletedCount = useCallback((courseId, totalLessons) => {
    const p = state[courseId]
    if (!p || !totalLessons) return 0
    const checked = p.homeworkChecked || []
    const watched = p.watched || []
    const submitted = p.homeworkSubmitted || []
    const completed = new Set([...checked, ...watched, ...submitted])
    return Math.min(completed.size, totalLessons)
  }, [state])

  const getPercent = useCallback((courseId, totalLessons) => {
    if (!totalLessons) return 0
    return Math.round((getCompletedCount(courseId, totalLessons) / totalLessons) * 100)
  }, [getCompletedCount])

  const saveVideoPosition = useCallback((courseId, lessonIndex, seconds) => {
    setProgress(courseId, (c) => ({
      ...c,
      videoPositions: { ...(c.videoPositions || {}), [lessonIndex]: Math.floor(seconds) },
    }))
  }, [setProgress])

  const getVideoPosition = useCallback((courseId, lessonIndex) => {
    const p = state[courseId]
    return p?.videoPositions?.[lessonIndex] || 0
  }, [state])

  const isLessonAvailable = useCallback((courseId, lessonIndex, unlockBySchedule, homeworkUnlock) => {
    if (lessonIndex === 0) return true
    const p = state[courseId]
    const checked = p?.homeworkChecked || []
    const prevChecked = lessonIndex > 0 && checked.includes(lessonIndex - 1)
    if (homeworkUnlock) return prevChecked && unlockBySchedule
    return unlockBySchedule
  }, [state])

  return (
    <ProgressContext.Provider
      value={{
        markWatched,
        submitHomework,
        checkHomework,
        getProgress,
        getCompletedCount,
        getPercent,
        isLessonAvailable,
        saveVideoPosition,
        getVideoPosition,
        syncHomeworkAccepted,
      }}
    >
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
