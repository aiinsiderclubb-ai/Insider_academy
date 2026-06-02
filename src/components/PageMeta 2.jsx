import { useEffect } from 'react'

const SITE = 'AI Insider Academy'
const DEFAULT_DESC =
  'Курсы, Vault, Marketplace и подписки Club/Pro — обучение AI и готовые автоматизации.'

export function PageMeta({ title, description = DEFAULT_DESC, path = '' }) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : SITE
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', description)

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}${path || window.location.pathname}`

    const setOg = (prop, content) => {
      let el = document.querySelector(`meta[property="${prop}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', prop)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setOg('og:title', title ? `${title} | ${SITE}` : SITE)
    setOg('og:description', description)
    setOg('og:url', url)
    setOg('og:type', 'website')
  }, [title, description, path])

  return null
}
