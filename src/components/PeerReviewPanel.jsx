import { useState } from 'react'
import { api } from '../api/client'

export function PeerReviewPanel({ courseId, lessonIndex, lang, enabled }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!enabled) return null

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.submitPeerReview({ courseId, lessonIndex, rating, comment })
      setSent(true)
    } catch (_) {}
    setLoading(false)
  }

  if (sent) {
    return (
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 16 }}>
        {lang === 'ru' ? 'Спасибо! Peer-review отправлен на модерацию.' : 'Thanks! Peer review submitted for moderation.'}
      </p>
    )
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 20, padding: 16, border: '1px solid var(--border)', borderRadius: 12 }}>
      <h4 style={{ margin: '0 0 8px' }}>{lang === 'ru' ? 'Peer-review урока' : 'Lesson peer review'}</h4>
      <label style={{ display: 'block', marginBottom: 8 }}>
        {lang === 'ru' ? 'Оценка' : 'Rating'}
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ marginLeft: 8 }}>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
        </select>
      </label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={lang === 'ru' ? 'Комментарий для одногруппников' : 'Comment for peers'}
        rows={3}
        style={{ width: '100%', marginBottom: 8 }}
      />
      <button type="submit" disabled={loading}>{lang === 'ru' ? 'Отправить' : 'Submit'}</button>
    </form>
  )
}
