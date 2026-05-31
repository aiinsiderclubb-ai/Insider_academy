// Хранение данных для админ-панели (localStorage, без бэкенда)

import { canLeaveCourseReview } from '../data/testAccount.js'
import { getCourseById } from '../data/courses.js'

const KEY_REG = 'lms_admin_registrations'
const KEY_CERT = 'lms_admin_certificates'
const KEY_PURCH = 'lms_admin_purchases'
const KEY_ANALYTICS = 'lms_analytics'
const KEY_REFERRALS = 'lms_referrals'
const KEY_DISCOUNTS = 'lms_referral_discounts'
const KEY_HOMEWORK = 'lms_homework_submissions'
const KEY_NOTIFICATIONS = 'lms_notifications'
const KEY_ADMIN_SEEN = 'lms_admin_seen'
const PURCHASES_KEY = 'lms_purchases'

function loadLocalPurchases() {
  try {
    const data = localStorage.getItem(PURCHASES_KEY)
    if (!data) return []
    const parsed = JSON.parse(data)
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (typeof parsed[0] === 'object' && parsed[0].id != null) return parsed
      return parsed.map((id) => ({ id, purchasedAt: new Date().toISOString() }))
    }
    return []
  } catch {
    return []
  }
}

function getJson(key, def = []) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : def
  } catch {
    return def
  }
}

function setJson(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('lms-admin-data-updated'))
    }
  } catch (_) {}
}

