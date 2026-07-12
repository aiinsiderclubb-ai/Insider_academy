import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { PageMeta } from '../components/PageMeta'
import { ScrollReveal } from '../components/ScrollReveal'
import { TELEGRAM_COMMUNITY } from '../data/siteLinks'
import { api, checkApiOnline } from '../api/client'
import {
  getActiveGiveaways,
  getEndedGiveaways,
} from '../data/giveaways'
import { getUpcomingEvents } from '../data/events'
import { UiIcon } from '../components/UiIcon'
import styles from './Events.module.css'

function formatCount(n) {
  return new Intl.NumberFormat().format(n || 0)
}

function timeProgress(startsAt, endsAt) {
  if (!endsAt) return null
  const end = new Date(endsAt).getTime()
  const start = startsAt ? new Date(startsAt).getTime() : end - 14 * 86400000
  const now = Date.now()
  if (now >= end) return 100
  if (now <= start) return 0
  return Math.round(((now - start) / (end - start)) * 100)
}

function formatEnds(endsAt, ru) {
  if (!endsAt) return ''
  try {
    return new Intl.DateTimeFormat(ru ? 'ru-RU' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(endsAt))
  } catch {
    return ''
  }
}

function GiveawayHubCard({ giveaway, lang, participantCount }) {
  const ru = lang === 'ru'
  const isActive = giveaway.status === 'active'
  const isEnded = giveaway.status === 'ended'
  const progress = timeProgress(giveaway.startsAt, giveaway.endsAt)
  const winner = giveaway.winner

  return (
    <article className={styles.cardWrap}>
      <Link
        to={`/giveaway/${giveaway.slug}`}
        className={styles.card}
        style={{ '--card-accent': giveaway.accent, '--card-gradient': giveaway.gradient }}
      >
        <div className={styles.cardTop}>
          <span className={styles.cardIcon} aria-hidden>
            <UiIcon name={giveaway.icon} variant="box" tone="accent" />
          </span>
          {isActive && (
            <span className={styles.statusLive}>
              <span className={styles.statusDot} aria-hidden />
              {ru ? 'Активен' : 'Active'}
            </span>
          )}
          {isEnded && (
            <span className={styles.statusEnded}>{ru ? 'Завершён' : 'Ended'}</span>
          )}
        </div>

        <h3 className={styles.cardTitle}>{ru ? giveaway.prizeRu : giveaway.prizeEn}</h3>
        <p className={styles.cardMeta}>
          {ru ? giveaway.prizeDetailRu : giveaway.prizeDetailEn}
          {isActive && participantCount != null && (
            <> · {formatCount(participantCount)} {ru ? 'участников' : 'participants'}</>
          )}
        </p>

        {isActive && progress != null && (
          <div className={styles.progressBlock}>
            <div className={styles.progressTrack} aria-hidden>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <span className={styles.progressLabel}>
              {ru ? `До ${formatEnds(giveaway.endsAt, true)}` : `Until ${formatEnds(giveaway.endsAt, false)}`}
            </span>
          </div>
        )}

        {isEnded && winner && (
          <div className={styles.winnerRow}>
            <span className={styles.winnerAvatar}>{winner.initials || '★'}</span>
            <span>
              {ru ? 'Победитель:' : 'Winner:'}
              {' '}
              <strong>{winner.name}</strong>
            </span>
          </div>
        )}

        {isActive && (
          <span className={styles.cardCta}>{ru ? 'Участвовать →' : 'Enter →'}</span>
        )}
      </Link>
    </article>
  )
}

function EventCard({ event, lang }) {
  const ru = lang === 'ru'
  const inner = (
    <>
      <span className={styles.eventIcon} aria-hidden>
        <UiIcon name={event.icon} variant="box" tone="accent" />
      </span>
      <div>
        <span className={styles.eventDate}>{ru ? event.dateRu : event.dateEn}</span>
        <h3 className={styles.eventTitle}>{ru ? event.titleRu : event.titleEn}</h3>
        <p className={styles.eventDesc}>{ru ? event.descRu : event.descEn}</p>
      </div>
    </>
  )

  if (event.link) {
    return (
      <a href={event.link} target="_blank" rel="noreferrer noopener" className={styles.eventCard}>
        {inner}
      </a>
    )
  }
  return <article className={styles.eventCard}>{inner}</article>
}

