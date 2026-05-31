import { useTheme } from '../context/ThemeContext'
import { IconMoon, IconSun } from './Icons'
import styles from './ThemeToggle.module.css'

export function ThemeToggle({ darkLabel, lightLabel }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      title={isDark ? lightLabel : darkLabel}
      aria-label={isDark ? lightLabel : darkLabel}
    >
      <span className={`${styles.iconWrap} ${isDark ? styles.showSun : styles.showMoon}`}>
        <span className={styles.icon} aria-hidden><IconSun /></span>
        <span className={styles.icon} aria-hidden><IconMoon /></span>
      </span>
    </button>
  )
}
