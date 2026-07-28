import { useEffect } from 'react'
import { localizePath } from '../routing/locale'

const SITE_URL = 'https://myinsideracademy.com'

function upsertJsonLd(id, data) {
  let node = document.getElementById(id)
  if (!node) {
    node = document.createElement('script')
    node.id = id
    node.type = 'application/ld+json'
    document.head.appendChild(node)
  }
  node.textContent = JSON.stringify(data).replace(/</g, '\\u003c')
  return () => node?.remove()
}

export function BlogStructuredData({ post, localized, locale }) {
  useEffect(() => {
    const articleUrl = `${SITE_URL}${localizePath(`/blog/${post.slug}`, locale)}`
    const language = locale === 'ukr' ? 'uk-UA' : locale === 'en' ? 'en-US' : 'ru-RU'
    const entries = [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: localized.title,
        description: localized.excerpt,
        datePublished: post.date,
        dateModified: post.updatedAt || post.date,
        inLanguage: language,
        mainEntityOfPage: articleUrl,
        author: { '@type': 'Organization', name: 'AI Insider Academy' },
        publisher: { '@type': 'Organization', name: 'AI Insider Academy', url: SITE_URL },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'AI Insider Academy', item: `${SITE_URL}${localizePath('/', locale)}` },
          { '@type': 'ListItem', position: 2, name: localized.relatedLabel, item: `${SITE_URL}${localizePath('/blog', locale)}` },
          { '@type': 'ListItem', position: 3, name: localized.title, item: articleUrl },
        ],
      },
    ]
    if (localized.faq?.length) {
      entries.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: localized.faq.map(([question, answer]) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      })
    }
    return upsertJsonLd('blog-structured-data', entries)
  }, [post, localized, locale])

  return null
}
