import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { fetchBlogPosts, getBlogPosts } from '../api/blogStore'
import { getBlogPostLocalized } from '../data/blog'
import { localizePath } from '../routing/locale'
import { PageMeta } from '../components/PageMeta'
import { BlogStructuredData } from '../components/BlogStructuredData'
import styles from './BlogPost.module.css'

export function BlogPost() {
  const { slug } = useParams()
  const { t, lang } = useLanguage()
  const [posts, setPosts] = useState(() => getBlogPosts())

  useEffect(() => {
    fetchBlogPosts().then(setPosts).catch(() => {})
  }, [])

  const post = useMemo(() => posts.find((item) => item.slug === slug), [posts, slug])

  if (!post) {
    return (
      <div className={styles.wrap}>
        <div className={styles.container}>
          <PageMeta title="Article not found" noIndex />
          <p>{lang === 'ru' ? 'Запись не найдена.' : lang === 'ukr' ? 'Запис не знайдено.' : 'Post not found.'}</p>
          <Link to={localizePath('/blog', lang)}>{t('blogPost.backToBlog')}</Link>
        </div>
      </div>
    )
  }

  const localized = getBlogPostLocalized(post, lang)
  const relatedPosts = localized.relatedSlugs
    .map((relatedSlug) => posts.find((item) => item.slug === relatedSlug))
    .filter(Boolean)

  return (
    <div className={styles.wrap}>
      <article className={styles.container}>
        <PageMeta title={localized.title} description={localized.excerpt} path={localizePath(`/blog/${post.slug}`, lang)} />
        <BlogStructuredData post={post} localized={localized} locale={lang} />
        <Link to={localizePath('/blog', lang)} className={styles.back}>{t('blogPost.backToBlog')}</Link>
        <div className={styles.cover} aria-hidden />
        <div className={styles.metaRow}>
          <span className={styles.category}>{localized.category}</span>
        </div>
        <h1 className={styles.title}>{localized.title}</h1>
        <time className={styles.date} dateTime={post.date}>
          {new Date(post.date).toLocaleDateString(lang === 'ukr' ? 'uk-UA' : lang === 'en' ? 'en-US' : 'ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </time>
        <div className={styles.body}>
          {localized.sections.map((section, index) => (
            <section key={index} className={styles.articleSection}>
              {section.heading && <h2>{section.heading}</h2>}
              {section.paragraphs?.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
              {section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
            </section>
          ))}
        </div>
        {localized.faq?.length > 0 && (
          <section className={styles.faq}>
            <h2>FAQ</h2>
            {localized.faq.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </section>
        )}
        {relatedPosts.length > 0 && (
          <section className={styles.related}>
            <h2>{localized.relatedLabel}</h2>
            <div className={styles.relatedGrid}>
              {relatedPosts.map((related) => {
                const item = getBlogPostLocalized(related, lang)
                return (
                  <Link key={related.slug} to={localizePath(`/blog/${related.slug}`, lang)} className={styles.relatedCard}>
                    <span>{item.category}</span>
                    <strong>{item.title}</strong>
                    <p>{item.excerpt}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </article>
    </div>
  )
}
