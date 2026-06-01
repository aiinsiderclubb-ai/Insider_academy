import { getCourseField } from '../data/courses'
import { ACCELERATOR_OFFER, PROMO_VIDEOS } from '../data/promo'
import { PromoVideo } from './PromoVideo'
import { BundleCourseActions } from './BundleCourseActions'
import styles from './HomeSuperOffer.module.css'

export function HomeSuperOffer({ course, lang }) {
  if (!course) return null

  const title = getCourseField(course, 'title', lang)
  const desc = getCourseField(course, 'shortDescription', lang)
  const program =
    getCourseField(course, 'fullDescription', lang)
    || getCourseField(course, 'courseIdea', lang)
  const finalProject = getCourseField(course, 'finalProject', lang)
  const selection = lang === 'en' ? ACCELERATOR_OFFER.selectionEn : ACCELERATOR_OFFER.selectionRu
  const perks = lang === 'en' ? ACCELERATOR_OFFER.perksEn : ACCELERATOR_OFFER.perksRu
  const stats = lang === 'en' ? ACCELERATOR_OFFER.statsEn : ACCELERATOR_OFFER.statsRu
  const tracks = lang === 'en' ? ACCELERATOR_OFFER.tracksEn : ACCELERATOR_OFFER.tracksRu
  const steps = lang === 'en' ? ACCELERATOR_OFFER.stepsEn : ACCELERATOR_OFFER.stepsRu

  return (
    <section id="super-offer" className={styles.section} aria-label={title}>
      <div className={styles.hotStrip}>
        <span className={styles.hotFlame} aria-hidden>🔥</span>
        <span className={styles.hotText}>
          {lang === 'ru' ? 'ГОРЯЩЕЕ ПРЕДЛОЖЕНИЕ — набор спецкурсов' : 'HOT OFFER — special course bundle'}
        </span>
        <span className={styles.hotPulse} aria-hidden />
      </div>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.content}>
            <span className={styles.badge}>
              {lang === 'en' ? ACCELERATOR_OFFER.badgeEn : ACCELERATOR_OFFER.badgeRu}
            </span>
            <span className={styles.tag}>
              {lang === 'en' ? ACCELERATOR_OFFER.tagEn : ACCELERATOR_OFFER.tagRu}
            </span>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.desc}>{desc}</p>

            <ul className={styles.stats} aria-label={lang === 'ru' ? 'Ключевые факты' : 'Key facts'}>
              {stats.map((item) => (
                <li key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>

            <div className={styles.selection}>
              <span className={styles.selectionIcon} aria-hidden>🎯</span>
              <p className={styles.selectionText}>{selection}</p>
            </div>

            {program && program !== desc && (
              <p className={styles.program}>{program}</p>
            )}

            <div className={styles.tracksBlock}>
              <span className={styles.tracksLabel}>
                {lang === 'ru' ? 'Пройдёте все направления:' : 'You will explore:'}
              </span>
              <div className={styles.tracks}>
                {tracks.map((track) => (
                  <span key={track} className={styles.trackChip}>
                    {track}
                  </span>
                ))}
              </div>
            </div>

            {finalProject && (
              <p className={styles.outcome}>
                <strong>{lang === 'ru' ? 'Итог:' : 'Outcome:'}</strong> {finalProject}
              </p>
            )}

            <ul className={styles.perks}>
              {perks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <ol className={styles.steps} aria-label={lang === 'ru' ? 'Как попасть' : 'How it works'}>
              {steps.map((step, index) => (
                <li key={step.title}>
                  <span className={styles.stepNum}>{index + 1}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <span>{step.text}</span>
                  </div>
                </li>
              ))}
            </ol>

            <div className={styles.actions}>
              <BundleCourseActions courseSlug={course.slug} lang={lang} />
            </div>
          </div>

          <div className={styles.mediaCol}>
            <PromoVideo
              url={PROMO_VIDEOS.accelerator}
              poster={course.image}
              title={title}
              compact
            />
            <p className={styles.mediaCaption}>
              {lang === 'ru'
                ? 'Коротко о программе набора — видео скоро'
                : 'Quick overview of the intake program — video coming soon'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
