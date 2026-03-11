import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProgressProvider } from './context/ProgressContext'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import { CoursesProvider } from './context/CoursesContext'
import { Layout } from './components/Layout'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { Home } from './pages/Home'
import { Courses } from './pages/Courses'
import { Course } from './pages/Course'
import { CourseBuy } from './pages/CourseBuy'
import { Cabinet } from './pages/Cabinet'
import { Blog } from './pages/Blog'
import { BlogPost } from './pages/BlogPost'
import { Calendar } from './pages/Calendar'
import { Login } from './pages/Login'
import { Admin } from './pages/Admin'
import { useAuth } from './context/AuthContext'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  return children
}

function AppContent() {
  const location = useLocation()

  return (
    <AppErrorBoundary resetKey={`${location.pathname}${location.search}`}>
      <ThemeProvider>
      <LanguageProvider>
      <CoursesProvider>
      <AuthProvider>
      <ProgressProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<Course />} />
          <Route path="/courses/:slug/buy" element={<CourseBuy />} />
          <Route path="/cabinet" element={<ProtectedRoute><Cabinet /></ProtectedRoute>} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      </ProgressProvider>
      </AuthProvider>
      </CoursesProvider>
      </LanguageProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
