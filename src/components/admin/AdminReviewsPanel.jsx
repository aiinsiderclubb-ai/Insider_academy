import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Star } from 'lucide-react'
import { api } from '../../api/client'
import {
  getReviewSubmissions,
  updateReviewSubmission,
  deleteReviewSubmission,
} from '../../api/adminStore'
import { getCourseById, getCourseField } from '../../data/courses'
import styles from '../../pages/Admin.module.css'

const STATUS_LABELS = {
  pending: 'На модерации',
  approved: 'Опубликован',
  rejected: 'Отклонён',
}

function resolveCourse(courseId, courses) {
  const fromApi = courses.find((c) => c.id === courseId)
  const course = fromApi || getCourseById(courseId)
  if (!course) {
    return { id: courseId, title: courseId, slug: courseId }
  }
  return {
    id: courseId,
    title: getCourseField(course, 'title', 'ru'),
    slug: course.slug || courseId,
  }
}

export function AdminReviewsPanel({
  reviews = [],
  online: useApi = false,
  courses = [],
  onUpdated,
  showToast,
}) {
  const [filter, setFilter] = useState('pending')
  const [localReviews, setLocalReviews] = useState(() => (useApi ? [] : getReviewSubmissions()))
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (useApi) return
    setLocalReviews(getReviewSubmissions())
  }, [useApi, reviews])

  const sourceList = useApi ? reviews : localReviews

  const filtered = useMemo(() => {
    if (filter === 'all') return sourceList
    return sourceList.filter((r) => (r.status || 'pending') === filter)
  }, [sourceList, filter])

  const applyLocalList = (updater) => {
    if (useApi) return
    const next = typeof updater === 'function' ? updater(getReviewSubmissions()) : updater
    setLocalReviews(next)
  }

  const setStatus = async (id, status) => {
    if (!id) {
      showToast('Ошибка: у отзыва нет идентификатора', 'error')
      return
    }
    const review = sourceList.find((r) => r.id === id)
    if (!review) {
      showToast('Отзыв не найден — обновите страницу', 'error')
      return
    }
    if (status === 'approved' && !String(review?.text || '').trim()) {
      showToast('Нельзя опубликовать отзыв без текста — отклоните или удалите', 'error')
      return
    }
    setBusyId(id)
    try {
      if (useApi) {
        await api.adminUpdateReview(id, { status })
      } else {
        const updated = updateReviewSubmission(id, { status })
        if (!updated) throw new Error('not found')
        applyLocalList(getReviewSubmissions())
      }
      showToast(
        status === 'approved' ? 'Отзыв опубликован на сайте и главной'
          : status === 'rejected' ? 'Отзыв отклонён'
            : 'Статус обновлён'
      )
      await onUpdated?.()
    } catch (err) {
      const msg = err?.data?.errorRu || err?.data?.error || err?.message || 'Ошибка обновления'
      showToast(err?.network ? 'Нет связи с API — проверьте сервер' : msg, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const removeReview = async (id) => {
    if (!id) {
      showToast('Ошибка: у отзыва нет идентификатора', 'error')
      return
    }
    if (!window.confirm('Удалить отзыв навсегда?')) return
    setBusyId(id)
    try {
      if (useApi) {
        await api.adminDeleteReview(id)
      } else {
        const ok = deleteReviewSubmission(id)
        if (!ok) throw new Error('not found')
        applyLocalList(getReviewSubmissions())
      }
      showToast('Отзыв удалён')
      await onUpdated?.()
    } catch (err) {
      const msg = err?.data?.errorRu || err?.data?.error || err?.message || 'Ошибка удаления'
      showToast(err?.network ? 'Нет связи с API — проверьте сервер' : msg, 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <p className={styles.sectionDesc}>
        Новые отзывы попадают в «На модерации». После «Опубликовать» они появляются на странице курса и в блоке «Что говорят студенты» на главной.
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
            ({f === 'all' ? sourceList.length : sourceList.filter((r) => (r.status || 'pending') === f).length})
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
            const course = resolveCourse(r.courseId, courses)
            return (
              <article key={r.id} className={styles.reviewAdminCard}>
                <div className={styles.reviewCourseBlock}>
                  <span className={styles.reviewCourseLabel}>Курс</span>
                  <div className={styles.reviewCourseInfo}>
                    <strong className={styles.reviewCourseTitle}>{course.title}</strong>
                    <Link
                      to={`/courses/${course.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.reviewCourseLink}
                    >
                      /courses/{course.slug}
                    </Link>
                    {course.title !== course.id && (
                      <span className={styles.reviewCourseId}>ID: {course.id}</span>
                    )}
                  </div>
                </div>

                <div className={styles.reviewAdminHead}>
                  <div>
                    <strong>{r.userName || 'Студент'}</strong>
                    {r.personalId && <span className={styles.reviewAdminCourse}>ID: {r.personalId}</span>}
                    <span className={styles.reviewAdminCourse}>{r.contactEmail || r.email}</span>
                  </div>
                  <span className={styles.reviewAdminStars}><Star size={15} aria-hidden /> {Number(r.rating) || 0}/5</span>
                </div>
                <p className={styles.reviewAdminText}>
                  {emptyText ? (
                    <em className={styles.reviewEmptyHint}>
                      Текст отсутствует — «Опубликовать» недоступно. Используйте «Отклонить» или «Удалить».
                    </em>
                  ) : r.text}
                </p>
                <div className={styles.reviewAdminMeta}>
                  <span>{new Date(r.date).toLocaleString('ru-RU')}</span>
                  <span className={`${styles.statusPill} ${styles[`status_${r.status || 'pending'}`]}`}>
                    {STATUS_LABELS[r.status || 'pending']}
                  </span>
                </div>
                <div className={styles.reviewAdminContact}>
                  <a href={`mailto:${r.contactEmail || r.email}`} className={styles.mailLink}>
                    <Mail size={14} aria-hidden /> {r.contactEmail || r.email}
                  </a>
                  <span className={styles.reviewAdminHint}>Полный email — только в админке</span>
                </div>
                <div className={styles.reviewAdminActions}>
                  {(r.status || 'pending') !== 'approved' && (
                    <button
                      type="button"
                      className={styles.approveBtn}
                      disabled={disabled || emptyText}
                      title={emptyText ? 'Нужен текст отзыва' : 'Опубликовать на сайте'}
                      aria-disabled={disabled || emptyText}
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
