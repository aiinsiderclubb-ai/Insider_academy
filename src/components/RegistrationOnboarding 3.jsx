import { useState } from 'react'
import { Link } from 'react-router-dom'
import { markRegistrationOnboardingDone } from '../utils/onboardingStorage'
import { TELEGRAM_COMMUNITY } from '../data/siteLinks'
import styles from './RegistrationOnboarding.module.css'

const STEPS_RU = [
  { title: 'Выберите курс', desc: 'Каталог Academy — от бесплатного старта до Pro-треков.', cta: 'Каталог', to: '/courses' },
  { title: 'Начните бесплатно', desc: 'AI Starter Week — 7 дней основ без оплаты.', cta: 'Старт', to: '/courses/ai-start?lesson=0' },
  { title: 'Сообщество', desc: 'Telegram — анонсы, поддержка и нетворк.', cta: 'Telegram', href: TELEGRAM_COMMUNITY, external: true },
]

const STEPS_EN = [
  { title: 'Pick a course', desc: 'Academy catalog — from free start to Pro tracks.', cta: 'Catalog', to: '/courses' },
  { title: 'Start free', desc: 'AI Starter Week — 7 days of fundamentals.', cta: 'Start', to: '/courses/ai-start?lesson=0' },
  { title: 'Community', desc: 'Telegram — updates, support and network.', cta: 'Telegram', href: TELEGRAM_COMMUNITY, external: true },
]

export function RegistrationOnboarding({ lang, onDone }) {
  const [step, setStep] = useState(0)
  const steps = lang === 'ru' ? STEPS_RU : STEPS_EN
  const current = steps[step]

  const finish = () => {
    markRegistrationOnboardingDone()
    onDone?.()
  }

  const next = () => {
    if (step >= steps.length - 1) finish()
    else setStep((s) => s + 1)
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="onboard-title">
      <div className={styles.card}>
        <p className={styles.pill}>{lang === 'ru' ? 'Добро пожаловать' : 'Welcome'}</p>
        <h2 id="onboard-title" className={styles.title}>
          {lang === 'ru' ? 'С чего начать' : 'Where to start'}
        </h2>
        <p className={styles.stepLabel}>
          {step + 1} / {steps.length}
        </p>
        <h3 className={styles.stepTitle}>{current.title}</h3>
        <p className={styles.stepDesc}>{current.desc}</p>
        <div className={styles.actions}>
          {current.external ? (
            <a
              href={current.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.primary}
              onClick={next}
            >
              {current.cta} ↗
            </a>
          ) : (
            <Link to={current.to} className={styles.primary} onClick={next}>
              {current.cta} →
            </Link>
          )}
          <button type="button" className={styles.skip} onClick={finish}>
            {lang === 'ru' ? 'Пропустить' : 'Skip'}
          </button>
        </div>
        {step < steps.length - 1 && (
          <button type="button" className={styles.nextGhost} onClick={next}>
            {lang === 'ru' ? 'Далее' : 'Next'} →
          </button>
        )}
      </div>
    </div>
  )
}
