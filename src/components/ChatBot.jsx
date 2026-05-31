import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { api, checkApiOnline } from '../api/client'
import { SUPPORT_TELEGRAM_URL } from '../data/support'
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
  }, [open, messages, supportMessages, tab])

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

  return (
    <div className={styles.overlay} role="dialog" aria-label={t('chatbot.title')}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <span className={styles.headerTitle}>{t('chatbot.title')}</span>
            <div className={styles.tabs}>
              <button type="button" className={tab === 'ai' ? styles.tabActive : styles.tab} onClick={() => setTab('ai')}>
                {t('chatbot.tabAi')}
              </button>
              <button type="button" className={tab === 'manager' ? styles.tabActive : styles.tab} onClick={() => setTab('manager')}>
                {t('chatbot.tabManager')}
              </button>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t('chatbot.close')}>×</button>
        </div>

        {tab === 'manager' && (
          <div className={styles.managerBar}>
            <a href={SUPPORT_TELEGRAM_URL} target="_blank" rel="noreferrer noopener" className={styles.telegramLink}>
              {t('chatbot.openTelegram')}
            </a>
          </div>
        )}

        <div className={styles.messages} ref={listRef}>
          {activeMessages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? styles.msgUser : styles.msgBot}>
              <span className={styles.msgBubble}>{m.text}</span>
            </div>
          ))}
          {loading && <div className={styles.msgBot}><span className={styles.msgBubble}>...</span></div>}
        </div>

        <div className={styles.footer}>
          <input
            type="text"
            className={styles.input}
            placeholder={tab === 'ai' ? t('chatbot.placeholder') : t('chatbot.managerPlaceholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            disabled={loading}
          />
          <button type="button" className={styles.sendBtn} onClick={send} disabled={loading}>{t('chatbot.send')}</button>
        </div>
      </div>
    </div>
  )
}
