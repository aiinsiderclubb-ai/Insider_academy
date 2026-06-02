const KEY = 'lms_registration_onboarding_done'

export function isRegistrationOnboardingDone() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markRegistrationOnboardingDone() {
  try {
    localStorage.setItem(KEY, '1')
  } catch (_) {}
}
