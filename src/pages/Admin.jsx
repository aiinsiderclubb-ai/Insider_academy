import { Fragment, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Camera, CheckCircle2, Clock3, LockKeyhole, RefreshCw } from 'lucide-react'
import {
  getRegistrations,
  getCertificates,
  getPurchases,
  getAnalyticsData,
  getReferrals,
  getDiscounts,
  getHomeworkSubmissions,
  getReviewSubmissions,
  getAcceleratorApplications,
  updateHomeworkSubmission,
  addNotification,
  recordCertificate,
  getCourseAverageScore,
  isAdminItemSeen,
  markAdminItemSeen,
  markAdminItemsSeen,
} from '../api/adminStore'
import { getCourses, setCourses as persistCourses } from '../api/courseStore'
import { getBlogPosts, setBlogPosts } from '../api/blogStore'
import { getCalendarEvents, setCalendarEvents } from '../api/calendarStore'
import { api, setAdminToken, getAdminToken } from '../api/client'
import { useApi } from '../context/ApiContext'
import { ACCELERATOR_ADMIN_TAB } from '../data/acceleratorApplication'
import { courses as defaultCourses } from '../data/courses'
import { blogPosts as defaultBlog } from '../data/blog'
import { AdminSidebar } from '../components/admin/AdminSidebar'
import { AdminDashboard } from '../components/admin/AdminDashboard'
import { AdminRoadmap } from '../components/admin/AdminRoadmap'
import { AdminReviewsPanel } from '../components/admin/AdminReviewsPanel'
import { AdminApplicationsPanel } from '../components/admin/AdminApplicationsPanel'
import { AdminInbox } from '../components/admin/AdminInbox'
import { AdminUserDrawer } from '../components/admin/AdminUserDrawer'
import { AdminToolsPanel } from '../components/admin/AdminToolsPanel'
import { AdminToast } from '../components/admin/AdminToast'
import { AdminSearchBar, matchesSearch } from '../components/admin/AdminSearchBar'
import { AdminBlogEditor } from '../components/admin/AdminBlogEditor'
import { AdminSettings } from '../components/admin/AdminSettings'
import { AdminCharts } from '../components/admin/AdminCharts'
import { LessonDragList } from '../components/admin/LessonDragList'
import { useAdminPushNotifications, useAdminStaleApplicationAlert, requestAdminNotificationPermission } from '../hooks/useAdminPushNotifications'
import { getAdminRole, setAdminRole, canAccessTab, resolveLocalRole, ROLE_LABELS } from '../utils/adminAuth'
import styles from './Admin.module.css'

const SEARCH_TABS = new Set(['registrations', 'purchases', 'homework', 'reviews', ACCELERATOR_ADMIN_TAB, 'certificates', 'referrals', 'courses', 'blog'])

function exportCsv(filename, rows, headers) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [headers.map(escape).join(',')]
  rows.forEach((row) => lines.push(row.map(escape).join(',')))
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function canPreviewFile(fileType) {
  return Boolean(
    fileType && (
      fileType.startsWith('image/')
      || fileType === 'application/pdf'
      || fileType.startsWith('text/')
    )
  )
}

const emptyCourse = () => ({
  id: `new-${Date.now()}`,
  slug: `new-course-${Date.now()}`,
  title: 'Новый курс',
  titleEn: 'New course',
  shortDescription: 'Описание',
  shortDescriptionEn: 'Description',
  description: 'Описание',
  descriptionEn: 'Description',
  fullDescription: 'Полное описание',
  fullDescriptionEn: 'Full description',
  duration: '1 урок',
  durationEn: '1 lesson',
  price: 0,
  priceEur: 0,
  image: 'https://images.unsplash.com/photo-1531746795393-6cde9e6b2c6b?w=800&q=80',
  category: 'Категория',
  categoryEn: 'Category',
  level: 'Basic',
  goals: ['Цель'],
  goalsEn: ['Goal'],
  lessons: [
    { id: 'l1', title: 'Урок 1', titleEn: 'Lesson 1', duration: '10 мин', durationEn: '10 min', videoUrl: '' },
  ],
})

