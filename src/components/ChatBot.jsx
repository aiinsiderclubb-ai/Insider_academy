import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import styles from './ChatBot.module.css'

function useChatGreeting(lang, t) {
  const [messages, setMessages] = useState([{ role: 'bot', text: t('chatbot.greeting') }])
  useEffect(() => {
    setMessages((prev) => prev.length === 1 && prev[0].role === 'bot'
      ? [{ role: 'bot', text: t('chatbot.greeting') }]
      : prev)
  }, [lang, t])
  return [messages, setMessages]
}

const BOT_REPLIES_RU = {
  привет: 'Привет! Чем могу помочь? Можете задать вопрос по курсам или оставить контакты для звонка.',
  звонок: 'Оставьте ваш номер телефона в сообщении — мы перезвоним в удобное время.',
  курс: 'У нас есть курсы по автоматизации, чат-ботам, голосовым агентам и AI. Откройте каталог на сайте.',
  каталог: 'Перейдите в раздел «Каталог» в меню — там все курсы с описаниями и ценами.',
  цена: 'Цены указаны в евро на странице каждого курса. Есть скидки и рассрочка.',
  default: 'Спасибо за сообщение! Мы ответим в ближайшее время. Для срочных вопросов оставьте номер телефона.',
}

const BOT_REPLIES_EN = {
  hi: 'Hi! How can I help? Ask about courses or leave your contact for a call.',
  call: 'Leave your phone number in the message — we will call you back.',
  course: 'We have courses on automation, chatbots, voice agents and AI. Open the Catalog on the site.',
  catalog: 'Go to the Catalog in the menu — all courses with descriptions and prices are there.',
  price: 'Prices are in euros on each course page. Discounts and installments available.',
  default: 'Thanks for your message! We will reply soon. For urgent questions leave your phone number.',
}

function getBotReply(text, lang) {
  const lower = (text || '').toLowerCase().trim()
  const replies = lang === 'en' ? BOT_REPLIES_EN : BOT_REPLIES_RU
  if (lang === 'en') {
    if (lower.includes('hi') || lower.includes('hello')) return replies.hi
    if (lower.includes('call') || lower.includes('phone')) return replies.call
    if (lower.includes('course') || lower.includes('courses')) return replies.course
    if (lower.includes('catalog')) return replies.catalog
    if (lower.includes('price') || lower.includes('cost')) return replies.price
  } else {
    if (lower.includes('привет')) return BOT_REPLIES_RU.привет
    if (lower.includes('звонок')) return BOT_REPLIES_RU.звонок
    if (lower.includes('курс')) return BOT_REPLIES_RU.курс
    if (lower.includes('каталог')) return BOT_REPLIES_RU.каталог
    if (lower.includes('цена')) return BOT_REPLIES_RU.цена
  }
  return replies.default
}

export function ChatBot({ open, onClose }) {
  const { t, lang } = useLanguage()
  const [messages, setMessages] = useChatGreeting(lang, t)
  const [input, setInput] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [open, messages])

  const send = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text }])
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'bot', text: getBotReply(text, lang) }])
    }, 600)
  }

  if (!open) return null

  return (
    <div className={styles.overlay} role="dialog" aria-label={t('chatbot.title')}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>{t('chatbot.title')}</span>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t('chatbot.close')}>×</button>
        </div>
        <div className={styles.messages} ref={listRef}>
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? styles.msgUser : styles.msgBot}>
              <span className={styles.msgBubble}>{m.text}</span>
            </div>
          ))}
        </div>
        <div className={styles.footer}>
          <input
            type="text"
            className={styles.input}
            placeholder={t('chatbot.placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button type="button" className={styles.sendBtn} onClick={send}>{t('chatbot.send')}</button>
        </div>
      </div>
    </div>
  )
}
