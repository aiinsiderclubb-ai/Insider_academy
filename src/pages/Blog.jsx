import { useState, useEffect, useMemo } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { fetchBlogPosts, getBlogPosts } from '../api/blogStore'
import { getBlogPostLocalized } from '../data/blog'
import { EmptyState } from '../components/EmptyState'
import { EditorialPosts } from '../components/EditorialPosts'
import styles from './Blog.module.css'

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
        {filteredPosts.length === 0 && (
          <EmptyState
            message={lang === 'ru' ? 'Статей на русском языке пока нет' : lang === 'ukr' ? 'Статей українською поки немає' : 'No English posts yet'}
          />
        )}
        <EditorialPosts
          posts={filteredPosts}
          lang={lang}
          title={t('blog.title')}
          description={t('blog.desc')}
          eyebrow={lang === 'en' ? 'AI INSIDER · EDITORIAL' : lang === 'ukr' ? 'AI INSIDER · РЕДАКЦІЯ' : 'AI INSIDER · РЕДАКЦИЯ'}
          allLabel={lang === 'en' ? 'All stories' : lang === 'ukr' ? 'Усі матеріали' : 'Все материалы'}
          allHref="#editorial-archive"
          headingLevel={1}
          archive
        />
      </div>
    </div>
  )
}
