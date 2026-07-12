import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { PageMeta } from '../components/PageMeta'
import styles from './NotFound.module.css'

export function NotFound() {
  const { lang } = useLanguage()
  const ru = lang === 'ru'

  return (
    <div className={styles.page}>
      <PageMeta
        title="404"
        description={ru ? 'Страница не найдена' : 'Page not found'}
        path="/404"
      />
      <p className={styles.code} aria-hidden>404</p>
      <h1 className={styles.title}>
        {ru ? 'Здесь пусто' : 'Nothing here'}
      </h1>
      <p className={styles.text}>
        {ru
          ? 'Маршрут сломан или страница переехала. Вернёмся на главную.'
          : 'Broken route or a moved page. Let’s head home.'}
      </p>
      <Link to="/" className={styles.btn}>
        {ru ? 'На главную' : 'Go home'}
      </Link>
    </div>
  )
}
