import { useMemo, useState } from 'react'
import { api } from '../../api/client'
import { courses as catalogCourses } from '../../data/courses'
import styles from '../../pages/Admin.module.css'

export function AdminUserDrawer({
  user,
  purchases = [],
  homeworkList = [],
  reviewsList = [],
  applications = [],
  online = false,
  showToast,
  onClose,
  onRefresh,
  formatDate,
}) {
  const [unlockCourseId, setUnlockCourseId] = useState(catalogCourses[0]?.id || '')
  const [unlockLessonNum, setUnlockLessonNum] = useState(1)
  const [unlockBusy, setUnlockBusy] = useState(false)

  const selectedCourse = useMemo(
    () => catalogCourses.find((c) => c.id === unlockCourseId),
    [unlockCourseId]
  )
  const lessonCount = selectedCourse?.lessons?.length || 0

  if (!user) return null

  const email = user.email?.toLowerCase()
  const userPurchases = purchases.filter(
    (p) => p.email?.toLowerCase() === email || p.userId === user.id
  )
  const userHw = homeworkList.filter((h) => h.email?.toLowerCase() === email)
  const userRev = reviewsList.filter((r) => r.email?.toLowerCase() === email || r.contactEmail?.toLowerCase() === email)
  const userApps = applications.filter((a) => a.email?.toLowerCase() === email)

  const handleUnlockLesson = async () => {
    if (!online) {
      showToast?.('Подключите API-сервер', 'error')
      return
    }
    const lessonIndex = Math.max(0, Number(unlockLessonNum) - 1)
    if (lessonCount && lessonIndex >= lessonCount) {
      showToast?.(`В курсе только ${lessonCount} урок(ов)`, 'error')
      return
    }
    setUnlockBusy(true)
    try {
      const res = await api.adminUnlockLesson({
        email: user.email,
        courseId: unlockCourseId,
        courseTitle: selectedCourse?.title,
        lessonIndex,
      })
      showToast?.(
        `Открыт урок ${lessonIndex + 1}${res.courseGranted ? ' · курс выдан' : ''}`,
        'success'
      )
      onRefresh?.()
    } catch (err) {
      showToast?.(err.message || 'Не удалось открыть урок', 'error')
    } finally {
      setUnlockBusy(false)
    }
  }

  return (
    <div className={styles.drawerOverlay} onClick={onClose} role="presentation">
      <aside
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Профиль пользователя"
      >
        <header className={styles.drawerHead}>
          <div>
            <h3>{user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Пользователь'}</h3>
            <p>{user.email}</p>
            {user.personalId && <p className={styles.drawerMuted}>ID: {user.personalId}</p>}
            {(user.telegramConnected != null || user.telegramUsername || user.telegram) && (
              <p className={styles.drawerMuted}>
                Telegram: {user.telegramUsername || user.telegram || '—'}
                {' · '}
                {user.telegramConnected ? (
                  <span className={styles.tgBadgeOn}>бот подключён</span>
                ) : (
                  <span className={styles.tgBadgeOff}>бот не подключён</span>
                )}
              </p>
            )}
          </div>
          <button type="button" className={styles.drawerClose} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        <section className={styles.drawerSection}>
          <h4>Открыть урок</h4>
          <p className={styles.drawerMuted}>
            Выдаёт доступ к курсу (если нет), принимает ДЗ по предыдущим урокам и открывает выбранный урок.
          </p>
          <select
            value={unlockCourseId}
            onChange={(e) => setUnlockCourseId(e.target.value)}
            className={styles.input}
            style={{ width: '100%', marginBottom: 8 }}
          >
            {catalogCourses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label className={styles.drawerMuted}>
              Урок №
              <input
                type="number"
                min={1}
                max={lessonCount || 99}
                value={unlockLessonNum}
                onChange={(e) => setUnlockLessonNum(Number(e.target.value) || 1)}
                className={styles.input}
                style={{ width: 72, marginLeft: 8 }}
              />
            </label>
            {lessonCount > 0 && (
              <span className={styles.drawerMuted}>из {lessonCount}</span>
            )}
          </div>
          <button
            type="button"
            className={styles.primaryBtn}
            style={{ marginTop: 10 }}
            disabled={unlockBusy || !online}
            onClick={handleUnlockLesson}
          >
            {unlockBusy ? 'Открываем…' : 'Открыть урок пользователю'}
          </button>
        </section>

        <section className={styles.drawerSection}>
          <h4>Заявки Accelerator ({userApps.length})</h4>
          {userApps.length === 0 ? (
            <p className={styles.drawerMuted}>Нет заявок</p>
          ) : (
            <ul className={styles.drawerList}>
              {userApps.map((a) => (
                <li key={a.id}>
                  {formatDate(a.date)} · {a.status || 'new'}
                  {a.accessGranted ? ' · доступ ✓' : ''}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.drawerSection}>
          <h4>Покупки ({userPurchases.length})</h4>
          {userPurchases.length === 0 ? (
            <p className={styles.drawerMuted}>Нет покупок</p>
          ) : (
            <ul className={styles.drawerList}>
              {userPurchases.map((p) => (
                <li key={p.id || `${p.courseId}-${p.date}`}>
                  {p.courseTitle || p.courseId} · {formatDate(p.date)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.drawerSection}>
          <h4>ДЗ ({userHw.length})</h4>
          {userHw.length === 0 ? (
            <p className={styles.drawerMuted}>Нет домашних заданий</p>
          ) : (
            <ul className={styles.drawerList}>
              {userHw.slice(0, 12).map((h) => (
                <li key={h.id}>
                  {h.courseTitle || h.courseId} · урок {(h.lessonIndex ?? 0) + 1} · {h.status}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.drawerSection}>
          <h4>Отзывы ({userRev.length})</h4>
          <ul className={styles.drawerList}>
            {userRev.length === 0 ? (
              <li className={styles.drawerMuted}>Нет отзывов</li>
            ) : (
              userRev.map((r) => (
                <li key={r.id}>
                  {r.courseId} · ★{r.rating} · {r.status || 'pending'}
                </li>
              ))
            )}
          </ul>
        </section>
      </aside>
    </div>
  )
}
