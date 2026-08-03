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

/** Прод-сайт с прокси /api (Render может «просыпаться» 30–90 с). */
export function isProductionSite() {
  if (typeof window === 'undefined') return false
  return usesVercelApiProxy(window.location.hostname)
}

let checkApiOnlinePromise = null

async function pingHealth(timeoutMs) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${getApiBase()}/health`, { signal: ctrl.signal, cache: 'no-store' })
    if (!res.ok) return false
    const data = await res.json().catch(() => ({}))
    return data.ok !== false
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
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
  try {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    return token
  } catch {
    return null
  }
}

export function setAdminToken(token) {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
    else sessionStorage.removeItem(ADMIN_TOKEN_KEY)
  } catch (_) {}
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
  register: (email, password, name, returnTo) => apiRequest('/auth/register', { method: 'POST', body: { email, password, name, returnTo }, auth: false, retries: 2 }),
  login: (email, password) => apiRequest('/auth/login', { method: 'POST', body: { email, password }, auth: false, retries: 2 }),
  oauth: (provider, idToken, fullName) => apiRequest('/auth/oauth', {
    method: 'POST',
    body: { provider, idToken, fullName },
    auth: false,
    retries: 1,
  }),
  oauthConfig: () => apiRequest('/auth/oauth/config', { auth: false }),
  verifyEmail: (token) => apiRequest('/auth/verify-email', { method: 'POST', body: { token }, auth: false }),
  verifyEmailCode: (email, code) => apiRequest('/auth/verify-email-code', { method: 'POST', body: { email, code }, auth: false }),
  resendVerificationCode: (email, returnTo) => apiRequest('/auth/resend-verification-code', { method: 'POST', body: { email, returnTo }, auth: false }),
  forgotPassword: (email) => apiRequest('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
  resetPassword: (token, password) => apiRequest('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false }),
  // auth: true — сервер отдаёт videoUrl только по купленным курсам
  getCourses: () => apiRequest('/courses'),
  getMe: () => apiRequest('/me'),
  getStats: () => apiRequest('/me/stats'),
  saveProgress: (courseId, data) => apiRequest(`/me/progress/${courseId}`, { method: 'PUT', body: { data } }),
  recordReferral: (payload) => apiRequest('/me/referral', { method: 'POST', body: payload }),
  getNotifications: () => apiRequest('/me/notifications'),
  markNotificationRead: (id) => apiRequest(`/me/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/me/notifications/read-all', { method: 'PATCH' }),
  getCertificates: () => apiRequest('/me/certificates'),
  getHomework: (courseId, lessonIndex) => apiRequest(`/me/homework/${courseId}/${lessonIndex}`),
  submitHomeworkForm: (formData) => apiRequest('/me/homework', { method: 'POST', body: formData }),
  getBlogPosts: () => apiRequest('/blog', { auth: false }),
  getCalendarEvents: () => apiRequest('/calendar', { auth: false }),
  getFeatureFlags: () => apiRequest('/feature-flags', { auth: false }),
  telegramBotInfo: () => apiRequest('/telegram/bot-info', { auth: false }),
  telegramStatus: () => apiRequest('/telegram/status'),
  telegramLinkToken: () => apiRequest('/telegram/link-token', { method: 'POST' }),
  telegramUpdatePrefs: (payload) => apiRequest('/telegram/prefs', { method: 'PATCH', body: payload }),
  telegramDisconnect: () => apiRequest('/telegram/disconnect', { method: 'POST' }),
  getGiveaways: () => apiRequest('/giveaways'),
  getGiveaway: (slug) => apiRequest(`/giveaways/${slug}`),
  verifyGiveawayTelegram: (slug) => apiRequest(`/giveaways/${slug}/verify-telegram`, { method: 'POST' }),
  enterGiveaway: (slug, payload = {}) => apiRequest(`/giveaways/${slug}/enter`, { method: 'POST', body: payload }),
  recordGiveawayShare: (slug) => apiRequest(`/giveaways/${slug}/share`, { method: 'POST' }),
  trackVisit: () => apiRequest('/analytics/visit', { method: 'POST', auth: false }),
  trackCourseClick: (courseId) => apiRequest('/analytics/course-click', { method: 'POST', body: { courseId }, auth: false }),
  stripeCheckout: (payload) => apiRequest('/payments/stripe/checkout', { method: 'POST', body: payload }),
  tributeCheckout: (payload) => apiRequest('/payments/tribute/checkout', { method: 'POST', body: payload }),
  tributeStatus: () => apiRequest('/payments/tribute/status', { auth: false }),
  liqpayCreate: (payload) => apiRequest('/payments/liqpay/create', { method: 'POST', body: payload }),
  marketplaceCatalog: () => apiRequest('/marketplace/catalog', { auth: false }),
  marketplaceProduct: (id) => apiRequest(`/marketplace/products/${id}`, { auth: false }),
  marketplaceEntitlements: () => apiRequest('/marketplace/me/entitlements'),
  marketplaceDownloads: () => apiRequest('/marketplace/me/downloads'),
  marketplaceDownload: (assetId) => apiRequest(`/marketplace/assets/${assetId}/download`),
  marketplaceStripeCheckout: (productId, licenseTier) => apiRequest('/payments/stripe/marketplace', {
    method: 'POST', body: { productId, licenseTier },
  }),
  marketplaceTributeCheckout: (productId, licenseTier) => apiRequest('/payments/tribute/marketplace', {
    method: 'POST', body: { productId, licenseTier },
  }),
  marketplaceLiqpayCheckout: (productId, licenseTier) => apiRequest('/payments/liqpay/marketplace', {
    method: 'POST', body: { productId, licenseTier },
  }),
  marketplaceReview: (productId, payload) => apiRequest(`/marketplace/products/${productId}/reviews`, {
    method: 'POST', body: payload,
  }),
  marketplaceEvent: (payload) => apiRequest('/marketplace/events', { method: 'POST', body: payload, auth: false }),
  getN8nConnections: () => apiRequest('/n8n/connections'),
  connectN8n: (payload) => apiRequest('/n8n/connections', { method: 'POST', body: payload }),
  revokeN8n: (id) => apiRequest(`/n8n/connections/${id}`, { method: 'DELETE' }),
  rotateN8nKey: (id, apiKey) => apiRequest(`/n8n/connections/${id}/rotate`, {
    method: 'PATCH', body: { apiKey },
  }),
  previewN8nDeploy: (payload) => apiRequest('/n8n/preview', { method: 'POST', body: payload }),
  deployToN8n: (payload) => apiRequest('/n8n/deployments', { method: 'POST', body: payload }),
  getN8nDeployments: () => apiRequest('/n8n/deployments'),
  retryN8nDeploy: (id, credentialMapping = {}) => apiRequest(`/n8n/deployments/${id}/retry`, {
    method: 'POST', body: { credentialMapping },
  }),
  rollbackN8nDeploy: (id) => apiRequest(`/n8n/deployments/${id}/rollback`, { method: 'POST' }),
  governanceDashboard: () => apiRequest('/governance/dashboard'),
  governanceEvalSuites: () => apiRequest('/governance/eval-suites'),
  runGovernanceEval: (suiteId, deploymentId) => apiRequest('/governance/eval-runs', {
    method: 'POST', body: { suiteId, deploymentId },
  }),
  createIncident: (payload) => apiRequest('/governance/incidents', { method: 'POST', body: payload }),
  updateIncident: (id, payload) => apiRequest(`/governance/incidents/${id}`, { method: 'PATCH', body: payload }),
  demoPurchase: (payload) => apiRequest('/payments/demo', { method: 'POST', body: payload }),
  chat: (messages) => apiRequest('/chat', { method: 'POST', body: { messages } }),
  getReviews: (courseId) => apiRequest(`/reviews/${courseId}`, { auth: false }),
  getFeaturedReviews: (limit = 12) => apiRequest(`/reviews?limit=${limit}`, { auth: false }),
  postReview: (courseId, payload) => apiRequest(`/reviews/${courseId}`, { method: 'POST', body: payload }),
  marketplaceProducts: (type = 'marketplace') => apiRequest(`/marketplace/products?type=${encodeURIComponent(type)}`, { auth: false }),
  marketplaceProduct: (slug) => apiRequest(`/marketplace/products/${encodeURIComponent(slug)}`, { auth: false }),
  claimMarketplaceProduct: (id) => apiRequest(`/marketplace/products/${encodeURIComponent(id)}/claim`, { method: 'POST' }),
  getMarketplaceDownloads: () => apiRequest('/marketplace/downloads'),
  getMarketplaceDownloadUrl: (assetId) => apiRequest(`/marketplace/downloads/${encodeURIComponent(assetId)}/url`, { method: 'POST' }),
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
  adminUnlockLesson: (payload) => apiRequest('/admin/unlock-lesson', { method: 'POST', body: payload, admin: true }),
  adminDeleteUser: (payload) => apiRequest('/admin/users/delete', { method: 'POST', body: payload, admin: true }),
  adminBulkApproveReviews: (ids) => apiRequest('/admin/reviews/bulk-approve', { method: 'POST', body: { ids }, admin: true }),
  adminAuditLog: () => apiRequest('/admin/audit-log', { admin: true }),
  adminFeatureFlags: () => apiRequest('/admin/feature-flags', { admin: true }),
  adminSetFeatureFlags: (payload) => apiRequest('/admin/feature-flags', { method: 'PUT', body: payload, admin: true }),
  adminMarketplaceProducts: () => apiRequest('/admin/marketplace/products', { admin: true }),
  adminCreateMarketplaceProduct: (payload) => apiRequest('/admin/marketplace/products', { method: 'POST', body: payload, admin: true }),
  adminUpdateMarketplaceProduct: (id, payload) => apiRequest(`/admin/marketplace/products/${id}`, { method: 'PATCH', body: payload, admin: true }),
  adminUploadMarketplaceAsset: (id, formData) => apiRequest(`/admin/marketplace/products/${id}/assets`, { method: 'POST', body: formData, admin: true }),
  adminUpdateMarketplaceAsset: (productId, assetId, payload) => apiRequest(`/admin/marketplace/products/${productId}/assets/${assetId}`, { method: 'PATCH', body: payload, admin: true }),
  adminCreatorPayouts: () => apiRequest('/admin/creator-payouts', { admin: true }),
  adminCreateCreatorPayout: (payload) => apiRequest('/admin/creator-payouts', { method: 'POST', body: payload, admin: true }),
  adminUpdateCreatorPayout: (id, payload) => apiRequest(`/admin/creator-payouts/${id}`, { method: 'PATCH', body: payload, admin: true }),
  adminTelegramBroadcast: (payload) => apiRequest('/admin/telegram/broadcast', { method: 'POST', body: payload, admin: true }),
}

