import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck, ExternalLink, Flag, Inbox, Star } from 'lucide-react'
import styles from '../../pages/Admin.module.css'

function hoursSince(iso) {
  if (!iso) return 0
  return (Date.now() - new Date(iso).getTime()) / 3600000
}

function SlaBadge({ date }) {
  const h = hoursSince(date)
  if (h < 24) return null
  const urgent = h >= 48
  return (
    <span className={urgent ? styles.slaUrgent : styles.slaWarn}>
      {urgent ? '>48ч' : '>24ч'}
    </span>
  )
}

export function AdminInbox({
  homeworkList = [],
  reviewsList = [],
  applications = [],
  onTabChange,
  onOpenReview,
  formatDate,
}) {
  const items = useMemo(() => {
    const hw = homeworkList
      .filter((h) => h.status === 'pending')
      .map((h) => ({
        id: `hw-${h.id}`,
        type: 'homework',
        date: h.date,
        title: h.courseTitle || h.courseId,
        subtitle: `${h.userName || h.email} · урок ${(h.lessonIndex ?? 0) + 1}`,
        raw: h,
      }))
    const rev = reviewsList
      .filter((r) => (r.status || 'pending') === 'pending')
      .map((r) => ({
        id: `rev-${r.id}`,
        type: 'review',
        date: r.date,
        title: r.courseId,
        subtitle: `${r.userName || r.email} · оценка ${r.rating}/5`,
        raw: r,
      }))
    const apps = applications
      .filter((a) => (a.status || 'new') === 'new')
      .map((a) => ({
        id: `app-${a.id}`,
        type: 'accelerator',
        date: a.date,
        title: `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email,
        subtitle: a.email,
        raw: a,
      }))
    return [...hw, ...rev, ...apps].sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [homeworkList, reviewsList, applications])

  const go = (item) => {
    if (item.type === 'homework') onTabChange('homework')
    if (item.type === 'review') {
      onTabChange('reviews')
      onOpenReview?.(item.raw.id)
    }
    if (item.type === 'accelerator') onTabChange('accelerator-selection')
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Очередь модерации</h2>
      <p className={styles.sectionDesc}>
        ДЗ, отзывы и заявки Accelerator в одном списке. Всего в очереди: <strong>{items.length}</strong>
      </p>
      {items.length === 0 ? (
        <p className={styles.emptyState}><Inbox size={18} aria-hidden /> Очередь пуста</p>
      ) : (
        <ul className={styles.inboxList}>
          {items.map((item) => {
            const TypeIcon = item.type === 'homework' ? ClipboardCheck : item.type === 'review' ? Star : Flag
            const typeLabel = item.type === 'homework' ? 'ДЗ' : item.type === 'review' ? 'Отзыв' : 'Отбор'
            return (
              <li key={item.id} className={styles.inboxItem}>
              <div className={styles.inboxMeta}>
                <span className={styles.inboxType}>
                  <TypeIcon size={14} aria-hidden /> {typeLabel}
                </span>
                <SlaBadge date={item.date} />
                <time className={styles.inboxDate}>{formatDate(item.date)}</time>
              </div>
              <strong>{item.title}</strong>
              <span className={styles.inboxSub}>{item.subtitle}</span>
              <div className={styles.inboxActions}>
                <button type="button" className={styles.smallBtn} onClick={() => go(item)}>
                  Открыть
                </button>
                {item.type === 'homework' && item.raw.courseId && (
                  <Link to={`/courses/${item.raw.courseId}`} className={styles.smallBtnGhost} target="_blank" rel="noreferrer">
                    Курс <ExternalLink size={13} aria-hidden />
                  </Link>
                )}
              </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
