export const PENDING_VERIFY_KEY = 'lms_pending_verify_email'
export const PENDING_VERIFY_RETURN_KEY = 'lms_pending_verify_return'

export function normalizeReturnPath(value, fallback = '/onboarding') {
  const path = String(value || '').trim()
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return fallback
  return path
}

export function setPendingVerifyEmail(email) {
  try {
    if (email) sessionStorage.setItem(PENDING_VERIFY_KEY, String(email).trim().toLowerCase())
  } catch (_) {}
}

export function getPendingVerifyEmail() {
  try {
    return sessionStorage.getItem(PENDING_VERIFY_KEY) || ''
  } catch {
    return ''
  }
}

export function clearPendingVerifyEmail() {
  try {
    sessionStorage.removeItem(PENDING_VERIFY_KEY)
  } catch (_) {}
}

export function setPendingVerifyReturnPath(path) {
  try {
    sessionStorage.setItem(PENDING_VERIFY_RETURN_KEY, normalizeReturnPath(path))
  } catch (_) {}
}

export function getPendingVerifyReturnPath() {
  try {
    return normalizeReturnPath(sessionStorage.getItem(PENDING_VERIFY_RETURN_KEY))
  } catch {
    return '/onboarding'
  }
}

export function clearPendingVerifyReturnPath() {
  try {
    sessionStorage.removeItem(PENDING_VERIFY_RETURN_KEY)
  } catch (_) {}
}
