import { getAdminToken } from '../api/client'

export const ADMIN_ROLE_KEY = 'lms_admin_role'

export const ROLE_LABELS = {
  admin: 'Администратор',
  editor: 'Редактор',
  moderator: 'Модератор',
}

export const TAB_PERMISSIONS = {
  admin: ['dashboard', 'roadmap', 'analytics', 'settings', 'registrations', 'purchases', 'referrals', 'homework', 'reviews', 'certificates', 'courses', 'blog', 'calendar'],
  editor: ['dashboard', 'roadmap', 'courses', 'blog', 'calendar'],
  moderator: ['dashboard', 'homework', 'reviews', 'certificates', 'registrations', 'purchases'],
}

export function getAdminRole() {
  try {
    const stored = localStorage.getItem(ADMIN_ROLE_KEY)
    if (stored && TAB_PERMISSIONS[stored]) return stored
    const token = getAdminToken()
    if (!token) return 'admin'
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return TAB_PERMISSIONS[payload.role] ? payload.role : 'admin'
  } catch {
    return 'admin'
  }
}

export function setAdminRole(role) {
  if (role) localStorage.setItem(ADMIN_ROLE_KEY, role)
  else localStorage.removeItem(ADMIN_ROLE_KEY)
}

export function canAccessTab(role, tabId) {
  const allowed = TAB_PERMISSIONS[role] || TAB_PERMISSIONS.admin
  return allowed.includes(tabId)
}

export function resolveLocalRole(password) {
  if (password === 'admin123') return 'admin'
  if (password === 'editor123') return 'editor'
  if (password === 'moderator123') return 'moderator'
  return null
}
