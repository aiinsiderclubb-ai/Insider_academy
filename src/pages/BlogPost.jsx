import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, BellRing, CheckCircle2, Clock3, TrendingUp } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { fetchBlogPosts, getBlogPosts } from '../api/blogStore'
import { getBlogPostLocalized } from '../data/blog'
import { localizePath } from '../routing/locale'
import { PageMeta } from '../components/PageMeta'
import { BlogStructuredData } from '../components/BlogStructuredData'
import styles from './BlogPost.module.css'

const ARTWORK = [
  '/design/course-ai-content-business.webp',
  '/design/course-ai-automation.webp',
  '/design/course-ai-agents.webp',
  '/design/course-ai-data.webp',
]

const FEATURED_ART = {
  'sms-dm-nagaduvannya-salon': '/design/course-ai-content-business.webp',
}

const PAGE_COPY = {
  ru: {
    back: 'Ко всем статьям',
    minutes: 'мин чтения',
    contents: 'В этой статье',
    result: 'Реальный эффект',
    impact: 'Эффект',
    workflow: 'Сценарий внедрения',
    next: 'Далее рекомендуем',
    read: 'Читать материал',
    featuredQuote: 'Правильный тайминг снижает no-show без скидок.',
    featuredImpact: 'Чёткий сценарий и правильный тайминг снижают no-show на 20–35% без скидок и акций.',
    stepLabels: ['Напоминание', 'Подтверждение', 'Оптимизация'],
    stepDescriptions: ['SMS / DM за 24 часа до записи', 'Клиент подтверждает визит в один клик', 'Считаем ответы и снижаем no-show'],
  },
  ukr: {
    back: 'До всіх статей',
    minutes: 'хв читання',
    contents: 'У цій статті',
    result: 'Реальний ефект',
    impact: 'No-show',
    workflow: 'Сценарій впровадження',
    next: 'Далі рекомендуємо',
    read: 'Читати матеріал',
    featuredQuote: 'Правильний таймінг знижує no-show без знижок.',
    featuredImpact: 'Чіткий сценарій і правильний таймінг знижують no-show на 20–35% без знижок і акцій.',
    stepLabels: ['Нагадування', 'Підтвердження', 'Оптимізація'],
    stepDescriptions: ['SMS / DM за 24 години до запису', 'Клієнт підтверджує візит в один клік', 'Враховуємо відповіді та зменшуємо no-show'],
  },
  en: {
    back: 'All articles',
    minutes: 'min read',
    contents: 'In this article',
    result: 'Measured impact',
    impact: 'No-show',
    workflow: 'Implementation flow',
    next: 'Read next',
    read: 'Read article',
    featuredQuote: 'Better timing reduces no-shows without discounts.',
    featuredImpact: 'A clear sequence and better timing reduce no-shows by 20–35% without discounts or promotions.',
    stepLabels: ['Reminder', 'Confirmation', 'Optimization'],
    stepDescriptions: ['SMS / DM 24 hours before the visit', 'Client confirms in one tap', 'Measure replies and reduce no-shows'],
  },
}

const STEP_ICONS = [BellRing, CheckCircle2, TrendingUp]

function formatDate(value, lang) {
  return new Date(value).toLocaleDateString(
    lang === 'ukr' ? 'uk-UA' : lang === 'en' ? 'en-US' : 'ru-RU',
    { day: 'numeric', month: 'long', year: 'numeric' },
  )
}

function getReadingTime(localized) {
  const words = [localized.title, localized.excerpt, ...localized.sections.flatMap((section) => [
    section.heading,
    ...(section.paragraphs || []),
    ...(section.items || []),
  ])]
    .filter(Boolean)
    .join(' ')
    .trim()
    .split(/\s+/).length

  return Math.max(3, Math.ceil(words / 180))
}

function getArtwork(post) {
  if (FEATURED_ART[post.slug]) return FEATURED_ART[post.slug]
  const hash = [...post.slug].reduce((total, character) => total + character.charCodeAt(0), 0)
  return ARTWORK[hash % ARTWORK.length]
}

