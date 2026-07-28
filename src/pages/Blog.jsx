import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { fetchBlogPosts, getBlogPosts } from '../api/blogStore'
import { getBlogPostLocalized } from '../data/blog'
import { EmptyState } from '../components/EmptyState'
import { localizePath } from '../routing/locale'
import styles from './Blog.module.css'

function formatPostDate(post, lang) {
  return new Date(post.date).toLocaleDateString(lang === 'ukr' ? 'uk-UA' : lang === 'en' ? 'en-US' : 'ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function Blog() {
  const { t, lang } = useLanguage()
  const [posts, setPosts] = useState(() => [...getBlogPosts()].sort((a, b) => new Date(b.date) - new Date(a.date)))

  useEffect(() => {
    fetchBlogPosts().then((list) => setPosts([...list].sort((a, b) => new Date(b.date) - new Date(a.date))))
    const handler = () => setPosts([...getBlogPosts()].sort((a, b) => new Date(b.date) - new Date(a.date)))
    window.addEventListener('lms-blog-updated', handler)
    return () => window.removeEventListener('lms-blog-updated', handler)
  }, [])

  const filteredPosts = useMemo(() => posts.filter((post) => {
    const localized = getBlogPostLocalized(post, lang)
    return Boolean(localized.title && localized.excerpt)
  }), [posts, lang])

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <span className={styles.eyebrow}>AI INSIDER · EDITORIAL</span>
          <h1 className={styles.title}>{t('blog.title')}</h1>
          <p className={styles.desc}>{t('blog.desc')}</p>

        </header>

        {filteredPosts.length === 0 && (
          <EmptyState
            message={lang === 'ru' ? 'Статей на русском языке пока нет' : lang === 'ukr' ? 'Статей українською поки немає' : 'No English posts yet'}
          />
        )}

        <div className={styles.grid}>
          {filteredPosts.map((post) => {
            const localized = getBlogPostLocalized(post, lang)
            return (
              <article key={post.id} className={styles.card}>
                <div className={styles.cardVisual} aria-hidden />
                <div className={styles.cardHead}>
                  <span className={styles.category}>{localized.category}</span>
                </div>
                <h2 className={styles.cardTitle}>
                  <Link to={localizePath(`/blog/${post.slug}`, lang)}>{localized.title}</Link>
                </h2>
                <p className={styles.excerpt}>{localized.excerpt}</p>
                <time className={styles.date} dateTime={post.date}>
                  {formatPostDate(post, lang)}
                </time>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
