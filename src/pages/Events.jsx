import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Gift,
  Radio,
  Send,
  Users,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { PageMeta } from '../components/PageMeta'
import { ScrollReveal } from '../components/ScrollReveal'
import { TELEGRAM_COMMUNITY } from '../data/siteLinks'
import { api, checkApiOnline } from '../api/client'
import { getActiveGiveaways, getEndedGiveaways } from '../data/giveaways'
import { getUpcomingEvents } from '../data/events'
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
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(endsAt))
  } catch {
    return ''
  }
}

function GiveawayFeature({ giveaway, lang, participantCount, result, index }) {
  const ru = lang === 'ru'
  const isActive = giveaway.status === 'active'
  const progress = timeProgress(giveaway.startsAt, giveaway.endsAt)
  const title = ru ? giveaway.prizeRu : giveaway.prizeEn
  const winnerName = result?.winnerTelegramUsername || giveaway.winner?.name || null

  return (
    <article className={`${styles.drop} ${!isActive ? styles.dropPast : ''}`}>
      <Link to={`/giveaway/${giveaway.slug}`} className={styles.dropLink}>
        <div className={styles.dropVisual}>
          <img src="/design/mentor-giveaway.webp" alt="" loading="lazy" />
          <div className={styles.dropVisualShade} aria-hidden />
          <span className={styles.dropIndex}>DROP / {String(index + 1).padStart(2, '0')}</span>
          <span className={isActive ? styles.liveBadge : styles.endedBadge}>
            {isActive && <span className={styles.liveDot} aria-hidden />}
            {isActive ? (ru ? 'Сейчас идёт' : 'Live now') : (ru ? 'Завершён' : 'Ended')}
          </span>
        </div>

        <div className={styles.dropContent}>
          <div className={styles.dropKicker}>
            <Gift size={17} aria-hidden />
            <span>{ru ? 'Приз сообщества' : 'Community reward'}</span>
          </div>
          <h3>{title}</h3>
          <p className={styles.dropDescription}>
            {ru ? giveaway.leadRu : giveaway.leadEn}
          </p>

          <div className={styles.dropFacts}>
            <span><Clock3 size={16} />{ru ? giveaway.prizeDetailRu : giveaway.prizeDetailEn}</span>
            {isActive && Number(participantCount) > 0 && (
              <span><Users size={16} />{formatCount(participantCount)} {ru ? 'участников' : 'participants'}</span>
            )}
          </div>

          {isActive && progress != null && (
            <div className={styles.progressBlock}>
              <div className={styles.progressCopy}>
                <span>{ru ? 'Окно участия' : 'Entry window'}</span>
                <strong>{ru ? `до ${formatEnds(giveaway.endsAt, true)}` : `until ${formatEnds(giveaway.endsAt, false)}`}</strong>
              </div>
              <div className={styles.progressTrack} aria-hidden>
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {!isActive && winnerName && (
            <p className={styles.winner}>{ru ? 'Победитель' : 'Winner'} — <strong>{winnerName}</strong></p>
          )}

          <span className={styles.dropCta}>
            {isActive ? (ru ? 'Открыть розыгрыш' : 'Open giveaway') : (ru ? 'Посмотреть итоги' : 'View results')}
            <ArrowUpRight size={20} aria-hidden />
          </span>
        </div>
      </Link>
    </article>
  )
}

function EventRow({ event, lang, index }) {
  const ru = lang === 'ru'
  const content = (
    <>
      <span className={styles.eventNumber}>{String(index + 1).padStart(2, '0')}</span>
      <span className={styles.eventDate}>{ru ? event.dateRu : event.dateEn}</span>
      <div className={styles.eventCopy}>
        <h3>{ru ? event.titleRu : event.titleEn}</h3>
        <p>{ru ? event.descRu : event.descEn}</p>
      </div>
      <span className={styles.eventAction} aria-hidden>
        <ArrowUpRight size={21} />
      </span>
    </>
  )

  if (event.link) {
    return <a href={event.link} target="_blank" rel="noreferrer noopener" className={styles.eventRow}>{content}</a>
  }
  return <article className={styles.eventRow}>{content}</article>
}

export function Events() {
  const { lang } = useLanguage()
  const ru = lang === 'ru'
  const [counts, setCounts] = useState({})
  const [results, setResults] = useState({})

  useEffect(() => {
    checkApiOnline().then(async (ok) => {
      if (!ok) return
      try {
        const list = await api.getGiveaways()
        const map = {}
        const resultMap = {}
        list.forEach((g) => {
          map[g.slug] = g.participantCount
          if (g.result) resultMap[g.slug] = g.result
        })
        setCounts(map)
        setResults(resultMap)
      } catch (_) {}
    })
  }, [])

  const active = getActiveGiveaways()
  const ended = getEndedGiveaways()
  const events = useMemo(
    () => getUpcomingEvents().filter((event) => {
      const date = (lang === 'ru' ? event.dateRu : event.dateEn) || ''
      const isVagueSoon = /^(скоро|coming soon)$/i.test(date.trim())
      if (isVagueSoon && !event.link) return false
      return Boolean(event.titleRu || event.titleEn)
    }),
    [lang],
  )

  return (
    <div className={styles.wrap}>
      <PageMeta
        title={ru ? 'Розыгрыши и события' : 'Giveaways & events'}
        description={ru ? 'Розыгрыши Claude Pro и других AI-инструментов. События AI Insider.' : 'Claude Pro and AI tool giveaways. AI Insider community events.'}
        path="/events"
      />

      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}><Radio size={14} />AI Insider / Community signal</span>
            <h1>
              {ru ? 'Больше, чем' : 'More than'}
              <span>{ru ? ' обучение.' : ' learning.'}</span>
            </h1>
            <p>
              {ru
                ? 'Живые форматы, полезные AI-инструменты и встречи с людьми, которые уже строят новое.'
                : 'Live formats, useful AI tools and people already building what comes next.'}
            </p>
            <div className={styles.heroTags} aria-label={ru ? 'Форматы' : 'Formats'}>
              <span>Giveaways</span><span>Live sessions</span><span>AMA</span>
            </div>
          </div>

          <div className={styles.signalStage} aria-hidden>
            <span className={styles.signalHalo} />
            <span className={styles.signalOrbitOne} />
            <span className={styles.signalOrbitTwo} />
            <span className={styles.signalCore}>AI</span>
            <span className={styles.signalCaption}>LIVE<br />SIGNAL</span>
          </div>
        </div>
      </header>

      <main className={styles.container}>
        {active.length > 0 && (
          <ScrollReveal>
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <div>
                  <span className={styles.sectionLabel}>{ru ? 'Сейчас в эфире' : 'On air now'}</span>
                  <h2>{ru ? 'Текущий drop' : 'Current drop'}</h2>
                </div>
                <span className={styles.sectionNote}>{ru ? 'Участие бесплатно' : 'Free to enter'}</span>
              </div>
              <div className={styles.dropList}>
                {active.map((giveaway, index) => (
                  <GiveawayFeature
                    key={giveaway.id}
                    giveaway={giveaway}
                    lang={lang}
                    participantCount={counts[giveaway.slug]}
                    result={results[giveaway.slug]}
                    index={index}
                  />
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        {events.length > 0 && (
          <ScrollReveal>
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <div>
                  <span className={styles.sectionLabel}>{ru ? 'Ближайшие форматы' : 'Upcoming formats'}</span>
                  <h2>{ru ? 'В календаре' : 'On the calendar'}</h2>
                </div>
                <CalendarDays size={26} className={styles.sectionIcon} aria-hidden />
              </div>
              <div className={styles.eventList}>
                {events.map((event, index) => <EventRow key={event.id} event={event} lang={lang} index={index} />)}
              </div>
            </section>
          </ScrollReveal>
        )}

        {ended.length > 0 && (
          <ScrollReveal>
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <div>
                  <span className={styles.sectionLabel}>{ru ? 'Архив' : 'Archive'}</span>
                  <h2>{ru ? 'Прошедшие drops' : 'Past drops'}</h2>
                </div>
              </div>
              <div className={styles.dropList}>
                {ended.map((giveaway, index) => (
                  <GiveawayFeature
                    key={giveaway.id}
                    giveaway={giveaway}
                    lang={lang}
                    participantCount={counts[giveaway.slug]}
                    result={results[giveaway.slug]}
                    index={index}
                  />
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        <ScrollReveal>
          <aside className={styles.telegramCta}>
            <div className={styles.telegramMark} aria-hidden><Send size={26} /></div>
            <div>
              <span className={styles.sectionLabel}>AI Insider / Telegram</span>
              <h2>{ru ? 'Не пропустите сигнал.' : 'Never miss the signal.'}</h2>
              <p>{ru ? 'Старт розыгрышей, прямые эфиры и итоги появляются в канале первыми.' : 'Giveaway launches, live sessions and results land in the channel first.'}</p>
            </div>
            <div className={styles.ctaActions}>
              <a href={TELEGRAM_COMMUNITY} target="_blank" rel="noreferrer noopener" className={styles.primaryAction}>
                {ru ? 'Открыть канал' : 'Open channel'}<ArrowUpRight size={18} />
              </a>
              <Link to="/giveaway-rules" className={styles.textAction}>{ru ? 'Правила' : 'Rules'}</Link>
            </div>
          </aside>
        </ScrollReveal>
      </main>
    </div>
  )
}
