import { useState, useEffect, useCallback } from 'react'
import { api, checkApiOnline, getToken } from '../api/client'
import { getNotifications, getUnreadCount, markNotificationRead } from '../api/adminStore'

export function useUserNotifications(userEmail) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const load = useCallback(async () => {
    if (!userEmail) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    const online = await checkApiOnline()
    if (online && getToken()) {
      try {
        const list = await api.getNotifications()
        setNotifications(list)
        setUnreadCount(list.filter((n) => !n.read).length)
        return
      } catch (_) {}
    }
    const local = getNotifications().filter(
      (n) => n.email === userEmail || n.userId === userEmail
    )
    setNotifications(local)
    setUnreadCount(getUnreadCount(userEmail))
  }, [userEmail])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    window.addEventListener('lms-notifications-refresh', load)
    window.addEventListener('lms-admin-data-updated', load)
    return () => {
      clearInterval(interval)
      window.removeEventListener('lms-notifications-refresh', load)
      window.removeEventListener('lms-admin-data-updated', load)
    }
  }, [load])

  const markRead = useCallback(async (id) => {
    const online = await checkApiOnline()
    if (online && getToken()) {
      try {
        await api.markNotificationRead(id)
      } catch (_) {
        markNotificationRead(id)
      }
    } else {
      markNotificationRead(id)
    }
    await load()
  }, [load])

  return {
    notifications: notifications.slice(0, 15),
    unreadCount,
    refresh: load,
    markRead,
  }
}
