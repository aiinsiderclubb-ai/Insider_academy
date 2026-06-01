import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, checkApiOnline } from '../api/client'
import { useAuth } from '../context/AuthContext'

export function InactivityBanner({ lang }) {
  const { user, apiMode } = useAuth()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      const online = apiMode || await checkApiOnline()
      if (!online) return
      try {
        const data = await api.getActivity()
        if (!cancelled && data.showInactivityBanner) setShow(true)
      } catch (_) {}
    })()
    return () => { cancelled = true }
  }, [user, apiMode])

  if (!show) return null

  return (
    <div style={wrapStyle} role="status">
      <span>
        {lang === 'ru'
          ? 'Вы давно не заходили — продолжите обучение с того места, где остановились.'
          : 'You have been away — pick up where you left off.'}
      </span>
      <Link to="/cabinet" style={linkStyle}>{lang === 'ru' ? 'В кабинет' : 'Go to cabinet'}</Link>
      <button type="button" onClick={() => setShow(false)} style={closeStyle} aria-label="Close">×</button>
    </div>
  )
}

const wrapStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  padding: '10px 16px',
  background: 'linear-gradient(90deg, rgba(124,58,237,0.15), rgba(249,115,22,0.12))',
  borderBottom: '1px solid var(--border)',
  fontSize: '0.875rem',
}
const linkStyle = { fontWeight: 600, color: 'var(--accent)' }
const closeStyle = { marginLeft: 'auto', border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }
