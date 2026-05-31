import { useTheme } from '../context/ThemeContext'
import { ScrollReveal } from './ScrollReveal'
import styles from './ThemePreview.module.css'

export function ThemePreview({ lang }) {
  const { theme, setTheme } = useTheme()

  return (
    <ScrollReveal>
      <section className={styles.wrap}>
        <h2 className={styles.title}>
          {lang === 'ru' ? 'Как выглядит платформа' : 'Platform preview'}
        </h2>
        <p className={styles.desc}>
          {lang === 'ru'
            ? 'Переключайте тему — интерфейс адаптируется под ваш стиль.'
            : 'Switch themes — the interface adapts to your preference.'}
        </p>
        <div className={styles.previews}>
          <button
            type="button"
            className={`${styles.preview} ${styles.darkPreview} ${theme === 'dark' ? styles.active : ''}`}
            onClick={() => setTheme('dark')}
            aria-pressed={theme === 'dark'}
          >
            <div className={styles.mockHeader} />
            <div className={styles.mockSidebar} />
            <div className={styles.mockContent}>
              <div className={styles.mockCard} />
              <div className={styles.mockCard} />
            </div>
            <span className={styles.previewLabel}>{lang === 'ru' ? 'Тёмная' : 'Dark'}</span>
          </button>
          <button
            type="button"
            className={`${styles.preview} ${styles.lightPreview} ${theme === 'light' ? styles.active : ''}`}
            onClick={() => setTheme('light')}
            aria-pressed={theme === 'light'}
          >
            <div className={styles.mockHeader} />
            <div className={styles.mockSidebar} />
            <div className={styles.mockContent}>
              <div className={styles.mockCard} />
              <div className={styles.mockCard} />
            </div>
            <span className={styles.previewLabel}>{lang === 'ru' ? 'Светлая' : 'Light'}</span>
          </button>
        </div>
      </section>
    </ScrollReveal>
  )
}
