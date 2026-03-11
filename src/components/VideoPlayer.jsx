// Когда добавите реальные видео — подставьте videoUrl в src
// Поддерживаются прямые ссылки на .mp4 или YouTube/Vimeo (можно доработать embed)
export function VideoPlayer({ lesson, title, locked, lockedMessage, unlockAt, onEnded }) {
  const videoUrl = lesson?.videoUrl
  const hasVideo = Boolean(videoUrl && videoUrl.startsWith('http'))

  if (!lesson) return null

  if (locked) {
    const dateStr = unlockAt
      ? new Date(unlockAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
      : ''
    return (
      <div className="video-player-wrap" style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        aspectRatio: '16/9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 320,
      }}>
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>{lockedMessage || 'Урок откроется по расписанию'}</p>
          <p style={{ fontSize: '0.875rem' }}>{title || lesson.title}</p>
          {dateStr && <p style={{ fontSize: '0.875rem', marginTop: 12 }}>Доступ с {dateStr}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="video-player-wrap" style={{
      background: 'var(--bg-card)',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid var(--border)',
      aspectRatio: '16/9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 320,
    }}>
      {hasVideo ? (
        <video
          key={lesson.id}
          src={videoUrl}
          controls
          onEnded={onEnded}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          poster=""
        >
          Ваш браузер не поддерживает видео.
        </video>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: 48,
          color: 'var(--text-muted)',
        }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>{title || lesson.title}</p>
          <p style={{ fontSize: '0.875rem' }}>
            Ссылку на видео можно добавить в <code>src/data/courses.js</code> в поле <code>videoUrl</code> для этого урока.
          </p>
          <p style={{ fontSize: '0.875rem', marginTop: 16 }}>
            Длительность: {lesson.duration}
          </p>
        </div>
      )}
    </div>
  )
}
