import { useEffect, useState } from 'react'
import { UiIcon } from './UiIcon'
import styles from './HeroProductPreview.module.css'

const SCRIPT = [
  { role: 'user', ru: 'Нужен агент, который квалифицирует лиды в Telegram', en: 'I need an agent that qualifies leads in Telegram' },
  { role: 'agent', ru: 'Соберу воркфлоу: триггер → квалификация → CRM. Какой критерий «горячего» лида?', en: 'I’ll build: trigger → qualify → CRM. What’s your hot-lead criteria?' },
  { role: 'user', ru: 'Бюджет от 500€ и срок до 14 дней', en: 'Budget from €500 and timeline under 14 days' },
  { role: 'agent', ru: 'Готово. Черновик агента в кабинете — можете открыть урок и донастроить промпт.', en: 'Done. Draft agent is in your cabinet — open the lesson and tune the prompt.' },
]

/**
 * Mock product window: AI agent chat with typewriter — looks live, no backend.
 */
export function HeroProductPreview({ lang = 'ru' }) {
  const ru = lang === 'ru'
  const [visible, setVisible] = useState(0)
  const [typed, setTyped] = useState('')
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setVisible(SCRIPT.length)
      setTyped(ru ? SCRIPT[SCRIPT.length - 1].ru : SCRIPT[SCRIPT.length - 1].en)
      return undefined
    }

    let cancelled = false
    let timer

    const run = async () => {
      setVisible(0)
      setTyped('')
      for (let i = 0; i < SCRIPT.length; i += 1) {
        if (cancelled) return
        const full = ru ? SCRIPT[i].ru : SCRIPT[i].en
        setTyping(SCRIPT[i].role === 'agent')
        setVisible(i)
        setTyped('')
        for (let c = 0; c <= full.length; c += 1) {
          if (cancelled) return
          setTyped(full.slice(0, c))
          await new Promise((r) => { timer = setTimeout(r, SCRIPT[i].role === 'agent' ? 18 : 12) })
        }
        setTyping(false)
        await new Promise((r) => { timer = setTimeout(r, 700) })
      }
      await new Promise((r) => { timer = setTimeout(r, 2400) })
      if (!cancelled) run()
    }

    run()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [ru])

  return (
    <div className={styles.window} aria-hidden>
      <div className={styles.titlebar}>
        <span className={styles.dots}>
          <i /><i /><i />
        </span>
        <span className={styles.title}>
          <UiIcon name="bot" variant="chip" tone="accent" />
          {ru ? 'AI Agent · кабинет' : 'AI Agent · cabinet'}
        </span>
        <span className={styles.live}>{ru ? 'live' : 'live'}</span>
      </div>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <span className={styles.sideLabel}>{ru ? 'Сегодня' : 'Today'}</span>
          <div className={styles.sideItem}>
            <UiIcon name="bookOpen" variant="chip" tone="secondary" />
            <span>{ru ? 'Урок 4 · Агенты' : 'Lesson 4 · Agents'}</span>
          </div>
          <div className={`${styles.sideItem} ${styles.sideActive}`}>
            <UiIcon name="messagesSquare" variant="chip" tone="accent" />
            <span>{ru ? 'Чат агента' : 'Agent chat'}</span>
          </div>
          <div className={styles.sideItem}>
            <UiIcon name="target" variant="chip" tone="secondary" />
            <span>{ru ? 'ДЗ на проверке' : 'HW in review'}</span>
          </div>
          <div className={styles.progress}>
            <span>{ru ? 'Прогресс' : 'Progress'}</span>
            <div className={styles.bar}><i style={{ width: '62%' }} /></div>
            <strong>62%</strong>
          </div>
        </aside>

        <div className={styles.chat}>
          {SCRIPT.slice(0, visible + 1).map((msg, i) => {
            const isLast = i === visible
            const text = isLast ? typed : (ru ? msg.ru : msg.en)
            return (
              <div
                key={`${msg.role}-${i}`}
                className={`${styles.bubble} ${msg.role === 'user' ? styles.user : styles.agent}`}
              >
                {text}
                {isLast && (typing || msg.role === 'agent') && <span className={styles.caret} />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
