import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { getCourses as getLocalCourses } from '../api/courseStore'
import { api, checkApiOnline } from '../api/client'

const CoursesContext = createContext(null)

export function CoursesProvider({ children }) {
  const [courses, setCoursesState] = useState(getLocalCourses)
  const [loading, setLoading] = useState(true)

  const refreshCourses = useCallback(async () => {
    try {
      const online = await checkApiOnline()
      if (online) {
        const list = await api.getCourses()
        setCoursesState(list)
        return list
      }
    } catch (_) {}
    const local = getLocalCourses()
    setCoursesState(local)
    return local
  }, [])

  useEffect(() => {
    refreshCourses().finally(() => setLoading(false))
    const handler = () => refreshCourses()
    window.addEventListener('lms-courses-updated', handler)
    return () => window.removeEventListener('lms-courses-updated', handler)
  }, [refreshCourses])

  const value = useMemo(
    () => ({
      courses,
      loading,
      freeTrialCourses: courses.filter((c) => c.isFreeTrial === true),
      getCourseBySlug: (slug) => courses.find((c) => c.slug === slug) || null,
      getCourseById: (id) => courses.find((c) => c.id === id) || null,
      refreshCourses,
    }),
    [courses, loading, refreshCourses]
  )

  return (
    <CoursesContext.Provider value={value}>
      {children}
    </CoursesContext.Provider>
  )
}

export function useCourses() {
  const ctx = useContext(CoursesContext)
  if (!ctx) throw new Error('useCourses must be used within CoursesProvider')
  return ctx
}
