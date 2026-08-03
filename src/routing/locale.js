export const PUBLIC_LOCALES = ['ru', 'ukr', 'en']
export const DEFAULT_LOCALE = 'ru'

export const LOCALE_LANGUAGE = {
  ru: 'ru',
  ukr: 'uk',
  en: 'en',
}

export function isPublicLocale(value) {
  return PUBLIC_LOCALES.includes(value)
}

export function getLocaleFromPath(pathname = '') {
  const segment = String(pathname).split('/').filter(Boolean)[0]
  return isPublicLocale(segment) ? segment : null
}

export function stripLocale(pathname = '/') {
  const path = String(pathname || '/')
  const locale = getLocaleFromPath(path)
  if (!locale) return path.startsWith('/') ? path : `/${path}`
  const stripped = path.replace(new RegExp(`^/${locale}(?=/|$)`), '')
  return stripped || '/'
}

export function localizePath(path = '/', locale = DEFAULT_LOCALE) {
  const safeLocale = isPublicLocale(locale) ? locale : DEFAULT_LOCALE
  const value = String(path || '/')
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return `/${safeLocale}/`
  }
  const hashIndex = value.indexOf('#')
  const queryIndex = value.indexOf('?')
  const splitIndex = [hashIndex, queryIndex].filter((index) => index >= 0).sort((a, b) => a - b)[0]
  const pathname = splitIndex === undefined ? value : value.slice(0, splitIndex)
  const suffix = splitIndex === undefined ? '' : value.slice(splitIndex)
  const barePath = stripLocale(pathname)
  return `/${safeLocale}${barePath === '/' ? '/' : barePath}${suffix}`
}

export function switchLocalePath(pathname, locale) {
  return localizePath(stripLocale(pathname), locale)
}

export function isPublicPath(pathname) {
  const path = stripLocale(pathname)
  return ![
    '/login',
    '/register',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
    '/onboarding',
    '/cabinet',
    '/account',
    '/admin',
    '/api',
  ].some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}
