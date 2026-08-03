import { writeFileSync } from 'node:fs'
import { blogPosts } from '../src/data/blog.js'

const origin = 'https://myinsideracademy.com'
const locales = ['ru', 'ukr', 'en']
const staticPaths = [
  ['', '1.0', 'weekly'],
  ['/courses', '0.9', 'weekly'],
  ['/learning-map', '0.8', 'monthly'],
  ['/marketplace', '0.85', 'weekly'],
  ['/memberships', '0.8', 'monthly'],
  ['/events', '0.85', 'weekly'],
  ['/blog', '0.8', 'weekly'],
  ['/oferta', '0.4', 'monthly'],
  ['/privacy', '0.4', 'monthly'],
  ['/refund', '0.4', 'monthly'],
  ['/giveaway-rules', '0.5', 'monthly'],
]

const escapeXml = (value) => String(value).replace(/[<>&'"]/g, (char) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
}[char]))

const urls = [
  ...locales.flatMap((locale) => staticPaths.map(([path, priority, changefreq]) => ({
    loc: `${origin}/${locale}${path || '/'}`,
    priority,
    changefreq,
  }))),
  ...locales.flatMap((locale) => blogPosts.map((post) => ({
    loc: `${origin}/${locale}/blog/${post.slug}`,
    lastmod: post.updatedAt || post.date,
    priority: '0.7',
    changefreq: 'monthly',
  }))),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escapeXml(url.loc)}</loc>${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}<changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority></url>`).join('\n')}\n</urlset>\n`

writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml)