export function Admin() {
  const { online, refresh: refreshApi } = useApi()
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [courses, setCoursesState] = useState([])
  const [editingIndex, setEditingIndex] = useState(null)
  const [editForm, setEditForm] = useState({
    title: '', titleEn: '', slug: '', id: '', price: 0, priceEur: 0, isFreeTrial: false,
    image: '', shortDescription: '', shortDescriptionEn: '', fullDescription: '', fullDescriptionEn: '',
    goals: [], goalsEn: [], lessons: [{ id: 'l1', title: '', titleEn: '', duration: '', durationEn: '', videoUrl: '' }],
  })
  const [activeTab, setActiveTab] = useState('dashboard')
  const [appFilter, setAppFilter] = useState('all')
  const [drawerUser, setDrawerUser] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const [adminRole, setAdminRoleState] = useState(() => getAdminRole())
  const [hwComment, setHwComment] = useState({})
  const [hwScore, setHwScore] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [previewHomeworkId, setPreviewHomeworkId] = useState(null)
  const [newEvent, setNewEvent] = useState({ date: '', title: '', titleEn: '', description: '' })
  const [newCertificate, setNewCertificate] = useState({
    email: '',
    courseId: '',
    fileName: '',
    fileType: '',
    fileDataUrl: '',
  })
  const [certificateError, setCertificateError] = useState('')
  const [dashData, setDashData] = useState(null)
  const [dataHealth, setDataHealth] = useState(null)
  const [emailStatus, setEmailStatus] = useState(null)
  const [deletingUserId, setDeletingUserId] = useState(null)

  useEffect(() => {
    const token = getAdminToken()
    const saved = localStorage.getItem('lms_admin_auth')
    if (token) {
      if (online === false) {
        setAuthenticated(true)
        return
      }
      api.adminMe()
        .then((me) => {
          setAdminRoleState(me.role || 'admin')
          setAdminRole(me.role || 'admin')
          setEmailStatus(me.email || null)
          setAuthenticated(true)
        })
        .catch(() => {
          setAdminToken(null)
          localStorage.removeItem('lms_admin_auth')
        })
      return
    }
    const localRole = saved
      ? (resolveLocalRole(saved) || (['admin', 'editor', 'moderator'].includes(saved) ? saved : null))
      : null
    if (localRole && online) {
      localStorage.removeItem('lms_admin_auth')
      return
    }
    if (localRole) {
      setAdminRoleState(localRole)
      setAuthenticated(true)
    }
  }, [online])

  useEffect(() => {
    if (dashData?.role) {
      setAdminRoleState(dashData.role)
      setAdminRole(dashData.role)
    }
  }, [dashData?.role])

  const loadDashboardFromApi = async () => {
    if (!online) return false
    if (!getAdminToken()) {
      setDashData(null)
      return false
    }
    try {
      const data = await api.adminDashboard()
      setDashData(data)
      if (data.courses?.length) setCoursesState(data.courses)
      return true
    } catch (err) {
      if (err?.status === 401) {
        handleLogout()
      } else {
        setToast({ message: 'Не удалось загрузить данные с сервера. Перезайдите в админку.', type: 'error' })
      }
      return false
    }
  }

  useEffect(() => {
    if (!authenticated) return
    loadDashboardFromApi().then((ok) => {
      if (!ok) setDashData(null)
    })
  }, [authenticated, refresh, online])

  useEffect(() => {
    if (!authenticated || !online || !getAdminToken()) return
    api.adminDataHealth()
      .then(setDataHealth)
      .catch(() => setDataHealth(null))
  }, [authenticated, online, refresh])

  useEffect(() => {
    if (!authenticated || activeTab !== ACCELERATOR_ADMIN_TAB || !online) return undefined
    const id = setInterval(() => setRefresh((r) => r + 1), 30000)
    return () => clearInterval(id)
  }, [authenticated, activeTab, online])

  useEffect(() => {
    if (authenticated) setCoursesState(getCourses())
  }, [authenticated])

  useEffect(() => {
    if (!newCertificate.courseId) return
    const email = newCertificate.email.trim().toLowerCase()
    const stillAvailable = getCertificates().some(
      (cert) => cert.email?.toLowerCase() === email && cert.courseId === newCertificate.courseId && !cert.fileDataUrl
    )
    if (!stillAvailable) {
      setNewCertificate((prev) => ({ ...prev, courseId: '' }))
    }
  }, [courses, newCertificate.email, newCertificate.courseId])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    const isLocalDev = typeof window !== 'undefined'
      && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    if (!online && !isLocalDev) {
      const ok = await refreshApi()
      if (!ok) {
        setError('API недоступен. Нажмите «Повторить подключение» вверху или обновите страницу через 1–2 мин.')
        return
      }
    }
    if (online) {
      try {
        const { token, role } = await api.adminLogin(password)
        setAdminToken(token)
        setAdminRole(role || 'admin')
        setAdminRoleState(role || 'admin')
        localStorage.setItem('lms_admin_auth', 'api')
        setAuthenticated(true)
        return
      } catch {
        setError('Неверный пароль или API недоступен. Проверьте ADMIN_PASSWORD на сервере.')
        return
      }
    }
    const localRole = import.meta.env.DEV && isLocalDev ? resolveLocalRole(password) : null
    if (localRole) {
      setAdminToken(null)
      setAdminRole(localRole)
      setAdminRoleState(localRole)
      localStorage.setItem('lms_admin_auth', localRole)
      setAuthenticated(true)
    } else {
      setError('Неверный пароль')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('lms_admin_auth')
    setAdminToken(null)
    setAdminRole(null)
    setAdminRoleState('admin')
    setAuthenticated(false)
    setPassword('')
  }

  const saveCourses = async (next) => {
    persistCourses(next)
    setCoursesState(next)
    setEditingIndex(null)
    if (online && getAdminToken()) {
      try {
        await api.adminSaveCourses(next)
        window.dispatchEvent(new CustomEvent('lms-courses-updated'))
      } catch (_) {}
    }
  }

  const handleAddCourse = () => {
    saveCourses([...courses, emptyCourse()])
  }

  const handleDeleteCourse = (index) => {
    if (!window.confirm('Удалить этот курс?')) return
    const next = courses.filter((_, i) => i !== index)
    saveCourses(next)
  }

  const startEdit = (index) => {
    const c = courses[index]
    const lessons = Array.isArray(c.lessons) && c.lessons.length > 0
      ? c.lessons.map((l) => ({ id: l.id || '', title: l.title || '', titleEn: l.titleEn || '', duration: l.duration || '', durationEn: l.durationEn || '', videoUrl: l.videoUrl || '' }))
      : [{ id: 'l1', title: '', titleEn: '', duration: '', durationEn: '', videoUrl: '' }]
    setEditingIndex(index)
    setEditForm({
      title: c.title || '',
      titleEn: c.titleEn || '',
      slug: c.slug || '',
      id: c.id || '',
      price: c.price ?? 0,
      priceEur: c.priceEur ?? 0,
      isFreeTrial: !!c.isFreeTrial,
      image: c.image || '',
      shortDescription: c.shortDescription || '',
      shortDescriptionEn: c.shortDescriptionEn || '',
      fullDescription: c.fullDescription || '',
      fullDescriptionEn: c.fullDescriptionEn || '',
      goals: Array.isArray(c.goals) ? c.goals : [],
      goalsEn: Array.isArray(c.goalsEn) ? c.goalsEn : [],
      lessons,
    })
  }

  const setLesson = (lessonIndex, field, value) => {
    setEditForm((f) => {
      const less = [...(f.lessons || [])]
      less[lessonIndex] = { ...(less[lessonIndex] || {}), [field]: value }
      return { ...f, lessons: less }
    })
  }
  const addLesson = () => {
    setEditForm((f) => ({ ...f, lessons: [...(f.lessons || []), { id: `l${(f.lessons?.length || 0) + 1}`, title: '', titleEn: '', duration: '', durationEn: '', videoUrl: '' }] }))
  }
  const removeLesson = (lessonIndex) => {
    setEditForm((f) => ({ ...f, lessons: (f.lessons || []).filter((_, i) => i !== lessonIndex) }))
  }

  const saveEdit = () => {
    if (editingIndex == null) return
    const next = [...courses]
    const base = next[editingIndex]
    const c = {
      ...base,
      title: editForm.title,
      titleEn: editForm.titleEn,
      slug: editForm.slug,
      id: editForm.id,
      price: editForm.price,
      priceEur: editForm.priceEur,
      isFreeTrial: editForm.isFreeTrial,
      image: editForm.image || base.image,
      shortDescription: editForm.shortDescription || base.shortDescription,
      shortDescriptionEn: editForm.shortDescriptionEn || base.shortDescriptionEn,
      fullDescription: editForm.fullDescription || base.fullDescription,
      fullDescriptionEn: editForm.fullDescriptionEn || base.fullDescriptionEn,
      goals: Array.isArray(editForm.goals) ? editForm.goals : base.goals,
      goalsEn: Array.isArray(editForm.goalsEn) ? editForm.goalsEn : base.goalsEn,
      lessons: (editForm.lessons || []).length > 0 ? editForm.lessons : base.lessons,
    }
    next[editingIndex] = c
    saveCourses(next)
  }

  const saveBlogPostsList = async (posts) => {
    setBlogPosts(posts)
    if (online && getAdminToken()) {
      try {
        await api.adminSaveBlog(posts)
        showToast('Блог сохранён на сервере')
      } catch {
        showToast('Ошибка сохранения блога', 'error')
      }
    }
    setRefresh((r) => r + 1)
  }

  const changeTab = (tab, nextAppFilter) => {
    if (!canAccessTab(adminRole, tab)) {
      showToast('Нет доступа к этому разделу', 'error')
      return
    }
    setActiveTab(tab)
    setSearchQuery('')
    if (nextAppFilter) setAppFilter(nextAppFilter)
    else if (tab !== ACCELERATOR_ADMIN_TAB) setAppFilter('all')
  }

  const restoreDefaults = () => {
    if (!window.confirm('Восстановить курсы по умолчанию? Текущие изменения будут потеряны.')) return
    persistCourses(defaultCourses)
    setCoursesState(defaultCourses)
    setEditingIndex(null)
  }

  const showToast = (message, type = 'success') => setToast({ message, type })

  const useServerData = online && Boolean(getAdminToken())

  const homeworkListPreview = authenticated
    ? (useServerData ? (dashData?.homework ?? []) : (dashData?.homework ?? (canAccessTab(adminRole, 'homework') ? getHomeworkSubmissions() : [])))
    : []
  const pendingHwCount = homeworkListPreview.filter((h) => h.status === 'pending').length
  const staleAppsPreview = authenticated && useServerData
    ? (dashData?.applications ?? []).filter((a) => {
      if ((a.status || 'new') !== 'new') return false
      return (Date.now() - new Date(a.date).getTime()) / 3600000 >= 24
    }).length
    : 0
  useAdminPushNotifications(pendingHwCount, authenticated && canAccessTab(adminRole, 'homework'))
  useAdminStaleApplicationAlert(
    staleAppsPreview,
    authenticated && canAccessTab(adminRole, ACCELERATOR_ADMIN_TAB)
  )

  if (!authenticated) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginGlow} aria-hidden />
        <div className={styles.loginCard}>
          <div className={styles.loginBrand}>
            <span className={styles.loginLogo}>IA</span>
            <span>Insider Academy</span>
          </div>
          <h1 className={styles.loginTitle}>Админ-панель</h1>
          <p className={styles.loginDesc}>Управление курсами, пользователями и контентом</p>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            {error && <div className={styles.loginError}>{error}</div>}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль администратора"
              className={styles.loginInput}
              autoFocus
            />
            <button type="submit" className={styles.loginBtn}>Войти в панель</button>
          </form>
          <p className={styles.loginHint}>
            {online ? 'Пароль задаётся переменной ADMIN_PASSWORD на сервере' : 'Оффлайн-режим: пароль локальной демо-версии'}
          </p>
        </div>
      </div>
    )
  }

  const registrations = dashData?.registrations ?? (canAccessTab(adminRole, 'registrations') ? getRegistrations() : [])
  const adminUsers = dashData?.users ?? []
  const userRows = adminUsers.length > 0
    ? adminUsers
    : registrations.map((r) => ({
        id: r.id,
        personalId: r.personal_id || r.personalId || null,
        email: r.email,
        name: r.name,
        emailVerified: false,
        hasAvatar: false,
        registeredAt: r.date,
        profileUpdatedAt: null,
        passwordChangedAt: null,
      }))
  const certificates = dashData?.certificates ?? (canAccessTab(adminRole, 'certificates') ? getCertificates() : [])
  const purchases = dashData?.purchases ?? (canAccessTab(adminRole, 'purchases') ? getPurchases() : [])
  const analytics = dashData?.analytics ?? getAnalyticsData()
  const charts = dashData?.charts ?? null
  const referrals = dashData?.referrals ?? (canAccessTab(adminRole, 'referrals') ? getReferrals() : [])
  const homeworkList = useServerData
    ? (dashData?.homework ?? [])
    : (dashData?.homework ?? (canAccessTab(adminRole, 'homework') ? getHomeworkSubmissions() : []))
  const reviewsList = useServerData
    ? (dashData?.reviews ?? [])
    : (dashData?.reviews ?? (canAccessTab(adminRole, 'reviews') ? getReviewSubmissions() : []))
  const applicationsList = useServerData
    ? (dashData?.applications ?? [])
    : (dashData?.applications ?? (canAccessTab(adminRole, ACCELERATOR_ADMIN_TAB) ? getAcceleratorApplications() : []))
  const blogPostsList = dashData?.blog ?? getBlogPosts()
  const normalizedCertificateEmail = newCertificate.email.trim().toLowerCase()
  const availableCertificateCourses = courses.filter((course) =>
    certificates.some(
      (cert) => cert.email?.toLowerCase() === normalizedCertificateEmail && cert.courseId === course.id && !cert.fileDataUrl
    )
  )
  const purchasesByEmail = purchases.reduce((map, p) => {
    if (!map[p.email]) map[p.email] = []
    map[p.email].push(p.courseTitle)
    return map
  }, {})
  const discounts = dashData?.discounts ?? getDiscounts()
  const topCourseClicks = Object.entries(analytics.courseClicks || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const formatScore = (value) => {
    if (value == null || Number.isNaN(value)) return '—'
    return `${String(value).replace('.', ',')} / 10`
  }

  const getUnseenCount = (type, items) => items.filter((item) => !isAdminItemSeen(type, item)).length

  const pendingReviewsCount = reviewsList.filter((r) => (r.status || 'pending') === 'pending').length
  const pendingHwQueue = homeworkList.filter((h) => h.status === 'pending').length
  const newAppsCount = applicationsList.filter((a) => (a.status || 'new') === 'new').length

  const openStudentByEmail = (email, app) => {
    const mail = String(email || '').toLowerCase()
    const found = adminUsers.find((u) => u.email?.toLowerCase() === mail)
    setDrawerUser(found ? {
      ...found,
      telegramConnected: app?.telegramConnected ?? Boolean(found.telegram_chat_id),
      telegramUsername: app?.telegramUsername || app?.telegram || found.telegram,
    } : {
      email,
      name: app ? `${app.firstName || ''} ${app.lastName || ''}`.trim() || email : email,
      firstName: app?.firstName,
      lastName: app?.lastName,
      telegram: app?.telegram,
      telegramConnected: app?.telegramConnected,
      telegramUsername: app?.telegramUsername || app?.telegram,
    })
  }

  const handleDeleteUser = async (userItem) => {
    const label = userItem.name ? `${userItem.name} (${userItem.email})` : userItem.email
    if (!window.confirm(
      `Удалить аккаунт ${label}?\n\nБудут удалены регистрация, покупки, ДЗ, сертификаты, заявки и все данные пользователя. Действие необратимо.`
    )) {
      return
    }

    setDeletingUserId(userItem.id || userItem.email)
    try {
      if (useServerData && getAdminToken()) {
        await api.adminDeleteUser({
          userId: userItem.id ?? undefined,
          email: userItem.email,
        })
        if (drawerUser?.email?.toLowerCase() === userItem.email?.toLowerCase()) {
          setDrawerUser(null)
        }
        showToast(`Аккаунт ${userItem.email} удалён`, 'success')
        setRefresh((r) => r + 1)
        if (useServerData) await loadDashboardFromApi()
      } else {
        showToast('Удаление доступно только при подключении к серверу (роль admin)', 'error')
      }
    } catch (err) {
      showToast(err?.message || 'Не удалось удалить аккаунт', 'error')
    } finally {
      setDeletingUserId(null)
    }
  }

  const unreadByTab = {
    registrations: getUnseenCount('registrations', registrations),
    purchases: getUnseenCount('purchases', purchases),
    certificates: getUnseenCount('certificates', certificates),
    homework: pendingHwQueue,
    reviews: pendingReviewsCount,
    [ACCELERATOR_ADMIN_TAB]: newAppsCount,
    inbox: pendingHwQueue + pendingReviewsCount + newAppsCount,
  }

  const handleHomeworkDecision = async (submission, status) => {
    const comment = hwComment[submission.id] ?? submission.adminComment ?? ''
    const rawScore = hwScore[submission.id] ?? submission.score ?? ''
    const parsedScore = rawScore === '' ? null : Number(rawScore)
    if (status === 'accepted' && !(parsedScore >= 1 && parsedScore <= 10)) {
      window.alert('Укажите оценку от 1 до 10 перед принятием ДЗ.')
      return
    }
    const payload = {
      status,
      adminComment: comment || null,
      score: parsedScore >= 1 && parsedScore <= 10 ? parsedScore : null,
    }
    if (online && getAdminToken()) {
      try {
        await api.adminUpdateHomework(submission.id, payload)
        showToast(status === 'accepted' ? 'ДЗ принято (сервер)' : 'Отправлено на доработку (сервер)')
        setRefresh((r) => r + 1)
        return
      } catch {
        showToast('Ошибка API — сохранено локально', 'error')
      }
    }
    updateHomeworkSubmission(submission.id, payload)
    addNotification({
      email: submission.email,
      type: 'homework_feedback',
      status,
      courseId: submission.courseId,
      courseTitle: submission.courseTitle,
      lessonTitle: submission.lessonTitle,
      lessonIndex: submission.lessonIndex,
      message: [
        parsedScore >= 1 && parsedScore <= 10 ? `Оценка: ${parsedScore}/10.` : '',
        comment || (status === 'accepted' ? 'Домашнее задание принято.' : 'Домашнее задание отправлено на доработку.'),
      ].filter(Boolean).join(' '),
    })
    setRefresh((r) => r + 1)
  }

  const handleCertificateFileChange = async (file) => {
    if (!file) {
      setNewCertificate((prev) => ({ ...prev, fileName: '', fileType: '', fileDataUrl: '' }))
      return
    }
    try {
      const fileDataUrl = await readFileAsDataUrl(file)
      setNewCertificate((prev) => ({
        ...prev,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileDataUrl,
      }))
      setCertificateError('')
    } catch {
      setCertificateError('Не удалось загрузить файл сертификата.')
    }
  }

  const handleCreateCertificate = async () => {
    const email = newCertificate.email.trim()
    const course = courses.find((item) => item.id === newCertificate.courseId)
    const score = getCourseAverageScore(email, course?.id)
    if (!email) {
      setCertificateError('Укажите email пользователя.')
      return
    }
    if (!course) {
      setCertificateError('Выберите курс.')
      return
    }
    if (!newCertificate.fileDataUrl) {
      setCertificateError('Загрузите файл сертификата.')
      return
    }

    if (online && getAdminToken()) {
      try {
        await api.adminAddCertificate({
          email,
          courseId: course.id,
          courseTitle: course.title,
          fileName: newCertificate.fileName,
          fileType: newCertificate.fileType,
          fileDataUrl: newCertificate.fileDataUrl,
          score,
        })
        showToast('Сертификат выдан')
        setNewCertificate({ email: '', courseId: '', fileName: '', fileType: '', fileDataUrl: '' })
        setCertificateError('')
        setRefresh((r) => r + 1)
        return
      } catch {
        showToast('Ошибка API — сохранено локально', 'error')
      }
    }

    recordCertificate({
      email,
      courseId: course.id,
      courseTitle: course.title,
      fileName: newCertificate.fileName,
      fileType: newCertificate.fileType,
      fileDataUrl: newCertificate.fileDataUrl,
      score,
      notify: true,
    })
    setNewCertificate({ email: '', courseId: '', fileName: '', fileType: '', fileDataUrl: '' })
    setCertificateError('')
    setRefresh((r) => r + 1)
  }

  const filteredRegistrations = userRows.filter((r) => matchesSearch(searchQuery, r.personalId, r.email, r.name))
  const filteredPurchases = purchases.filter((p) => matchesSearch(searchQuery, p.email, p.courseTitle))
  const filteredHomework = homeworkList.filter((h) => matchesSearch(searchQuery, h.email, h.name, h.courseTitle))
  const filteredReviews = reviewsList.filter((r) => matchesSearch(searchQuery, r.email, r.contactEmail, r.userName, r.text, r.courseId))
  const filteredApplications = applicationsList.filter((a) => matchesSearch(
    searchQuery,
    a.email,
    a.firstName,
    a.lastName,
    a.telegram,
    a.country,
    a.motivation,
  ))
  const filteredCertificates = certificates.filter((c) => matchesSearch(searchQuery, c.email, c.courseTitle))
  const filteredReferrals = referrals.filter((r) => matchesSearch(searchQuery, r.referrerEmail, r.referredEmail))
  const filteredCourses = courses.filter((c) => matchesSearch(searchQuery, c.title, c.slug, c.id))

  const tabTitles = {
    dashboard: 'Дашборд',
    roadmap: 'Роадмап',
    analytics: 'Аналитика',
    registrations: 'Регистрации',
    purchases: 'Покупки',
    certificates: 'Сертификаты',
    homework: 'Домашние задания',
    reviews: 'Отзывы',
    [ACCELERATOR_ADMIN_TAB]: 'Отборочный курс',
    courses: 'Курсы',
    blog: 'Блог',
    calendar: 'Календарь',
    settings: 'Настройки',
    tools: 'Операции',
    referrals: 'Рефералы',
  }

  return (
    <div className={styles.page}>
      <AdminToast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <div className={styles.shell}>
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={changeTab}
          unreadByTab={unreadByTab}
          online={online}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          adminRole={adminRole}
          roleLabel={ROLE_LABELS[adminRole]}
        />

        <main className={styles.main}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>{tabTitles[activeTab] || 'Админ'}</h1>
              <p className={`${styles.headerSub} ${!online ? styles.headerWarning : ''}`}>
                {!online && <AlertTriangle size={14} aria-hidden />}
                {online && useServerData
                  ? 'PostgreSQL + Google Sheets'
                  : online
                    ? 'API доступен — войдите паролем админа для синхронизации'
                    : 'API недоступен — данные не сохраняются. Дождитесь подключения или обновите страницу.'}
              </p>
            </div>
            <div className={styles.headerActions}>
              <button type="button" className={styles.refreshBtn} onClick={() => { setRefresh((r) => r + 1); showToast('Данные обновлены') }} title="Обновить">
                <RefreshCw size={17} aria-hidden />
              </button>
              <Link to="/" className={styles.backLink}><ArrowLeft size={15} aria-hidden /> На сайт</Link>
              <button type="button" onClick={handleLogout} className={styles.logoutBtn}>Выйти</button>
            </div>
          </header>

          {SEARCH_TABS.has(activeTab) && (
            <AdminSearchBar value={searchQuery} onChange={setSearchQuery} />
          )}

          {drawerUser && (
            <AdminUserDrawer
              user={drawerUser}
              purchases={purchases}
              homeworkList={homeworkList}
              reviewsList={reviewsList}
              applications={applicationsList}
              online={useServerData}
              showToast={showToast}
              onClose={() => setDrawerUser(null)}
              onRefresh={async () => {
                setRefresh((r) => r + 1)
                if (useServerData) await loadDashboardFromApi()
              }}
              formatDate={formatDate}
            />
          )}

          {(activeTab === 'dashboard' || activeTab === 'inbox') && canAccessTab(adminRole, 'inbox') && (
            <AdminInbox
              homeworkList={homeworkList}
              reviewsList={reviewsList}
              applications={applicationsList}
              onTabChange={changeTab}
              formatDate={formatDate}
            />
          )}

          {activeTab === 'dashboard' && (
            <AdminDashboard
              analytics={analytics}
              charts={charts}
              registrations={registrations}
              purchases={purchases}
              homeworkList={homeworkList}
              certificates={certificates}
              courses={courses}
              referrals={referrals}
              applications={applicationsList}
              unreadByTab={unreadByTab}
              onTabChange={changeTab}
              formatDate={formatDate}
              adminRole={adminRole}
            />
          )}

          {activeTab === 'settings' && canAccessTab(adminRole, 'settings') && (
            <AdminSettings
              settings={dashData?.settings}
              webhookLog={dashData?.webhookLog}
              dataHealth={dataHealth}
              emailStatus={emailStatus}
              online={online}
              onCopy={(url) => { navigator.clipboard?.writeText(url); showToast('URL скопирован') }}
              onEnablePush={() => requestAdminNotificationPermission().then((p) => showToast(p === 'granted' ? 'Push включены' : `Статус: ${p}`))}
              onToast={(msg, type) => showToast(msg, type)}
            />
          )}

          {activeTab === 'tools' && canAccessTab(adminRole, 'tools') && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Операции платформы</h2>
              <p className={styles.sectionDesc}>Промокоды, выдача курсов, feature flags, audit log, marketplace и выплаты.</p>
              <AdminToolsPanel
                online={useServerData}
                showToast={showToast}
                reviews={reviewsList}
                onTabChange={changeTab}
                onReviewsUpdated={async () => {
                  setRefresh((r) => r + 1)
                  if (useServerData) await loadDashboardFromApi()
                }}
              />
            </section>
          )}

          {activeTab === 'roadmap' && (
            <AdminRoadmap onToast={(msg) => showToast(msg)} />
          )}

          {activeTab === 'analytics' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Аналитика</h2>
          <AdminCharts charts={charts} analytics={analytics} registrations={registrations} purchases={purchases} />
          <div className={styles.statsGrid} style={{ marginTop: 24 }}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{analytics.visits || 0}</span>
              <span className={styles.statLabel}>Заходов на сайт</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{topCourseClicks.length}</span>
              <span className={styles.statLabel}>Курсов с переходами</span>
            </div>
          </div>
          <h3 className={styles.subSectionTitle}>Топ курсов по кликам</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID курса</th>
                  <th>Кликов</th>
                </tr>
              </thead>
              <tbody>
                {topCourseClicks.length === 0 ? (
                  <tr><td colSpan={2} className={styles.empty}>Нет данных</td></tr>
                ) : (
                  topCourseClicks.map(([id, count]) => (
                    <tr key={id}>
                      <td>{id}</td>
                      <td>{count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {activeTab === 'referrals' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Рефералы</h2>
          <p className={styles.sectionDesc}>Кто скопировал/передал ссылку (пригласил), кто зарегистрировался, время, какой курс купил. Скидка пригласившему: +1% за приглашённого, +5% за покупку.</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Кто пригласил (email)</th>
                  <th>Кого пригласил (email)</th>
                  <th>Время</th>
                  <th>Курс куплен</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.length === 0 ? (
                  <tr><td colSpan={4} className={styles.empty}>Нет данных</td></tr>
                ) : (
                  filteredReferrals.map((r, i) => (
                    <tr key={i}>
                      <td>{r.referrerEmail}</td>
                      <td>{r.referredEmail}</td>
                      <td>{formatDate(r.date)}</td>
                      <td>{(purchasesByEmail[r.referredEmail] || []).join(', ') || (r.referredPurchased ? 'Да' : '—')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {Object.keys(discounts).length > 0 && (
            <>
              <h3 className={styles.subSectionTitle}>Накопленные скидки по email (отображаются у пользователя)</h3>
              <ul className={styles.discountList}>
                {Object.entries(discounts).map(([email, percent]) => (
                  <li key={email}>{email}: −{percent}%</li>
                ))}
              </ul>
            </>
          )}
        </section>
        )}

        {activeTab === 'homework' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Домашние задания</h2>
          <p className={styles.sectionDesc}>Новые ДЗ подсвечиваются до отметки «увидено». Можно открыть файл прямо в админке, скачать его, а затем принять или отправить на доработку с комментарием.</p>
          <div className={styles.courseActions}>
            <button type="button" className={styles.restoreBtn} onClick={() => { markAdminItemsSeen('homework', homeworkList); setRefresh((r) => r + 1) }}>Отметить все как увиденные</button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email / Имя</th>
                  <th>Курс / Урок</th>
                  <th>ДЗ (фрагмент)</th>
                  <th>Файл</th>
                  <th>Статус</th>
                  <th>Балл</th>
                  <th>Комментарий</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredHomework.length === 0 ? (
                  <tr><td colSpan={8} className={styles.empty}>Нет сданных ДЗ</td></tr>
                ) : (
                  filteredHomework.map((h) => {
                    const unseen = !isAdminItemSeen('homework', h)
                    const previewOpen = previewHomeworkId === h.id && canPreviewFile(h.fileType)
                    return (
                      <Fragment key={h.id}>
                        <tr className={unseen ? styles.unseenRow : ''}>
                          <td>{h.email}<br /><small>{h.name}</small></td>
                          <td>{h.courseTitle} — ур. {h.lessonIndex + 1}</td>
                          <td className={`${styles.cellClip} ${styles.fragmentCell}`}>{(h.content || '').slice(0, 120) || '—'}{h.content && h.content.length > 120 ? '…' : ''}</td>
                          <td className={styles.fileCell}>
                            {(h.fileDataUrl || h.fileUrl) ? (
                              <div className={styles.fileActions}>
                                <span className={styles.fileName}>{h.fileName || 'Файл'}</span>
                                <div className={styles.inlineActions}>
                                  <a href={h.fileDataUrl || h.fileUrl} target="_blank" rel="noreferrer" className={styles.inlineLink}>Открыть</a>
                                  <a href={h.fileDataUrl || h.fileUrl} download={h.fileName || 'homework'} className={styles.inlineLink}>Скачать</a>
                                  {canPreviewFile(h.fileType) && (
                                    <button type="button" className={styles.inlineBtn} onClick={() => setPreviewHomeworkId((prev) => prev === h.id ? null : h.id)}>
                                      {previewOpen ? 'Скрыть' : 'Просмотр'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : '—'}
                          </td>
                          <td className={styles.statusCell}>{h.status === 'accepted' ? 'Принято' : h.status === 'resubmit' ? 'На пересдачу' : 'На проверке'}</td>
                          <td className={styles.scoreCell}>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              step="1"
                              placeholder="1-10"
                              value={hwScore[h.id] ?? h.score ?? ''}
                              onChange={(e) => setHwScore((prev) => ({ ...prev, [h.id]: e.target.value }))}
                              className={styles.scoreInput}
                            />
                          </td>
                          <td className={styles.commentCell}>
                            <textarea
                              placeholder="Правки, комментарий (увидит пользователь)"
                              value={hwComment[h.id] ?? h.adminComment ?? ''}
                              onChange={(e) => setHwComment((c) => ({ ...c, [h.id]: e.target.value }))}
                              className={styles.hwCommentInput}
                              rows={5}
                            />
                          </td>
                          <td className={styles.actionsCell}>
                            <div className={styles.actionStack}>
                              <button type="button" className={styles.smallBtn} onClick={() => handleHomeworkDecision(h, 'accepted')}>Принять</button>
                              <button type="button" className={styles.smallBtnDanger} onClick={() => handleHomeworkDecision(h, 'resubmit')}>На пересдачу</button>
                              {unseen && (
                                <button type="button" className={styles.inlineBtn} onClick={() => { markAdminItemSeen('homework', h); setRefresh((r) => r + 1) }}>Увидено</button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {previewOpen && (
                          <tr className={styles.previewRow}>
                            <td colSpan={8}>
                              <div className={styles.previewBox}>
                                {h.fileType?.startsWith('image/') ? (
                                  <img src={h.fileDataUrl} alt={h.fileName || 'Homework preview'} className={styles.previewImage} />
                                ) : (
                                  <iframe src={h.fileDataUrl} title={h.fileName || 'Homework preview'} className={styles.previewFrame} />
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {activeTab === 'reviews' && canAccessTab(adminRole, 'reviews') && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Модерация отзывов</h2>
          <p className={styles.sectionDesc}>
            Одобренные отзывы публикуются на странице курса. Email для связи виден полностью только здесь.
          </p>
          <AdminReviewsPanel
            reviews={searchQuery ? filteredReviews : reviewsList}
            online={useServerData}
            courses={courses}
            onUpdated={async () => {
              setRefresh((r) => r + 1)
              if (useServerData) await loadDashboardFromApi()
            }}
            showToast={showToast}
          />
        </section>
        )}

        {activeTab === ACCELERATOR_ADMIN_TAB && canAccessTab(adminRole, ACCELERATOR_ADMIN_TAB) && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Отборочный курс — AI Insider Accelerator</h2>
          <AdminApplicationsPanel
            applications={searchQuery ? filteredApplications : applicationsList}
            online={useServerData}
            onUpdated={() => setRefresh((r) => r + 1)}
            showToast={showToast}
            onOpenStudent={openStudentByEmail}
            initialFilter={appFilter}
          />
        </section>
        )}

        {activeTab === 'blog' && canAccessTab(adminRole, 'blog') && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Блог</h2>
          <p className={styles.sectionDesc}>Создание, редактирование и удаление статей. Изменения синхронизируются с API.</p>
          <div className={styles.courseActions}>
            <button type="button" onClick={() => { saveBlogPostsList(defaultBlog); showToast('Сброшено к данным по умолчанию') }} className={styles.restoreBtn}>Сбросить к данным по умолчанию</button>
          </div>
          <AdminBlogEditor
            posts={blogPostsList}
            onSave={saveBlogPostsList}
            onDelete={(id) => saveBlogPostsList(blogPostsList.filter((p) => p.id !== id))}
          />
        </section>
        )}

        {activeTab === 'calendar' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Календарь</h2>
          <p className={styles.sectionDesc}>Добавление, изменение, удаление событий. Отображаются у всех пользователей.</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Название</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {(getCalendarEvents() || []).map((ev) => (
                  <tr key={ev.id}>
                    <td>{formatDate(ev.date)}</td>
                    <td>{ev.title}</td>
                    <td>
                      <button type="button" className={styles.smallBtnDanger} onClick={() => { const list = getCalendarEvents().filter((e) => e.id !== ev.id); setCalendarEvents(list); setRefresh((r) => r + 1); }}>Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.editForm} style={{ marginTop: 16 }}>
            <h4>Добавить событие</h4>
            <label>Дата и время (YYYY-MM-DD HH:mm) <input value={newEvent.date} onChange={(e) => setNewEvent((f) => ({ ...f, date: e.target.value }))} className={styles.editInput} placeholder="2026-04-15 14:00" /></label>
            <label>Название (RU) <input value={newEvent.title} onChange={(e) => setNewEvent((f) => ({ ...f, title: e.target.value }))} className={styles.editInput} /></label>
            <label>Название (EN) <input value={newEvent.titleEn} onChange={(e) => setNewEvent((f) => ({ ...f, titleEn: e.target.value }))} className={styles.editInput} /></label>
            <label>Описание <input value={newEvent.description} onChange={(e) => setNewEvent((f) => ({ ...f, description: e.target.value }))} className={styles.editInput} /></label>
            <button type="button" className={styles.addBtn} onClick={() => { if (newEvent.date && newEvent.title) { const d = new Date(newEvent.date.replace(' ', 'T')); if (!isNaN(d.getTime())) { const list = [...getCalendarEvents(), { id: `e-${Date.now()}`, date: d.toISOString(), title: newEvent.title, titleEn: newEvent.titleEn || newEvent.title, description: newEvent.description, descriptionEn: newEvent.description, type: 'webinar' }]; setCalendarEvents(list); setNewEvent({ date: '', title: '', titleEn: '', description: '' }); setRefresh((r) => r + 1); } } }}>Добавить</button>
          </div>
        </section>
        )}

        {activeTab === 'courses' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Управление курсами</h2>
          <p className={styles.sectionDesc}>Изменения сразу отображаются на платформе.</p>
          <div className={styles.courseActions}>
            <button type="button" onClick={handleAddCourse} className={styles.addBtn}>+ Добавить курс</button>
            <button type="button" onClick={restoreDefaults} className={styles.restoreBtn}>Восстановить по умолчанию</button>
          </div>
          {editingIndex != null && (
            <div className={styles.editForm}>
              <h3>Редактировать курс — изменения сразу на сайте</h3>
              <div className={styles.editGrid}>
                <label>ID <input value={editForm.id} onChange={(e) => setEditForm((f) => ({ ...f, id: e.target.value }))} className={styles.editInput} /></label>
                <label>Slug <input value={editForm.slug} onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))} className={styles.editInput} /></label>
                <label>Название (RU) <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} className={styles.editInput} /></label>
                <label>Название (EN) <input value={editForm.titleEn} onChange={(e) => setEditForm((f) => ({ ...f, titleEn: e.target.value }))} className={styles.editInput} /></label>
                <label>Цена <input type="number" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))} className={styles.editInput} /></label>
                <label>Цена € <input type="number" value={editForm.priceEur} onChange={(e) => setEditForm((f) => ({ ...f, priceEur: Number(e.target.value) || 0 }))} className={styles.editInput} /></label>
                <label className={styles.editFullWidth}>URL картинки <input value={editForm.image} onChange={(e) => setEditForm((f) => ({ ...f, image: e.target.value }))} className={styles.editInput} placeholder="https://..." /></label>
                <label className={styles.editFullWidth}>Краткое описание (RU) <textarea value={editForm.shortDescription} onChange={(e) => setEditForm((f) => ({ ...f, shortDescription: e.target.value }))} className={styles.editTextarea} rows={2} /></label>
                <label className={styles.editFullWidth}>Краткое описание (EN) <textarea value={editForm.shortDescriptionEn} onChange={(e) => setEditForm((f) => ({ ...f, shortDescriptionEn: e.target.value }))} className={styles.editTextarea} rows={2} /></label>
                <label className={styles.editFullWidth}>Полное описание (RU) <textarea value={editForm.fullDescription} onChange={(e) => setEditForm((f) => ({ ...f, fullDescription: e.target.value }))} className={styles.editTextarea} rows={4} /></label>
                <label className={styles.editFullWidth}>Полное описание (EN) <textarea value={editForm.fullDescriptionEn} onChange={(e) => setEditForm((f) => ({ ...f, fullDescriptionEn: e.target.value }))} className={styles.editTextarea} rows={4} /></label>
                <label className={styles.editFullWidth}>Цели (RU, с новой строки) <textarea value={(editForm.goals || []).join('\n')} onChange={(e) => setEditForm((f) => ({ ...f, goals: e.target.value.split('\n').filter(Boolean) }))} className={styles.editTextarea} rows={3} /></label>
                <label className={styles.editFullWidth}>Цели (EN, с новой строки) <textarea value={(editForm.goalsEn || []).join('\n')} onChange={(e) => setEditForm((f) => ({ ...f, goalsEn: e.target.value.split('\n').filter(Boolean) }))} className={styles.editTextarea} rows={3} /></label>
                <label className={styles.editFullWidth}><input type="checkbox" checked={editForm.isFreeTrial} onChange={(e) => setEditForm((f) => ({ ...f, isFreeTrial: e.target.checked }))} /> Бесплатный пробный</label>
              </div>
              <LessonDragList
                lessons={editForm.lessons || []}
                onChange={(lessons) => setEditForm((f) => ({ ...f, lessons }))}
                onRemove={removeLesson}
                onAdd={addLesson}
              />
              <div className={styles.editFormActions}>
                <button type="button" onClick={saveEdit} className={styles.saveEditBtn}>Сохранить и применить</button>
                <button type="button" onClick={() => setEditingIndex(null)} className={styles.cancelBtn}>Отмена</button>
              </div>
            </div>
          )}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Slug</th>
                  <th>Цена</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.length === 0 ? (
                  <tr><td colSpan={5} className={styles.empty}>Нет курсов</td></tr>
                ) : (
                  filteredCourses.map((c, i) => {
                    const origIndex = courses.indexOf(c)
                    return (
                    <tr key={c.id || i}>
                      <td>{c.id}</td>
                      <td>{c.title}</td>
                      <td>{c.slug}</td>
                      <td>{c.isFreeTrial ? 'Бесплатно' : `${c.priceEur ?? c.price} €`}</td>
                      <td>
                        <button type="button" onClick={() => startEdit(origIndex)} className={styles.smallBtn}>Изменить</button>
                        <button type="button" onClick={() => handleDeleteCourse(origIndex)} className={styles.smallBtnDanger}>Удалить</button>
                      </td>
                    </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {activeTab === 'registrations' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Пользователи и регистрации</h2>
          <div className={styles.courseActions}>
            <button type="button" className={styles.restoreBtn} onClick={() => { markAdminItemsSeen('registrations', userRows); setRefresh((r) => r + 1) }}>Отметить все как увиденные</button>
            <button type="button" className={styles.exportBtn} onClick={() => exportCsv('users.csv', filteredRegistrations.map((r) => [r.personalId || '', r.email, r.name, r.registeredAt, r.profileUpdatedAt || '', r.passwordChangedAt || '', r.lastLoginAt || '']), ['ID', 'Email', 'Имя', 'Регистрация', 'Профиль обновлён', 'Пароль изменён', 'Последний вход'])}>Экспорт CSV</button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Личный ID</th>
                  <th>Фото</th>
                  <th>Email</th>
                  <th>Имя</th>
                  <th>Email подтверждён</th>
                  <th>Регистрация</th>
                  <th>Профиль</th>
                  <th>Пароль</th>
                  <th>Последний вход</th>
                  <th>Telegram</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.length === 0 ? (
                  <tr><td colSpan={11} className={styles.empty}>Нет данных</td></tr>
                ) : (
                  filteredRegistrations.map((r, i) => {
                    const unseen = !isAdminItemSeen('registrations', r)
                    return (
                      <tr key={r.id || r.email || i} className={unseen ? styles.unseenRow : ''}>
                        <td><code className={styles.personalId}>{r.personalId || '—'}</code></td>
                        <td>{r.hasAvatar ? <Camera size={16} aria-label="Фото загружено" /> : '—'}</td>
                        <td>
                          <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => setDrawerUser(r)}
                          >
                            {r.email}
                          </button>
                        </td>
                        <td>{r.name || '—'}</td>
                        <td>{r.emailVerified ? <CheckCircle2 size={16} aria-label="Подтверждён" /> : <Clock3 size={16} aria-label="Ожидает подтверждения" />}</td>
                        <td>{formatDate(r.registeredAt || r.date)}</td>
                        <td>{r.profileUpdatedAt ? formatDate(r.profileUpdatedAt) : '—'}</td>
                        <td>
                          {r.passwordChangedAt ? (
                            <span className={styles.passwordChangedBadge} title={formatDate(r.passwordChangedAt)}>
                              <LockKeyhole size={13} aria-hidden /> {formatDate(r.passwordChangedAt)}
                            </span>
                          ) : (
                            <span className={styles.passwordNeverBadge}>Не менялся</span>
                          )}
                        </td>
                        <td>{r.lastLoginAt ? formatDate(r.lastLoginAt) : '—'}</td>
                        <td>
                          {r.telegramConnected ? (
                            <span className={styles.passwordChangedBadge} title={r.telegramChatId}>
                              <CheckCircle2 size={13} aria-hidden /> {r.telegramUsername ? `@${r.telegramUsername}` : r.telegramChatId}
                            </span>
                          ) : (
                            <span className={styles.passwordNeverBadge}>—</span>
                          )}
                        </td>
                        <td>
                          <div className={styles.tableActions}>
                            {unseen && (
                              <button type="button" className={styles.inlineBtn} onClick={() => { markAdminItemSeen('registrations', r); setRefresh((v) => v + 1) }}>
                                Увидено
                              </button>
                            )}
                            <button
                              type="button"
                              className={styles.smallBtnDanger}
                              disabled={adminRole !== 'admin' || deletingUserId === (r.id || r.email)}
                              onClick={() => handleDeleteUser(r)}
                              title={adminRole === 'admin'
                                ? 'Удалить аккаунт и все данные пользователя'
                                : 'Недостаточно прав (нужна роль admin)'}
                            >
                              {adminRole !== 'admin'
                                ? 'Удалить'
                                : deletingUserId === (r.id || r.email) ? '…' : 'Удалить'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {activeTab === 'certificates' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Сертификаты</h2>
          <div className={styles.editForm}>
            <h3>Загрузить сертификат конкретному пользователю</h3>
            <div className={styles.editGrid}>
              <label>
                Email пользователя
                <input
                  value={newCertificate.email}
                  onChange={(e) => setNewCertificate((prev) => ({ ...prev, email: e.target.value }))}
                  className={styles.editInput}
                  list="admin-users"
                  placeholder="user@example.com"
                />
              </label>
              <label>
                Курс
                <select value={newCertificate.courseId} onChange={(e) => setNewCertificate((prev) => ({ ...prev, courseId: e.target.value }))} className={styles.editInput}>
                  <option value="">Выберите курс</option>
                  {availableCertificateCourses.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
                <span className={styles.fileHint}>
                  {!normalizedCertificateEmail
                    ? 'Сначала укажите email пользователя.'
                    : availableCertificateCourses.length === 0
                      ? 'У этого пользователя нет пройденных курсов без выданного сертификата.'
                      : 'Показаны только пройденные курсы, по которым сертификат ещё не выдан.'}
                </span>
              </label>
              <label className={styles.editFullWidth}>
                Файл сертификата
                <input type="file" onChange={(e) => handleCertificateFileChange(e.target.files?.[0])} className={styles.editInput} />
                {newCertificate.fileName && <span className={styles.fileHint}>Загружен: {newCertificate.fileName}</span>}
              </label>
            </div>
            {certificateError && <div className={styles.loginError}>{certificateError}</div>}
            <button type="button" className={styles.addBtn} onClick={handleCreateCertificate}>Добавить сертификат</button>
            <datalist id="admin-users">
              {userRows.map((userItem) => (
                <option key={userItem.email} value={userItem.email} />
              ))}
            </datalist>
          </div>
          <div className={styles.courseActions}>
            <button type="button" className={styles.restoreBtn} onClick={() => { markAdminItemsSeen('certificates', certificates); setRefresh((r) => r + 1) }}>Отметить все как увиденные</button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Курс</th>
                  <th>Статус</th>
                  <th>Балл</th>
                  <th>Файл</th>
                  <th>Дата</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.length === 0 ? (
                  <tr><td colSpan={7} className={styles.empty}>Нет данных</td></tr>
                ) : (
                  filteredCertificates.map((c, i) => {
                    const unseen = !isAdminItemSeen('certificates', c)
                    const score = c.score ?? getCourseAverageScore(c.email, c.courseId)
                    return (
                      <tr key={c.id || i} className={unseen ? styles.unseenRow : ''}>
                        <td>{c.email}</td>
                        <td>{c.courseTitle}</td>
                        <td>{c.fileDataUrl ? 'Выдан' : 'Ожидает выдачи'}</td>
                        <td>{formatScore(score)}</td>
                        <td>
                          {c.fileDataUrl ? (
                            <div className={styles.inlineActions}>
                              <a href={c.fileDataUrl} target="_blank" rel="noreferrer" className={styles.inlineLink}>Открыть</a>
                              <a href={c.fileDataUrl} download={c.fileName || 'certificate'} className={styles.inlineLink}>Скачать</a>
                            </div>
                          ) : 'Файл не загружен'}
                        </td>
                        <td>{formatDate(c.date)}</td>
                        <td>
                          {unseen && <button type="button" className={styles.inlineBtn} onClick={() => { markAdminItemSeen('certificates', c); setRefresh((v) => v + 1) }}>Увидено</button>}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {activeTab === 'purchases' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Покупки курсов</h2>
          <div className={styles.courseActions}>
            <button type="button" className={styles.restoreBtn} onClick={() => { markAdminItemsSeen('purchases', purchases); setRefresh((r) => r + 1) }}>Отметить все как увиденные</button>
            <button type="button" className={styles.exportBtn} onClick={() => exportCsv('purchases.csv', filteredPurchases.map((p) => [p.email, p.courseTitle, p.amount, p.date]), ['Email', 'Курс', 'Сумма €', 'Дата'])}>Экспорт CSV</button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Курс</th>
                  <th>Сумма</th>
                  <th>Дата</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length === 0 ? (
                  <tr><td colSpan={5} className={styles.empty}>Нет данных</td></tr>
                ) : (
                  filteredPurchases.map((p, i) => {
                    const unseen = !isAdminItemSeen('purchases', p)
                    return (
                      <tr key={p.id || i} className={unseen ? styles.unseenRow : ''}>
                        <td>{p.email}</td>
                        <td>{p.courseTitle}</td>
                        <td>{p.amount != null ? `${p.amount} €` : '—'}</td>
                        <td>{formatDate(p.date)}</td>
                        <td>
                          {unseen && <button type="button" className={styles.inlineBtn} onClick={() => { markAdminItemSeen('purchases', p); setRefresh((v) => v + 1) }}>Увидено</button>}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
        )}
        </main>
      </div>
    </div>
  )
}
