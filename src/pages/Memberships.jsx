import { useLanguage } from '../context/LanguageContext'
import { ArrowRight } from 'lucide-react'
import { MembershipsSection } from '../components/MembershipsSection'
import { ScrollReveal } from '../components/ScrollReveal'
import styles from './Memberships.module.css'

export function Memberships() {
  const { lang } = useLanguage()

  return (
    <div className={styles.wrap}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <ScrollReveal className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className={styles.pill}>
                {lang === 'ru' ? 'Подписка · все курсы · шаблоны Pro' : 'Subscription · all courses · Pro templates'}
              </span>
              <h1 className={styles.title}>
                {lang === 'ru' ? 'Один доступ. Два уровня роста.' : 'One access. Two levels of growth.'}
              </h1>
              <p className={styles.subtitle}>
                {lang === 'ru'
                  ? 'Club открывает обучение и комьюнити. Pro добавляет готовые workflow, шаблоны агентов и материалы для клиентов.'
                  : 'Club unlocks learning and community. Pro adds workflows, agent templates and client-ready resources.'}
              </p>
              <div className={styles.heroActions}>
                <a href="#memberships" className={styles.primaryLink}>
                  {lang === 'ru' ? 'Выбрать доступ' : 'Choose access'}
                </a>
                <a href="#compare" className={styles.secondaryLink}>
                  {lang === 'ru' ? 'Сравнить планы' : 'Compare plans'}
                </a>
              </div>
            </div>
            <div className={styles.accessVisual} aria-hidden="true">
              <span className={styles.visualOrbit} />
              <span className={styles.visualKicker}>AI INSIDER MEMBERSHIP</span>
              <div className={styles.visualPlans}>
                <span className={styles.visualClub}>Club</span>
                <ArrowRight className={styles.visualArrow} size={34} strokeWidth={1.4} />
                <span className={styles.visualPro}>Pro</span>
              </div>
              <span className={styles.visualCaption}>LEARN / BUILD / LAUNCH</span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <MembershipsSection lang={lang} showHeader={false} />
    </div>
  )
}
