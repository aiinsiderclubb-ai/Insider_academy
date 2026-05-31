import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { getCourses as getLocalCourses, setCourses as persistCourses } from '../api/courseStore'
import { isCatalogStale, syncCoursesWithDefaults } from '../data/catalogSync'
import { courses as defaultCourses } from '../data/courses'
import { splitCourses } from '../data/courseCatalog'
import { api, checkApiOnline } from '../api/client'

const CoursesContext = createContext(null)

function normalizeCourses(list) {
  if (!Array.isArray(list) || list.length === 0) return defaultCourses
  return isCatalogStale(list) ? syncCoursesWithDefaults(list) : list
}

export function CoursesProvider({ children }) {
  const [courses, setCoursesState] = useState(() => normalizeCourses(getLocalCourses()))
  const [loading, setLoading] = useState(true)

  const refreshCourses = useCallback(async () => {
    let result = normalizeCourses(getLocalCourses())
    try {
      const online = await checkApiOnline()
      if (online) {
        const list = await api.getCourses()
        if (Array.isArray(list) && list.length > 0) {
          result = normalizeCourses(list)
        }
      }
    } catch (_) {}
    persistCourses(result)
    setCoursesState(result)
    return result
  }, [])

  useEffect(() => {
    let active = true
    refreshCourses()
      .catch(() => {
        if (active) setCoursesState(defaultCourses)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    const handler = () => { refreshCourses() }
    window.addEventListener('lms-courses-updated', handler)
    return () => {
      active = false
      window.removeEventListener('lms-courses-updated', handler)
    }
  }, [refreshCourses])

  const { freeCourses, paidCourses, acceleratorCourse } = useMemo(
    () => splitCourses(courses),
    [courses]
  )

  const value = useMemo(
    () => ({
      courses,
      loading,
      freeCourses,
      paidCourses,
      acceleratorCourse,
      freeTrialCourses: freeCourses,
      getCourseBySlug: (slug) => courses.find((c) => c.slug === slug) || null,
      getCourseById: (id) => courses.find((c) => c.id === id) || null,
      refreshCourses,
    }),
    [courses, loading, freeCourses, paidCourses, acceleratorCourse, refreshCourses]
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
