import { useLanguage } from '../context/LanguageContext'
import { MembershipsSection } from '../components/MembershipsSection'
import { ScrollReveal } from '../components/ScrollReveal'
import styles from './Memberships.module.css'

export function Memberships() {
  const { lang } = useLanguage()

  return (
    <div className={styles.wrap}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <ScrollReveal>
            <span className={styles.pill}>
              {lang === 'ru' ? 'Подписка · все курсы · шаблоны Pro' : 'Subscription · all courses · Pro templates'}
            </span>
            <h1 className={styles.title}>
              {lang === 'ru' ? 'AI Insider Memberships' : 'AI Insider Memberships'}
            </h1>
            <p className={styles.subtitle}>
              {lang === 'ru'
                ? 'Club открывает все курсы Academy. Pro добавляет готовые workflow, шаблоны агентов и ресурсы для клиентов.'
                : 'Club unlocks every Academy course. Pro adds ready workflows, agent templates and client resources.'}
            </p>
          </ScrollReveal>
        </div>
      </section>

      <MembershipsSection lang={lang} />
    </div>
  )
}
