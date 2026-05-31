import { useEffect } from 'react'
import styles from '../../pages/Admin.module.css'

export function AdminToast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return undefined
    const t = setTimeout(onClose, 3200)
    return () => clearTimeout(t)
  }, [message, onClose])

  if (!message) return null

  return (
    <div className={`${styles.toast} ${styles[`toast_${type}`]}`} role="status">
      <span>{message}</span>
      <button type="button" className={styles.toastClose} onClick={onClose} aria-label="Закрыть">×</button>
    </div>
  )
}
