const TOKEN_KEY = 'lms_token'
const ADMIN_TOKEN_KEY = 'lms_admin_token'

export const PRODUCTION_API_BASE = 'https://insider-academy.onrender.com/api'

function isLocalHost(host) {
  return host === 'localhost' || host === '127.0.0.1'
}

/** Хосты на Vercel с rewrite /api → Render (без CORS). */
function usesVercelApiProxy(host) {
  if (isLocalHost(host)) return false
  if (host.endsWith('.vercel.app')) return true
  if (host === 'myinsideracademy.com' || host === 'www.myinsideracademy.com') return true
  return false
}

export function getApiBase() {
  const fromEnv = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (isLocalHost(host)) return fromEnv || '/api'
    if (usesVercelApiProxy(host)) return '/api'
    if (fromEnv && fromEnv !== '/api') return fromEnv
    return PRODUCTION_API_BASE
  }

  return fromEnv && fromEnv !== '/api' ? fromEnv : PRODUCTION_API_BASE
}

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getAdminToken() {
  try { return localStorage.getItem(ADMIN_TOKEN_KEY) } catch { return null }
}

export function setAdminToken(token) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
  else localStorage.removeItem(ADMIN_TOKEN_KEY)
}

export async function apiRequest(path, { method = 'GET', body, admin = false, auth = true, retries = 0 } = {}) {
  const headers = {}
  const isForm = body instanceof FormData
  if (!isForm) headers['Content-Type'] = 'application/json'
  const token = admin ? getAdminToken() : getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${getApiBase()}${path}`, {
      method,
      headers,
      body: isForm ? body : body != null ? JSON.stringify(body) : undefined,
    })
  } catch (fetchErr) {
    const raw = fetchErr?.message || 'Network error'
    const isLoadFailed = /load failed|failed to fetch|networkerror/i.test(raw)
    const err = new Error(isLoadFailed ? 'Network error' : raw)
    err.network = true
    err.cause = raw
    throw err
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (retries > 0 && res.status >= 502) {
      await new Promise((r) => setTimeout(r, 800))
      return apiRequest(path, { method, body, admin, auth, retries: retries - 1 })
    }
    const err = new Error(data.error || res.statusText || 'Request failed')
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  health: () => apiRequest('/health', { auth: false }),
  register: (email, password, name) => apiRequest('/auth/register', { method: 'POST', body: { email, password, name }, auth: false, retries: 2 }),
  login: (email, password) => apiRequest('/auth/login', { method: 'POST', body: { email, password }, auth: false, retries: 2 }),
  verifyEmail: (token) => apiRequest('/auth/verify-email', { method: 'POST', body: { token }, auth: false }),
  verifyEmailCode: (email, code) => apiRequest('/auth/verify-email-code', { method: 'POST', body: { email, code }, auth: false }),
  resendVerificationCode: (email) => apiRequest('/auth/resend-verification-code', { method: 'POST', body: { email }, auth: false }),
  forgotPassword: (email) => apiRequest('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
  resetPassword: (token, password) => apiRequest('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false }),
  getCourses: () => apiRequest('/courses', { auth: false }),
  getMe: () => apiRequest('/me'),
  getStats: () => apiRequest('/me/stats'),
  purchaseCourse: (payload) => apiRequest('/me/purchases', { method: 'POST', body: payload }),
  saveProgress: (courseId, data) => apiRequest(`/me/progress/${courseId}`, { method: 'PUT', body: { data } }),
  recordReferral: (payload) => apiRequest('/me/referral', { method: 'POST', body: payload }),
  getNotifications: () => apiRequest('/me/notifications'),
  markNotificationRead: (id) => apiRequest(`/me/notifications/${id}/read`, { method: 'PATCH' }),
  getCertificates: () => apiRequest('/me/certificates'),
  getHomework: (courseId, lessonIndex) => apiRequest(`/me/homework/${courseId}/${lessonIndex}`),
  submitHomeworkForm: (formData) => apiRequest('/me/homework', { method: 'POST', body: formData }),
  getBlogPosts: () => apiRequest('/blog', { auth: false }),
  getCalendarEvents: () => apiRequest('/calendar', { auth: false }),
  trackVisit: () => apiRequest('/analytics/visit', { method: 'POST', auth: false }),
  trackCourseClick: (courseId) => apiRequest('/analytics/course-click', { method: 'POST', body: { courseId }, auth: false }),
  stripeCheckout: (payload) => apiRequest('/payments/stripe/checkout', { method: 'POST', body: payload }),
  tributeCheckout: (payload) => apiRequest('/payments/tribute/checkout', { method: 'POST', body: payload }),
  tributeStatus: () => apiRequest('/payments/tribute/status', { auth: false }),
  liqpayCreate: (payload) => apiRequest('/payments/liqpay/create', { method: 'POST', body: payload }),
  demoPurchase: (payload) => apiRequest('/payments/demo', { method: 'POST', body: payload }),
  chat: (messages) => apiRequest('/chat', { method: 'POST', body: { messages } }),
  getReviews: (courseId) => apiRequest(`/reviews/${courseId}`, { auth: false }),
  getFeaturedReviews: (limit = 12) => apiRequest(`/reviews?limit=${limit}`, { auth: false }),
  postReview: (courseId, payload) => apiRequest(`/reviews/${courseId}`, { method: 'POST', body: payload }),
  submitAcceleratorApplication: (payload) => apiRequest('/applications/accelerator', { method: 'POST', body: payload }),
  getTeam: () => apiRequest('/teams/my'),
  createTeam: (name) => apiRequest('/teams/create', { method: 'POST', body: { name } }),
  joinTeam: (code) => apiRequest('/teams/join', { method: 'POST', body: { code } }),
  adminLogin: (password) => apiRequest('/admin/login', { method: 'POST', body: { password }, auth: false }),
  adminMe: () => apiRequest('/admin/me', { admin: true }),
  adminTestEmail: (email) => apiRequest('/admin/test-email', { method: 'POST', body: { email }, admin: true }),
  adminDashboard: () => apiRequest('/admin/dashboard', { admin: true }),
  adminDataHealth: () => apiRequest('/admin/data-health', { admin: true }),
  adminSaveCourses: (courses) => apiRequest('/admin/courses', { method: 'PUT', body: { courses }, admin: true }),
  adminSaveBlog: (posts) => apiRequest('/admin/blog', { method: 'PUT', body: { posts }, admin: true }),
  adminSaveCalendar: (events) => apiRequest('/admin/calendar', { method: 'PUT', body: { events }, admin: true }),
  adminUpdateHomework: (id, payload) => apiRequest(`/admin/homework/${id}`, { method: 'PATCH', body: payload, admin: true }),
  adminUpdateReview: (id, payload) => apiRequest(`/admin/reviews/${id}`, { method: 'PATCH', body: payload, admin: true }),
  adminDeleteReview: (id) => apiRequest(`/admin/reviews/${id}`, { method: 'DELETE', admin: true }),
  adminUpdateApplication: (id, payload) => apiRequest(`/admin/applications/${id}`, { method: 'PATCH', body: payload, admin: true }),
  adminApproveApplication: (id, payload = {}) => apiRequest(`/admin/applications/${id}/approve`, { method: 'POST', body: payload, admin: true }),
  adminBulkApproveApplications: (ids, payload = {}) => apiRequest('/admin/applications/bulk-approve', { method: 'POST', body: { ids, ...payload }, admin: true }),
  adminRejectApplication: (id, payload = {}) => apiRequest(`/admin/applications/${id}/reject`, { method: 'POST', body: payload, admin: true }),
  adminSendApplicationTelegram: (id, payload) => apiRequest(`/admin/applications/${id}/send-telegram`, { method: 'POST', body: payload, admin: true }),
  adminApplicationHistory: (id) => apiRequest(`/admin/applications/${id}/history`, { admin: true }),
  adminAddCertificate: (payload) => apiRequest('/admin/certificates', { method: 'POST', body: payload, admin: true }),
  adminSheetsStatus: () => apiRequest('/admin/sheets/status', { admin: true }),
  adminSheetsSync: () => apiRequest('/admin/sheets/sync', { method: 'POST', admin: true }),
  adminPromoCodes: () => apiRequest('/admin/promo-codes', { admin: true }),
  adminCreatePromo: (payload) => apiRequest('/admin/promo-codes', { method: 'POST', body: payload, admin: true }),
  adminGrantCourse: (payload) => apiRequest('/admin/grant-course', { method: 'POST', body: payload, admin: true }),
  adminDeleteUser: (payload) => apiRequest('/admin/users/delete', { method: 'POST', body: payload, admin: true }),
  adminBulkApproveReviews: (ids) => apiRequest('/admin/reviews/bulk-approve', { method: 'POST', body: { ids }, admin: true }),
  adminAuditLog: () => apiRequest('/admin/audit-log', { admin: true }),
  adminFeatureFlags: () => apiRequest('/admin/feature-flags', { admin: true }),
  adminSetFeatureFlags: (payload) => apiRequest('/admin/feature-flags', { method: 'PUT', body: payload, admin: true }),
  adminMarketplaceProducts: () => apiRequest('/admin/marketplace/products', { admin: true }),
  adminUpdateMarketplaceProduct: (id, payload) => apiRequest(`/admin/marketplace/products/${id}`, { method: 'PATCH', body: payload, admin: true }),
  adminCreatorPayouts: () => apiRequest('/admin/creator-payouts', { admin: true }),
  adminCreateCreatorPayout: (payload) => apiRequest('/admin/creator-payouts', { method: 'POST', body: payload, admin: true }),
  adminUpdateCreatorPayout: (id, payload) => apiRequest(`/admin/creator-payouts/${id}`, { method: 'PATCH', body: payload, admin: true }),
  adminTelegramBroadcast: (payload) => apiRequest('/admin/telegram/broadcast', { method: 'POST', body: payload, admin: true }),
}

export async function checkApiOnline() {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const ctrl = new AbortController()
      const timeoutMs = attempt === 0 ? 8000 : 12000
      const timer = setTimeout(() => ctrl.abort(), timeoutMs)
      const res = await fetch(`${getApiBase()}/health`, { signal: ctrl.signal, cache: 'no-store' })
      clearTimeout(timer)
      if (!res.ok) continue
      const data = await res.json().catch(() => ({}))
      if (data.ok !== false) return true
    } catch (_) {}
    if (attempt < 2) await new Promise((r) => setTimeout(r, 1200))
  }
  return false
}

/** API доступен и пользователь авторизован JWT-токеном */
export async function canUseAuthenticatedApi() {
  if (!getToken()) return false
  return checkApiOnline()
}
