const TOKEN_KEY = 'lms_token'
const ADMIN_TOKEN_KEY = 'lms_admin_token'

export function getApiBase() {
  return import.meta.env.VITE_API_URL || '/api'
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

export async function apiRequest(path, { method = 'GET', body, admin = false, auth = true } = {}) {
  const headers = {}
  const isForm = body instanceof FormData
  if (!isForm) headers['Content-Type'] = 'application/json'
  const token = admin ? getAdminToken() : getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${getApiBase()}${path}`, {
    method,
    headers,
    body: isForm ? body : body != null ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || res.statusText || 'Request failed')
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  health: () => apiRequest('/health', { auth: false }),
  register: (email, password, name) => apiRequest('/auth/register', { method: 'POST', body: { email, password, name }, auth: false }),
  login: (email, password) => apiRequest('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  verifyEmail: (token) => apiRequest('/auth/verify-email', { method: 'POST', body: { token }, auth: false }),
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
  postReview: (courseId, payload) => apiRequest(`/reviews/${courseId}`, { method: 'POST', body: payload }),
  getTeam: () => apiRequest('/teams/my'),
  createTeam: (name) => apiRequest('/teams/create', { method: 'POST', body: { name } }),
  joinTeam: (inviteCode) => apiRequest('/teams/join', { method: 'POST', body: { inviteCode } }),
  grantTeamCourse: (payload) => apiRequest('/teams/grant-course', { method: 'POST', body: payload }),
  linkTelegram: (chatId) => apiRequest('/telegram/link', { method: 'POST', body: { chatId } }),
  setReminder: (payload) => apiRequest('/telegram/reminder', { method: 'POST', body: payload }),
  telegramBotInfo: () => apiRequest('/telegram/bot-info', { auth: false }),
  adminLogin: (password) => apiRequest('/admin/login', { method: 'POST', body: { password }, auth: false }),
  adminMe: () => apiRequest('/admin/me', { admin: true }),
  adminDashboard: () => apiRequest('/admin/dashboard', { admin: true }),
  adminSaveCourses: (courses) => apiRequest('/admin/courses', { method: 'PUT', body: { courses }, admin: true }),
  adminSaveBlog: (posts) => apiRequest('/admin/blog', { method: 'PUT', body: { posts }, admin: true }),
  adminSaveCalendar: (events) => apiRequest('/admin/calendar', { method: 'PUT', body: { events }, admin: true }),
  adminUpdateHomework: (id, payload) => apiRequest(`/admin/homework/${id}`, { method: 'PATCH', body: payload, admin: true }),
  adminUpdateReview: (id, payload) => apiRequest(`/admin/reviews/${id}`, { method: 'PATCH', body: payload, admin: true }),
  adminAddCertificate: (payload) => apiRequest('/admin/certificates', { method: 'POST', body: payload, admin: true }),
}

export async function checkApiOnline() {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 2500)
    const res = await fetch(`${getApiBase()}/health`, { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return false
    return true
  } catch {
    return false
  }
}

/** API доступен и пользователь авторизован JWT-токеном */
export async function canUseAuthenticatedApi() {
  if (!getToken()) return false
  return checkApiOnline()
}
