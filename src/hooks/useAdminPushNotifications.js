import { useEffect, useRef } from 'react'

const STALE_APPS_STORAGE_KEY = 'admin-stale-apps-notified'

function notifyAdmin(title, body, tag) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag,
    })
  } catch (_) {}
}

export function useAdminPushNotifications(pendingHomeworkCount, enabled = true) {
  const prevCount = useRef(null)

  useEffect(() => {
    if (!enabled || typeof Notification === 'undefined') return undefined

    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }

    if (Notification.permission !== 'granted') return undefined
    if (pendingHomeworkCount <= 0) {
      prevCount.current = pendingHomeworkCount
      return undefined
    }

    if (prevCount.current != null && pendingHomeworkCount > prevCount.current) {
      notifyAdmin('AI Insider Admin', `Новых ДЗ на проверке: ${pendingHomeworkCount}`, 'admin-hw-digest')
    }

    prevCount.current = pendingHomeworkCount
    return undefined
  }, [pendingHomeworkCount, enabled])
}

export function useAdminStaleApplicationAlert(staleCount, enabled = true) {
  useEffect(() => {
    if (!enabled || staleCount <= 0 || typeof Notification === 'undefined') return undefined
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
    if (Notification.permission !== 'granted') return undefined

    const today = new Date().toDateString()
    const last = localStorage.getItem(STALE_APPS_STORAGE_KEY)
    if (last === today) return undefined

    notifyAdmin(
      'AI Insider Admin',
      `${staleCount} заявок в статусе «Новая» более 24 часов — проверьте раздел «Набор».`,
      'admin-stale-apps'
    )
    localStorage.setItem(STALE_APPS_STORAGE_KEY, today)
    return undefined
  }, [staleCount, enabled])
}

export function requestAdminNotificationPermission() {
  if (typeof Notification === 'undefined') return Promise.resolve('unsupported')
  return Notification.requestPermission()
}
