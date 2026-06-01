import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MEMBERSHIPS_TITLE, MEMBERSHIP_PLANS } from '../data/memberships'
import { PLAN_COMPARISON_ROWS } from '../data/membershipDetails'
import { ScrollReveal } from './ScrollReveal'
import styles from './MembershipsSection.module.css'

const BONUS_CARDS = {
  ru: [
    ['Club', 'Доступ к обычным курсам, урокам, материалам и сертификатам.'],
    ['Pro', 'Открывает Pro-only курсы, workflow, шаблоны, промпты и ресурсы для клиентов.'],
    ['Пакеты курсов', 'Разовые наборы с Pro-only курсами и бонусами под конкретный результат.'],
    ['Без лишнего', 'Вы выбираете: подписка для доступа или пакет для запуска проекта.'],
  ],
  en: [
    ['Club', 'Access to regular courses, lessons, materials and certificates.'],
    ['Pro', 'Unlocks Pro-only courses, workflows, templates, prompts and client-ready resources.'],
    ['Course packs', 'One-time bundles with Pro-only courses and outcome-focused bonuses.'],
    ['Clear choice', 'Subscription for access, or a pack for launching a project.'],
  ],
}

function mark(value, lang) {
  return value ? '✓' : (lang === 'ru' ? '—' : '-')
}

