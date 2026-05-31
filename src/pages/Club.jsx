import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { AI_INSIDER_CLUB } from '../data/club'
import { PROMO_VIDEOS } from '../data/promo'
import { PromoVideo } from '../components/PromoVideo'
import { ScrollReveal } from '../components/ScrollReveal'
import styles from './Club.module.css'

export function Club() {
  const { lang } = useLanguage()
  const club = AI_INSIDER_CLUB
  const includes = lang === 'en' ? club.includesEn : club.includesRu
  const rules = lang === 'en' ? club.rulesEn : club.rulesRu

  return (
    <div className={styles.wrap}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.pill}>{lang === 'ru' ? '99 €/мес · все Pro-курсы · без созвонов' : '€99/mo · all Pro courses · no calls'}</span>
          <h1 className={styles.title}>{lang === 'en' ? club.nameEn : club.nameRu}</h1>
          <p className={styles.subtitle}>{lang === 'en' ? club.taglineEn : club.taglineRu}</p>
          <p className={styles.desc}>{lang === 'en' ? club.descEn : club.descRu}</p>
        </div>
      </section>

      <div className={styles.container}>
        <ScrollReveal>
          <div className={styles.videoRow}>
            <PromoVideo
              url={PROMO_VIDEOS.club}
              poster="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
              title={lang === 'en' ? club.nameEn : club.nameRu}
            />
          </div>
        </ScrollReveal>

        <div className={styles.grid}>
          <ScrollReveal delay={40}>
            <section className={styles.card}>
              <h2>{lang === 'ru' ? 'Что входит' : 'What\'s included'}</h2>
              <ul>
                {includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <section className={styles.card}>
              <h2>{lang === 'ru' ? 'Условия' : 'Terms'}</h2>
              <ul>
                {rules.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={120}>
          <section className={styles.pricing}>
            <div className={styles.priceCardMain}>
              <span className={styles.priceLabel}>{lang === 'ru' ? 'Подписка' : 'Subscription'}</span>
              <strong className={styles.price}>{club.priceEur} €</strong>
              <p>{lang === 'ru' ? 'в месяц · доступ ко всем Pro-курсам' : 'per month · all Pro courses included'}</p>
            </div>
            <div className={styles.ctaBlock}>
              <p className={styles.ctaText}>
                {lang === 'ru'
                  ? 'После оплаты подписки все Pro-курсы откроются в личном кабинете автоматически.'
                  : 'After payment, all Pro courses unlock in your account automatically.'}
              </p>
              <div className={styles.ctaRow}>
                <Link to="/cabinet#support" className={styles.ctaPrimary}>
                  {lang === 'ru' ? 'Оформить подписку' : 'Subscribe'}
                </Link>
                <Link to="/courses" className={styles.ctaSecondary}>
                  {lang === 'ru' ? 'Смотреть курсы' : 'Browse courses'}
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </div>
    </div>
  )
}
