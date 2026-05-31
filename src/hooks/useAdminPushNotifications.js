import { useEffect, useRef } from 'react'

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
      try {
        new Notification('AI Insider Admin', {
          body: `Новых ДЗ на проверке: ${pendingHomeworkCount}`,
          icon: '/favicon.ico',
          tag: 'admin-hw-digest',
        })
      } catch (_) {}
    }

    prevCount.current = pendingHomeworkCount
    return undefined
  }, [pendingHomeworkCount, enabled])
}

export function requestAdminNotificationPermission() {
  if (typeof Notification === 'undefined') return Promise.resolve('unsupported')
  return Notification.requestPermission()
}
