import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { getCourses } from '../api/courseStore'

const CoursesContext = createContext(null)

export function CoursesProvider({ children }) {
  const [courses, setCoursesState] = useState(getCourses)

  const refreshCourses = useMemo(
    () => () => setCoursesState(getCourses()),
    []
  )

  useEffect(() => {
    const handler = () => setCoursesState(getCourses())
    window.addEventListener('lms-courses-updated', handler)
    return () => window.removeEventListener('lms-courses-updated', handler)
  }, [])

  const value = useMemo(
    () => ({
      courses,
      freeTrialCourses: courses.filter((c) => c.isFreeTrial === true),
      getCourseBySlug: (slug) => courses.find((c) => c.slug === slug) || null,
      getCourseById: (id) => courses.find((c) => c.id === id) || null,
      refreshCourses,
    }),
    [courses, refreshCourses]
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
