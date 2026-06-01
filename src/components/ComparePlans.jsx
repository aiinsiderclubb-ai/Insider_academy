import { Link } from 'react-router-dom'
import { getPriceComparisonForCourse } from '../data/comparePlansPricing'
import { ScrollReveal } from './ScrollReveal'
import styles from './ComparePlans.module.css'

const LABELS_RU = {
  single: 'Один курс',
  'ai-insider-club': 'AI Insider Club',
  'ai-insider-pro': 'AI Insider Pro',
  'ai-insider-club-annual': 'Club · год',
  'ai-insider-pro-annual': 'Pro · год',
}

const LABELS_EN = {
  single: 'Single course',
  'ai-insider-club': 'AI Insider Club',
  'ai-insider-pro': 'AI Insider Pro',
  'ai-insider-club-annual': 'Club · annual',
  'ai-insider-pro-annual': 'Pro · annual',
}

function periodLabel(row, ru) {
  if (row.billing === 'once') return ru ? 'разовая оплата' : 'one-time'
  if (row.billing === 'annual') return ru ? 'в год' : 'per year'
  return ru ? 'в месяц' : 'per month'
}

export function ComparePlans({ course, lang, coursePriceEur }) {
  const ru = lang === 'ru'
  const rows = getPriceComparisonForCourse(course, coursePriceEur)

  const getLabel = (row) => {
    if (row.label) return row.label
    const map = ru ? LABELS_RU : LABELS_EN
    return map[row.labelKey] || row.labelEn || row.labelKey
  }

  return (
    <ScrollReveal>
      <section className={styles.wrap}>
        <h2 className={styles.title}>{ru ? 'Сравнение по цене' : 'Price comparison'}</h2>
        <p className={styles.subtitle}>
          {ru
            ? 'Разовая покупка, пакеты с этим курсом и все варианты подписки'
            : 'One-time purchase, bundles with this course, and all subscriptions'}
        </p>

        <div className={styles.grid}>
          {rows.map((row) => {
            const label = getLabel(row)
            const period = periodLabel(row, ru)
            const includes = row.includesCourse
            const muted = !includes && row.kind === 'subscription'

            return (
              <article
                key={row.id}
                className={[
                  styles.plan,
                  row.isCurrent ? styles.planCurrent : '',
                  row.isBestOneTime ? styles.planBest : '',
                  muted ? styles.planMuted : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {row.isBestOneTime && (
                  <span className={styles.planBadge}>
                    {ru ? 'Выгоднее разово' : 'Better one-time'}
                  </span>
                )}
                {row.isCurrent && (
                  <span className={styles.planBadgeCurrent}>
                    {ru ? 'Ваш выбор' : 'Your choice'}
                  </span>
                )}

                <span className={styles.planLabel}>{label}</span>

                {row.kind === 'pack' && row.courseCount > 1 && (
                  <span className={styles.planHint}>
                    {ru ? `${row.courseCount} курса в пакете` : `${row.courseCount} courses in bundle`}
                  </span>
                )}

                {!includes && row.kind === 'subscription' && (
                  <span className={styles.planHintWarn}>
                    {ru ? 'Курс не входит в этот тариф' : 'Course not in this plan'}
                  </span>
                )}

                <div className={styles.planPrice}>{row.priceEur} €</div>
                <p className={styles.planPeriod}>{period}</p>

                {row.saveLabelRu && (
                  <p className={styles.planSave}>
                    {ru ? row.saveLabelRu : row.saveLabelEn}
                  </p>
                )}

                {row.isCurrent ? (
                  <span className={styles.currentBadge}>{ru ? 'Вы выбрали' : 'Selected'}</span>
                ) : row.link ? (
                  <Link
                    to={row.link}
                    className={row.kind === 'subscription' ? styles.clubBtn : styles.linkBtn}
                  >
                    {row.kind === 'pack'
                      ? (ru ? 'Смотреть пакет' : 'View bundle')
                      : row.kind === 'subscription'
                        ? (ru ? 'Подписка' : 'Subscribe')
                        : (ru ? 'Подробнее' : 'Details')}
                  </Link>
                ) : null}
              </article>
            )
          })}
        </div>
      </section>
    </ScrollReveal>
  )
}
