import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
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
const lazyPage = (loader, name) => lazy(() => loader().then((module) => ({ default: module[name] })))
const Home = lazyPage(() => import('./pages/Home'), 'Home')
const Courses = lazyPage(() => import('./pages/Courses'), 'Courses')
const Course = lazyPage(() => import('./pages/Course'), 'Course')
const CourseBuy = lazyPage(() => import('./pages/CourseBuy'), 'CourseBuy')
const Cabinet = lazyPage(() => import('./pages/Cabinet'), 'Cabinet')
const Blog = lazyPage(() => import('./pages/Blog'), 'Blog')
const BlogPost = lazyPage(() => import('./pages/BlogPost'), 'BlogPost')
const Calendar = lazyPage(() => import('./pages/Calendar'), 'Calendar')
const Login = lazyPage(() => import('./pages/Login'), 'Login')
const Register = lazyPage(() => import('./pages/Register'), 'Register')
const AccountSettings = lazyPage(() => import('./pages/AccountSettings'), 'AccountSettings')
const VerifyEmail = lazyPage(() => import('./pages/VerifyEmail'), 'VerifyEmail')
const ForgotPassword = lazyPage(() => import('./pages/ForgotPassword'), 'ForgotPassword')
const ResetPassword = lazyPage(() => import('./pages/ResetPassword'), 'ResetPassword')
const Memberships = lazyPage(() => import('./pages/Memberships'), 'Memberships')
const MembershipPlan = lazyPage(() => import('./pages/MembershipPlan'), 'MembershipPlan')
const CoursePack = lazyPage(() => import('./pages/CoursePack'), 'CoursePack')
const VaultProduct = lazyPage(() => import('./pages/VaultProduct'), 'VaultProduct')
const VaultBuy = lazyPage(() => import('./pages/VaultBuy'), 'VaultBuy')
const Marketplace = lazyPage(() => import('./pages/Marketplace'), 'Marketplace')
const MarketplaceProduct = lazyPage(() => import('./pages/MarketplaceProduct'), 'MarketplaceProduct')
const MarketplaceBuy = lazyPage(() => import('./pages/MarketplaceBuy'), 'MarketplaceBuy')
const MarketplaceCreators = lazyPage(() => import('./pages/MarketplaceCreators'), 'MarketplaceCreators')
const Admin = lazyPage(() => import('./pages/Admin'), 'Admin')
const AcceleratorApply = lazyPage(() => import('./pages/AcceleratorApply'), 'AcceleratorApply')
const LearningMap = lazyPage(() => import('./pages/LearningMap'), 'LearningMap')
const Giveaway = lazyPage(() => import('./pages/Giveaway'), 'Giveaway')
const Events = lazyPage(() => import('./pages/Events'), 'Events')
const PublicOffer = lazyPage(() => import('./pages/PublicOffer'), 'PublicOffer')
const PrivacyPolicy = lazyPage(() => import('./pages/PrivacyPolicy'), 'PrivacyPolicy')
const RefundPolicy = lazyPage(() => import('./pages/RefundPolicy'), 'RefundPolicy')
const Team = lazyPage(() => import('./pages/Team'), 'Team')
const GiveawayRules = lazyPage(() => import('./pages/GiveawayRules'), 'GiveawayRules')
const Onboarding = lazyPage(() => import('./pages/Onboarding'), 'Onboarding')
const NotFound = lazyPage(() => import('./pages/NotFound'), 'NotFound')
import { ToastProvider } from './context/ToastContext'
import { LEGACY_SLUG_REDIRECTS, LEGACY_PACK_REDIRECTS } from './data/courseAliases'
import { DEFAULT_LOCALE, isPublicLocale, localizePath } from './routing/locale'
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingSpinner fullPage />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

function LocaleGuard() {
  const { locale } = useParams()
  if (!isPublicLocale(locale)) return <Navigate to={`/${DEFAULT_LOCALE}/`} replace />
  return <Outlet />
}

function LocaleRedirect({ to }) {
  const { locale } = useParams()
  return <Navigate to={`/${locale}${to}`} replace />
}

