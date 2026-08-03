import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { getCalendarEvents } from '../api/calendarStore'
import styles from './Calendar.module.css'

const WEEKDAYS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getDaysInMonth(year, month) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = first.getDay()
  const days = last.getDate()
  const cells = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d))
  return cells
}

export function Calendar() {
  const { t, lang } = useLanguage()
  const [rawEvents, setRawEvents] = useState(getCalendarEvents)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  useEffect(() => {
    const handler = () => setRawEvents(getCalendarEvents())
    window.addEventListener('lms-calendar-updated', handler)
    return () => window.removeEventListener('lms-calendar-updated', handler)
  }, [])

  const events = useMemo(() => {
    return rawEvents.map((e) => {
      const date = typeof e.date === 'string' ? new Date(e.date) : e.date
      return {
        date,
        title: lang === 'en' ? (e.titleEn || e.title) : e.title,
        description: lang === 'en' ? (e.descriptionEn || e.description) : e.description,
        type: e.type || 'webinar',
      }
    })
  }, [rawEvents, lang])

  const locale = lang === 'en' ? 'en-US' : 'ru-RU'
  const monthLabel = currentMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  const calendarDays = useMemo(
    () => getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth]
  )
  const now = new Date()
  const weekdays = lang === 'en' ? WEEKDAYS_EN : WEEKDAYS_RU

  const prevMonth = () => {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  const nextMonth = () => {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  const getEventsForDay = (day) => {
    if (!day) return []
    return events.filter((e) => {
      const ed = new Date(e.date)
      return ed.getDate() === day.getDate() && ed.getMonth() === day.getMonth() && ed.getFullYear() === day.getFullYear()
    })
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <header className={styles.pageHead}>
          <div>
            <span className={styles.eyebrow}>{lang === 'ru' ? 'Учебный ритм' : 'Learning rhythm'}</span>
            <h1 className={styles.title}>{t('calendar.title')}</h1>
            <p className={styles.desc}>{t('calendar.desc')}</p>
          </div>
          <div className={styles.todayCard} aria-label={lang === 'ru' ? 'Сегодня' : 'Today'}>
            <span>{lang === 'ru' ? 'Сегодня' : 'Today'}</span>
            <strong>{now.getDate()}</strong>
            <small>{now.toLocaleDateString(locale, { month: 'long', weekday: 'short' })}</small>
          </div>
        </header>

        <section className={styles.section}>
          <div className={styles.monthNav}>
            <button type="button" className={styles.monthBtn} onClick={prevMonth} aria-label={t('calendar.prevMonth')}>
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <h2 className={styles.monthTitle}>{monthLabel}</h2>
            <button type="button" className={styles.monthBtn} onClick={nextMonth} aria-label={t('calendar.nextMonth')}>
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
          <div className={styles.calendarGrid}>
            {weekdays.map((wd) => (
              <div key={wd} className={styles.weekdayHead}>{wd}</div>
            ))}
            {calendarDays.map((day, i) => {
              const dayEvents = day ? getEventsForDay(day) : []
              const isToday = day && day.toDateString() === now.toDateString()
              return (
                <div
                  key={i}
                  className={`${styles.calendarCell} ${!day ? styles.calendarCellEmpty : ''} ${isToday ? styles.calendarCellToday : ''} ${dayEvents.length ? styles.calendarCellHasEvent : ''}`}
                >
                  {day && (
                    <>
                      <span className={styles.cellDay}>{day.getDate()}</span>
                      {dayEvents.length > 0 && (
                        <div className={styles.cellEvents}>
                          {dayEvents.map((ev) => (
                            <span key={ev.title + String(ev.date)} className={styles.cellWebinar}>
                              <i aria-hidden="true" /> {ev.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('calendar.upcoming')}</h2>
          {events.length > 0 ? (
            <ul className={styles.eventList}>
              {events.map((e) => (
                <li key={String(e.date) + e.title} className={styles.eventItem}>
                  <time className={styles.eventDate} dateTime={e.date.toISOString()}>
                    <strong>{new Date(e.date).toLocaleDateString(locale, { day: '2-digit' })}</strong>
                    <span>{new Date(e.date).toLocaleDateString(locale, {
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}</span>
                  </time>
                  <span className={styles.eventInfo}>
                    <span className={styles.eventTitle}><i aria-hidden="true" /> {e.title}</span>
                    {e.description && <small>{e.description}</small>}
                  </span>
                  <span className={styles.eventWebinar}>{t('calendar.webinar')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>
              <p>{lang === 'ru' ? 'На этот период событий пока нет.' : 'No events scheduled for this period.'}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
