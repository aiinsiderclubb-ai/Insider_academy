function envFlag(name, fallback = true) {
  const value = import.meta.env[name]
  if (value == null || value === '') return fallback
  return value !== 'false' && value !== '0'
}

export const RELEASES = {
  courses: {
    enabled: envFlag('VITE_COURSES_COMING_SOON'),
    at: import.meta.env.VITE_COURSES_RELEASE_AT || '2026-09-01T12:00:00+02:00',
  },
  marketplace: {
    enabled: false,
    at: import.meta.env.VITE_MARKETPLACE_RELEASE_AT || '2026-09-15T12:00:00+02:00',
  },
  vault: {
    enabled: envFlag('VITE_VAULT_COMING_SOON'),
    at: import.meta.env.VITE_VAULT_RELEASE_AT || '2026-09-15T12:00:00+02:00',
  },
}

export function getRelease(kind = 'courses') {
  return RELEASES[kind] || RELEASES.courses
}

export function isComingSoon(kind = 'courses') {
  return getRelease(kind).enabled
}
