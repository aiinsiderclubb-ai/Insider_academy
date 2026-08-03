import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Check, Minus, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { MEMBERSHIP_PLANS, isMembershipExcludedLine } from '../data/memberships'
import {
  MEMBERSHIP_TIER_DETAILS,
  PLAN_COMPARISON_ROWS,
  VALID_MEMBERSHIP_TIERS,
} from '../data/membershipDetails'
import { CLUB_INCLUDED_COURSE_IDS, PRO_ONLY_COURSE_IDS } from '../data/club'
import { getCourseById, getCourseField } from '../data/courses'
import { ScrollReveal } from '../components/ScrollReveal'
import styles from './MembershipPlan.module.css'

function mark(value) {
  return value
    ? <Check size={17} strokeWidth={2.4} aria-hidden="true" />
    : <Minus size={17} strokeWidth={2.4} aria-hidden="true" />
}

export function MembershipPlan() {
  const { tier } = useParams()
  const { lang } = useLanguage()
  const [billing, setBilling] = useState('monthly')
  const ru = lang === 'ru'

  const details = MEMBERSHIP_TIER_DETAILS[tier]
  if (!details || !VALID_MEMBERSHIP_TIERS.includes(tier)) {
    return <Navigate to="/memberships" replace />
  }

  const isPro = tier === 'pro'
  const comparisonRows = ru ? PLAN_COMPARISON_ROWS.ru : PLAN_COMPARISON_ROWS.en
  const plans = useMemo(
    () => MEMBERSHIP_PLANS.filter((p) => p.tier === tier && p.billing === billing),
    [tier, billing]
  )
  const plan = plans[0]

  const includedCourses = useMemo(() => {
    const ids = isPro
      ? [...CLUB_INCLUDED_COURSE_IDS, ...PRO_ONLY_COURSE_IDS]
      : CLUB_INCLUDED_COURSE_IDS
    return ids.map((id) => getCourseById(id)).filter(Boolean)
  }, [isPro])

  const excludedCourses = useMemo(() => {
    if (isPro) return []
    return PRO_ONLY_COURSE_IDS.map((id) => getCourseById(id)).filter(Boolean)
  }, [isPro])

  const monthlyPlan = MEMBERSHIP_PLANS.find((p) => p.tier === tier && p.billing === 'monthly')
  const annualPlan = MEMBERSHIP_PLANS.find((p) => p.tier === tier && p.billing === 'annual')

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <ScrollReveal>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/memberships">{ru ? 'Подписки' : 'Memberships'}</Link>
            <span aria-hidden>/</span>
            <span>{ru ? details.nameRu : details.nameEn}</span>
          </nav>
        </ScrollReveal>

        <ScrollReveal>
          <header className={`${styles.hero} ${isPro ? styles.heroPro : styles.heroClub}`}>
            <div className={styles.heroCopy}>
              <span className={styles.badge}>{ru ? details.badgeRu : details.badgeEn}</span>
              <h1 className={styles.title}>{ru ? details.nameRu : details.nameEn}</h1>
              <p className={styles.heroLead}>{ru ? details.heroRu : details.heroEn}</p>
              <p className={styles.lead}>{ru ? details.leadRu : details.leadEn}</p>
            </div>
            <div className={styles.heroVisual} aria-hidden="true">
              <img src="/design/course-ai-content-business.webp" alt="" />
              <span>{isPro ? 'PRO / FULL ACCESS' : 'CLUB / LEARN'}</span>
            </div>
          </header>
        </ScrollReveal>

        <ScrollReveal>
          <div
            className={styles.billingSwitch}
            role="tablist"
            aria-label={ru ? 'Период оплаты' : 'Billing period'}
          >
            <button
              type="button"
              className={billing === 'monthly' ? styles.billingActive : ''}
              onClick={() => setBilling('monthly')}
              role="tab"
              aria-selected={billing === 'monthly'}
            >
              {ru ? 'Ежемесячно' : 'Monthly'}
            </button>
            <button
              type="button"
              className={billing === 'annual' ? styles.billingActive : ''}
              onClick={() => setBilling('annual')}
              role="tab"
              aria-selected={billing === 'annual'}
            >
              {ru ? 'Годовой доступ' : 'Annual'}
              {annualPlan?.saveLabelRu && (
                <span>{ru ? annualPlan.saveLabelRu : annualPlan.saveLabelEn}</span>
              )}
            </button>
          </div>
        </ScrollReveal>

        {plan && (
          <ScrollReveal>
            <article className={`${styles.priceCard} ${isPro ? styles.priceCardPro : ''}`}>
              {plan.saveLabelRu && (
                <span className={styles.save}>{ru ? plan.saveLabelRu : plan.saveLabelEn}</span>
              )}
              <div className={styles.priceRow}>
                <strong className={styles.price}>{plan.priceEur}€</strong>
                <span className={styles.period}>{ru ? plan.periodRu : plan.periodEn}</span>
              </div>
              {billing === 'annual' && monthlyPlan && (
                <p className={styles.priceHint}>
                  {ru
                    ? `≈ ${Math.round(plan.priceEur / 12)}€/мес вместо ${monthlyPlan.priceEur}€/мес`
                    : `≈ €${Math.round(plan.priceEur / 12)}/mo vs €${monthlyPlan.priceEur}/mo`}
                </p>
              )}
              <div className={styles.priceActions}>
                <Link
                  to="/cabinet#support"
                  className={isPro ? styles.btnPrimaryPro : styles.btnPrimaryClub}
                >
                  {ru ? plan.ctaRu : plan.ctaEn}
                </Link>
                <Link to="/memberships#compare" className={styles.btnSecondary}>
                  {ru ? 'Сравнить с другим тарифом' : 'Compare plans'}
                </Link>
              </div>
              <p className={styles.priceNote}>
                {ru
                  ? 'Доступ открывается сразу после подтверждения оплаты.'
                  : 'Access opens immediately after payment confirmation.'}
              </p>
            </article>
          </ScrollReveal>
        )}

        {plan && (
          <div className={styles.grid}>
            <ScrollReveal>
              <section className={styles.block}>
                <h2>{ru ? 'Для кого' : 'Who it is for'}</h2>
                <ul className={styles.list}>
                  {(ru ? details.forWhoRu : details.forWhoEn).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={40}>
              <section className={styles.block}>
                <h2>{ru ? 'Что входит' : 'What is included'}</h2>
                <ul className={styles.list}>
                  {(ru ? plan.includesRu : plan.includesEn).map((item) => {
                    const excluded = isMembershipExcludedLine(item)
                    return (
                      <li key={item} className={excluded ? styles.listExcluded : undefined}>
                        <span className={styles.listIcon} aria-hidden="true">
                          {excluded
                            ? <X size={15} strokeWidth={2.4} />
                            : <Check size={15} strokeWidth={2.4} />}
                        </span>
                        {item}
                      </li>
                    )
                  })}
                </ul>
                {(ru ? plan.bonusRu : plan.bonusEn)?.length > 0 && (
                  <div className={styles.bonusBox}>
                    <strong>{ru ? 'Бонус годового Pro' : 'Pro Annual bonus'}</strong>
                    <ul>
                      {(ru ? plan.bonusRu : plan.bonusEn).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </ScrollReveal>
          </div>
        )}

        <ScrollReveal>
          <section className={styles.block}>
            <h2>{ru ? 'Курсы в подписке' : 'Courses in this plan'}</h2>
            <div className={styles.courseChips}>
              {includedCourses.map((course) => (
                <Link key={course.id} to={`/courses/${course.slug}`} className={styles.courseChip}>
                  {getCourseField(course, 'title', lang)}
                </Link>
              ))}
            </div>
            {excludedCourses.length > 0 && (
              <div className={styles.excluded}>
                <strong>{ru ? 'Не входят в Club (только Pro или пакет):' : 'Not in Club (Pro or pack only):'}</strong>
                <div className={styles.courseChips}>
                  {excludedCourses.map((course) => (
                    <Link
                      key={course.id}
                      to={`/courses/${course.slug}`}
                      className={`${styles.courseChip} ${styles.courseChipMuted}`}
                    >
                      {getCourseField(course, 'title', lang)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className={styles.compare} aria-label={ru ? 'Сравнение тарифов' : 'Plan comparison'}>
            <h2>{ru ? 'Club vs Pro' : 'Club vs Pro'}</h2>
            <div className={styles.compareTable}>
              <div className={styles.compareRowHead}>
                <span>{ru ? 'Возможность' : 'Feature'}</span>
                <strong>Club</strong>
                <strong>Pro</strong>
              </div>
              {comparisonRows.map(([label, club, pro]) => (
                <div className={styles.compareRow} key={label}>
                  <span>{label}</span>
                  <strong className={club ? styles.yes : styles.no}>{mark(club)}</strong>
                  <strong className={pro ? styles.yes : styles.no}>{mark(pro)}</strong>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className={styles.block}>
            <h2>{ru ? 'Частые вопросы' : 'FAQ'}</h2>
            <div className={styles.faq}>
              {(ru ? details.faqRu : details.faqEn).map((item) => (
                <details key={item.q} className={styles.faqItem}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <footer className={styles.footerCta}>
            <p>
              {isPro
                ? ru
                  ? 'Готовы внедрять AI и работать с клиентами?'
                  : 'Ready to implement AI and work with clients?'
                : ru
                  ? 'Готовы пройти Academy по подписке?'
                  : 'Ready to learn with Academy access?'}
            </p>
            <div className={styles.footerActions}>
              <Link
                to="/cabinet#support"
                className={isPro ? styles.btnPrimaryPro : styles.btnPrimaryClub}
              >
                {plan ? (ru ? plan.ctaRu : plan.ctaEn) : (ru ? 'Оформить' : 'Subscribe')}
              </Link>
              <Link to="/memberships" className={styles.btnSecondary}>
                {ru ? 'Все тарифы' : 'All plans'}
              </Link>
            </div>
          </footer>
        </ScrollReveal>
      </div>
    </div>
  )
}
