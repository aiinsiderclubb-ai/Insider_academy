import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { PageMeta } from '../components/PageMeta'
import { ScrollReveal } from '../components/ScrollReveal'
import { TELEGRAM_COMMUNITY } from '../data/siteLinks'
import {
  getGiveaway,
  getActiveGiveaways,
  getUpcomingGiveaways,
} from '../data/giveaways'
import styles from './Giveaway.module.css'

function useCountdown(endsAt) {
  const [left, setLeft] = useState(null)

  useEffect(() => {
    if (!endsAt) {
      setLeft(null)
      return undefined
    }
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now()
      if (diff <= 0) {
        setLeft({ done: true })
        return
      }
      const days = Math.floor(diff / 86400000)
      const hours = Math.floor((diff % 86400000) / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      setLeft({ days, hours, mins, done: false })
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [endsAt])

  return left
}

function GiveawayCard({ giveaway, lang, compact = false }) {
  const ru = lang === 'ru'
  const isActive = giveaway.status === 'active'
  const isUpcoming = giveaway.status === 'upcoming'

  return (
    <Link
      to={isUpcoming ? '#' : `/giveaway/${giveaway.slug}`}
      className={`${styles.card} ${compact ? styles.cardCompact : ''} ${isUpcoming ? styles.cardUpcoming : ''}`}
      onClick={isUpcoming ? (e) => e.preventDefault() : undefined}
      style={{ '--giveaway-accent': giveaway.accent, '--giveaway-gradient': giveaway.gradient }}
    >
      <div className={styles.cardGlow} aria-hidden />
      <span className={styles.cardIcon} aria-hidden>{giveaway.icon}</span>
      <div className={styles.cardBody}>
        <span className={`${styles.cardTag} ${isActive ? styles.cardTagActive : ''}`}>
          {ru ? giveaway.tagRu : giveaway.tagEn}
        </span>
        <h3 className={styles.cardTitle}>
          {ru ? giveaway.prizeRu : giveaway.prizeEn}
        </h3>
        <p className={styles.cardDetail}>
          {ru ? giveaway.prizeDetailRu : giveaway.prizeDetailEn}
        </p>
        {!compact && (
          <p className={styles.cardLead}>
            {ru ? giveaway.leadRu : giveaway.leadEn}
          </p>
        )}
        {isActive && (
          <span className={styles.cardCta}>
            {ru ? 'Участвовать →' : 'Enter →'}
          </span>
        )}
      </div>
    </Link>
  )
}

function GiveawayDetail({ giveaway, lang }) {
  const ru = lang === 'ru'
  const { user } = useAuth()
  const countdown = useCountdown(giveaway.endsAt)
  const steps = ru ? giveaway.stepsRu : giveaway.stepsEn
  const rules = ru ? giveaway.rulesRu : giveaway.rulesEn

  const stepLinks = useMemo(
    () =>
      steps.map((step) => ({
        ...step,
        href: step.useTelegramPost ? giveaway.telegramPostUrl : step.link,
        external: step.external || step.useTelegramPost,
      })),
    [steps, giveaway.telegramPostUrl]
  )

  return (
    <>
      <PageMeta
        title={ru ? giveaway.headlineRu : giveaway.headlineEn}
        description={ru ? giveaway.leadRu : giveaway.leadEn}
        path={`/giveaway/${giveaway.slug}`}
      />

      <header
        className={styles.hero}
        style={{ '--giveaway-accent': giveaway.accent, '--giveaway-gradient': giveaway.gradient }}
      >
        <div className={styles.heroBg} aria-hidden />
        <div className={styles.container}>
          <Link to="/giveaway" className={styles.backLink}>
            {ru ? '← Все розыгрыши' : '← All giveaways'}
          </Link>
          <span className={styles.heroPill}>{ru ? giveaway.tagRu : giveaway.tagEn}</span>
          <h1 className={styles.heroTitle}>{ru ? giveaway.headlineRu : giveaway.headlineEn}</h1>
          <p className={styles.heroLead}>{ru ? giveaway.leadRu : giveaway.leadEn}</p>

          <div className={styles.prizeRow}>
            <div className={styles.prizeMain}>
              <span className={styles.prizeIcon} aria-hidden>{giveaway.icon}</span>
              <div>
                <strong>{ru ? giveaway.prizeRu : giveaway.prizeEn}</strong>
                <span>{ru ? giveaway.prizeDetailRu : giveaway.prizeDetailEn}</span>
              </div>
            </div>
            <div className={styles.prizeMeta}>
              <div className={styles.prizeMetaItem}>
                <span className={styles.prizeMetaLabel}>{ru ? 'Приз' : 'Prize value'}</span>
                <strong>{giveaway.prizeValue}</strong>
              </div>
              <div className={styles.prizeMetaItem}>
                <span className={styles.prizeMetaLabel}>{ru ? 'Победителей' : 'Winners'}</span>
                <strong>{giveaway.winnersCount}</strong>
              </div>
            </div>
          </div>

          {countdown && !countdown.done && (
            <div className={styles.countdown} role="timer">
              <span className={styles.countdownLabel}>{ru ? 'До окончания' : 'Ends in'}</span>
              <div className={styles.countdownValues}>
                <span><strong>{countdown.days}</strong> {ru ? 'дн' : 'd'}</span>
                <span><strong>{countdown.hours}</strong> {ru ? 'ч' : 'h'}</span>
                <span><strong>{countdown.mins}</strong> {ru ? 'мин' : 'm'}</span>
              </div>
            </div>
          )}

          <div className={styles.heroActions}>
            <a
              href={giveaway.telegramPostUrl}
              target="_blank"
              rel="noreferrer noopener"
              className={styles.btnPrimary}
            >
              {ru ? 'Перейти к посту в Telegram' : 'Open Telegram post'}
            </a>
            {!user && (
              <Link to="/register" className={styles.btnSecondary}>
                {ru ? 'Регистрация на Academy' : 'Sign up on Academy'}
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className={styles.container}>
        {user && (
          <ScrollReveal>
            <div className={styles.accountNote}>
              {ru ? 'Вы вошли как' : 'Signed in as'} <strong>{user.email}</strong>
              {' — '}
              {ru
                ? 'используйте этот email при участии, если потребуется.'
                : 'use this email when participating if needed.'}
            </div>
          </ScrollReveal>
        )}

        <ScrollReveal>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{ru ? 'Как участвовать' : 'How to enter'}</h2>
            <ol className={styles.steps}>
              {stepLinks.map((step, index) => {
                const content = (
                  <>
                    <span className={styles.stepNum}>{index + 1}</span>
                    <span className={styles.stepText}>{step.label}</span>
                  </>
                )
                if (step.href) {
                  return step.external ? (
                    <li key={step.id}>
                      <a
                        href={step.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={styles.stepLink}
                      >
                        {content}
                      </a>
                    </li>
                  ) : (
                    <li key={step.id}>
                      <Link to={step.href} className={styles.stepLink}>
                        {content}
                      </Link>
                    </li>
                  )
                }
                return (
                  <li key={step.id} className={styles.stepItem}>
                    {content}
                  </li>
                )
              })}
            </ol>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{ru ? 'Правила' : 'Rules'}</h2>
            <ul className={styles.rules}>
              {rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <aside className={styles.telegramCta}>
            <h3>{ru ? 'Следите за новыми розыгрышами' : 'Stay tuned for new giveaways'}</h3>
            <p>
              {ru
                ? 'ChatGPT Plus, Cursor Pro и другие AI-подписки — анонсы только в Telegram.'
                : 'ChatGPT Plus, Cursor Pro and more AI subscriptions — announcements on Telegram only.'}
            </p>
            <a href={TELEGRAM_COMMUNITY} target="_blank" rel="noreferrer noopener" className={styles.btnPrimary}>
              {ru ? 'Подписаться на канал' : 'Join the channel'}
            </a>
          </aside>
        </ScrollReveal>
      </div>
    </>
  )
}

function GiveawayHub({ lang }) {
  const ru = lang === 'ru'
  const active = getActiveGiveaways()
  const upcoming = getUpcomingGiveaways()

  return (
    <>
      <PageMeta
        title={ru ? 'Розыгрыши AI' : 'AI Giveaways'}
        description={
          ru
            ? 'Розыгрыши подписок Claude Pro, ChatGPT и других AI-инструментов от AI Insider Academy.'
            : 'Giveaways for Claude Pro, ChatGPT and other AI tools from AI Insider Academy.'
        }
        path="/giveaway"
      />

      <header className={styles.hubHero}>
        <div className={styles.heroBg} aria-hidden />
        <div className={styles.container}>
          <span className={styles.heroPill}>AI Insider Giveaways</span>
          <h1 className={styles.heroTitle}>
            {ru ? 'Розыгрыши AI-инструментов' : 'AI tool giveaways'}
          </h1>
          <p className={styles.heroLead}>
            {ru
              ? 'Периодически разыгрываем подписки на Claude, ChatGPT, Cursor и другие сервисы — для комьюнити AI Insider.'
              : 'We regularly give away Claude, ChatGPT, Cursor and other subscriptions to the AI Insider community.'}
          </p>
        </div>
      </header>

      <div className={styles.container}>
        {active.length > 0 && (
          <ScrollReveal>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{ru ? 'Сейчас идёт' : 'Live now'}</h2>
              <div className={styles.cardGrid}>
                {active.map((g) => (
                  <GiveawayCard key={g.id} giveaway={g} lang={lang} />
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        {upcoming.length > 0 && (
          <ScrollReveal>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{ru ? 'Скоро' : 'Coming soon'}</h2>
              <div className={`${styles.cardGrid} ${styles.cardGridCompact}`}>
                {upcoming.map((g) => (
                  <GiveawayCard key={g.id} giveaway={g} lang={lang} compact />
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        <ScrollReveal>
          <aside className={styles.telegramCta}>
            <h3>{ru ? 'Все анонсы — в Telegram' : 'All announcements on Telegram'}</h3>
            <p>
              {ru
                ? 'Подпишитесь, чтобы не пропустить старт розыгрыша и итоги.'
                : 'Subscribe so you do not miss the start or results.'}
            </p>
            <a href={TELEGRAM_COMMUNITY} target="_blank" rel="noreferrer noopener" className={styles.btnPrimary}>
              {ru ? 'Telegram AI Insider' : 'AI Insider Telegram'}
            </a>
          </aside>
        </ScrollReveal>
      </div>
    </>
  )
}

export function Giveaway() {
  const { slug } = useParams()
  const { lang } = useLanguage()

  if (!slug) {
    const active = getActiveGiveaways()
    if (active.length === 1) {
      return <Navigate to={`/giveaway/${active[0].slug}`} replace />
    }
    return (
      <div className={styles.wrap}>
        <GiveawayHub lang={lang} />
      </div>
    )
  }

  const giveaway = getGiveaway(slug)
  if (!giveaway) {
    return <Navigate to="/giveaway" replace />
  }

  if (giveaway.status === 'upcoming') {
    return (
      <div className={styles.wrap}>
        <GiveawayHub lang={lang} />
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <GiveawayDetail giveaway={giveaway} lang={lang} />
    </div>
  )
}