export function Events() {
  const { lang } = useLanguage()
  const ru = lang === 'ru'
  const [counts, setCounts] = useState({})

  useEffect(() => {
    checkApiOnline().then(async (ok) => {
      if (!ok) return
      try {
        const list = await api.getGiveaways()
        const map = {}
        list.forEach((g) => { map[g.slug] = g.participantCount })
        setCounts(map)
      } catch (_) {}
    })
  }, [])

  const active = getActiveGiveaways()
  const ended = getEndedGiveaways()
  const events = useMemo(
    () => getUpcomingEvents().filter((e) => {
      const date = (lang === 'ru' ? e.dateRu : e.dateEn) || ''
      const isVagueSoon = /^(скоро|coming soon)$/i.test(date.trim())
      if (isVagueSoon && !e.link) return false
      return Boolean(e.titleRu || e.titleEn)
    }),
    [lang],
  )

  return (
    <div className={styles.wrap}>
      <PageMeta
        title={ru ? 'Розыгрыши и события' : 'Giveaways & events'}
        description={
          ru
            ? 'Розыгрыши Claude Pro и других AI-инструментов. События AI Insider.'
            : 'Claude Pro and AI tool giveaways. AI Insider community events.'
        }
        path="/events"
      />

      <header className={styles.hero}>
        <div className={styles.heroBg} aria-hidden />
        <div className={styles.container}>
          <span className={styles.pill}>AI Insider</span>
          <h1 className={styles.title}>{ru ? 'Розыгрыши и события' : 'Giveaways & events'}</h1>
          <p className={styles.lead}>
            {ru
              ? 'Подписки на AI-сервисы и активности комьюнити — без пустых «скоро»-карточек.'
              : 'AI subscriptions and community activities — no empty “coming soon” cards.'}
          </p>
        </div>
      </header>

      <div className={styles.container}>
        {active.length > 0 && (
          <ScrollReveal>
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>{ru ? 'Розыгрыши' : 'Giveaways'}</h2>
                <span className={styles.sectionBadge}>
                  <span className={styles.statusDot} aria-hidden />
                  {ru ? 'Сейчас идёт' : 'Live now'}
                </span>
              </div>
              <div className={styles.cardGrid}>
                {active.map((g) => (
                  <GiveawayHubCard
                    key={g.id}
                    giveaway={g}
                    lang={lang}
                    participantCount={counts[g.slug]}
                  />
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        {ended.length > 0 && (
          <ScrollReveal>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{ru ? 'Завершённые' : 'Past giveaways'}</h2>
              <div className={styles.cardGrid}>
                {ended.map((g) => (
                  <GiveawayHubCard key={g.id} giveaway={g} lang={lang} />
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        {events.length > 0 && (
          <ScrollReveal>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <UiIcon name="calendarDays" variant="inline" size={20} tone="accent" />
                {' '}
                {ru ? 'События' : 'Events'}
              </h2>
              <div className={styles.eventGrid}>
                {events.map((event) => (
                  <EventCard key={event.id} event={event} lang={lang} />
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        <ScrollReveal>
          <aside className={styles.telegramCta}>
            <h3>{ru ? 'Анонсы в Telegram' : 'Announcements on Telegram'}</h3>
            <p>
              {ru
                ? 'Старт розыгрышей и итоги — в канале AI Insider.'
                : 'Giveaway launches and results — on the AI Insider channel.'}
            </p>
            <div className={styles.ctaRow}>
              <a href={TELEGRAM_COMMUNITY} target="_blank" rel="noreferrer noopener" className={styles.btnPrimary}>
                {ru ? 'Подписаться' : 'Subscribe'}
              </a>
              <Link to="/giveaway-rules" className={styles.btnGhost}>
                {ru ? 'Правила розыгрышей' : 'Giveaway rules'}
              </Link>
            </div>
          </aside>
        </ScrollReveal>
      </div>
    </div>
  )
}
