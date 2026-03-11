import { useParams, Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { getBlogPostBySlug } from '../api/blogStore'
import styles from './BlogPost.module.css'

export function BlogPost() {
  const { slug } = useParams()
  const post = getBlogPostBySlug(slug)
  const { t, lang } = useLanguage()
  const locale = lang === 'en' ? 'en-US' : 'ru-RU'

  if (!post) {
    return (
      <div className={styles.wrap}>
        <div className={styles.container}>
          <p>{lang === 'ru' ? 'Запись не найдена.' : 'Post not found.'}</p>
          <Link to="/blog">{t('blogPost.backToBlog')}</Link>
        </div>
      </div>
    )
  }

  const title = lang === 'en' && post.titleEn ? post.titleEn : post.title
  const excerpt = lang === 'en' && post.excerptEn ? post.excerptEn : post.excerpt
  const category = lang === 'en' && post.categoryEn ? post.categoryEn : post.category

  return (
    <div className={styles.wrap}>
      <article className={styles.container}>
        <Link to="/blog" className={styles.back}>{t('blogPost.backToBlog')}</Link>
        <span className={styles.category}>{category}</span>
        <h1 className={styles.title}>{title}</h1>
        <time className={styles.date} dateTime={post.date}>
          {new Date(post.date).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </time>
        <div className={styles.body}>
          <p>{excerpt || title || (lang === 'ru' ? 'Содержание статьи.' : 'Article content.')}</p>
          <p>{lang === 'ru' ? 'Полная версия статьи доступна на сайте AI Insider.' : 'Full article available on AI Insider website.'}</p>
          <a href="https://www.aiinsider.it.com/uk/blog" target="_blank" rel="noreferrer noopener" className={styles.externalLink}>
            {lang === 'ru' ? 'Читать на aiinsider.it.com →' : 'Read on aiinsider.it.com →'}
          </a>
        </div>
      </article>
    </div>
  )
}
