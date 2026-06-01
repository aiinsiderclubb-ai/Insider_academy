import styles from '../../pages/Admin.module.css'

export function AdminUserDrawer({
  user,
  purchases = [],
  homeworkList = [],
  reviewsList = [],
  applications = [],
  onClose,
  formatDate,
}) {
  if (!user) return null

  const email = user.email?.toLowerCase()
  const userPurchases = purchases.filter(
    (p) => p.email?.toLowerCase() === email || p.userId === user.id
  )
  const userHw = homeworkList.filter((h) => h.email?.toLowerCase() === email)
  const userRev = reviewsList.filter((r) => r.email?.toLowerCase() === email || r.contactEmail?.toLowerCase() === email)
  const userApps = applications.filter((a) => a.email?.toLowerCase() === email)

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
