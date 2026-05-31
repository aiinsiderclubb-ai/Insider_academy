import { ScrollReveal } from './ScrollReveal'
import styles from './ReferralDashboard.module.css'

export function ReferralDashboard({ lang, discount, referralLink, copied, onCopy, referralsCount = 0 }) {
  return (
    <ScrollReveal>
      <section id="invite" className={styles.wrap}>
        <h2 className={styles.title}>{lang === 'ru' ? 'Реферальная программа' : 'Referral program'}</h2>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{discount || 0}%</span>
            <span className={styles.statLabel}>{lang === 'ru' ? 'Ваша скидка' : 'Your discount'}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{referralsCount}</span>
            <span className={styles.statLabel}>{lang === 'ru' ? 'Приглашено' : 'Invited'}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>5%</span>
            <span className={styles.statLabel}>{lang === 'ru' ? 'Бонус другу' : 'Friend bonus'}</span>
          </div>
        </div>
        <p className={styles.desc}>
          {lang === 'ru'
            ? 'Поделитесь ссылкой — друг получит скидку, вы накопите бонусы на следующие курсы.'
            : 'Share your link — your friend gets a discount, you earn bonuses for future courses.'}
        </p>
        <div className={styles.linkRow}>
          <input readOnly value={referralLink} className={styles.input} aria-label="Referral link" />
          <button type="button" onClick={onCopy} className={styles.copyBtn}>
            {copied ? '✓' : (lang === 'ru' ? 'Копировать' : 'Copy')}
          </button>
        </div>
        <div className={styles.steps}>
          <div className={styles.step}><span>1</span>{lang === 'ru' ? 'Скопируйте ссылку' : 'Copy link'}</div>
          <div className={styles.step}><span>2</span>{lang === 'ru' ? 'Отправьте другу' : 'Send to friend'}</div>
          <div className={styles.step}><span>3</span>{lang === 'ru' ? 'Получите скидку' : 'Get discount'}</div>
        </div>
      </section>
    </ScrollReveal>
  )
}
