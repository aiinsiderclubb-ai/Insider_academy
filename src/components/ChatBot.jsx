import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { api, checkApiOnline } from '../api/client'
import styles from './ChatBot.module.css'

export function ChatBot({ open, onClose }) {
  const { t, lang } = useLanguage()
  const { user, apiMode } = useAuth()
  const [messages, setMessages] = useState([{ role: 'bot', text: t('chatbot.greeting') }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [open, messages])

  const send = async () => {
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
      } else {
        setMessages((prev) => [...prev, { role: 'bot', text: lang === 'ru' ? 'Войдите в аккаунт для AI-чата или запустите сервер API.' : 'Log in for AI chat or start the API server.' }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', text: lang === 'ru' ? 'Ошибка AI. Попробуйте позже.' : 'AI error. Try again later.' }])
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className={styles.overlay} role="dialog" aria-label={t('chatbot.title')}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>{t('chatbot.title')} · AI</span>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t('chatbot.close')}>×</button>
        </div>
        <div className={styles.messages} ref={listRef}>
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? styles.msgUser : styles.msgBot}>
              <span className={styles.msgBubble}>{m.text}</span>
            </div>
          ))}
          {loading && <div className={styles.msgBot}><span className={styles.msgBubble}>...</span></div>}
        </div>
        <div className={styles.footer}>
          <input type="text" className={styles.input} placeholder={t('chatbot.placeholder')} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} disabled={loading} />
          <button type="button" className={styles.sendBtn} onClick={send} disabled={loading}>{t('chatbot.send')}</button>
        </div>
      </div>
    </div>
  )
}
