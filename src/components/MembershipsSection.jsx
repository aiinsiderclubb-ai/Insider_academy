import { Link } from 'react-router-dom'
import { MEMBERSHIPS_TITLE, MEMBERSHIP_PLANS } from '../data/memberships'
import { ScrollReveal } from './ScrollReveal'
import styles from './MembershipsSection.module.css'

export function MembershipsSection({ lang, compact = false }) {
  return (
    <section className={`${styles.section} ${compact ? styles.sectionCompact : ''}`} id="memberships">
      <div className={styles.container}>
        <ScrollReveal>
          <header className={styles.header}>
            <h2 className={styles.title}>
              {lang === 'en' ? MEMBERSHIPS_TITLE.en : MEMBERSHIPS_TITLE.ru}
            </h2>
            {!compact && (
              <p className={styles.lead}>
                {lang === 'ru'
                  ? 'Один тариф — все курсы Academy. Pro добавляет шаблоны, workflow и ресурсы для клиентов.'
                  : 'One plan — every Academy course. Pro adds templates, workflows and client-ready resources.'}
              </p>
            )}
          </header>
        </ScrollReveal>

        <div className={styles.grid}>
          {MEMBERSHIP_PLANS.map((plan, index) => {
            const name = lang === 'en' ? plan.nameEn : plan.name
            const includes = lang === 'en' ? plan.includesEn : plan.includesRu
            const bonus = lang === 'en' ? plan.bonusEn : plan.bonusRu
            const badge = plan.badge ? (lang === 'en' ? plan.badge.en : plan.badge.ru) : null
            const save = plan.saveLabelRu
              ? (lang === 'en' ? plan.saveLabelEn : plan.saveLabelRu)
              : null
            const cta = lang === 'en' ? plan.ctaEn : plan.ctaRu
            const isPro = plan.tier === 'pro'

            return (
              <ScrollReveal key={plan.id} delay={index * 40}>
                <article
                  className={`${styles.card} ${plan.featured ? styles.cardFeatured : ''} ${isPro ? styles.cardPro : ''}`}
                >
                  {badge && <span className={styles.popular}>{badge}</span>}
                  {save && <span className={styles.save}>{save}</span>}

                  <h3 className={styles.planName}>{name}</h3>

                  <div className={styles.priceRow}>
                    <strong className={styles.price}>{plan.priceEur}€</strong>
                    <span className={styles.period}>
                      {lang === 'en' ? plan.periodEn : plan.periodRu}
                    </span>
                  </div>

                  <ul className={styles.features}>
                    {includes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>

                  {bonus.length > 0 && (
                    <div className={styles.bonus}>
                      <strong>Bonus:</strong>
                      <ul>
                        {bonus.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Link
                    to="/cabinet#support"
                    className={isPro ? styles.btnPro : styles.btnClub}
                  >
                    {cta}
                  </Link>
                </article>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
