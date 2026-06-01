import { createContext, useCallback, useContext, useState } from 'react'
import styles from './ToastContext.module.css'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId
    setItems((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.stack} aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type] || ''}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) return { showToast: () => {} }
  return ctx
}
