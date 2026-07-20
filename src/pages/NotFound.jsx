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
      <div className={styles.copy}>
        <p className={styles.code} aria-hidden>404</p>
        <h1 className={styles.title}>{ru ? 'Маршрут потерян' : 'Route lost'}</h1>
        <p className={styles.text}>
          {ru
            ? 'Инсайдер уже ищет нужную страницу. А пока вернёмся в Академию.'
            : 'The Insider is already looking for it. Meanwhile, let’s return to the Academy.'}
        </p>
        <Link to="/" className={styles.btn}>{ru ? 'Вернуться на главную' : 'Return home'}</Link>
      </div>
      <div className={styles.visual} aria-hidden="true">
        <img src="/design/course-ai-data.webp" alt="" />
      </div>
    </div>
  )
}
