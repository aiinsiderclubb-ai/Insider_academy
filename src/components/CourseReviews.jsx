import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { api, checkApiOnline, canUseAuthenticatedApi } from '../api/client'
import { getPublicReviews, recordReviewSubmission } from '../api/adminStore'
import { maskEmail } from '../utils/maskEmail'
import styles from './CourseReviews.module.css'

function StarPicker({ value, onChange, lang }) {
  return (
    <div className={styles.starsPick} role="group" aria-label={lang === 'ru' ? 'Оценка' : 'Rating'}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`${styles.starBtn} ${n <= value ? styles.starBtnActive : ''}`}
          onClick={() => onChange(n)}
          aria-label={`${n}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function formatDate(iso, lang) {
  try {
    return new Date(iso).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export function CourseReviews({ courseId, courseTitle }) {
  const { user, canReviewCourse, purchases } = useAuth()
  const { lang } = useLanguage()
  const [tab, setTab] = useState('published')
  const [data, setData] = useState({ reviews: [], average: null, count: 0 })
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [userName, setUserName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    try {
      if (await checkApiOnline()) {
        setData(await api.getReviews(courseId))
      } else {
        setData(getPublicReviews(courseId))
      }
    } catch (_) {
      setData(getPublicReviews(courseId))
    }
  }

  useEffect(() => {
    load()
  }, [courseId])

  useEffect(() => {
    if (user?.email) setContactEmail((prev) => prev || user.email)
    if (user?.name) setUserName((prev) => prev || user.name)
  }, [user])

  const canReview = canReviewCourse(courseId)

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')
    if (!user) {
      setMsg(lang === 'ru' ? 'Войдите, чтобы оставить отзыв' : 'Log in to leave a review')
      return
    }
    if (!canReview) {
      setMsg(lang === 'ru' ? 'Отзыв доступен только после покупки этого курса' : 'You can review only after purchasing this course')
      return
    }
    if (!text.trim()) {
      setMsg(lang === 'ru' ? 'Напишите текст отзыва' : 'Please write your review')
      return
    }
    if (!contactEmail.includes('@')) {
      setMsg(lang === 'ru' ? 'Укажите email для связи' : 'Enter a contact email')
      return
    }
    setSubmitting(true)
    try {
      if (await canUseAuthenticatedApi()) {
        await api.postReview(courseId, {
          rating: Number(rating),
          text: text.trim(),
          contactEmail,
          userName,
        })
      } else {
        recordReviewSubmission({
          courseId,
          email: user.email,
          contactEmail,
          userName,
          rating: Number(rating),
          text: text.trim(),
          userId: user.email,
          purchases,
        })
      }
      setText('')
      setTab('published')
      setMsg(lang === 'ru' ? 'Отзыв отправлен на модерацию. После одобрения он появится на сайте.' : 'Review submitted for moderation. It will appear after approval.')
      load()
    } catch (err) {
      const apiMsg = lang === 'ru' ? err.data?.errorRu : err.data?.error
      setMsg(apiMsg || err.message || (lang === 'ru' ? 'Ошибка отправки' : 'Submit error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={styles.wrap} id="course-reviews">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{lang === 'ru' ? 'Отзывы студентов' : 'Student reviews'}</h2>
          {courseTitle && <p className={styles.courseLabel}>{courseTitle}</p>}
        </div>
        {data.count > 0 && data.average != null && (
          <div className={styles.scoreCard}>
            <span className={styles.scoreValue}>{data.average}</span>
            <span className={styles.scoreStars}>{'★'.repeat(Math.round(data.average))}</span>
            <span className={styles.scoreCount}>{data.count} {lang === 'ru' ? 'отзывов' : 'reviews'}</span>
          </div>
        )}
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'published' ? styles.tabActive : ''}`}
          onClick={() => setTab('published')}
        >
          {lang === 'ru' ? 'На сайте' : 'Published'} ({data.count})
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'write' ? styles.tabActive : ''}`}
          onClick={() => setTab('write')}
        >
          {lang === 'ru' ? 'Оставить отзыв' : 'Write a review'}
        </button>
      </div>

      {tab === 'published' && (
        <div className={styles.published}>
          {data.reviews.length === 0 ? (
            <p className={styles.empty}>
              {lang === 'ru' ? 'Пока нет опубликованных отзывов. Будьте первым!' : 'No published reviews yet. Be the first!'}
            </p>
          ) : (
            <ul className={styles.list}>
              {data.reviews.map((r) => (
                <li key={r.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.avatar}>{(r.userName || 'U')[0].toUpperCase()}</div>
                    <div className={styles.cardMeta}>
                      <strong className={styles.author}>{r.userName || (lang === 'ru' ? 'Студент' : 'Student')}</strong>
                      {r.emailMasked && (
                        <span className={styles.emailMasked} title={lang === 'ru' ? 'Email частично скрыт' : 'Email partially hidden'}>
                          {r.emailMasked}
                        </span>
                      )}
                      <span className={styles.cardDate}>{formatDate(r.date, lang)}</span>
                    </div>
                    <span className={styles.cardStars} aria-label={`${r.rating}/5`}>
                      {'★'.repeat(r.rating)}
                      <span className={styles.cardStarsDim}>{'★'.repeat(5 - r.rating)}</span>
                    </span>
                  </div>
                  <p className={styles.cardText}>{r.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'write' && (
        <form className={styles.form} onSubmit={submit}>
          {!user ? (
            <p className={styles.loginHint}>
              {lang === 'ru' ? 'Чтобы оставить отзыв, ' : 'To leave a review, '}
              <Link to="/login">{lang === 'ru' ? 'войдите в аккаунт' : 'sign in'}</Link>
            </p>
          ) : !canReview ? (
            <p className={styles.loginHint}>
              {lang === 'ru'
                ? 'Отзыв могут оставить только те, кто купил этот курс. '
                : 'Only students who purchased this course can leave a review. '}
              <Link to="/courses">{lang === 'ru' ? 'К каталогу' : 'Browse courses'}</Link>
            </p>
          ) : (
            <>
              <p className={styles.formNote}>
                {lang === 'ru'
                  ? 'Отзыв проходит модерацию. Email виден только администратору; на сайте он отображается частично.'
                  : 'Reviews are moderated. Email is visible to admins only; on the site it is partially masked.'}
              </p>
              <label className={styles.field}>
                <span>{lang === 'ru' ? 'Ваше имя' : 'Your name'}</span>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={lang === 'ru' ? 'Как показать на сайте' : 'Display name'}
                />
              </label>
              <label className={styles.field}>
                <span>{lang === 'ru' ? 'Email для связи' : 'Contact email'}</span>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
                <span className={styles.fieldHint}>
                  {lang === 'ru' ? 'На сайте: ' : 'On site: '}{maskEmail(contactEmail) || '—'}
                </span>
              </label>
              <div className={styles.field}>
                <span>{lang === 'ru' ? 'Оценка' : 'Rating'}</span>
                <StarPicker value={rating} onChange={setRating} lang={lang} />
              </div>
              <label className={styles.field}>
                <span>{lang === 'ru' ? 'Отзыв' : 'Review'}</span>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={lang === 'ru' ? 'Что понравилось, что помогло, рекомендуете ли курс…' : 'What helped, would you recommend…'}
                  rows={4}
                  required
                />
              </label>
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting
                  ? (lang === 'ru' ? 'Отправка…' : 'Sending…')
                  : (lang === 'ru' ? 'Отправить на модерацию' : 'Submit for review')}
              </button>
            </>
          )}
          {msg && <p className={styles.msg}>{msg}</p>}
        </form>
      )}
    </section>
  )
}