function LegacyPublicRedirect() {
  const location = useLocation()
  return <Navigate to={`${localizePath(location.pathname)}${location.search}${location.hash}`} replace />
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
        <Suspense fallback={<LoadingSpinner fullPage />}>
        <Routes>
          <Route path="/" element={<Navigate to={`/${DEFAULT_LOCALE}/`} replace />} />
          <Route path="/courses/*" element={<LegacyPublicRedirect />} />
          <Route path="/packs/*" element={<LegacyPublicRedirect />} />
          <Route path="/vault/*" element={<LegacyPublicRedirect />} />
          <Route path="/marketplace/*" element={<LegacyPublicRedirect />} />
          <Route path="/memberships/*" element={<LegacyPublicRedirect />} />
          <Route path="/club" element={<LegacyPublicRedirect />} />
          <Route path="/learning-map" element={<LegacyPublicRedirect />} />
          <Route path="/events/*" element={<LegacyPublicRedirect />} />
          <Route path="/giveaway/*" element={<LegacyPublicRedirect />} />
          <Route path="/blog/*" element={<LegacyPublicRedirect />} />
          <Route path="/calendar" element={<LegacyPublicRedirect />} />
          <Route path="/oferta" element={<LegacyPublicRedirect />} />
          <Route path="/privacy" element={<LegacyPublicRedirect />} />
          <Route path="/refund" element={<LegacyPublicRedirect />} />
          <Route path="/team" element={<LegacyPublicRedirect />} />
          <Route path="/giveaway-rules" element={<LegacyPublicRedirect />} />
          <Route path="/:locale" element={<LocaleGuard />}>
            <Route index element={<Home />} />
            <Route path="courses" element={<Courses />} />
            {Object.entries(LEGACY_PACK_REDIRECTS).map(([from, to]) => (
              <Route key={from} path={`packs/${from}`} element={<LocaleRedirect to={`/packs/${to}`} />} />
            ))}
            <Route path="packs/:packId" element={<CoursePack />} />
            <Route path="vault" element={<LocaleRedirect to="/marketplace?tab=vault" />} />
            <Route path="vault/:vaultSlug" element={<VaultProduct />} />
            <Route path="vault/:vaultSlug/buy" element={<VaultBuy />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="marketplace/creators" element={<MarketplaceCreators />} />
            <Route path="marketplace/creators/:creatorSlug" element={<MarketplaceCreators />} />
            <Route path="marketplace/:productSlug/buy" element={<MarketplaceBuy />} />
            <Route path="marketplace/:productSlug" element={<MarketplaceProduct />} />
            <Route path="memberships" element={<Memberships />} />
            <Route path="memberships/:tier" element={<MembershipPlan />} />
            <Route path="club" element={<Memberships />} />
            <Route path="learning-map" element={<LearningMap />} />
            <Route path="events" element={<Events />} />
            <Route path="giveaway" element={<LocaleRedirect to="/events" />} />
            <Route path="giveaway/:slug" element={<Giveaway />} />
            <Route path="courses/ai-insider-accelerator/apply" element={<AcceleratorApply />} />
            {Object.entries(LEGACY_SLUG_REDIRECTS).map(([from, to]) => (
              <Route key={from} path={`courses/${from}`} element={<LocaleRedirect to={`/courses/${to}`} />} />
            ))}
            {Object.entries(LEGACY_SLUG_REDIRECTS).map(([from, to]) => (
              <Route key={`${from}-buy`} path={`courses/${from}/buy`} element={<LocaleRedirect to={`/courses/${to}/buy`} />} />
            ))}
            <Route path="courses/:slug" element={<Course />} />
            <Route path="courses/:slug/buy" element={<CourseBuy />} />
            <Route path="blog" element={<Blog />} />
            <Route path="blog/:slug" element={<BlogPost />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="oferta" element={<PublicOffer />} />
            <Route path="privacy" element={<PrivacyPolicy />} />
            <Route path="refund" element={<RefundPolicy />} />
            <Route path="team" element={<Team />} />
            <Route path="giveaway-rules" element={<GiveawayRules />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/cabinet" element={<ProtectedRoute><Cabinet /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<Suspense fallback={<LoadingSpinner fullPage />}><Admin /></Suspense>} />
          <Route path="*" element={<LegacyPublicRedirect />} />
        </Routes>
        </Suspense>
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
