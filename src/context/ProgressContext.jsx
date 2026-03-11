import { createContext, useContext, useState, useCallback } from 'react'

const STORAGE_KEY = 'lms_progress'

function load() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const ProgressContext = createContext(null)

export function ProgressProvider({ children }) {
  const [state, setState] = useState(load)

  const setProgress = useCallback((courseId, updater) => {
    setState((prev) => {
      const next = { ...prev }
      const course = next[courseId] || { watched: [], homeworkSubmitted: [], homeworkChecked: [] }
      next[courseId] = updater(course)
      save(next)
      return next
    })
  }, [])

  const markWatched = useCallback((courseId, lessonIndex) => {
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

  const getCompletedCount = useCallback((courseId, totalLessons) => {
    const p = state[courseId]
    if (!p || !totalLessons) return 0
    const checked = p.homeworkChecked || []
    const watched = p.watched || []
    const completed = new Set([...checked, ...watched])
    return Math.min(completed.size, totalLessons)
  }, [state])

  const getPercent = useCallback((courseId, totalLessons) => {
    if (!totalLessons) return 0
    const n = getCompletedCount(courseId, totalLessons)
    return Math.round((n / totalLessons) * 100)
  }, [getCompletedCount])

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