function getEditorialDetails(post, localized, copy) {
  const featured = post.slug === 'sms-dm-nagaduvannya-salon'
  const firstParagraph = localized.sections
    .flatMap((section) => section.paragraphs || [])
    .find((paragraph) => paragraph.length > 60) || localized.excerpt

  const checklist = localized.sections.find((section) => section.items?.length)?.items || []
  const steps = featured
    ? copy.stepLabels.map((label, index) => ({ label, description: copy.stepDescriptions[index] }))
    : checklist.slice(0, 3).map((item, index) => ({
        label: `${String(index + 1).padStart(2, '0')}`,
        description: item,
      }))

  return {
    quote: featured ? copy.featuredQuote : firstParagraph,
    impact: featured ? copy.featuredImpact : null,
    impactValue: featured ? '−35%' : null,
    steps,
  }
}

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
        <div className={styles.notFound}>
          <PageMeta title="Article not found" noIndex />
          <p>{lang === 'ru' ? 'Запись не найдена.' : lang === 'ukr' ? 'Запис не знайдено.' : 'Post not found.'}</p>
          <Link to={localizePath('/blog', lang)}>{t('blogPost.backToBlog')}</Link>
        </div>
      </div>
    )
  }

  const localized = getBlogPostLocalized(post, lang)
  const copy = PAGE_COPY[lang] || PAGE_COPY.ru
  const readingTime = getReadingTime(localized)
  const editorial = getEditorialDetails(post, localized, copy)
  const sections = localized.sections.map((section, index) => ({ ...section, id: `article-section-${index + 1}` }))
  const navigationSections = sections.filter((section) => section.heading)
  const relatedPosts = localized.relatedSlugs
    .map((relatedSlug) => posts.find((item) => item.slug === relatedSlug))
    .filter(Boolean)

  return (
    <div className={styles.wrap}>
      <article className={styles.container}>
        <PageMeta title={localized.title} description={localized.excerpt} path={localizePath(`/blog/${post.slug}`, lang)} />
        <BlogStructuredData post={post} localized={localized} locale={lang} />

        <Link to={localizePath('/blog', lang)} className={styles.back}>
          <span aria-hidden>←</span>
          {copy.back}
        </Link>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.metaRow}>
              <time dateTime={post.date}>{formatDate(post.date, lang)}</time>
              <span aria-hidden>•</span>
              <span><Clock3 size={13} aria-hidden /> {readingTime} {copy.minutes}</span>
              <span aria-hidden>•</span>
              <span className={styles.category}>{localized.category}</span>
              <i className={styles.liveDot} aria-hidden />
            </div>
            <h1 className={styles.title}>{localized.title}</h1>
            <p className={styles.deck}>{localized.excerpt}</p>
          </div>
          <div
            className={styles.heroArtwork}
            style={{ '--blog-art': `url(${getArtwork(post)})` }}
            role="img"
            aria-label={localized.title}
          />
        </header>

        <div className={styles.articleGrid}>
          {navigationSections.length > 0 && (
            <nav className={styles.toc} aria-label={copy.contents}>
              <span className={styles.tocTitle}>{copy.contents}</span>
              <ol>
                {navigationSections.map((section, index) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className={styles.body}>
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className={styles.articleSection}>
                {section.heading && <h2>{section.heading}</h2>}
                {section.paragraphs?.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
                {section.items && (
                  <ul>
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}

                {index === 0 && editorial.quote && (
                  <blockquote className={styles.pullQuote}>
                    <span aria-hidden>“</span>
                    <p>{editorial.quote}</p>
                  </blockquote>
                )}

                {index === 0 && editorial.impact && (
                  <div className={styles.impactStrip}>
                    <span className={styles.impactLabel}>{copy.result}</span>
                    <p>{editorial.impact}</p>
                    <strong><small>{copy.impact}</small>{editorial.impactValue}</strong>
                  </div>
                )}
              </section>
            ))}

            {editorial.steps.length > 0 && (
              <section className={styles.workflow} aria-labelledby="workflow-title">
                <h2 id="workflow-title">{copy.workflow}</h2>
                <ol>
                  {editorial.steps.map((step, index) => {
                    const Icon = STEP_ICONS[index] || CheckCircle2
                    return (
                      <li key={`${step.label}-${index}`}>
                        <span className={styles.stepIcon}><Icon size={23} strokeWidth={1.7} aria-hidden /></span>
                        <span><strong>{index + 1}. {step.label}</strong><small>{step.description}</small></span>
                      </li>
                    )
                  })}
                </ol>
              </section>
            )}
          </div>
        </div>

        {localized.faq?.length > 0 && (
          <section className={styles.faq}>
            <div className={styles.sectionLabel}>FAQ</div>
            <div className={styles.faqList}>
              {localized.faq.map(([question, answer]) => (
                <details key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {relatedPosts.length > 0 && (
          <section className={styles.related}>
            <div className={styles.relatedLabel}>{copy.next}</div>
            <div className={styles.relatedList}>
              {relatedPosts.map((related) => {
                const item = getBlogPostLocalized(related, lang)
                const relatedReadingTime = getReadingTime(item)
                return (
                  <Link key={related.slug} to={localizePath(`/blog/${related.slug}`, lang)} className={styles.relatedStory}>
                    <span
                      className={styles.relatedArtwork}
                      style={{ '--blog-art': `url(${getArtwork(related)})` }}
                      aria-hidden
                    />
                    <span className={styles.relatedCopy}>
                      <strong>{item.title}</strong>
                      <small>{item.excerpt}</small>
                    </span>
                    <span className={styles.relatedTime}>{relatedReadingTime} {copy.minutes}</span>
                    <ArrowRight size={20} strokeWidth={1.6} aria-hidden />
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
