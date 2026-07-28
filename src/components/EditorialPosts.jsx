import { ArrowUpRight, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getBlogPostLocalized } from '../data/blog'
import { localizePath } from '../routing/locale'
import styles from './EditorialPosts.module.css'

const ARTWORK = [
  '/design/course-ai-agents.webp',
  '/design/course-ai-automation.webp',
  '/design/course-ai-content-business.webp',
  '/design/course-ai-data.webp',
]

function formatDate(value, lang) {
  return new Date(value).toLocaleDateString(
    lang === 'ukr' ? 'uk-UA' : lang === 'en' ? 'en-US' : 'ru-RU',
    { day: 'numeric', month: 'short', year: 'numeric' },
  )
}

function readingTime(post, lang) {
  const localized = getBlogPostLocalized(post, lang)
  const words = `${localized.title || ''} ${localized.excerpt || ''}`.trim().split(/\s+/).length
  return Math.max(3, Math.ceil(words / 55))
}

function PostMeta({ post, lang }) {
  return (
    <span className={styles.meta}>
      <time dateTime={post.date}>{formatDate(post.date, lang)}</time>
      <span aria-hidden>·</span>
      <span className={styles.readTime}>
        <Clock3 size={13} strokeWidth={1.8} aria-hidden />
        {readingTime(post, lang)} {lang === 'en' ? 'min read' : lang === 'ukr' ? 'хв читання' : 'мин чтения'}
      </span>
    </span>
  )
}

export function EditorialPosts({
  posts,
  lang,
  title,
  description,
  eyebrow = 'AI INSIDER · EDITORIAL',
  allLabel,
  allHref = '/blog',
  archive = false,
  headingLevel = 2,
}) {
  if (!posts?.length) return null

  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  const lead = posts[0]
  const secondary = posts.slice(1, 3)
  const remaining = archive ? posts.slice(3) : []
  const leadCopy = getBlogPostLocalized(lead, lang)
  const topics = [...new Set(posts.map((post) => getBlogPostLocalized(post, lang).category).filter(Boolean))].slice(0, 5)

  return (
    <section className={`${styles.editorial} ${archive ? styles.archive : styles.preview}`}>
      <header className={styles.masthead}>
        <div className={styles.mastheadCopy}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <Heading className={styles.title}>{title}</Heading>
          <p className={styles.description}>{description}</p>
        </div>
        {allHref.startsWith('#') ? (
          <a className={styles.allLink} href={allHref}>
            {allLabel}
            <ArrowUpRight size={18} strokeWidth={1.8} aria-hidden />
          </a>
        ) : (
          <Link className={styles.allLink} to={localizePath(allHref, lang)}>
            {allLabel}
            <ArrowUpRight size={18} strokeWidth={1.8} aria-hidden />
          </Link>
        )}
      </header>

      <div className={styles.topicRail} aria-label={lang === 'en' ? 'Article topics' : lang === 'ukr' ? 'Теми статей' : 'Темы статей'}>
        <span className={styles.topicLead}>{lang === 'en' ? 'Signals' : lang === 'ukr' ? 'Сигнали' : 'Сигналы'}</span>
        {topics.map((topic) => <span key={topic} className={styles.topic}>{topic}</span>)}
      </div>

      <div className={styles.leadGrid}>
        <Link className={styles.feature} to={localizePath(`/blog/${lead.slug}`, lang)}>
          <div
            className={styles.featureArtwork}
            style={{ '--editorial-art': `url(${ARTWORK[0]})` }}
            aria-hidden
          >
            <span className={styles.signalLine} />
            <span className={styles.issue}>INSIDER SIGNAL / 01</span>
          </div>
          <div className={styles.featureCopy}>
            <span className={styles.category}>{leadCopy.category}</span>
            <h3 className={styles.featureTitle}>{leadCopy.title}</h3>
            <p className={styles.featureExcerpt}>{leadCopy.excerpt}</p>
            <span className={styles.featureFooter}>
              <PostMeta post={lead} lang={lang} />
              <span className={styles.readAction}>
                {lang === 'en' ? 'Read story' : lang === 'ukr' ? 'Читати' : 'Читать'}
                <ArrowUpRight size={18} strokeWidth={1.8} aria-hidden />
              </span>
            </span>
          </div>
        </Link>

        <div className={styles.sideStories}>
          <div className={styles.sideIntro}>
            <span>{lang === 'en' ? 'Latest intelligence' : lang === 'ukr' ? 'Останні матеріали' : 'Свежие материалы'}</span>
            <span className={styles.liveDot} aria-hidden />
          </div>
          {secondary.map((post, index) => {
            const localized = getBlogPostLocalized(post, lang)
            return (
              <Link className={styles.sideStory} to={localizePath(`/blog/${post.slug}`, lang)} key={post.id}>
                <div
                  className={styles.sideArtwork}
                  style={{ '--editorial-art': `url(${ARTWORK[index + 1]})` }}
                  aria-hidden
                />
                <div className={styles.sideCopy}>
                  <span className={styles.sideIndex}>0{index + 2} · {localized.category}</span>
                  <h3 className={styles.sideTitle}>{localized.title}</h3>
                  <PostMeta post={post} lang={lang} />
                </div>
                <ArrowUpRight className={styles.sideArrow} size={20} strokeWidth={1.6} aria-hidden />
              </Link>
            )
          })}
        </div>
      </div>

      {remaining.length > 0 && (
        <div className={styles.archiveSection} id="editorial-archive">
          <div className={styles.archiveHead}>
            <span>{lang === 'en' ? 'Archive' : lang === 'ukr' ? 'Архів' : 'Архив'}</span>
            <span>{String(remaining.length).padStart(2, '0')} {lang === 'en' ? 'stories' : lang === 'ukr' ? 'матеріалів' : 'материалов'}</span>
          </div>
          <div className={styles.archiveGrid}>
            {remaining.map((post, index) => {
              const localized = getBlogPostLocalized(post, lang)
              return (
                <Link className={styles.archiveStory} to={localizePath(`/blog/${post.slug}`, lang)} key={post.id}>
                  <div
                    className={styles.archiveArtwork}
                    style={{ '--editorial-art': `url(${ARTWORK[(index + 3) % ARTWORK.length]})` }}
                    aria-hidden
                  />
                  <span className={styles.category}>{localized.category}</span>
                  <h3 className={styles.archiveTitle}>{localized.title}</h3>
                  <p className={styles.archiveExcerpt}>{localized.excerpt}</p>
                  <PostMeta post={post} lang={lang} />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
