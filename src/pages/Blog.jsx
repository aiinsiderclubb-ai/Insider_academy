import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { fetchBlogPosts, getBlogPosts } from '../api/blogStore'
import { getBlogPostLang, getBlogPostLocale } from '../data/blog'
import { EmptyState } from '../components/EmptyState'
import { localizePath } from '../routing/locale'
import styles from './Blog.module.css'

function formatPostDate(post) {
  return new Date(post.date).toLocaleDateString(getBlogPostLocale(post), {
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

  const filteredPosts = useMemo(() => {
    const contentLang = lang === 'ukr' ? 'uk' : lang
    return posts.filter((post) => contentLang === 'en'
      ? Boolean(post.titleEn || post.title)
      : getBlogPostLang(post) === contentLang)
  }, [posts, lang])

  const getTitle = (post) => (lang === 'en' && post.titleEn ? post.titleEn : post.title)
  const getExcerpt = (post) => (lang === 'en' && post.excerptEn ? post.excerptEn : post.excerpt)
  const getCategory = (post) => (lang === 'en' && post.categoryEn ? post.categoryEn : post.category)

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
            const postLang = getBlogPostLang(post)
            return (
              <article key={post.id} className={styles.card}>
                <div className={styles.cardVisual} aria-hidden />
                <div className={styles.cardHead}>
                  <span className={styles.category}>{getCategory(post)}</span>
                  {postLang === 'uk' && (
                    <span className={styles.langTag} title={lang === 'ru' ? 'Українська' : 'Ukrainian'}>
                      UA
                    </span>
                  )}
                  {postLang === 'ru' && (
                    <span className={`${styles.langTag} ${styles.langTagRu}`}>RU</span>
                  )}
                </div>
                <h2 className={styles.cardTitle}>
                  <Link to={localizePath(`/blog/${post.slug}`, lang)}>{getTitle(post)}</Link>
                </h2>
                <p className={styles.excerpt}>{getExcerpt(post)}</p>
                <time className={styles.date} dateTime={post.date}>
                  {formatPostDate(post)}
                </time>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
