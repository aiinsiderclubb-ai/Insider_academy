import styles from '../../pages/Admin.module.css'
import { Search, X } from 'lucide-react'

export function AdminSearchBar({ value, onChange, placeholder = 'Поиск по email, названию…' }) {
  return (
    <div className={styles.searchWrap}>
      <span className={styles.searchIcon} aria-hidden><Search size={16} /></span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.searchInput}
      />
      {value && (
        <button type="button" className={styles.searchClear} onClick={() => onChange('')} aria-label="Очистить">
          <X size={15} aria-hidden />
        </button>
      )}
    </div>
  )
}

export function matchesSearch(query, ...fields) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return fields.some((f) => String(f || '').toLowerCase().includes(q))
}
