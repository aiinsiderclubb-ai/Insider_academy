import { blogPosts as defaultBlog } from '../data/blog'

const KEY = 'lms_blog_posts'

export function getBlogPosts() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : defaultBlog
    }
  } catch (_) {}
  return defaultBlog
}

export function setBlogPosts(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('lms-blog-updated'))
  } catch (_) {}
}

export function getBlogPostBySlug(slug) {
  const posts = getBlogPosts()
  return posts.find((p) => p.slug === slug) || null
}
