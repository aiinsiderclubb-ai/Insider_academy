import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Send, Share2, Ticket, Trophy, UserPlus, Users } from 'lucide-react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { PageMeta } from '../components/PageMeta'
import { ScrollReveal } from '../components/ScrollReveal'
import { TelegramPostEmbed } from '../components/TelegramPostEmbed'
import { api, checkApiOnline } from '../api/client'
import { useToast } from '../context/ToastContext'
import { getGiveaway } from '../data/giveaways'
import {
  buildParticipantAvatars,
  buildReferralLink,
  bumpReferral,
  captureReferralFromUrl,
  CHANCE_REFERRAL,
  CHANCE_SHARE,
  CHANCE_TELEGRAM,
  computeChances,
  consumePendingReferral,
  getChanceState,
  getReferralCode,
  markShared,
  maxPossibleChances,
  userInitials,
} from '../data/giveawayChances'
import { UiIcon } from '../components/UiIcon'
import { getTelegramPostEmbedId } from '../utils/telegramPost'
import styles from './Giveaway.module.css'

function pad2(n) {
  return String(n).padStart(2, '0')
}

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
        setLeft({ done: true, days: 0, hours: 0, mins: 0, secs: 0 })
        return
      }
      setLeft({
        done: false,
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  return left
}

function formatCount(n) {
  return new Intl.NumberFormat().format(n || 0)
}

function FlipUnit({ value, label }) {
  const display = pad2(value)
  return (
    <div className={styles.flipUnit}>
      <div className={styles.flipCard} key={display}>
        <span className={styles.flipValue}>{display}</span>
      </div>
      <span className={styles.flipLabel}>{label}</span>
    </div>
  )
}

function PrizeTiltCard({ giveaway, lang }) {
  const ru = lang === 'ru'
  const cardRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const onMove = (e) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    setTilt({
      x: (py - 0.5) * -14,
      y: (px - 0.5) * 18,
    })
  }

  const onLeave = () => setTilt({ x: 0, y: 0 })

  return (
    <div
      ref={cardRef}
      className={styles.prizeTilt}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        '--giveaway-accent': giveaway.accent,
        '--giveaway-gradient': giveaway.gradient,
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
    >
      <div className={styles.prizeTiltInner}>
        <img className={styles.prizeMentor} src="/design/mentor-giveaway.webp" alt="" aria-hidden />
        <span className={styles.prizeLogo}>{giveaway.logoText || giveaway.brand}</span>
        <strong className={styles.prizeName}>
          {ru ? giveaway.prizeRu : giveaway.prizeEn}
          {' '}
          {ru ? giveaway.prizeDetailRu : giveaway.prizeDetailEn}
        </strong>
        <span className={styles.prizeWinners}>
          {giveaway.winnersCount}
          {' '}
          {ru
            ? (giveaway.winnersCount === 1 ? 'победитель' : 'победителей')
            : (giveaway.winnersCount === 1 ? 'winner' : 'winners')}
        </span>
      </div>
    </div>
  )
}

