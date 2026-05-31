import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MEMBERSHIPS_TITLE, MEMBERSHIP_PLANS } from '../data/memberships'
import { ScrollReveal } from './ScrollReveal'
import styles from './MembershipsSection.module.css'

const COMPARISON_ROWS = {
  ru: [
    ['Все курсы Academy', true, true],
    ['Новые курсы без доплаты', true, true],
    ['Сертификаты и библиотека промптов', true, true],
    ['Закрытое комьюнити', true, true],
    ['Готовые n8n workflow', false, true],
    ['Шаблоны AI-агентов, ботов и voice agents', false, true],
    ['Скрипты продаж и outreach для клиентов', false, true],
    ['Премиальные кейсы и ресурсы для AI-бизнеса', false, true],
  ],
  en: [
    ['Every Academy course', true, true],
    ['Future courses included', true, true],
    ['Certificates and prompt library', true, true],
    ['Private community', true, true],
    ['Ready-to-use n8n workflows', false, true],
    ['AI agent, chatbot and voice agent templates', false, true],
    ['Sales scripts and client outreach', false, true],
    ['Premium case studies and AI business resources', false, true],
  ],
}

const BONUS_CARDS = {
  ru: [
    ['Prompt Pack', 'Готовые промпты для работы, обучения, маркетинга и продаж.'],
    ['Automation Pack', 'n8n-сценарии, которые можно адаптировать под клиентов и бизнес.'],
    ['Agent Pack', 'Шаблоны AI-агентов, чатботов и voice agents для быстрых запусков.'],
    ['Agency Toolkit', 'Материалы для упаковки услуг, outreach, звонков и первых продаж.'],
  ],
  en: [
    ['Prompt Pack', 'Ready prompts for work, learning, marketing and sales.'],
    ['Automation Pack', 'n8n workflows you can adapt for clients and business.'],
    ['Agent Pack', 'AI agent, chatbot and voice agent templates for fast launches.'],
    ['Agency Toolkit', 'Service packaging, outreach, calls and first sales resources.'],
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
  const comparisonRows = lang === 'en' ? COMPARISON_ROWS.en : COMPARISON_ROWS.ru
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
                    ? 'Один тариф — все курсы Academy. Pro добавляет шаблоны, workflow и ресурсы для клиентов.'
                    : 'One plan — every Academy course. Pro adds templates, workflows and client-ready resources.'}
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
              <span>{lang === 'ru' ? '2 месяца бесплатно' : '2 months free'}</span>
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
                ? 'Для тех, кто хочет пройти все курсы и уверенно развиваться в AI.'
                : 'For learning every course and growing confidently with AI.')

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

                  <Link
                    to="/cabinet#support"
                    className={isPro ? styles.btnPro : styles.btnClub}
                  >
                    {cta}
                  </Link>
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
            <section className={styles.compare} aria-label={lang === 'ru' ? 'Сравнение тарифов' : 'Plan comparison'}>
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