function ensureText(value, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function normalizeEmail(email) {
  return ensureText(email).trim().toLowerCase()
}

function getAdminSeenState() {
  return getJson(KEY_ADMIN_SEEN, {
    registrations: [],
    purchases: [],
    certificates: [],
    homework: [],
  })
}

function getAdminItemKey(type, item = {}) {
  switch (type) {
    case 'registrations':
      return `reg:${ensureText(item.email).toLowerCase()}`
    case 'purchases':
      return `purchase:${ensureText(item.email).toLowerCase()}:${ensureText(item.courseId)}:${ensureText(item.date)}`
    case 'certificates':
      return `cert:${ensureText(item.email).toLowerCase()}:${ensureText(item.courseId)}`
    case 'homework':
      return `hw:${ensureText(item.id)}`
    default:
      return `${type}:${ensureText(item.id || item.email || item.date)}`
  }
}

export function isAdminItemSeen(type, item) {
  const seen = getAdminSeenState()
  const list = Array.isArray(seen[type]) ? seen[type] : []
  return list.includes(getAdminItemKey(type, item))
}

export function markAdminItemSeen(type, item) {
  const seen = getAdminSeenState()
  const key = getAdminItemKey(type, item)
  const list = Array.isArray(seen[type]) ? seen[type] : []
  if (!list.includes(key)) {
    seen[type] = [...list, key]
    setJson(KEY_ADMIN_SEEN, seen)
  }
}

export function markAdminItemsSeen(type, items) {
  const seen = getAdminSeenState()
  const list = new Set(Array.isArray(seen[type]) ? seen[type] : [])
  items.forEach((item) => list.add(getAdminItemKey(type, item)))
  seen[type] = [...list]
  setJson(KEY_ADMIN_SEEN, seen)
}

export function getRegistrations() {
  return getJson(KEY_REG)
}

export function getCertificates() {
  return getJson(KEY_CERT)
}

export function getPurchases() {
  return getJson(KEY_PURCH)
}

export function recordRegistration({ email, name }) {
  const list = getRegistrations()
  if (list.some((r) => r.email === email)) return
  list.unshift({
    id: createId('reg'),
    email: email || '',
    name: name || email || '',
    date: new Date().toISOString(),
  })
  setJson(KEY_REG, list.slice(0, 500))
}

export function recordCertificate({ email, courseId, courseTitle, fileName = null, fileType = null, fileDataUrl = null, score = null, notify = true }) {
  const list = getCertificates()
  const idx = list.findIndex((c) => c.email === email && c.courseId === courseId)
  const now = new Date().toISOString()
  const normalizedEmail = email || ''
  const normalizedCourseId = courseId || ''
  const normalizedCourseTitle = courseTitle || ''
  const existing = idx >= 0 ? list[idx] : null

  if (existing) {
    list[idx] = {
      ...existing,
      courseTitle: normalizedCourseTitle || existing.courseTitle,
      fileName: fileName || existing.fileName || null,
      fileType: fileType || existing.fileType || null,
      fileDataUrl: fileDataUrl || existing.fileDataUrl || null,
      score: score != null ? score : (existing.score ?? null),
      updatedAt: now,
    }
  } else {
    list.unshift({
      id: createId('cert'),
      email: normalizedEmail,
      courseId: normalizedCourseId,
      courseTitle: normalizedCourseTitle,
      fileName: fileName || null,
      fileType: fileType || null,
      fileDataUrl: fileDataUrl || null,
      score: score != null ? score : null,
      date: now,
      updatedAt: now,
    })
  }
  setJson(KEY_CERT, list.slice(0, 500))

  const shouldNotify = notify && normalizedEmail && (
    !existing || (!existing.fileDataUrl && Boolean(fileDataUrl))
  )
  if (shouldNotify) {
    addNotification({
      email: normalizedEmail,
      type: 'certificate_added',
      courseId: normalizedCourseId,
      courseTitle: normalizedCourseTitle || existing?.courseTitle || '',
      targetPath: '/cabinet#certificates',
      message: fileName
        ? 'Сертификат добавлен и доступен для открытия.'
        : 'Сертификат добавлен в ваш кабинет.',
    })
  }
}

export function recordPurchase({ email, courseId, courseTitle, amount }) {
  const list = getPurchases()
  list.unshift({
    id: createId('purchase'),
    email: email || '',
    courseId: courseId || '',
    courseTitle: courseTitle || '',
    amount: amount != null ? amount : null,
    date: new Date().toISOString(),
  })
  setJson(KEY_PURCH, list.slice(0, 500))
}

// ——— Аналитика ———
function getAnalytics() {
  try {
    const raw = localStorage.getItem(KEY_ANALYTICS)
    return raw ? JSON.parse(raw) : { visits: 0, courseClicks: {} }
  } catch {
    return { visits: 0, courseClicks: {} }
  }
}

export function getAnalyticsData() {
  return getAnalytics()
}

export function trackVisit() {
  const data = getAnalytics()
  data.visits = (data.visits || 0) + 1
  try {
    localStorage.setItem(KEY_ANALYTICS, JSON.stringify(data))
  } catch (_) {}
}

export function trackCourseClick(courseId) {
  const data = getAnalytics()
  data.courseClicks = data.courseClicks || {}
  data.courseClicks[courseId] = (data.courseClicks[courseId] || 0) + 1
  try {
    localStorage.setItem(KEY_ANALYTICS, JSON.stringify(data))
  } catch (_) {}
}

// ——— Рефералы ———
export function getReferrals() {
  return getJson(KEY_REFERRALS)
}

export function getDiscounts() {
  try {
    const raw = localStorage.getItem(KEY_DISCOUNTS)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function recordReferral({ referrerCode, referrerEmail, referredEmail }) {
  const list = getReferrals()
  if (list.some((r) => r.referredEmail === referredEmail)) return
  list.unshift({
    referrerCode,
    referrerEmail: referrerEmail || '',
    referredEmail: referredEmail || '',
    date: new Date().toISOString(),
    referredPurchased: false,
  })
  setJson(KEY_REFERRALS, list.slice(0, 500))
}

export function markReferredPurchased(referredEmail) {
  const list = getReferrals()
  const idx = list.findIndex((r) => r.referredEmail === referredEmail)
  if (idx >= 0) list[idx].referredPurchased = true
  setJson(KEY_REFERRALS, list)
  const discounts = getDiscounts()
  const ref = list.find((r) => r.referredEmail === referredEmail)
  if (ref && ref.referrerEmail) {
    discounts[ref.referrerEmail] = (discounts[ref.referrerEmail] || 0) + 5
    try {
      localStorage.setItem(KEY_DISCOUNTS, JSON.stringify(discounts))
    } catch (_) {}
  }
}

export function addReferralDiscount(email, percent) {
  const discounts = getDiscounts()
  discounts[email] = (discounts[email] || 0) + percent
  try {
    localStorage.setItem(KEY_DISCOUNTS, JSON.stringify(discounts))
  } catch (_) {}
}

export function getUserDiscountPercent(email) {
  const d = getDiscounts()
  return d[email] || 0
}

// ——— Домашние задания ———
export function getHomeworkSubmissions() {
  return getJson(KEY_HOMEWORK)
}

export function recordHomeworkSubmission({
  email,
  name,
  courseId,
  courseTitle,
  lessonIndex,
  lessonTitle,
  content,
  fileName = null,
  fileType = null,
  fileDataUrl = null,
}) {
  const list = getHomeworkSubmissions()
  const normalizedEmail = normalizeEmail(email)
  const existingIndex = list.findIndex(
    (h) => normalizeEmail(h.email) === normalizedEmail && h.courseId === courseId && h.lessonIndex === lessonIndex
  )
  const now = new Date().toISOString()
  const nextItem = {
    id: existingIndex >= 0 ? list[existingIndex].id : createId('hw'),
    email: email || '',
    name: name || '',
    courseId: courseId || '',
    courseTitle: courseTitle || '',
    lessonIndex: lessonIndex ?? 0,
    lessonTitle: lessonTitle || '',
    content: content || '',
    fileName,
    fileType,
    fileDataUrl,
    status: 'pending',
    score: null,
    adminComment: null,
    date: existingIndex >= 0 ? list[existingIndex].date : now,
    updatedAt: now,
  }
  if (existingIndex >= 0) {
    list.splice(existingIndex, 1)
  }
  list.unshift(nextItem)
  setJson(KEY_HOMEWORK, list.slice(0, 300))
  return nextItem.id
}

export function updateHomeworkSubmission(id, { status, adminComment, score }) {
  const list = getHomeworkSubmissions()
  const idx = list.findIndex((h) => h.id === id)
  if (idx < 0) return
  if (status) list[idx].status = status
  if (adminComment !== undefined) list[idx].adminComment = adminComment
  if (score !== undefined) list[idx].score = score
  list[idx].updatedAt = new Date().toISOString()
  setJson(KEY_HOMEWORK, list)
}

export function getHomeworkByUserAndLesson(email, courseId, lessonIndex) {
  const list = getHomeworkSubmissions()
  return list.find(
    (h) => normalizeEmail(h.email) === normalizeEmail(email) && h.courseId === courseId && h.lessonIndex === lessonIndex
  ) || null
}

export function getCourseAverageScore(email, courseId) {
  const list = getHomeworkSubmissions().filter(
    (h) => normalizeEmail(h.email) === normalizeEmail(email) && h.courseId === courseId && typeof h.score === 'number'
  )
  if (list.length === 0) return null
  const total = list.reduce((sum, item) => sum + item.score, 0)
  return Math.round((total / list.length) * 10) / 10
}

// ——— Уведомления (ответы по ДЗ) ———
export function getNotifications() {
  return getJson(KEY_NOTIFICATIONS)
}

export function addNotification({ userId, email, type, status, courseId, courseSlug, courseTitle, lessonTitle, lessonIndex, message, targetPath }) {
  const list = getNotifications()
  list.unshift({
    id: createId('n'),
    userId: userId || email,
    email: email || '',
    type: type || 'homework_feedback',
    status: status || '',
    courseId: courseId || '',
    courseSlug: courseSlug || '',
    courseTitle: courseTitle || '',
    lessonTitle: lessonTitle || '',
    lessonIndex: lessonIndex ?? 0,
    targetPath: targetPath || '',
    message: message || '',
    read: false,
    date: new Date().toISOString(),
  })
  setJson(KEY_NOTIFICATIONS, list.slice(0, 200))
}

export function markNotificationRead(id) {
  const list = getNotifications()
  const idx = list.findIndex((n) => n.id === id)
  if (idx >= 0) list[idx].read = true
  setJson(KEY_NOTIFICATIONS, list)
}

export function getUnreadCount(email) {
  const list = getNotifications()
  return list.filter((n) => (n.email === email || n.userId === email) && !n.read).length
}

// ——— Отзывы ———
const KEY_REVIEWS = 'lms_reviews'
const KEY_APPLICATIONS = 'lms_accelerator_applications'

export function getReviewSubmissions() {
  return getJson(KEY_REVIEWS)
}

function mapReviewForPublic(r) {
  const course = getCourseById(r.courseId)
  const mask = (email) => {
    if (!email?.includes('@')) return ''
    const [local, domain] = email.split('@')
    if (local.length <= 1) return `*@${domain}`
    return `${local[0]}***${local[local.length - 1]}@${domain}`
  }
  return {
    id: r.id,
    courseId: r.courseId,
    courseTitle: course?.title || r.courseId,
    courseTitleEn: course?.titleEn || course?.title || r.courseId,
    courseSlug: course?.slug || r.courseId,
    userName: r.userName,
    rating: r.rating,
    text: r.text,
    date: r.date,
    emailMasked: mask(r.contactEmail || r.email),
  }
}

export function getPublicReviews(courseId) {
  const list = getReviewSubmissions().filter(
    (r) => r.status === 'approved' && r.courseId === courseId && String(r.text || '').trim()
  )
  const count = list.length
  const average = count ? Math.round((list.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : null
  return {
    reviews: list.map(mapReviewForPublic),
    average,
    count,
  }
}

export function getFeaturedReviews(limit = 12) {
  const approved = getReviewSubmissions().filter((r) => r.status === 'approved' && String(r.text || '').trim())
  const list = [...approved].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit)
  const count = approved.length
  const average = count
    ? Math.round((approved.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : null
  return {
    reviews: list.map(mapReviewForPublic),
    average,
    count,
  }
}

export function recordReviewSubmission({ courseId, email, contactEmail, userName, rating, text, userId, purchases }) {
  const owned = purchases ?? loadLocalPurchases()
  if (!canLeaveCourseReview(courseId, owned)) {
    throw new Error('Review requires purchasing this course')
  }
  const list = getReviewSubmissions()
  const item = {
    id: createId('rev'),
    courseId,
    email: email || '',
    contactEmail: contactEmail || email || '',
    userName: userName || '',
    userId: userId || null,
    rating,
    text: text || '',
    status: 'pending',
    date: new Date().toISOString(),
  }
  list.unshift(item)
  setJson(KEY_REVIEWS, list.slice(0, 500))
  return item
}

export function updateReviewSubmission(id, { status }) {
  const list = getReviewSubmissions()
  const idx = list.findIndex((r) => r.id === id)
  if (idx < 0) return null
  if (status) list[idx].status = status
  setJson(KEY_REVIEWS, list)
  return list[idx]
}

export function deleteReviewSubmission(id) {
  const list = getReviewSubmissions()
  const next = list.filter((r) => r.id !== id)
  if (next.length === list.length) return false
  setJson(KEY_REVIEWS, next)
  return true
}

export function getAcceleratorApplications() {
  return getJson(KEY_APPLICATIONS)
}

export function recordAcceleratorApplication(payload) {
  const list = getAcceleratorApplications()
  const item = {
    id: createId('app'),
    status: 'new',
    date: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...payload,
  }
  list.unshift(item)
  setJson(KEY_APPLICATIONS, list.slice(0, 500))
  return item
}

export function updateAcceleratorApplication(id, { status, adminNote }) {
  const list = getAcceleratorApplications()
  const idx = list.findIndex((a) => a.id === id)
  if (idx < 0) return null
  if (status) list[idx].status = status
  if (adminNote !== undefined) list[idx].adminNote = adminNote
  list[idx].updatedAt = new Date().toISOString()
  setJson(KEY_APPLICATIONS, list)
  return list[idx]
}
