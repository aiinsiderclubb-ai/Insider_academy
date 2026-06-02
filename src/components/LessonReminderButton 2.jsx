import { useState } from 'react'
import { api } from '../api/client'

export function LessonReminderButton({ courseId, lessonIndex, lang }) {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const schedule = async () => {
    setLoading(true)
    try {
      const remindAt = new Date(Date.now() + 24 * 3600000).toISOString()
      await api.setReminder({ courseId, lessonIndex, remindAt })
      setDone(true)
    } catch (_) {
      setDone(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" onClick={schedule} disabled={loading || done} style={btnStyle}>
      {done
        ? (lang === 'ru' ? 'Напоминание через 24 ч' : 'Reminder in 24h')
        : (lang === 'ru' ? 'Напомнить завтра' : 'Remind me tomorrow')}
    </button>
  )
}

const btnStyle = {
  marginTop: 8,
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  color: 'var(--text)',
  fontSize: '0.875rem',
  cursor: 'pointer',
}
