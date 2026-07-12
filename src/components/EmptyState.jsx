import { SearchX } from 'lucide-react'
import styles from './EmptyState.module.css'

/**
 * Empty search / filter state — icon + one line + optional reset.
 */
export function EmptyState({
  message,
  actionLabel,
  onAction,
  icon: Icon = SearchX,
}) {
  return (
    <div className={styles.wrap} role="status">
      <span className={styles.icon} aria-hidden>
        <Icon size={28} strokeWidth={1.5} />
      </span>
      <p className={styles.message}>{message}</p>
      {actionLabel && onAction && (
        <button type="button" className={styles.action} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