function Accordion({ items, idPrefix, numbered = false }) {
  const [open, setOpen] = useState(numbered ? 0 : null)
  return (
    <div className={`${styles.accordion} ${numbered ? styles.accordionRules : ''}`}>
      {items.map((item, i) => {
        const key = `${idPrefix}-${i}`
        const isOpen = open === i
        const title = item.q || item.title || item
        const body = item.a || item.text || (typeof item === 'string' ? item : '')
        return (
          <div key={key} className={`${styles.accItem} ${isOpen ? styles.accOpen : ''}`}>
            <button
              type="button"
              className={styles.accHead}
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span className={styles.accHeadMain}>
                {numbered && (
                  <span className={styles.accNum} aria-hidden>{String(i + 1).padStart(2, '0')}</span>
                )}
                <span className={styles.accTitle}>{title}</span>
              </span>
              <span className={`${styles.accChevron} ${isOpen ? styles.accChevronOpen : ''}`} aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </button>
            <div className={`${styles.accBody} ${isOpen ? styles.accBodyOpen : ''}`} hidden={!isOpen}>
              {body && <p>{body}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ConfettiBurst({ active }) {
  if (!active) return null
  return (
    <div className={styles.confetti} aria-hidden>
      {Array.from({ length: 28 }).map((_, i) => (
        <span key={i} className={styles.confettiPiece} style={{ '--i': i }} />
      ))}
    </div>
  )
}

function GiveawayDetail({ giveaway, lang }) {
  const ru = lang === 'ru'
  const { user } = useAuth()
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()
  const countdown = useCountdown(giveaway.endsAt)
  const embedId = useMemo(() => getTelegramPostEmbedId(giveaway.telegramPostUrl), [giveaway.telegramPostUrl])
  const faq = (ru ? giveaway.faqRu : giveaway.faqEn) || []
  const redirectPath = `/giveaway/${giveaway.slug}`

  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [apiOffline, setApiOffline] = useState(false)
  const [bonus, setBonus] = useState({ shared: false, referralCount: 0 })
  const [showConfetti, setShowConfetti] = useState(false)
  const confettiShown = useRef(false)

  const userKey = user?.email || user?.id || ''
  const refCode = getReferralCode(user)
  const referralLink = buildReferralLink(giveaway.slug, refCode)

  useEffect(() => {
    captureReferralFromUrl()
  }, [searchParams])

  useEffect(() => {
    setBonus(getChanceState(giveaway.slug, userKey))
  }, [giveaway.slug, userKey])

  const load = useCallback(async () => {
    setLoading(true)
    const online = await checkApiOnline()
    if (!online) {
      setApiOffline(true)
      setLoading(false)
      return
    }
    setApiOffline(false)
    try {
      const data = await api.getGiveaway(giveaway.slug)
      setState(data)
    } catch (_) {
      setState(null)
    } finally {
      setLoading(false)
    }
  }, [giveaway.slug])

  useEffect(() => { load() }, [load])

  const entered = Boolean(state?.entered)
  const count = state?.participantCount ?? 0
  const chances = computeChances({
    entered,
    channelSubscribed: Boolean(state?.channelSubscribed),
    shared: bonus.shared,
    referralCount: bonus.referralCount,
  })
  const chanceCap = Math.max(maxPossibleChances(bonus.referralCount), chances || 1)
  const avatars = buildParticipantAvatars(count, entered ? userInitials(user) : '')
  const isEnded = giveaway.status === 'ended' || countdown?.done
  const winner = giveaway.winner

  const triggerConfetti = () => {
    if (confettiShown.current) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    confettiShown.current = true
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2800)
  }

  const handleVerifyTelegram = async () => {
    if (!user) return
    setBusy(true)
    try {
      const res = await api.verifyGiveawayTelegram(giveaway.slug)
      if (res.subscribed) {
        showToast(ru ? 'Подписка подтверждена (+1 шанс)' : 'Subscription confirmed (+1 chance)', 'success')
        await load()
      } else {
        showToast(res.errorRu || res.error || (ru ? 'Подписка не найдена' : 'Not subscribed'), 'error')
      }
    } catch (err) {
      showToast(err.data?.errorRu || err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleEnter = async () => {
    if (!user) return
    setBusy(true)
    try {
      if (!state?.channelSubscribed) {
        const verified = await api.verifyGiveawayTelegram(giveaway.slug)
        if (!verified.subscribed) {
          showToast(
            ru
              ? 'Сначала подпишитесь на Telegram-канал и подтвердите'
              : 'Subscribe to the Telegram channel first',
            'error',
          )
          setBusy(false)
          return
        }
      }
      const res = await api.enterGiveaway(giveaway.slug)
      const pendingRef = consumePendingReferral()
      if (pendingRef && pendingRef !== refCode) {
        bumpReferral(giveaway.slug, pendingRef)
      }
      setState((prev) => ({
        ...prev,
        entered: true,
        participantCount: res.participantCount ?? ((prev?.participantCount || 0) + 1),
        channelSubscribed: true,
      }))
      showToast(ru ? 'Ты участвуешь!' : 'You are in!', 'success', 5000)
      triggerConfetti()
      await load()
    } catch (err) {
      showToast(err.data?.errorRu || err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const title = ru ? giveaway.headlineRu : giveaway.headlineEn
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
        showToast(ru ? 'Ссылка скопирована' : 'Link copied', 'success')
      }
    } catch (_) {
      try {
        await navigator.clipboard.writeText(url)
        showToast(ru ? 'Ссылка скопирована' : 'Link copied', 'success')
      } catch (__) {}
    }
    if (entered) {
      const next = markShared(giveaway.slug, userKey)
      setBonus(next)
      showToast(ru ? '+2 шанса за шаринг' : '+2 chances for sharing', 'success')
    }
  }

  const copyReferral = async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      showToast(ru ? 'Реферальная ссылка скопирована' : 'Referral link copied', 'success')
    } catch (_) {
      showToast(ru ? 'Не удалось скопировать' : 'Could not copy', 'error')
    }
  }

  const scrollToCta = () => {
    document.getElementById('giveaway-cta')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <>
      <PageMeta
        title={ru ? giveaway.headlineRu : giveaway.headlineEn}
        description={ru ? giveaway.leadRu : giveaway.leadEn}
        path={`/giveaway/${giveaway.slug}`}
      />
      <ConfettiBurst active={showConfetti} />

      <header
        className={styles.hero}
        style={{ '--giveaway-accent': giveaway.accent, '--giveaway-gradient': giveaway.gradient }}
      >
        <div className={styles.heroBg} aria-hidden />
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <Link to="/events" className={styles.backLink}>
              {ru ? '← Розыгрыши и события' : '← Giveaways & events'}
            </Link>

            {!isEnded && (
              <span className={styles.liveBadge}>
                <span className={styles.liveDot} aria-hidden />
                {ru ? giveaway.tagRu : giveaway.tagEn}
              </span>
            )}
            {isEnded && (
              <span className={styles.endedBadge}>{ru ? 'Завершён' : 'Ended'}</span>
            )}

            <h1 className={styles.heroTitle}>{ru ? giveaway.headlineRu : giveaway.headlineEn}</h1>
            <p className={styles.heroLead}>{ru ? giveaway.leadRu : giveaway.leadEn}</p>

            <div className={styles.participantsRow}>
              <div className={styles.avatarStack} aria-hidden>
                {avatars.map((initials, i) => (
                  <span key={`${initials}-${i}`} className={styles.avatar} style={{ zIndex: 10 - i }}>
                    {initials}
                  </span>
                ))}
              </div>
              <span className={styles.participantsText}>
                <strong>{formatCount(count)}</strong>
                {' '}
                {ru ? 'участвуют' : 'joining'}
              </span>
            </div>

            {!isEnded && !entered && (
              <button type="button" className={styles.btnPrimary} onClick={scrollToCta}>
                {ru ? 'Участвовать бесплатно' : 'Enter for free'}
              </button>
            )}
          </div>

          <PrizeTiltCard giveaway={giveaway} lang={lang} />
        </div>
      </header>

      <div className={styles.container}>
        {countdown && !countdown.done && (
          <section className={styles.timerSection} aria-label={ru ? 'До итогов' : 'Until results'}>
            <p className={styles.timerLabel}>{ru ? 'до итогов' : 'until results'}</p>
            <div className={styles.flipRow} role="timer">
              <FlipUnit value={countdown.days} label={ru ? 'дн' : 'd'} />
              <span className={styles.flipSep}>:</span>
              <FlipUnit value={countdown.hours} label={ru ? 'ч' : 'h'} />
              <span className={styles.flipSep}>:</span>
              <FlipUnit value={countdown.mins} label={ru ? 'мин' : 'm'} />
              <span className={styles.flipSep}>:</span>
              <FlipUnit value={countdown.secs} label={ru ? 'сек' : 's'} />
            </div>
          </section>
        )}

        {isEnded && winner && (
          <section className={styles.winnerModule}>
            <span className={styles.winnerPill}>{ru ? 'Победитель' : 'Winner'}</span>
            <div className={styles.winnerCard}>
              <span className={styles.winnerAvatar}>{winner.initials || '★'}</span>
              <div>
                <strong>{winner.name}</strong>
                <p>{ru ? giveaway.prizeRu : giveaway.prizeEn}</p>
              </div>
            </div>
            <Link to="/events" className={styles.btnPrimary}>
              {ru ? 'Смотреть следующий розыгрыш' : 'See next giveaway'}
            </Link>
          </section>
        )}

        {!isEnded && (
          <ScrollReveal>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{ru ? 'Как участвовать' : 'How to enter'}</h2>
              <ol className={styles.stepper}>
                <li className={`${styles.step} ${styles.stepViolet}`}>
                  <span className={styles.stepGhost} aria-hidden>01</span>
                  <span className={styles.stepIcon}><UserPlus size={22} strokeWidth={1.8} aria-hidden /></span>
                  <strong>{ru ? 'Регистрация' : 'Sign up'}</strong>
                  <p>{ru ? 'Аккаунт Academy за минуту' : 'Academy account in a minute'}</p>
                </li>
                <li className={`${styles.step} ${styles.stepMagenta}`}>
                  <span className={styles.stepGhost} aria-hidden>02</span>
                  <span className={styles.stepIcon}><Send size={22} strokeWidth={1.8} aria-hidden /></span>
                  <strong>{ru ? 'Участие' : 'Enter'}</strong>
                  <p>{ru ? 'Telegram + кнопка участия' : 'Telegram + enter button'}</p>
                </li>
                <li className={`${styles.step} ${styles.stepEmber}`}>
                  <span className={styles.stepGhost} aria-hidden>03</span>
                  <span className={styles.stepIcon}><Trophy size={22} strokeWidth={1.8} aria-hidden /></span>
                  <strong>{ru ? 'Итоги в Telegram' : 'Results on Telegram'}</strong>
                  <p>{ru ? 'Анонс победителя в канале' : 'Winner announced in the channel'}</p>
                </li>
              </ol>
            </section>
          </ScrollReveal>
        )}

        {!isEnded && (
          <ScrollReveal>
            <section className={styles.section} id="giveaway-chances">
              <div className={styles.chancesHead}>
                <h2 className={styles.sectionTitle}>{ru ? 'Дополнительные шансы' : 'Bonus chances'}</h2>
                {entered && (
                  <div className={styles.chanceMeter}>
                    <span className={styles.chanceYou}>
                      {ru ? `У тебя ${chances} ${chances === 1 ? 'шанс' : 'шансов'}` : `You have ${chances} chance${chances === 1 ? '' : 's'}`}
                    </span>
                    <div className={styles.chanceBar} aria-hidden>
                      <div className={styles.chanceFill} style={{ width: `${Math.min(100, (chances / chanceCap) * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.chanceGrid}>
                <article className={`${styles.chanceCard} ${styles.chanceViolet} ${entered ? styles.chanceDone : ''}`}>
                  <span className={styles.chanceTop}>
                    <span className={styles.chanceIcon}><Ticket size={20} strokeWidth={1.8} aria-hidden /></span>
                    <span className={styles.chancePlus}>+{1}</span>
                    {entered && <span className={styles.chanceCheck} aria-label={ru ? 'Выполнено' : 'Done'}><Check size={13} strokeWidth={3} /></span>}
                  </span>
                  <h3>{ru ? 'Базовое участие' : 'Base entry'}</h3>
                  <p>{ru ? '1 шанс за регистрацию в розыгрыше' : '1 chance for joining the giveaway'}</p>
                </article>

                <article className={`${styles.chanceCard} ${styles.chanceBlue} ${entered && state?.channelSubscribed ? styles.chanceDone : ''}`}>
                  <span className={styles.chanceTop}>
                    <span className={styles.chanceIcon}><Send size={20} strokeWidth={1.8} aria-hidden /></span>
                    <span className={styles.chancePlus}>+{CHANCE_TELEGRAM}</span>
                    {entered && state?.channelSubscribed && <span className={styles.chanceCheck} aria-label={ru ? 'Выполнено' : 'Done'}><Check size={13} strokeWidth={3} /></span>}
                  </span>
                  <h3>{ru ? 'Telegram-канал' : 'Telegram channel'}</h3>
                  <p>{ru ? 'Подписка на канал AI Insider' : 'Subscribe to AI Insider channel'}</p>
                  <div className={styles.chanceActions}>
                    <a
                      href={giveaway.telegramInviteUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={styles.btnGhost}
                    >
                      {ru ? 'Открыть канал' : 'Open channel'}
                    </a>
                    {user && (
                      <button type="button" className={styles.btnSecondary} disabled={busy} onClick={handleVerifyTelegram}>
                        {ru ? 'Проверить' : 'Verify'}
                      </button>
                    )}
                  </div>
                </article>

                <article className={`${styles.chanceCard} ${styles.chanceEmber} ${entered && bonus.referralCount > 0 ? styles.chanceDone : ''}`}>
                  <span className={styles.chanceTop}>
                    <span className={styles.chanceIcon}><Users size={20} strokeWidth={1.8} aria-hidden /></span>
                    <span className={styles.chancePlus}>+{CHANCE_REFERRAL}</span>
                    {entered && bonus.referralCount > 0 && <span className={styles.chanceCheck} aria-label={ru ? 'Выполнено' : 'Done'}><Check size={13} strokeWidth={3} /></span>}
                  </span>
                  <h3>{ru ? 'Пригласи друга' : 'Invite a friend'}</h3>
                  <p>{ru ? '+3 шанса за каждого друга по ссылке' : '+3 chances per friend who joins via your link'}</p>
                  {entered && referralLink ? (
                    <div className={styles.refRow}>
                      <input className={styles.refInput} readOnly value={referralLink} aria-label={ru ? 'Реферальная ссылка' : 'Referral link'} />
                      <button type="button" className={styles.btnSecondary} onClick={copyReferral}>
                        {ru ? 'Копировать' : 'Copy'}
                      </button>
                    </div>
                  ) : (
                    <p className={styles.chanceHint}>{ru ? 'Ссылка появится после участия' : 'Link appears after you enter'}</p>
                  )}
                  {bonus.referralCount > 0 && (
                    <p className={styles.chanceHint}>
                      {ru ? `Приглашено: ${bonus.referralCount}` : `Invited: ${bonus.referralCount}`}
                    </p>
                  )}
                </article>

                <article className={`${styles.chanceCard} ${styles.chanceMagenta} ${entered && bonus.shared ? styles.chanceDone : ''}`}>
                  <span className={styles.chanceTop}>
                    <span className={styles.chanceIcon}><Share2 size={20} strokeWidth={1.8} aria-hidden /></span>
                    <span className={styles.chancePlus}>+{CHANCE_SHARE}</span>
                    {entered && bonus.shared && <span className={styles.chanceCheck} aria-label={ru ? 'Выполнено' : 'Done'}><Check size={13} strokeWidth={3} /></span>}
                  </span>
                  <h3>{ru ? 'Поделись страницей' : 'Share the page'}</h3>
                  <p>{ru ? '+2 шанса за шаринг розыгрыша' : '+2 chances for sharing this giveaway'}</p>
                  <button type="button" className={styles.btnSecondary} onClick={handleShare} disabled={!entered}>
                    {ru ? 'Поделиться' : 'Share'}
                  </button>
                  {!entered && (
                    <p className={styles.chanceHint}>{ru ? 'Сначала участвуй' : 'Enter first'}</p>
                  )}
                </article>
              </div>
            </section>
          </ScrollReveal>
        )}

        {entered && !isEnded && (
          <section className={styles.enteredCard}>
            <strong>{ru ? 'Ты участвуешь!' : 'You’re in!'}</strong>
            <span>{ru ? `Шансов: ${chances}` : `Chances: ${chances}`}</span>
          </section>
        )}

        {embedId && (
          <ScrollReveal>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{ru ? 'Пост розыгрыша' : 'Giveaway post'}</h2>
              <TelegramPostEmbed embedId={embedId} lang={lang} />
              <a
                href={giveaway.telegramPostUrl}
                target="_blank"
                rel="noreferrer noopener"
                className={styles.postLink}
              >
                {ru ? 'Открыть в Telegram →' : 'Open in Telegram →'}
              </a>
            </section>
          </ScrollReveal>
        )}

        <ScrollReveal>
          <section className={styles.section}>
            <div className={styles.rulesHead}>
              <h2 className={styles.sectionTitle}>{ru ? 'Правила' : 'Rules'}</h2>
              <Link to="/giveaway-rules" className={styles.rulesPageLink}>
                {ru ? 'Полные правила →' : 'Full rules →'}
              </Link>
            </div>
            <ol className={styles.rulesGrid}>
              {(ru ? giveaway.rulesRu : giveaway.rulesEn).map((r, index) => {
                const title = typeof r === 'string' ? null : r.title
                const text = typeof r === 'string' ? r : r.text
                return (
                  <li key={index} className={styles.ruleCard}>
                    <span className={styles.ruleNum} aria-hidden>{String(index + 1).padStart(2, '0')}</span>
                    <div className={styles.ruleBody}>
                      {title && <strong>{title}</strong>}
                      <p>{text}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        </ScrollReveal>

        {faq.length > 0 && (
          <ScrollReveal>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>FAQ</h2>
              <Accordion idPrefix="faq" items={faq} />
            </section>
          </ScrollReveal>
        )}

        {!isEnded && (
          <section className={styles.finalCta} id="giveaway-cta">
            {loading && <p className={styles.hint}>{ru ? 'Загрузка…' : 'Loading…'}</p>}

            {!loading && !user && (
              <>
                <h2 className={styles.finalTitle}>{ru ? 'Участвуй бесплатно' : 'Enter for free'}</h2>
                <p className={styles.finalLead}>
                  {ru ? 'Создай аккаунт — вернёмся сюда сразу после регистрации.' : 'Create an account — we’ll bring you right back.'}
                </p>
                {apiOffline && (
                  <p className={styles.hint}>
                    {ru
                      ? 'Сейчас API недоступен с локального фронта — регистрируйся на myinsideracademy.com или подожди подключение.'
                      : 'API is offline from local frontend — register on myinsideracademy.com or wait for the connection.'}
                  </p>
                )}
                <Link
                  to="/register"
                  state={{ from: { pathname: redirectPath } }}
                  className={styles.btnPrimaryLg}
                >
                  {ru ? 'Участвовать бесплатно' : 'Enter for free'}
                </Link>
              </>
            )}

            {!loading && user && apiOffline && (
              <p className={styles.hint}>
                {ru
                  ? 'Сервер временно недоступен. Попробуйте позже.'
                  : 'Server temporarily offline. Try again later.'}
              </p>
            )}

            {!loading && !apiOffline && user && !entered && (
              <>
                <h2 className={styles.finalTitle}>{ru ? 'Готов участвовать?' : 'Ready to enter?'}</h2>
                <p className={styles.finalLead}>
                  {!state?.telegramConnected
                    ? (ru ? 'Подключи Telegram-бота в кабинете, затем подтверди участие.' : 'Connect the Telegram bot in your cabinet, then confirm.')
                    : (ru ? 'Проверь подписку на канал и нажми кнопку.' : 'Verify channel subscription and tap the button.')}
                </p>
                {!state?.telegramConnected && (
                  <Link to="/cabinet#telegram" className={styles.btnGhost}>
                    {ru ? 'Подключить Telegram →' : 'Connect Telegram →'}
                  </Link>
                )}
                <button
                  type="button"
                  className={styles.btnPrimaryLg}
                  disabled={busy || !state?.telegramConnected}
                  onClick={handleEnter}
                >
                  {ru ? 'Участвовать бесплатно' : 'Enter for free'}
                </button>
              </>
            )}

            {!loading && !apiOffline && user && entered && (
              <>
                <h2 className={styles.finalTitle}>{ru ? 'Ты уже в розыгрыше' : 'You’re already in'}</h2>
                <p className={styles.finalLead}>
                  {ru ? `Шансов: ${chances}. Увеличь их выше — реферал и шаринг.` : `Chances: ${chances}. Boost them above — referral & share.`}
                </p>
                <a href="#giveaway-chances" className={styles.btnSecondary}>
                  {ru ? 'К шансам' : 'Boost chances'}
                </a>
              </>
            )}
          </section>
        )}
      </div>
    </>
  )
}

export function Giveaway() {
  const { slug } = useParams()
  const { lang } = useLanguage()

  if (!slug) {
    return <Navigate to="/events" replace />
  }

  const giveaway = getGiveaway(slug)
  if (!giveaway || giveaway.status === 'upcoming') {
    return <Navigate to="/events" replace />
  }

  return (
    <div className={styles.wrap}>
      <GiveawayDetail giveaway={giveaway} lang={lang} />
    </div>
  )
}