/**
 * @param {{ wake?: boolean }} [options] — wake: длинная серия попыток при первой загрузке (cold start Render).
 */
export async function checkApiOnline(options = {}) {
  const { wake = false } = options
  if (!wake && checkApiOnlinePromise) return checkApiOnlinePromise

  const run = async () => {
    const prod = isProductionSite()
    const attempts = wake && prod ? 10 : prod ? 4 : 3
    const timeouts = wake && prod
      ? [12000, 14000, 16000, 18000, 20000, 22000, 24000, 26000, 28000, 30000]
      : prod
        ? [10000, 12000, 14000, 16000]
        : [8000, 12000, 12000]
    const delays = wake && prod
      ? [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500]
      : [1200, 1500, 2000]

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (await pingHealth(timeouts[attempt] ?? 12000)) return true
      if (attempt < attempts - 1) {
        await new Promise((r) => setTimeout(r, delays[attempt] ?? 1500))
      }
    }
    return false
  }

  if (wake) return run()

  checkApiOnlinePromise = run().finally(() => {
    checkApiOnlinePromise = null
  })
  return checkApiOnlinePromise
}

/** API доступен и пользователь авторизован JWT-токеном */
export async function canUseAuthenticatedApi() {
  if (!getToken()) return false
  return checkApiOnline()
}
