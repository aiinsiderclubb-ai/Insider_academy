import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { getBlogPosts } from '../api/blogStore'
import styles from './Blog.module.css'

export function Blog() {
  const { t, lang } = useLanguage()
  const [posts, setPosts] = useState(() => [...getBlogPosts()].sort((a, b) => new Date(b.date) - new Date(a.date)))

  useEffect(() => {
    const handler = () => setPosts([...getBlogPosts()].sort((a, b) => new Date(b.date) - new Date(a.date)))
    window.addEventListener('lms-blog-updated', handler)
    return () => window.removeEventListener('lms-blog-updated', handler)
  }, [])
  const locale = lang === 'en' ? 'en-US' : 'ru-RU'

  const getTitle = (post) => (lang === 'en' && post.titleEn ? post.titleEn : post.title)
  const getExcerpt = (post) => (lang === 'en' && post.excerptEn ? post.excerptEn : post.excerpt)
  const getCategory = (post) => (lang === 'en' && post.categoryEn ? post.categoryEn : post.category)

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('blog.title')}</h1>
        <p className={styles.desc}>{t('blog.desc')}</p>
        <div className={styles.grid}>
          {posts.map((post) => (
            <article key={post.id} className={styles.card}>
              <span className={styles.category}>{getCategory(post)}</span>
              <h2 className={styles.cardTitle}>
                <Link to={`/blog/${post.slug}`}>{getTitle(post)}</Link>
              </h2>
              <p className={styles.excerpt}>{getExcerpt(post)}</p>
              <time className={styles.date} dateTime={post.date}>
                {new Date(post.date).toLocaleDateString(locale, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
