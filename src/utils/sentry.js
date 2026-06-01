/**
 * Sentry: set VITE_SENTRY_DSN and add @sentry/browser via CDN or install @sentry/react.
 * Stub keeps build working without the dependency.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn || typeof window === 'undefined') return
  if (window.__SENTRY_INITIALIZED__) return
  window.__SENTRY_INITIALIZED__ = true
  if (import.meta.env.DEV) {
    console.info('[sentry] DSN configured — add @sentry/react and call Sentry.init in production')
  }
}
