const DONE_KEY = 'lms_registration_onboarding_done'
const PATH_KEY = 'lms_preferred_path'

export function isRegistrationOnboardingDone() {
  try {
    return localStorage.getItem(DONE_KEY) === '1'
  } catch {
    return false
  }
}

export function markRegistrationOnboardingDone() {
  try {
    localStorage.setItem(DONE_KEY, '1')
  } catch (_) {}
}

export function getPreferredPath() {
  try {
    return localStorage.getItem(PATH_KEY) || null
  } catch {
    return null
  }
}

export function setPreferredPath(pathId) {
  try {
    if (pathId) localStorage.setItem(PATH_KEY, pathId)
    else localStorage.removeItem(PATH_KEY)
  } catch (_) {}
}

export function completePathOnboarding(pathId) {
  setPreferredPath(pathId)
  markRegistrationOnboardingDone()
}
