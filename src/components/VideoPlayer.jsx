function parseVideoUrl(url) {
  if (!url) return { type: 'none' }
  const u = url.trim()

  const ytMatch = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/)
  if (ytMatch) return { type: 'youtube', id: ytMatch[1] }

  const vimeoMatch = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeoMatch) return { type: 'vimeo', id: vimeoMatch[1] }

  if (u.startsWith('http') && /\.(mp4|webm|ogg)(\?|$)/i.test(u)) return { type: 'mp4', src: u }
  if (u.startsWith('http')) return { type: 'mp4', src: u }

  return { type: 'none' }
}

export function VideoPlayer({ lesson, title, locked, lockedMessage, unlockAt, onEnded, initialTime = 0, onTimeUpdate }) {
  const videoUrl = lesson?.videoUrl
  const parsed = parseVideoUrl(videoUrl)

  if (!lesson) return null

  if (locked) {
    const dateStr = unlockAt
      ? new Date(unlockAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
      : ''
    return (
      <div className="video-player-wrap" style={wrapStyle}>
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>{lockedMessage || 'Урок откроется по расписанию'}</p>
          <p style={{ fontSize: '0.875rem' }}>{title || lesson.title}</p>
          {dateStr && <p style={{ fontSize: '0.875rem', marginTop: 12 }}>Доступ с {dateStr}</p>}
        </div>
      </div>
    )
  }

  const wrap = (
    <div className="video-player-wrap" style={wrapStyle}>
      {parsed.type === 'youtube' && (
        <iframe
          title={title || lesson.title}
          src={`https://www.youtube.com/embed/${parsed.id}?rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 0 }}
        />
      )}
      {parsed.type === 'vimeo' && (
        <iframe
          title={title || lesson.title}
          src={`https://player.vimeo.com/video/${parsed.id}`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 0 }}
        />
      )}
      {parsed.type === 'mp4' && (
        <video
          key={lesson.id}
          ref={(el) => {
            if (el && initialTime > 0 && Math.abs(el.currentTime - initialTime) > 2) {
              try { el.currentTime = initialTime } catch (_) {}
            }
          }}
          src={parsed.src}
          controls
          onEnded={onEnded}
          onTimeUpdate={(e) => onTimeUpdate?.(e.target.currentTime)}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        >
          Ваш браузер не поддерживает видео.
        </video>
      )}
      {parsed.type === 'none' && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>{title || lesson.title}</p>
          <p style={{ fontSize: '0.875rem' }}>
            Добавьте ссылку YouTube, Vimeo или .mp4 в поле <code>videoUrl</code> урока.
          </p>
          <p style={{ fontSize: '0.875rem', marginTop: 16 }}>Длительность: {lesson.duration}</p>
        </div>
      )}
    </div>
  )
  return wrap
}

const wrapStyle = {
  background: 'var(--bg-card)',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid var(--border)',
  aspectRatio: '16/9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 320,
}
