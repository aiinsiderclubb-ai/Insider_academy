import { useState } from 'react'
import { UiIcon } from './UiIcon'
import styles from './MarketplaceFreePreview.module.css'

export function MarketplaceFreePreview({ preview, lang, productTitle }) {
  const ru = lang === 'ru'
  const [copied, setCopied] = useState(false)
  if (!preview) return null

  const title = ru ? preview.titleRu : preview.titleEn
  const content = ru ? preview.contentRu : preview.contentEn
  const typeLabel =
    preview.type === 'workflow'
      ? (ru ? 'Фрагмент конфига' : 'Config snippet')
      : preview.type === 'video'
        ? (ru ? 'Видео-демо' : 'Video demo')
        : (ru ? 'Бесплатный промпт' : 'Free prompt')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (_) {}
  }

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.badge}>
          <UiIcon name="sparkles" variant="badge" tone="onAccent" />
          {ru ? 'Попробуйте бесплатно' : 'Try free'}
        </span>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.sub}>
          {typeLabel}
          {productTitle ? ` · ${productTitle}` : ''}
        </p>
      </div>

      {preview.type === 'video' && preview.videoUrl ? (
        <div className={styles.video}>
          <iframe
            src={preview.videoUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className={styles.codeBlock}>
          <pre className={styles.pre}><code>{content}</code></pre>
          <button type="button" className={styles.copyBtn} onClick={copy}>
            {copied ? (ru ? 'Скопировано' : 'Copied') : (ru ? 'Копировать' : 'Copy')}
          </button>
        </div>
      )}

      <p className={styles.ctaHint}>
        {ru
          ? 'Понравилось? Полный пакет — после покупки в кабинете.'
          : 'Like it? Full pack unlocks in your account after purchase.'}
      </p>
    </section>
  )
}
