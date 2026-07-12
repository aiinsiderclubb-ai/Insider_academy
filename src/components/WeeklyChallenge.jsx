import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentChallenge, CHALLENGE_BADGES } from '../data/challenges'
import { getChallengeSubmission, submitChallenge, listUserChallengeBadges } from '../utils/challengeStorage'
import { useToast } from '../context/ToastContext'
import { UiIcon } from './UiIcon'
import styles from './WeeklyChallenge.module.css'

export function WeeklyChallenge({ lang, email, hasPriority = false }) {
  const ru = lang === 'ru'
  const { showToast } = useToast()
  const challenge = useMemo(() => getCurrentChallenge(), [])
  const existing = email ? getChallengeSubmission(challenge.weekKey, email) : null
  const [text, setText] = useState(existing?.text || '')
  const [submitted, setSubmitted] = useState(Boolean(existing))
  const badges = email ? listUserChallengeBadges(email) : []

  const ends = new Date(challenge.endsAt)
  const daysLeft = Math.max(0, Math.ceil((ends - Date.now()) / 86400000))

  const onSubmit = (e) => {
    e.preventDefault()
    if (!email) {
      showToast(ru ? 'Войдите, чтобы сдать челлендж' : 'Log in to submit', 'info')
      return
    }
    if (text.trim().length < 40) {
      showToast(ru ? 'Напишите чуть подробнее (от 40 символов)' : 'Please write a bit more (40+ chars)', 'error')
      return
    }
    submitChallenge({
      weekKey: challenge.weekKey,
      challengeId: challenge.badgeId,
      email,
      text,
      priority: hasPriority,
    })
    setSubmitted(true)
    showToast(
      hasPriority
        ? (ru ? 'Сдано! Club/Pro — приоритетный разбор' : 'Submitted! Club/Pro — priority review')
        : (ru ? 'Челлендж сдан — бейдж открыт' : 'Challenge submitted — badge unlocked'),
      'success',
      5000
    )
  }

  return (
    <section id="challenge" className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.pill}>{ru ? 'Челлендж недели' : 'Weekly challenge'}</span>
        {hasPriority && (
          <span className={styles.priority}>
            {ru ? 'Club/Pro · приоритетный разбор' : 'Club/Pro · priority review'}
          </span>
        )}
      </div>

      <div className={styles.card}>
        <span className={styles.icon} aria-hidden>
          <UiIcon name={challenge.icon} size={28} tone="accent" />
        </span>
        <div className={styles.body}>
          <h2 className={styles.title}>{ru ? challenge.titleRu : challenge.titleEn}</h2>
          <p className={styles.desc}>{ru ? challenge.descRu : challenge.descEn}</p>
          <p className={styles.meta}>
            {ru ? `До конца недели: ${daysLeft} дн.` : `${daysLeft} days left this week`}
            {' · '}
            <Link to={ru ? challenge.linkRu : challenge.linkEn}>
              {ru ? 'Материалы →' : 'Resources →'}
            </Link>
          </p>

          {!email && (
            <Link to="/login" state={{ from: { pathname: '/cabinet', hash: '#challenge' } }} className={styles.cta}>
              {ru ? 'Войти и участвовать' : 'Log in to join'}
            </Link>
          )}

          {email && !submitted && (
            <form onSubmit={onSubmit} className={styles.form}>
              <label className={styles.label} htmlFor="challenge-text">
                {ru ? 'Ваш отчёт / описание' : 'Your report / description'}
              </label>
              <textarea
                id="challenge-text"
                className={styles.textarea}
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={ru ? 'Что сделали, какой результат…' : 'What you built, what result…'}
              />
              <button type="submit" className={styles.cta}>
                {ru ? 'Сдать челлендж' : 'Submit challenge'}
              </button>
            </form>
          )}

          {email && submitted && (
            <div className={styles.success}>
              <p>
                {ru
                  ? 'Сдано. Бейдж сохранён в кабинете.'
                  : 'Submitted. Badge saved in your cabinet.'}
              </p>
              {hasPriority && (
                <p className={styles.successNote}>
                  {ru
                    ? 'Ваша работа в очереди приоритетного разбора Club/Pro.'
                    : 'Your work is in the Club/Pro priority review queue.'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {badges.length > 0 && (
        <div className={styles.badges}>
          <span className={styles.badgesLabel}>{ru ? 'Ваши бейджи челленджей' : 'Your challenge badges'}</span>
          <div className={styles.badgeRow}>
            {badges.map((id) => {
              const b = CHALLENGE_BADGES[id]
              if (!b) return null
              return (
                <span key={id} className={styles.badge}>
                  <UiIcon name={b.icon} size={14} tone="accent" />
                  {' '}{ru ? b.titleRu : b.titleEn}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
