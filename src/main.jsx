import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/light-theme.css'

// Применить тему до первого рендера (без inline-скрипта в index.html — иначе ломается Vite React Refresh)
try {
  const theme = localStorage.getItem('lms_theme')
  if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light')
} catch (_) {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
