import { Link } from 'react-router-dom'
import { AI_INSIDER_CLUB } from '../data/club'
import { PROMO_VIDEOS } from '../data/promo'
import { PromoVideo } from './PromoVideo'
import { ScrollReveal } from './ScrollReveal'
import styles from './HomeClubSection.module.css'

export function HomeClubSection({ lang }) {
  const club = AI_INSIDER_CLUB
  const includes = lang === 'en' ? club.includesEn : club.includesRu

  return (
    <ScrollReveal delay={60}>
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.grid}>
            <PromoVideo
              url={PROMO_VIDEOS.club}
              poster="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
              title={lang === 'en' ? club.nameEn : club.nameRu}
              compact
            />
            <div className={styles.content}>
              <span className={styles.badge}>{lang === 'ru' ? 'Подписка' : 'Subscription'}</span>
              <h2 className={styles.title}>{lang === 'en' ? club.nameEn : club.nameRu}</h2>
              <p className={styles.tagline}>{lang === 'en' ? club.taglineEn : club.taglineRu}</p>
              <p className={styles.desc}>{lang === 'en' ? club.descEn : club.descRu}</p>
              <ul className={styles.list}>
                {includes.slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className={styles.priceRow}>
                <span className={styles.price}>{club.priceEur} €</span>
                <span className={styles.priceNote}>
                  {lang === 'ru' ? '/ месяц · все Pro-курсы · без созвонов' : '/ month · all Pro courses · no calls'}
                </span>
              </div>
              <Link to="/club" className={styles.cta}>
                {lang === 'ru' ? 'Условия и вступление →' : 'Terms & join →'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}
