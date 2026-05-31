import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../context/ApiContext'
import { useCourses } from '../context/CoursesContext'
import { api } from '../api/client'
import { recordAcceleratorApplication } from '../api/adminStore'
import { ACCELERATOR_ID } from '../data/courseCatalog'
import {
  ACTIVITY_OPTIONS,
  AI_EXPERIENCE_OPTIONS,
  INTEREST_OPTIONS,
  SOURCE_OPTIONS,
} from '../data/acceleratorApplication'
import styles from './AcceleratorApply.module.css'

const emptyForm = {
  firstName: '',
  lastName: '',
  age: '',
  country: '',
  telegram: '',
  email: '',
  currentActivity: '',
  aiExperience: '',
  interests: [],
  source: '',
  motivation: '',
  futureGoal: '',
}

export function AcceleratorApply() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const { online } = useApi()
  const { getCourseById } = useCourses()
  const course = getCourseById(ACCELERATOR_ID)
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    email: user?.email || '',
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
  }))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!course) return <Navigate to="/courses" replace />

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const toggleInterest = (id) => {
    setForm((prev) => {
      let next = prev.interests.includes(id)
        ? prev.interests.filter((x) => x !== id)
        : [...prev.interests, id]
      if (id === 'undecided') next = ['undecided']
      else next = next.filter((x) => x !== 'undecided')
      return { ...prev, interests: next }
    })
  }

  const wordCount = form.motivation.trim().split(/\s+/).filter(Boolean).length

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        interests: form.interests,
      }
      if (online) {
        await api.submitAcceleratorApplication(payload)
      } else {
        recordAcceleratorApplication(payload)
      }
      setSuccess(true)
    } catch (err) {
      setError(err.data?.error || err.message || (lang === 'ru' ? 'Ошибка отправки' : 'Submit failed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className={styles.wrap}>
        <div className={styles.container}>
          <div className={styles.successCard}>
            <span className={styles.successIcon} aria-hidden>✓</span>
            <h1>{lang === 'ru' ? 'Заявка отправлена!' : 'Application submitted!'}</h1>
            <p>
              {lang === 'ru'
                ? 'Менторы AI Insider Academy рассмотрят анкету и свяжутся с вами по email или Telegram.'
                : 'AI Insider Academy mentors will review your application and contact you via email or Telegram.'}
            </p>
            <Link to={`/courses/${course.slug}`} className={styles.backBtn}>
              {lang === 'ru' ? 'К странице программы' : 'Back to program page'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <Link to={`/courses/${course.slug}`} className={styles.backLink}>
          ← {lang === 'ru' ? 'AI Insider Accelerator' : 'AI Insider Accelerator'}
        </Link>

        <header className={styles.hero}>
          <span className={styles.badge}>{lang === 'ru' ? 'Заявка на участие' : 'Application'}</span>
          <h1 className={styles.title}>AI Insider Accelerator</h1>
          <p className={styles.lead}>
            {lang === 'ru'
              ? 'Бесплатная отборочная программа, которая поможет познакомиться со всеми направлениями AI и выбрать свою специализацию.'
              : 'A free selection program to explore all AI tracks and choose your specialization.'}
          </p>
          <p className={styles.note}>
            {lang === 'ru' ? 'Заполнение анкеты займёт 5–10 минут.' : 'The form takes about 5–10 minutes.'}
          </p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error} role="alert">{error}</div>}

          <section className={styles.section}>
            <h2>{lang === 'ru' ? '1. Расскажите немного о себе' : '1. About you'}</h2>
            <div className={styles.grid2}>
              <label className={styles.field}>
                <span>{lang === 'ru' ? 'Имя' : 'First name'} *</span>
                <input required value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>{lang === 'ru' ? 'Фамилия' : 'Last name'} *</span>
                <input required value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>{lang === 'ru' ? 'Возраст' : 'Age'} *</span>
                <input type="number" min="14" max="100" required value={form.age} onChange={(e) => setField('age', e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>{lang === 'ru' ? 'Страна проживания' : 'Country'} *</span>
                <input required value={form.country} onChange={(e) => setField('country', e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Telegram *</span>
                <input required placeholder="@username" value={form.telegram} onChange={(e) => setField('telegram', e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Email *</span>
                <input type="email" required value={form.email} onChange={(e) => setField('email', e.target.value)} />
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <h2>{lang === 'ru' ? '2. Чем вы сейчас занимаетесь?' : '2. What do you do now?'}</h2>
            <div className={styles.radioGroup}>
              {ACTIVITY_OPTIONS.map((opt) => (
                <label key={opt.id} className={styles.radio}>
                  <input
                    type="radio"
                    name="activity"
                    required
                    checked={form.currentActivity === opt.id}
                    onChange={() => setField('currentActivity', opt.id)}
                  />
                  <span>{lang === 'en' ? opt.en : opt.ru}</span>
                </label>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2>{lang === 'ru' ? '3. Есть ли у вас опыт работы с AI?' : '3. Your AI experience'}</h2>
            <div className={styles.radioGroup}>
              {AI_EXPERIENCE_OPTIONS.map((opt) => (
                <label key={opt.id} className={styles.radio}>
                  <input
                    type="radio"
                    name="aiExperience"
                    required
                    checked={form.aiExperience === opt.id}
                    onChange={() => setField('aiExperience', opt.id)}
                  />
                  <span>{lang === 'en' ? opt.en : opt.ru}</span>
                </label>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2>{lang === 'ru' ? '4. Какое направление вам интересно?' : '4. Tracks of interest'}</h2>
            <p className={styles.hint}>{lang === 'ru' ? 'Можно выбрать несколько вариантов.' : 'You can select multiple options.'}</p>
            <div className={styles.checkGroup}>
              {INTEREST_OPTIONS.map((opt) => (
                <label key={opt.id} className={styles.check}>
                  <input
                    type="checkbox"
                    checked={form.interests.includes(opt.id)}
                    onChange={() => toggleInterest(opt.id)}
                  />
                  <span>{lang === 'en' ? opt.en : opt.ru}</span>
                </label>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2>{lang === 'ru' ? '5. Откуда вы узнали об AI Insider Academy?' : '5. How did you hear about us?'}</h2>
            <div className={styles.radioGroup}>
              {SOURCE_OPTIONS.map((opt) => (
                <label key={opt.id} className={styles.radio}>
                  <input
                    type="radio"
                    name="source"
                    required
                    checked={form.source === opt.id}
                    onChange={() => setField('source', opt.id)}
                  />
                  <span>{lang === 'en' ? opt.en : opt.ru}</span>
                </label>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2>{lang === 'ru' ? 'Мотивационное письмо' : 'Motivation letter'}</h2>
            <p className={styles.hint}>
              {lang === 'ru'
                ? 'Почему вы хотите попасть в AI Insider Accelerator? Расскажите, почему вас заинтересовал AI, чего хотите достичь, почему сейчас, что будете делать после программы и почему мы должны выбрать вас. Рекомендуемый объём: 150–300 слов.'
                : 'Why do you want to join? Cover your AI interest, goals, timing, plans after the program, and why we should choose you. Recommended: 150–300 words.'}
            </p>
            <textarea
              required
              rows={8}
              value={form.motivation}
              onChange={(e) => setField('motivation', e.target.value)}
              className={styles.textarea}
            />
            <span className={styles.wordCount}>{wordCount} {lang === 'ru' ? 'слов' : 'words'}</span>
          </section>

          <section className={styles.section}>
            <h2>{lang === 'ru' ? 'Финальный вопрос' : 'Final question'}</h2>
            <p className={styles.hint}>
              {lang === 'ru'
                ? 'Представьте, что прошло 12 месяцев. Какой результат вы хотите получить благодаря AI? Напишите максимально конкретно.'
                : 'Imagine 12 months have passed. What concrete result do you want from AI?'}
            </p>
            <textarea
              required
              rows={5}
              value={form.futureGoal}
              onChange={(e) => setField('futureGoal', e.target.value)}
              className={styles.textarea}
            />
          </section>

          <button type="submit" className={styles.submitBtn} disabled={submitting || form.interests.length === 0}>
            {submitting
              ? (lang === 'ru' ? 'Отправка…' : 'Submitting…')
              : (lang === 'ru' ? 'Отправить заявку' : 'Submit application')}
          </button>
        </form>
      </div>
    </div>
  )
}
