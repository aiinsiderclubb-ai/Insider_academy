import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { api, checkApiOnline } from '../api/client'
import { Link } from 'react-router-dom'
import { SUPPORT_TELEGRAM_URL } from '../data/support'
import { CHATBOT_FAQ_RU, CHATBOT_FAQ_EN } from '../data/chatbotFaq'
import styles from './ChatBot.module.css'

const SUPPORT_STORAGE = 'lms_support_messages'

function loadLocalSupport(email) {
  try {
    const raw = localStorage.getItem(`${SUPPORT_STORAGE}_${email}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalSupport(email, messages) {
  try {
    localStorage.setItem(`${SUPPORT_STORAGE}_${email}`, JSON.stringify(messages))
  } catch (_) {}
}

function AiOrb({ small }) {
  return (
    <span className={small ? styles.orbSmall : styles.orb} aria-hidden>
      <span className={styles.orbCore} />
      <span className={styles.orbGlow} />
    </span>
  )
}

function TypingIndicator() {
  return (
    <div className={styles.typing} aria-label="typing">
      <span /><span /><span />
    </div>
  )
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChatBot({ open, onClose, initialTab = 'ai' }) {
  const { t, lang } = useLanguage()
  const { user, apiMode } = useAuth()
  const [tab, setTab] = useState(initialTab)
  const [messages, setMessages] = useState([{ role: 'bot', text: t('chatbot.greeting') }])
  const [supportMessages, setSupportMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab])

  useEffect(() => {
    if (!open || tab !== 'manager' || !user?.email) return
    const load = async () => {
      try {
        if (apiMode || await checkApiOnline()) {
          const rows = await api.getSupportMessages()
          const mapped = rows.flatMap((row) => {
            const items = [{ role: 'user', text: row.message, date: row.date }]
            if (row.reply) items.push({ role: 'bot', text: row.reply, date: row.date })
            return items
          })
          setSupportMessages(mapped.length ? mapped : [{ role: 'bot', text: t('chatbot.managerGreeting') }])
        } else {
          const local = loadLocalSupport(user.email)
          setSupportMessages(local.length ? local : [{ role: 'bot', text: t('chatbot.managerGreeting') }])
        }
      } catch {
        setSupportMessages([{ role: 'bot', text: t('chatbot.managerGreeting') }])
      }
    }
    load()
  }, [open, tab, user, apiMode, t])

  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [open, messages, supportMessages, tab, loading])

  const sendAi = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const next = [...messages, { role: 'user', text }]
    setMessages(next)
    setLoading(true)
    try {
      if ((apiMode || await checkApiOnline()) && user) {
        const apiMessages = next.filter((m) => m.role !== 'bot' || next.indexOf(m) > 0).map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text,
        }))
        const { reply } = await api.chat(apiMessages.slice(-10))
        setMessages((prev) => [...prev, { role: 'bot', text: reply }])
      } else if (!user) {
        setMessages((prev) => [...prev, { role: 'bot', text: t('chatbot.loginRequired') }])
      } else {
        setMessages((prev) => [...prev, { role: 'bot', text: t('chatbot.offlineAi') }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', text: t('chatbot.error') }])
    } finally {
      setLoading(false)
    }
  }

  const sendManager = async () => {
    const text = input.trim()
    if (!text || loading) return
    if (!user) {
      setSupportMessages((prev) => [...prev, { role: 'bot', text: t('chatbot.loginRequired') }])
      return
    }
    setInput('')
    const userMsg = { role: 'user', text }
    setSupportMessages((prev) => [...prev, userMsg])
    setLoading(true)
    try {
      if (apiMode || await checkApiOnline()) {
        await api.sendSupportMessage(text)
      } else {
        const next = [...loadLocalSupport(user.email), userMsg, { role: 'bot', text: t('chatbot.managerSent') }]
        saveLocalSupport(user.email, next)
      }
      setSupportMessages((prev) => [...prev, { role: 'bot', text: t('chatbot.managerSent') }])
    } catch {
      setSupportMessages((prev) => [...prev, { role: 'bot', text: t('chatbot.error') }])
    } finally {
      setLoading(false)
    }
  }

  const send = () => (tab === 'ai' ? sendAi() : sendManager())

  if (!open) return null

  const activeMessages = tab === 'ai' ? messages : supportMessages
  const statusLabel = tab === 'ai' ? t('chatbot.statusAi') : t('chatbot.statusManager')

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={t('chatbot.title')}>
      <button type="button" className={styles.backdrop} onClick={onClose} aria-label={t('chatbot.close')} />
      <div className={styles.panel}>
        <div className={styles.panelGlow} aria-hidden />
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <AiOrb />
            <div className={styles.headerText}>
              <span className={styles.headerTitle}>{t('chatbot.title')}</span>
              <span className={styles.headerStatus}>
                <span className={styles.statusDot} />
                {statusLabel}
              </span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t('chatbot.close')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className={styles.tabBar} role="tablist">
          <div className={styles.tabTrack} data-active={tab}>
            <span className={styles.tabIndicator} aria-hidden />
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'ai'}
              className={styles.tabBtn}
              onClick={() => setTab('ai')}
            >
              <span className={styles.tabIcon}>✦</span>
              {t('chatbot.tabAi')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'manager'}
              className={styles.tabBtn}
              onClick={() => setTab('manager')}
            >
              <span className={styles.tabIcon}>◎</span>
              {t('chatbot.tabManager')}
            </button>
          </div>
        </div>

        {tab === 'manager' && (
          <div className={styles.managerBar}>
            <a href={SUPPORT_TELEGRAM_URL} target="_blank" rel="noreferrer noopener" className={styles.telegramLink}>
              <span className={styles.telegramPulse} />
              {t('chatbot.openTelegram')}
            </a>
          </div>
        )}

        {tab === 'ai' && (
          <div className={styles.faqRow}>
            {(lang === 'ru' ? CHATBOT_FAQ_RU : CHATBOT_FAQ_EN).map((item) => (
              <Link key={item.q} to={item.link} className={styles.faqChip} onClick={onClose}>
                {item.q}
              </Link>
            ))}
          </div>
        )}

        <div className={styles.messages} ref={listRef}>
          {activeMessages.map((m, i) => (
            <div
              key={`${i}-${m.text.slice(0, 12)}`}
              className={m.role === 'user' ? styles.msgRowUser : styles.msgRowBot}
            >
              {m.role === 'bot' && <AiOrb small />}
              <div className={m.role === 'user' ? styles.bubbleUser : styles.bubbleBot}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className={styles.msgRowBot}>
              <AiOrb small />
              <div className={styles.bubbleBot}>
                <TypingIndicator />
              </div>
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <div className={styles.inputWrap}>
            <input
              type="text"
              className={styles.input}
              placeholder={tab === 'ai' ? t('chatbot.placeholder') : t('chatbot.managerPlaceholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={loading}
            />
            <button
              type="button"
              className={styles.sendBtn}
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label={t('chatbot.send')}
            >
              <SendIcon />
            </button>
          </div>
          <p className={styles.footerHint}>{t('chatbot.poweredBy')}</p>
        </footer>
      </div>
    </div>
  )
}
