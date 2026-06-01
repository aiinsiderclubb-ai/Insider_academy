import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ApiProvider } from './context/ApiContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoadingSpinner } from './components/LoadingSpinner'
import { ScrollToTop } from './components/ScrollToTop'
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
import { Register } from './pages/Register'
import { AccountSettings } from './pages/AccountSettings'
import { VerifyEmail } from './pages/VerifyEmail'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { Memberships } from './pages/Memberships'
import { MembershipPlan } from './pages/MembershipPlan'
import { CoursePack } from './pages/CoursePack'
import { Vault } from './pages/Vault'
import { VaultProduct } from './pages/VaultProduct'
import { VaultBuy } from './pages/VaultBuy'
import { Marketplace } from './pages/Marketplace'
import { MarketplaceProduct } from './pages/MarketplaceProduct'
import { MarketplaceBuy } from './pages/MarketplaceBuy'
import { MarketplaceCreators } from './pages/MarketplaceCreators'
import { Admin } from './pages/Admin'
import { AcceleratorApply } from './pages/AcceleratorApply'
import { LearningMap } from './pages/LearningMap'
import { ToastProvider } from './context/ToastContext'
import { LEGACY_SLUG_REDIRECTS, LEGACY_PACK_REDIRECTS } from './data/courseAliases'
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingSpinner fullPage />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
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
      <ToastProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          {Object.entries(LEGACY_PACK_REDIRECTS).map(([from, to]) => (
            <Route key={from} path={`/packs/${from}`} element={<Navigate to={`/packs/${to}`} replace />} />
          ))}
          <Route path="/packs/:packId" element={<CoursePack />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/vault/:vaultSlug" element={<VaultProduct />} />
          <Route path="/vault/:vaultSlug/buy" element={<VaultBuy />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/creators" element={<MarketplaceCreators />} />
          <Route path="/marketplace/creators/:creatorSlug" element={<MarketplaceCreators />} />
          <Route path="/marketplace/:productSlug/buy" element={<MarketplaceBuy />} />
          <Route path="/marketplace/:productSlug" element={<MarketplaceProduct />} />
          <Route path="/memberships" element={<Memberships />} />
          <Route path="/memberships/:tier" element={<MembershipPlan />} />
          <Route path="/club" element={<Memberships />} />
          <Route path="/learning-map" element={<LearningMap />} />
          <Route path="/courses/ai-insider-accelerator/apply" element={<AcceleratorApply />} />
          {Object.entries(LEGACY_SLUG_REDIRECTS).map(([from, to]) => (
            <Route key={from} path={`/courses/${from}`} element={<Navigate to={`/courses/${to}`} replace />} />
          ))}
          {Object.entries(LEGACY_SLUG_REDIRECTS).map(([from, to]) => (
            <Route key={`${from}-buy`} path={`/courses/${from}/buy`} element={<Navigate to={`/courses/${to}/buy`} replace />} />
          ))}
          <Route path="/courses/:slug" element={<Course />} />
          <Route path="/courses/:slug/buy" element={<CourseBuy />} />
          <Route path="/cabinet" element={<ProtectedRoute><Cabinet /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      </ToastProvider>
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
      <ScrollToTop />
      <ApiProvider>
        <AppContent />
      </ApiProvider>
    </BrowserRouter>
  )
}

export default App
