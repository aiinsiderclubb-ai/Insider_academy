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
              {lang === 'ru' ? 'Выберите доступ к AI Insider Academy' : 'Choose your AI Insider Academy access'}
            </h1>
            <p className={styles.subtitle}>
              {lang === 'ru'
                ? 'Club открывает обучение и комьюнити. Pro добавляет готовые workflow, шаблоны агентов и материалы для клиентов.'
                : 'Club unlocks learning and community. Pro adds workflows, agent templates and client-ready resources.'}
            </p>
          </ScrollReveal>
        </div>
      </section>

      <MembershipsSection lang={lang} showHeader={false} />
    </div>
  )
}
