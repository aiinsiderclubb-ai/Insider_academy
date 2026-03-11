import { Fragment, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getRegistrations,
  getCertificates,
  getPurchases,
  getAnalyticsData,
  getReferrals,
  getDiscounts,
  getHomeworkSubmissions,
  updateHomeworkSubmission,
  addNotification,
  recordCertificate,
  getCourseAverageScore,
  isAdminItemSeen,
  markAdminItemSeen,
  markAdminItemsSeen,
} from '../api/adminStore'
import { getCourses, setCourses } from '../api/courseStore'
import { getBlogPosts, setBlogPosts } from '../api/blogStore'
import { getCalendarEvents, setCalendarEvents } from '../api/calendarStore'
import { courses as defaultCourses } from '../data/courses'
import { blogPosts as defaultBlog } from '../data/blog'
import styles from './Admin.module.css'

const ADMIN_PASSWORD = 'admin123'

const adminTabs = [
  { id: 'analytics', label: 'Аналитика' },
  { id: 'registrations', label: 'Регистрации' },
  { id: 'purchases', label: 'Покупки' },
  { id: 'certificates', label: 'Сертификаты' },
  { id: 'homework', label: 'ДЗ' },
  { id: 'courses', label: 'Курсы' },
  { id: 'blog', label: 'Блог' },
  { id: 'calendar', label: 'Календарь' },
  { id: 'referrals', label: 'Рефералы' },
]

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
  const [activeTab, setActiveTab] = useState('analytics')
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

  useEffect(() => {
    const saved = localStorage.getItem('lms_admin_auth')
    if (saved === ADMIN_PASSWORD) setAuthenticated(true)
  }, [])

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

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('lms_admin_auth', password)
      setAuthenticated(true)
    } else {
      setError('Неверный пароль')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('lms_admin_auth')
    setAuthenticated(false)
    setPassword('')
  }

  const saveCourses = (next) => {
    setCourses(next)
    setCoursesState(next)
    setEditingIndex(null)
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

  const restoreDefaults = () => {
    if (!window.confirm('Восстановить курсы по умолчанию? Текущие изменения будут потеряны.')) return
    setCourses(defaultCourses)
    setCoursesState(defaultCourses)
    setEditingIndex(null)
  }

  if (!authenticated) {
    return (
      <div className={styles.page}>
        <div className={styles.loginCard}>
          <h1 className={styles.loginTitle}>Админ-панель</h1>
          <p className={styles.loginDesc}>Введите пароль для доступа</p>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            {error && <div className={styles.loginError}>{error}</div>}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              className={styles.loginInput}
              autoFocus
            />
            <button type="submit" className={styles.loginBtn}>Войти</button>
          </form>
          <p className={styles.loginHint}>Демо: пароль admin123</p>
        </div>
      </div>
    )
  }

  const registrations = getRegistrations()
  const certificates = getCertificates()
  const purchases = getPurchases()
  const analytics = getAnalyticsData()
  const referrals = getReferrals()
  const homeworkList = getHomeworkSubmissions()
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
  const discounts = getDiscounts()
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

  const unreadByTab = {
    registrations: getUnseenCount('registrations', registrations),
    purchases: getUnseenCount('purchases', purchases),
    certificates: getUnseenCount('certificates', certificates),
    homework: getUnseenCount('homework', homeworkList),
  }

  const handleHomeworkDecision = (submission, status) => {
    const comment = hwComment[submission.id] ?? submission.adminComment ?? ''
    const rawScore = hwScore[submission.id] ?? submission.score ?? ''
    const parsedScore = rawScore === '' ? null : Number(rawScore)
    if (status === 'accepted' && !(parsedScore >= 1 && parsedScore <= 10)) {
      window.alert('Укажите оценку от 1 до 10 перед принятием ДЗ.')
      return
    }
    updateHomeworkSubmission(submission.id, {
      status,
      adminComment: comment || null,
      score: parsedScore >= 1 && parsedScore <= 10 ? parsedScore : null,
    })
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

  const handleCreateCertificate = () => {
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

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <h1 className={styles.title}>Админ-панель</h1>
          <div className={styles.headerActions}>
            <Link to="/" className={styles.backLink}>← На сайт</Link>
            <button type="button" onClick={handleLogout} className={styles.logoutBtn}>Выйти</button>
          </div>
        </header>

        <div className={styles.tabs}>
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {unreadByTab[tab.id] > 0 && <span className={styles.tabBadge}>{unreadByTab[tab.id]}</span>}
            </button>
          ))}
        </div>

        {activeTab === 'analytics' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Аналитика</h2>
          <div className={styles.statsGrid}>
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
                {referrals.length === 0 ? (
                  <tr><td colSpan={4} className={styles.empty}>Нет данных</td></tr>
                ) : (
                  referrals.map((r, i) => (
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
                {homeworkList.length === 0 ? (
                  <tr><td colSpan={8} className={styles.empty}>Нет сданных ДЗ</td></tr>
                ) : (
                  homeworkList.map((h) => {
                    const unseen = !isAdminItemSeen('homework', h)
                    const previewOpen = previewHomeworkId === h.id && canPreviewFile(h.fileType)
                    return (
                      <Fragment key={h.id}>
                        <tr className={unseen ? styles.unseenRow : ''}>
                          <td>{h.email}<br /><small>{h.name}</small></td>
                          <td>{h.courseTitle} — ур. {h.lessonIndex + 1}</td>
                          <td className={`${styles.cellClip} ${styles.fragmentCell}`}>{(h.content || '').slice(0, 120) || '—'}{h.content && h.content.length > 120 ? '…' : ''}</td>
                          <td className={styles.fileCell}>
                            {h.fileDataUrl ? (
                              <div className={styles.fileActions}>
                                <span className={styles.fileName}>{h.fileName || 'Файл'}</span>
                                <div className={styles.inlineActions}>
                                  <a href={h.fileDataUrl} target="_blank" rel="noreferrer" className={styles.inlineLink}>Открыть</a>
                                  <a href={h.fileDataUrl} download={h.fileName || 'homework'} className={styles.inlineLink}>Скачать</a>
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

        {activeTab === 'blog' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Блог</h2>
          <p className={styles.sectionDesc}>Редактирование, добавление, удаление. Подгрузка с <a href="https://www.aiinsider.it.com/uk/blog" target="_blank" rel="noreferrer">aiinsider.it.com/uk/blog</a> — через бэкенд (в демо данные из хранилища).</p>
          <div className={styles.courseActions}>
            <button type="button" onClick={() => { setBlogPosts(defaultBlog); setRefresh((r) => r + 1); }} className={styles.restoreBtn}>Сбросить к данным по умолчанию</button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Slug</th>
                  <th>Дата</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {(getBlogPosts() || []).slice(0, 20).map((post) => (
                  <tr key={post.id}>
                    <td>{post.title?.slice(0, 50)}…</td>
                    <td>{post.slug}</td>
                    <td>{post.date}</td>
                    <td>
                      <button type="button" className={styles.smallBtnDanger} onClick={() => { const list = getBlogPosts().filter((p) => p.id !== post.id); setBlogPosts(list); setRefresh((r) => r + 1); }}>Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              <h4 className={styles.editSubtitle}>Уроки (ролики, названия)</h4>
              {(editForm.lessons || []).map((les, idx) => (
                <div key={idx} className={styles.lessonRow}>
                  <span className={styles.lessonNum}>Урок {idx + 1}</span>
                  <input placeholder="Название RU" value={les.title} onChange={(e) => setLesson(idx, 'title', e.target.value)} className={styles.editInput} />
                  <input placeholder="Название EN" value={les.titleEn} onChange={(e) => setLesson(idx, 'titleEn', e.target.value)} className={styles.editInput} />
                  <input placeholder="Длительность" value={les.duration} onChange={(e) => setLesson(idx, 'duration', e.target.value)} className={styles.editInput} />
                  <input placeholder="URL видео" value={les.videoUrl} onChange={(e) => setLesson(idx, 'videoUrl', e.target.value)} className={styles.editInput} />
                  <button type="button" onClick={() => removeLesson(idx)} className={styles.smallBtnDanger}>×</button>
                </div>
              ))}
              <button type="button" onClick={addLesson} className={styles.smallBtn}>+ Урок</button>
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
                {courses.length === 0 ? (
                  <tr><td colSpan={5} className={styles.empty}>Нет курсов</td></tr>
                ) : (
                  courses.map((c, i) => (
                    <tr key={c.id || i}>
                      <td>{c.id}</td>
                      <td>{c.title}</td>
                      <td>{c.slug}</td>
                      <td>{c.isFreeTrial ? 'Бесплатно' : `${c.priceEur ?? c.price} €`}</td>
                      <td>
                        <button type="button" onClick={() => startEdit(i)} className={styles.smallBtn}>Изменить</button>
                        <button type="button" onClick={() => handleDeleteCourse(i)} className={styles.smallBtnDanger}>Удалить</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {activeTab === 'registrations' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Регистрации</h2>
          <div className={styles.courseActions}>
            <button type="button" className={styles.restoreBtn} onClick={() => { markAdminItemsSeen('registrations', registrations); setRefresh((r) => r + 1) }}>Отметить все как увиденные</button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Имя</th>
                  <th>Дата</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr><td colSpan={4} className={styles.empty}>Нет данных</td></tr>
                ) : (
                  registrations.map((r, i) => {
                    const unseen = !isAdminItemSeen('registrations', r)
                    return (
                      <tr key={r.id || i} className={unseen ? styles.unseenRow : ''}>
                        <td>{r.email}</td>
                        <td>{r.name}</td>
                        <td>{formatDate(r.date)}</td>
                        <td>
                          {unseen && <button type="button" className={styles.inlineBtn} onClick={() => { markAdminItemSeen('registrations', r); setRefresh((v) => v + 1) }}>Увидено</button>}
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
              {registrations.map((userItem) => (
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
                {certificates.length === 0 ? (
                  <tr><td colSpan={7} className={styles.empty}>Нет данных</td></tr>
                ) : (
                  certificates.map((c, i) => {
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
                {purchases.length === 0 ? (
                  <tr><td colSpan={5} className={styles.empty}>Нет данных</td></tr>
                ) : (
                  purchases.map((p, i) => {
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
      </div>
    </div>
  )
}
