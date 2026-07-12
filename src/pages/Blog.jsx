import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { getBlogPosts } from '../api/blogStore'
import { getBlogPostLang, getBlogPostLocale, BLOG_CONTENT_LANGS } from '../data/blog'
import { EmptyState } from '../components/EmptyState'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const contentLang = searchParams.get('contentLang') || 'all'
  const [posts, setPosts] = useState(() => [...getBlogPosts()].sort((a, b) => new Date(b.date) - new Date(a.date)))

  useEffect(() => {
    const handler = () => setPosts([...getBlogPosts()].sort((a, b) => new Date(b.date) - new Date(a.date)))
    window.addEventListener('lms-blog-updated', handler)
    return () => window.removeEventListener('lms-blog-updated', handler)
  }, [])

  const filteredPosts = useMemo(() => {
    if (contentLang === 'all') return posts
    return posts.filter((p) => getBlogPostLang(p) === contentLang)
  }, [posts, contentLang])

  const getTitle = (post) => (lang === 'en' && post.titleEn ? post.titleEn : post.title)
  const getExcerpt = (post) => (lang === 'en' && post.excerptEn ? post.excerptEn : post.excerpt)
  const getCategory = (post) => (lang === 'en' && post.categoryEn ? post.categoryEn : post.category)

  const setContentLang = (id) => {
    if (id === 'all') {
      searchParams.delete('contentLang')
      setSearchParams(searchParams, { replace: true })
    } else {
      setSearchParams({ contentLang: id }, { replace: true })
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('blog.title')}</h1>
        <p className={styles.desc}>{t('blog.desc')}</p>

        <div className={styles.langFilter} role="tablist" aria-label={lang === 'ru' ? 'Язык статей' : 'Article language'}>
          {BLOG_CONTENT_LANGS.map((item) => {
            const label = lang === 'en' ? item.labelEn : item.labelRu
            const active = contentLang === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${styles.langBtn} ${active ? styles.langBtnActive : ''}`}
                onClick={() => setContentLang(item.id)}
              >
                {item.id === 'uk' && <span className={styles.langBadge}>UA</span>}
                {label}
              </button>
            )
          })}
        </div>

        {filteredPosts.length === 0 && (
          <EmptyState
            message={lang === 'ru' ? 'Статей на выбранном языке пока нет' : 'No posts in this language yet'}
            actionLabel={lang === 'ru' ? 'Показать все' : 'Show all'}
            onAction={() => setContentLang('all')}
          />
        )}

        <div className={styles.grid}>
          {filteredPosts.map((post) => {
            const postLang = getBlogPostLang(post)
            return (
              <article key={post.id} className={styles.card}>
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
                  <Link to={`/blog/${post.slug}`}>{getTitle(post)}</Link>
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
