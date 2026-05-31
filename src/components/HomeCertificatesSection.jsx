import { Link } from 'react-router-dom'
import { ScrollReveal } from './ScrollReveal'
import styles from './HomeCertificatesSection.module.css'

const SAMPLES = [
  {
    id: 'content-creator',
    src: '/certificates/ai-content-creator-ru.png',
    programRu: 'AI Content Creator',
    programEn: 'AI Content Creator',
    langTag: 'RU',
  },
  {
    id: 'agency-builder',
    src: '/certificates/ai-agency-builder-en.png',
    programRu: 'AI Agency Builder',
    programEn: 'AI Agency Builder',
    langTag: 'EN',
  },
]

export function HomeCertificatesSection({ lang }) {
  const isRu = lang === 'ru'

  return (
    <ScrollReveal>
      <section className={styles.section} aria-labelledby="home-certificates-title">
        <div className={styles.container}>
          <div className={styles.layout}>
            <div className={styles.copy}>
              <span className={styles.pill}>
                {isRu ? 'Сертификат Academy' : 'Academy certificate'}
              </span>
              <h2 id="home-certificates-title" className={styles.title}>
                {isRu ? 'Документ, который подтверждает ваши навыки' : 'Proof of skills you can show'}
              </h2>
              <p className={styles.desc}>
                {isRu
                  ? 'После прохождения Pro-курса и сдачи финального проекта вы получаете именной сертификат AI Insider Academy — в личном кабинете и на почту.'
                  : 'After completing a Pro course and your capstone project, you receive a personalized AI Insider Academy certificate — in your account and by email.'}
              </p>
              <ul className={styles.bullets}>
                <li>{isRu ? 'Уникальный ID сертификата' : 'Unique certificate ID'}</li>
                <li>{isRu ? 'Название программы и дата завершения' : 'Program name and completion date'}</li>
                <li>{isRu ? 'Подпись CEO AI Insider' : 'Signed by CEO of AI Insider'}</li>
                <li>{isRu ? 'Готов к LinkedIn и портфолио' : 'Ready for LinkedIn and your portfolio'}</li>
              </ul>
              <Link to="/courses" className={styles.cta}>
                {isRu ? 'Выбрать курс с сертификатом →' : 'Choose a certified course →'}
              </Link>
            </div>

            <div className={styles.showcase} aria-hidden={false}>
              <div className={styles.glowOrb} aria-hidden />
              {SAMPLES.map((cert, index) => (
                <figure
                  key={cert.id}
                  className={`${styles.card} ${index === 0 ? styles.cardFront : styles.cardBack}`}
                  style={{ animationDelay: `${index * 0.6}s` }}
                >
                  <img
                    src={cert.src}
                    alt={isRu ? `Пример сертификата ${cert.programRu}` : `Sample certificate ${cert.programEn}`}
                    className={styles.certImage}
                    loading="lazy"
                  />
                  <figcaption className={styles.caption}>
                    <span className={styles.captionProgram}>
                      {isRu ? cert.programRu : cert.programEn}
                    </span>
                    <span className={styles.captionLang}>{cert.langTag}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}
