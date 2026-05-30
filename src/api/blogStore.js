import { blogPosts as defaultBlog } from '../data/blog'
import { api, checkApiOnline } from './client'

const KEY = 'lms_blog_posts'
let cache = null

function getLocal() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : defaultBlog
    }
  } catch (_) {}
  return defaultBlog
}

export function getBlogPosts() {
  return cache || getLocal()
}

export async function fetchBlogPosts() {
  try {
    if (await checkApiOnline()) {
      cache = await api.getBlogPosts()
      return cache
    }
  } catch (_) {}
  cache = getLocal()
  return cache
}

export function setBlogPosts(list) {
  cache = list
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('lms-blog-updated'))
  } catch (_) {}
}

export function getBlogPostBySlug(slug) {
  return getBlogPosts().find((p) => p.slug === slug) || null
}
