import { useMemo, useState } from 'react'
import { api } from '../../api/client'
import { getReviewSubmissions, updateReviewSubmission } from '../../api/adminStore'
import styles from '../../pages/Admin.module.css'

const STATUS_LABELS = {
  pending: 'На модерации',
  approved: 'Опубликован',
  rejected: 'Отклонён',
}

export function AdminReviewsPanel({
  reviews = [],
  online,
  courses = [],
  onUpdated,
  showToast,
}) {
  const [filter, setFilter] = useState('pending')
  const [localReviews, setLocalReviews] = useState(() => (online ? [] : getReviewSubmissions()))

  const list = online ? reviews : localReviews

  const courseTitle = (id) => courses.find((c) => c.id === id)?.title || id

  const filtered = useMemo(() => {
    if (filter === 'all') return list
    return list.filter((r) => (r.status || 'pending') === filter)
  }, [list, filter])

  const setStatus = async (id, status) => {
    try {
      if (online) {
        await api.adminUpdateReview(id, { status })
      } else {
        updateReviewSubmission(id, { status })
        setLocalReviews(getReviewSubmissions())
      }
      showToast(status === 'approved' ? 'Отзыв опубликован' : status === 'rejected' ? 'Отзыв отклонён' : 'Статус обновлён')
      onUpdated?.()
    } catch {
      showToast('Ошибка обновления', 'error')
    }
  }

  return (
    <div>
      <div className={styles.filterRow}>
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button
            key={f}
            type="button"
            className={`${styles.filterChip} ${filter === f ? styles.filterChipActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Все' : STATUS_LABELS[f]}
            {' '}
            ({f === 'all' ? list.length : list.filter((r) => (r.status || 'pending') === f).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className={styles.emptyState}>Нет отзывов в этой категории</p>
      ) : (
        <div className={styles.reviewGrid}>
          {filtered.map((r) => (
            <article key={r.id} className={styles.reviewAdminCard}>
              <div className={styles.reviewAdminHead}>
                <div>
                  <strong>{r.userName || 'Студент'}</strong>
                  <span className={styles.reviewAdminCourse}>{courseTitle(r.courseId)}</span>
                </div>
                <span className={styles.reviewAdminStars}>{'★'.repeat(r.rating)}</span>
              </div>
              <p className={styles.reviewAdminText}>{r.text}</p>
              <div className={styles.reviewAdminMeta}>
                <span>{new Date(r.date).toLocaleString('ru-RU')}</span>
                <span className={`${styles.statusPill} ${styles[`status_${r.status || 'pending'}`]}`}>
                  {STATUS_LABELS[r.status || 'pending']}
                </span>
              </div>
              <div className={styles.reviewAdminContact}>
                <a href={`mailto:${r.contactEmail || r.email}`} className={styles.mailLink}>
                  ✉ {r.contactEmail || r.email}
                </a>
                <span className={styles.reviewAdminHint}>Полный email — только в админке</span>
              </div>
              <div className={styles.reviewAdminActions}>
                {(r.status || 'pending') !== 'approved' && (
                  <button type="button" className={styles.approveBtn} onClick={() => setStatus(r.id, 'approved')}>
                    Опубликовать
                  </button>
                )}
                {(r.status || 'pending') !== 'rejected' && (
                  <button type="button" className={styles.rejectBtn} onClick={() => setStatus(r.id, 'rejected')}>
                    Отклонить
                  </button>
                )}
                {(r.status || 'pending') !== 'pending' && (
                  <button type="button" className={styles.inlineBtn} onClick={() => setStatus(r.id, 'pending')}>
                    В модерацию
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
