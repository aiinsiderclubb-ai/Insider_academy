import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { api, checkApiOnline } from '../api/client'
import styles from './CourseReviews.module.css'

export function CourseReviews({ courseId }) {
  const { user, apiMode } = useAuth()
  const { lang } = useLanguage()
  const [data, setData] = useState({ reviews: [], average: null, count: 0 })
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        if (await checkApiOnline()) setData(await api.getReviews(courseId))
      } catch (_) {}
    }
    load()
  }, [courseId])

  const submit = async (e) => {
    e.preventDefault()
    if (!user) return setMsg(lang === 'ru' ? 'Войдите, чтобы оставить отзыв' : 'Log in to review')
    try {
      if (apiMode || await checkApiOnline()) {
        await api.postReview(courseId, { rating, text })
        setData(await api.getReviews(courseId))
        setText('')
        setMsg(lang === 'ru' ? 'Спасибо за отзыв!' : 'Thanks for your review!')
      }
    } catch {
      setMsg(lang === 'ru' ? 'Ошибка отправки' : 'Submit error')
    }
  }

  return (
    <section className={styles.wrap}>
      <h2 className={styles.title}>{lang === 'ru' ? 'Отзывы' : 'Reviews'}</h2>
      {data.average != null && (
        <p className={styles.avg}>★ {data.average} · {data.count} {lang === 'ru' ? 'отзывов' : 'reviews'}</p>
      )}
      <ul className={styles.list}>
        {data.reviews.map((r) => (
          <li key={r.id} className={styles.item}>
            <span className={styles.stars}>{'★'.repeat(r.rating)}</span>
            <strong>{r.userName || 'User'}</strong>
            <p>{r.text}</p>
          </li>
        ))}
      </ul>
      <form className={styles.form} onSubmit={submit}>
        <label>{lang === 'ru' ? 'Оценка' : 'Rating'}
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={lang === 'ru' ? 'Ваш отзыв…' : 'Your review…'} rows={3} />
        <button type="submit">{lang === 'ru' ? 'Отправить' : 'Submit'}</button>
        {msg && <p className={styles.msg}>{msg}</p>}
      </form>
    </section>
  )
}
