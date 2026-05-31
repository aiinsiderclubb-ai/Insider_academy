import { CLUB_PLAN } from '../data/courseLanding'
import { ScrollReveal } from './ScrollReveal'
import styles from './ComparePlans.module.css'

export function ComparePlans({ course, lang, coursePriceEur }) {
  const clubFeatures = lang === 'ru' ? CLUB_PLAN.featuresRu : CLUB_PLAN.featuresEn

  return (
    <ScrollReveal>
      <section className={styles.wrap}>
        <h2 className={styles.title}>{lang === 'ru' ? 'Сравнение тарифов' : 'Compare plans'}</h2>
        <div className={styles.grid}>
          <div className={styles.plan}>
            <span className={styles.planLabel}>{lang === 'ru' ? 'Один курс' : 'Single course'}</span>
            <div className={styles.planPrice}>{coursePriceEur} €</div>
            <p className={styles.planPeriod}>{lang === 'ru' ? 'разовая оплата' : 'one-time'}</p>
            <ul className={styles.features}>
              <li>{lang === 'ru' ? 'Доступ к этому курсу' : 'Access to this course'}</li>
              <li>{lang === 'ru' ? 'Проверка ДЗ' : 'Homework review'}</li>
              <li>{lang === 'ru' ? 'Сертификат' : 'Certificate'}</li>
            </ul>
            <span className={styles.currentBadge}>{lang === 'ru' ? 'Вы выбрали' : 'Selected'}</span>
          </div>

          <div className={`${styles.plan} ${styles.planFeatured}`}>
            <span className={styles.planBadge}>{lang === 'ru' ? 'Выгоднее' : 'Best value'}</span>
            <span className={styles.planLabel}>{lang === 'ru' ? CLUB_PLAN.name : CLUB_PLAN.nameEn}</span>
            <div className={styles.planPrice}>{CLUB_PLAN.priceEur} €</div>
            <p className={styles.planPeriod}>{lang === 'ru' ? CLUB_PLAN.periodRu : CLUB_PLAN.periodEn}</p>
            <ul className={styles.features}>
              {clubFeatures.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <a
              href="https://web.tribute.tg/p/h8e"
              target="_blank"
              rel="noreferrer noopener"
              className={styles.clubBtn}
            >
              {lang === 'ru' ? 'Вступить в клуб' : 'Join the club'}
            </a>
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}
