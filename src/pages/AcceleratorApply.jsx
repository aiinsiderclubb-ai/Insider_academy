import { useMemo, useState } from 'react'
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

const TOTAL_STEPS = 7

function SectionHead({ num, title, hint }) {
  return (
    <div className={styles.sectionHead}>
      <span className={styles.sectionNum}>{num}</span>
      <div>
        <h2>{title}</h2>
        {hint && <p className={styles.hint}>{hint}</p>}
      </div>
    </div>
  )
}

function calcProgress(form) {
  let done = 0
  if (form.firstName && form.lastName && form.age && form.country && form.telegram && form.email) done++
  if (form.currentActivity) done++
  if (form.aiExperience) done++
  if (form.interests.length > 0) done++
  if (form.source) done++
  if (form.motivation.trim().length > 30) done++
  if (form.futureGoal.trim().length > 10) done++
  return Math.round((done / TOTAL_STEPS) * 100)
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

  const wordCount = useMemo(
    () => form.motivation.trim().split(/\s+/).filter(Boolean).length,
    [form.motivation]
  )
  const progress = useMemo(() => calcProgress(form), [form])
  const wordCountClass = wordCount >= 150 && wordCount <= 300
    ? styles.wordCountGood
    : wordCount > 0 && wordCount < 150
      ? styles.wordCountWarn
      : ''

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
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.data?.error || err.message || (lang === 'ru' ? 'Ошибка отправки' : 'Submit failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const bg = (
    <div className={styles.bg} aria-hidden>
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />
      <div className={styles.gridOverlay} />
    </div>
  )

  if (success) {
    return (
      <div className={styles.successWrap}>
        {bg}
        <div className={styles.successCard}>
          <span className={styles.successIcon} aria-hidden>✓</span>
          <h1>{lang === 'ru' ? 'Заявка отправлена!' : 'Application submitted!'}</h1>
          <p>
            {lang === 'ru'
              ? 'Менторы AI Insider Academy рассмотрят анкету и свяжутся с вами по email или Telegram.'
              : 'AI Insider Academy mentors will review your application and contact you via email or Telegram.'}
          </p>
          <Link to={`/courses/${course.slug}`} className={styles.backBtn}>
            {lang === 'ru' ? '← К странице программы' : '← Back to program'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      {bg}
      <div className={styles.container}>
        <Link to={`/courses/${course.slug}`} className={styles.backLink}>
          ← {lang === 'ru' ? 'AI Insider Accelerator' : 'AI Insider Accelerator'}
        </Link>

        <header className={styles.hero}>
          <div className={styles.heroTop}>
            <span className={styles.badge}>
              {lang === 'ru' ? 'Заявка на участие' : 'Apply now'}
            </span>
            <span className={styles.heroPill}>{lang === 'ru' ? 'Бесплатно' : 'Free'}</span>
            <span className={styles.heroPill}>5–10 min</span>
          </div>
          <h1 className={styles.title}>AI Insider Accelerator</h1>
          <p className={styles.lead}>
            {lang === 'ru'
              ? 'Бесплатная отборочная программа, которая поможет познакомиться со всеми направлениями AI и выбрать свою специализацию.'
              : 'A free selection program to explore all AI tracks and choose your specialization.'}
          </p>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span>🎯</span>
              <span>{lang === 'ru' ? <>Отбор в <strong>Accelerator</strong></> : <>Join the <strong>Accelerator</strong></>}</span>
            </div>
            <div className={styles.stat}>
              <span>⚡</span>
              <span>{lang === 'ru' ? <>Ответ в <strong>3–5 дней</strong></> : <>Reply in <strong>3–5 days</strong></>}</span>
            </div>
            <div className={styles.stat}>
              <span>🚀</span>
              <span>{lang === 'ru' ? <strong>7 направлений</strong> : <strong>7 AI tracks</strong>}</span>
            </div>
          </div>
        </header>

        <div className={styles.progressWrap}>
          <div className={styles.progressHead}>
            <span>{lang === 'ru' ? 'Прогресс анкеты' : 'Form progress'}</span>
            <strong>{progress}%</strong>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error} role="alert">{error}</div>}

          <section className={styles.section}>
            <SectionHead
              num="1"
              title={lang === 'ru' ? 'Расскажите немного о себе' : 'About you'}
            />
            <div className={styles.grid2}>
              <label className={styles.field}>
                <span>{lang === 'ru' ? 'Имя' : 'First name'} *</span>
                <input required value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} placeholder={lang === 'ru' ? 'Иван' : 'John'} />
              </label>
              <label className={styles.field}>
                <span>{lang === 'ru' ? 'Фамилия' : 'Last name'} *</span>
                <input required value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} placeholder={lang === 'ru' ? 'Иванов' : 'Doe'} />
              </label>
              <label className={styles.field}>
                <span>{lang === 'ru' ? 'Возраст' : 'Age'} *</span>
                <input type="number" min="14" max="100" required value={form.age} onChange={(e) => setField('age', e.target.value)} placeholder="25" />
              </label>
              <label className={styles.field}>
                <span>{lang === 'ru' ? 'Страна проживания' : 'Country'} *</span>
                <input required value={form.country} onChange={(e) => setField('country', e.target.value)} placeholder={lang === 'ru' ? 'Украина' : 'Ukraine'} />
              </label>
              <label className={styles.field}>
                <span>Telegram *</span>
                <input required placeholder="@username" value={form.telegram} onChange={(e) => setField('telegram', e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Email *</span>
                <input type="email" required value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="you@email.com" />
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <SectionHead
              num="2"
              title={lang === 'ru' ? 'Чем вы сейчас занимаетесь?' : 'What do you do now?'}
            />
            <div className={styles.chipGrid}>
              {ACTIVITY_OPTIONS.map((opt) => (
                <label key={opt.id} className={styles.chip}>
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
            <SectionHead
              num="3"
              title={lang === 'ru' ? 'Есть ли у вас опыт работы с AI?' : 'Your AI experience'}
            />
            <div className={styles.chipGridWide}>
              {AI_EXPERIENCE_OPTIONS.map((opt) => (
                <label key={opt.id} className={styles.chip}>
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
            <SectionHead
              num="4"
              title={lang === 'ru' ? 'Какое направление вам интересно?' : 'Tracks of interest'}
              hint={lang === 'ru' ? 'Можно выбрать несколько вариантов.' : 'You can select multiple options.'}
            />
            <div className={styles.chipGridWide}>
              {INTEREST_OPTIONS.map((opt) => (
                <label key={opt.id} className={styles.chip}>
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
            <SectionHead
              num="5"
              title={lang === 'ru' ? 'Откуда вы узнали об AI Insider Academy?' : 'How did you hear about us?'}
            />
            <div className={styles.chipGrid}>
              {SOURCE_OPTIONS.map((opt) => (
                <label key={opt.id} className={styles.chip}>
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
            <SectionHead
              num="✦"
              title={lang === 'ru' ? 'Мотивационное письмо' : 'Motivation letter'}
              hint={lang === 'ru'
                ? 'Почему вы хотите попасть в Accelerator? Расскажите о целях, мотивации и почему мы должны выбрать вас.'
                : 'Why do you want to join? Share your goals, motivation, and why we should choose you.'}
            />
            <textarea
              required
              rows={8}
              value={form.motivation}
              onChange={(e) => setField('motivation', e.target.value)}
              className={styles.textarea}
              placeholder={lang === 'ru'
                ? 'Почему вас заинтересовал AI, чего хотите достичь, почему именно сейчас…'
                : 'Why AI interests you, what you want to achieve, why now…'}
            />
            <div className={styles.wordCountRow}>
              <span className={`${styles.wordCount} ${wordCountClass}`}>
                {wordCount} {lang === 'ru' ? 'слов' : 'words'}
              </span>
              <span className={styles.wordHint}>
                {lang === 'ru' ? 'Рекомендуем: 150–300 слов' : 'Recommended: 150–300 words'}
              </span>
            </div>
          </section>

          <section className={styles.section}>
            <SectionHead
              num="★"
              title={lang === 'ru' ? 'Финальный вопрос' : 'Final question'}
              hint={lang === 'ru'
                ? 'Представьте, что прошло 12 месяцев. Какой результат вы хотите получить благодаря AI?'
                : 'Imagine 12 months have passed. What concrete result do you want from AI?'}
            />
            <textarea
              required
              rows={5}
              value={form.futureGoal}
              onChange={(e) => setField('futureGoal', e.target.value)}
              className={styles.textarea}
              placeholder={lang === 'ru'
                ? 'Например: запустил AI-агентство с 3 клиентами и стабильным доходом…'
                : 'E.g. launched an AI agency with 3 clients and stable income…'}
            />
          </section>

          <div className={styles.submitBar}>
            <p className={styles.submitHint}>
              {form.interests.length === 0
                ? (lang === 'ru' ? 'Выберите хотя бы одно направление в блоке 4' : 'Select at least one track in section 4')
                : (lang === 'ru' ? 'Нажимая кнопку, вы соглашаетесь на обработку данных для рассмотрения заявки.' : 'By submitting, you agree to data processing for application review.')}
            </p>
            <button type="submit" className={styles.submitBtn} disabled={submitting || form.interests.length === 0}>
              {submitting
                ? (lang === 'ru' ? 'Отправка…' : 'Submitting…')
                : (lang === 'ru' ? 'Отправить заявку →' : 'Submit application →')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
