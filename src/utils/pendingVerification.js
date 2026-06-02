export const PENDING_VERIFY_KEY = 'lms_pending_verify_email'

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