export function MembershipsSection({ lang, compact = false, showHeader = true }) {
  const [billing, setBilling] = useState('monthly')
  const plans = useMemo(
    () => MEMBERSHIP_PLANS.filter((plan) => plan.billing === billing),
    [billing]
  )
  const comparisonRows = lang === 'en' ? PLAN_COMPARISON_ROWS.en : PLAN_COMPARISON_ROWS.ru
  const bonusCards = lang === 'en' ? BONUS_CARDS.en : BONUS_CARDS.ru

  return (
    <section className={`${styles.section} ${compact ? styles.sectionCompact : ''}`} id="memberships">
      <div className={styles.container}>
        {showHeader && (
          <ScrollReveal>
            <header className={styles.header}>
              <h2 className={styles.title}>
                {lang === 'en' ? MEMBERSHIPS_TITLE.en : MEMBERSHIPS_TITLE.ru}
              </h2>
              {!compact && (
                <p className={styles.lead}>
                  {lang === 'ru'
                    ? 'Club открывает обычные курсы Academy. Pro добавляет Agent Engineer, Agency Builder, шаблоны, workflow и ресурсы для клиентов.'
                    : 'Club unlocks regular Academy courses. Pro adds Agent Engineer, Agency Builder, templates, workflows and client-ready resources.'}
                </p>
              )}
            </header>
          </ScrollReveal>
        )}

        <ScrollReveal>
          <div className={styles.billingSwitch} role="tablist" aria-label={lang === 'ru' ? 'Период оплаты' : 'Billing period'}>
            <button
              type="button"
              className={billing === 'monthly' ? styles.billingActive : ''}
              onClick={() => setBilling('monthly')}
              role="tab"
              aria-selected={billing === 'monthly'}
            >
              {lang === 'ru' ? 'Ежемесячно' : 'Monthly'}
            </button>
            <button
              type="button"
              className={billing === 'annual' ? styles.billingActive : ''}
              onClick={() => setBilling('annual')}
              role="tab"
              aria-selected={billing === 'annual'}
            >
              {lang === 'ru' ? 'Годовой доступ' : 'Annual'}
              <span>{lang === 'ru' ? 'до 6 месяцев бесплатно' : 'up to 6 months free'}</span>
            </button>
          </div>
        </ScrollReveal>

        <div className={styles.grid}>
          {plans.map((plan, index) => {
            const name = lang === 'en' ? plan.nameEn : plan.name
            const includes = lang === 'en' ? plan.includesEn : plan.includesRu
            const bonus = lang === 'en' ? plan.bonusEn : plan.bonusRu
            const badge = plan.badge ? (lang === 'en' ? plan.badge.en : plan.badge.ru) : null
            const save = plan.saveLabelRu
              ? (lang === 'en' ? plan.saveLabelEn : plan.saveLabelRu)
              : null
            const cta = lang === 'en' ? plan.ctaEn : plan.ctaRu
            const isPro = plan.tier === 'pro'
            const planBadge = isPro
              ? (lang === 'ru' ? 'Лучший выбор для заработка' : 'Best for monetization')
              : (badge || (lang === 'ru' ? 'Для обучения' : 'For learning'))
            const subline = isPro
              ? (lang === 'ru'
                ? 'Для тех, кто хочет внедрять AI, брать клиентов и продавать услуги.'
                : 'For building AI systems, landing clients and selling services.')
              : (lang === 'ru'
                ? 'Для тех, кто хочет пройти основные курсы. Agent Engineer и Agency Builder не входят.'
                : 'For learning core courses. Agent Engineer and Agency Builder are not included.')
            const detailsPath = `/memberships/${isPro ? 'pro' : 'club'}`

            return (
              <ScrollReveal key={plan.id} delay={index * 40}>
                <article
                  className={`${styles.card} ${isPro ? styles.cardFeatured : ''} ${isPro ? styles.cardPro : ''}`}
                >
                  {save && <span className={styles.save}>{save}</span>}
                  <span className={isPro ? styles.popular : styles.planBadge}>{planBadge}</span>

                  <h3 className={styles.planName}>{name}</h3>
                  <p className={styles.planSubline}>{subline}</p>

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
                      <strong>{lang === 'ru' ? 'Бонус:' : 'Bonus:'}</strong>
                      <ul>
                        {bonus.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className={styles.actions}>
                    <Link
                      to="/cabinet#support"
                      className={isPro ? styles.btnPro : styles.btnClub}
                    >
                      {cta}
                    </Link>
                    <Link to={detailsPath} className={styles.btnDetails}>
                      {lang === 'ru' ? 'Подробнее' : 'Details'}
                    </Link>
                  </div>
                  <p className={styles.cardNote}>
                    {lang === 'ru'
                      ? 'Доступ открывается сразу после подтверждения оплаты.'
                      : 'Access opens immediately after payment confirmation.'}
                  </p>
                </article>
              </ScrollReveal>
            )
          })}
        </div>

        {!compact && (
          <ScrollReveal>
            <div className={styles.bonusGrid} aria-label={lang === 'ru' ? 'Бонусы подписки' : 'Membership bonuses'}>
              {bonusCards.map(([title, text]) => (
                <article className={styles.bonusCard} key={title}>
                  <span className={styles.bonusMark} aria-hidden />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </ScrollReveal>
        )}

        {!compact && (
          <ScrollReveal>
            <section id="compare" className={styles.compare} aria-label={lang === 'ru' ? 'Сравнение тарифов' : 'Plan comparison'}>
              <div className={styles.compareHead}>
                <h3>{lang === 'ru' ? 'Что выбрать: Club или Pro?' : 'Which plan should you choose?'}</h3>
                <p>
                  {lang === 'ru'
                    ? 'Club закрывает обучение. Pro добавляет всё, что нужно для внедрения AI и работы с клиентами.'
                    : 'Club covers learning. Pro adds everything needed to implement AI and work with clients.'}
                </p>
              </div>

              <div className={styles.compareTable}>
                <div className={styles.compareRowHead}>
                  <span>{lang === 'ru' ? 'Возможность' : 'Feature'}</span>
                  <strong>Club</strong>
                  <strong>Pro</strong>
                </div>
                {comparisonRows.map(([label, club, pro]) => (
                  <div className={styles.compareRow} key={label}>
                    <span>{label}</span>
                    <strong className={club ? styles.compareYes : styles.compareNo}>{mark(club, lang)}</strong>
                    <strong className={pro ? styles.compareYes : styles.compareNo}>{mark(pro, lang)}</strong>
                  </div>
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}
      </div>
    </section>
  )
}
