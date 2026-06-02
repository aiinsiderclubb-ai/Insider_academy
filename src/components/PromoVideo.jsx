import styles from './PromoVideo.module.css'

function parseVideoUrl(url) {
  if (!url) return null
  const u = url.trim()
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return { type: 'youtube', id: yt[1] }
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return { type: 'vimeo', id: vimeo[1] }
  if (u.startsWith('http') || u.startsWith('/')) return { type: 'mp4', src: u }
  return null
}

export function PromoVideo({ url, poster, title, compact = false }) {
  const parsed = parseVideoUrl(url)

  if (parsed?.type === 'youtube') {
    return (
      <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
        <iframe
          title={title}
          src={`https://www.youtube.com/embed/${parsed.id}?rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className={styles.media}
        />
      </div>
    )
  }

  if (parsed?.type === 'vimeo') {
    return (
      <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
        <iframe
          title={title}
          src={`https://player.vimeo.com/video/${parsed.id}`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className={styles.media}
        />
      </div>
    )
  }

  if (parsed?.type === 'mp4') {
    return (
      <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
        <video src={parsed.src} controls poster={poster} className={styles.media} />
      </div>
    )
  }

  return (
    <div
      className={`${styles.wrap} ${styles.placeholder} ${compact ? styles.compact : ''}`}
      style={poster ? { backgroundImage: `url(${poster})` } : undefined}
    >
      <div className={styles.placeholderOverlay}>
        <span className={styles.playIcon} aria-hidden>▶</span>
        <p>{title}</p>
        <span className={styles.placeholderHint}>Видео скоро</span>
      </div>
    </div>
  )
}
