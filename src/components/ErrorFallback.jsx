export function ErrorFallback({ error }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'system-ui, sans-serif',
      background: '#0a0a0f',
      color: '#f5f5fa',
      textAlign: 'center',
    }}>
      <h1 style={{ marginBottom: 16 }}>Ошибка загрузки</h1>
      <p style={{ color: '#a8b4c8', marginBottom: 24 }}>
        {(error && error.message) || 'Не удалось отобразить страницу.'}
      </p>
      <a href="/" style={{ color: '#c084fc', fontWeight: 600 }}>На главную</a>
      <a href="/admin" style={{ marginLeft: 24, color: '#c084fc', fontWeight: 600 }}>В админ-панель</a>
    </div>
  )
}
