import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import {
  getReviewSubmissions,
  updateReviewSubmission,
  deleteReviewSubmission,
} from '../../api/adminStore'
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
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (online) return
    setLocalReviews(getReviewSubmissions())
  }, [online, reviews])

  const list = online ? reviews : localReviews

  const courseTitle = (id) => courses.find((c) => c.id === id)?.title || id

  const filtered = useMemo(() => {
    if (filter === 'all') return list
    return list.filter((r) => (r.status || 'pending') === filter)
  }, [list, filter])

  const setStatus = async (id, status) => {
    const review = list.find((r) => r.id === id)
    if (status === 'approved' && !String(review?.text || '').trim()) {
      showToast('Нельзя опубликовать отзыв без текста — удалите его', 'error')
      return
    }
    setBusyId(id)
    try {
      if (online) {
        await api.adminUpdateReview(id, { status })
      } else {
        updateReviewSubmission(id, { status })
        setLocalReviews(getReviewSubmissions())
      }
      showToast(
        status === 'approved' ? 'Отзыв опубликован на сайте'
          : status === 'rejected' ? 'Отзыв отклонён'
            : 'Статус обновлён'
      )
      onUpdated?.()
    } catch (err) {
      showToast(err.data?.errorRu || err.data?.error || 'Ошибка обновления', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const removeReview = async (id) => {
    if (!window.confirm('Удалить отзыв навсегда?')) return
    setBusyId(id)
    try {
      if (online) {
        await api.adminDeleteReview(id)
      } else {
        deleteReviewSubmission(id)
        setLocalReviews(getReviewSubmissions())
      }
      showToast('Отзыв удалён')
      onUpdated?.()
    } catch {
      showToast('Ошибка удаления', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <p className={styles.sectionDesc}>
        Новые отзывы попадают в «На модерации». После «Опубликовать» они появляются на странице курса в блоке «Отзывы студентов».
      </p>

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
          {filtered.map((r) => {
            const emptyText = !String(r.text || '').trim()
            const disabled = busyId === r.id
            return (
              <article key={r.id} className={styles.reviewAdminCard}>
                <div className={styles.reviewAdminHead}>
                  <div>
                    <strong>{r.userName || 'Студент'}</strong>
                    <span className={styles.reviewAdminCourse}>{courseTitle(r.courseId)}</span>
                  </div>
                  <span className={styles.reviewAdminStars}>{'★'.repeat(Number(r.rating) || 0)}</span>
                </div>
                <p className={styles.reviewAdminText}>
                  {emptyText ? <em style={{ opacity: 0.6 }}>Текст отсутствует — опубликовать нельзя</em> : r.text}
                </p>
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
                    <button
                      type="button"
                      className={styles.approveBtn}
                      disabled={disabled || emptyText}
                      onClick={() => setStatus(r.id, 'approved')}
                    >
                      Опубликовать
                    </button>
                  )}
                  {(r.status || 'pending') !== 'rejected' && (
                    <button
                      type="button"
                      className={styles.rejectBtn}
                      disabled={disabled}
                      onClick={() => setStatus(r.id, 'rejected')}
                    >
                      Отклонить
                    </button>
                  )}
                  {(r.status || 'pending') !== 'pending' && (
                    <button
                      type="button"
                      className={styles.inlineBtn}
                      disabled={disabled}
                      onClick={() => setStatus(r.id, 'pending')}
                    >
                      В модерацию
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.smallBtnDanger}
                    disabled={disabled}
                    onClick={() => removeReview(r.id)}
                  >
                    Удалить
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
