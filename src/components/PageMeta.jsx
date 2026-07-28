import { useEffect } from 'react'
import { SITE_NAME } from '../data/siteMeta'
import { getLocaleFromPath, localizePath, stripLocale } from '../routing/locale'

const DEFAULT_DESC =
  'Курсы, Vault, Marketplace и подписки Club/Pro — обучение AI и готовые автоматизации.'

function absoluteUrl(path) {
  if (typeof window === 'undefined') return path
  if (!path) return `${window.location.origin}/og-image.png`
  if (path.startsWith('http')) return path
  return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
}

export function PageMeta({ title, description = DEFAULT_DESC, path = '', image = '/og-image.png' }) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', description)

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const currentPath = window.location.pathname
    const currentLocale = getLocaleFromPath(currentPath)
    const effectivePath = path && currentLocale && !getLocaleFromPath(path)
      ? localizePath(path, currentLocale)
      : (path || currentPath)
    const url = `${origin}${effectivePath}`
    const ogImage = absoluteUrl(image)

    const setOg = (prop, content) => {
      let el = document.querySelector(`meta[property="${prop}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', prop)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    const setName = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('name', name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setOg('og:title', title ? `${title} | ${SITE_NAME}` : SITE_NAME)
    setOg('og:description', description)
    setOg('og:url', url)
    setOg('og:type', 'website')
    setOg('og:image', ogImage)
    setOg('og:site_name', SITE_NAME)
    setName('twitter:card', 'summary_large_image')
    setName('twitter:image', ogImage)
    setName('twitter:title', title ? `${title} | ${SITE_NAME}` : SITE_NAME)
    setName('twitter:description', description)

    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    canonical.setAttribute('href', url)
    if (!canonical.parentNode) document.head.appendChild(canonical)

    const locale = getLocaleFromPath(effectivePath)
    if (locale) {
      const barePath = stripLocale(effectivePath)
      const alternates = [
        ['ru', 'ru-RU'],
        ['ukr', 'uk-UA'],
        ['en', 'en-US'],
      ]
      alternates.forEach(([targetLocale, hrefLang]) => {
        const selector = `link[rel="alternate"][hreflang="${hrefLang}"]`
        const link = document.querySelector(selector) || document.createElement('link')
        link.setAttribute('rel', 'alternate')
        link.setAttribute('hreflang', hrefLang)
        link.setAttribute('href', `${origin}${localizePath(barePath, targetLocale)}`)
        if (!link.parentNode) document.head.appendChild(link)
      })
    }
  }, [title, description, path, image])

  return null
}
