import { useParams, Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { getBlogPostBySlug } from '../api/blogStore'
import { getBlogPostLang, getBlogPostLocale } from '../data/blog'
import { localizePath } from '../routing/locale'
import { PageMeta } from '../components/PageMeta'
import styles from './BlogPost.module.css'

export function BlogPost() {
  const { slug } = useParams()
  const post = getBlogPostBySlug(slug)
  const { t, lang } = useLanguage()

  if (!post) {
    return (
      <div className={styles.wrap}>
        <div className={styles.container}>
          <p>{lang === 'ru' ? 'Запись не найдена.' : lang === 'ukr' ? 'Запис не знайдено.' : 'Post not found.'}</p>
          <Link to={localizePath('/blog', lang)}>{t('blogPost.backToBlog')}</Link>
        </div>
      </div>
    )
  }

  const postLang = getBlogPostLang(post)
  const title = lang === 'en' && post.titleEn ? post.titleEn : post.title
  const excerpt = lang === 'en' && post.excerptEn ? post.excerptEn : post.excerpt
  const category = lang === 'en' && post.categoryEn ? post.categoryEn : post.category
  const content = lang === 'en' ? post.contentEn : post.content

  return (
    <div className={styles.wrap}>
      <article className={styles.container}>
        <PageMeta title={title} description={excerpt} path={localizePath(`/blog/${post.slug}`, lang)} />
        <Link to={localizePath('/blog', lang)} className={styles.back}>{t('blogPost.backToBlog')}</Link>
        <div className={styles.cover} aria-hidden />
        <div className={styles.metaRow}>
          <span className={styles.category}>{category}</span>
          {postLang === 'uk' && (
            <span className={styles.langTag} title={lang === 'ru' ? 'Українська' : 'Ukrainian'}>UA</span>
          )}
          {postLang === 'ru' && <span className={`${styles.langTag} ${styles.langTagRu}`}>RU</span>}
        </div>
        <h1 className={styles.title}>{title}</h1>
        <time className={styles.date} dateTime={post.date}>
          {new Date(post.date).toLocaleDateString(getBlogPostLocale(post), {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </time>
        <div className={styles.body}>
          {(content || excerpt || title || '').split(/\n{2,}/).filter(Boolean).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  )
}
