import { getCourseField } from '../data/courses'
import { ACCELERATOR_OFFER, PROMO_VIDEOS } from '../data/promo'
import { BundleCourseActions } from './BundleCourseActions'
import { PromoVideo } from './PromoVideo'
import { UiIcon } from './UiIcon'
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
  const videoUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ACCELERATOR_VIDEO_URL?.trim())
    || PROMO_VIDEOS.accelerator
    || ''

  return (
    <section id="super-offer" className={styles.section} aria-label={title}>
      <div className={styles.hotStrip}>
        <UiIcon name="flame" variant="inline" size={20} tone="onAccent" className={styles.hotFlame} />
        <span className={styles.hotText}>
          {lang === 'ru' ? 'ГОРЯЩЕЕ ПРЕДЛОЖЕНИЕ — набор спецкурсов' : 'HOT OFFER — special course bundle'}
        </span>
        <span className={styles.hotPulse} aria-hidden />
      </div>
      <div className={styles.container}>
        <div className={`${styles.grid} ${videoUrl ? '' : styles.gridSolo}`}>
          <div className={styles.content}>
            <span className={styles.badge}>
              <UiIcon name="flame" variant="badge" tone="onAccent" />
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
              <span className={styles.selectionIcon} aria-hidden>
                <UiIcon name="target" variant="box" tone="accent" />
              </span>
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
            {videoUrl ? (
              <>
                <PromoVideo
                  url={videoUrl}
                  title={lang === 'ru'
                    ? 'Основатель о Accelerator — что соберёте за месяц'
                    : 'Founder on Accelerator — what you will build'}
                />
                <p className={styles.mediaCaption}>
                  {lang === 'ru'
                    ? '60–90 сек: лицо основателя и результат программы.'
                    : '60–90 sec: founder face + program outcome.'}
                </p>
              </>
            ) : (
              <div className={styles.outcomeCard}>
                <span className={styles.outcomeEyebrow}>
                  {lang === 'ru' ? 'Что соберёте' : 'What you will build'}
                </span>
                <p className={styles.outcomeCardText}>
                  {finalProject
                    || (lang === 'ru'
                      ? 'Рабочий AI-стек под вашу специализацию: агенты, автоматизации или контент-система.'
                      : 'A working AI stack for your path: agents, automation, or a content system.')}
                </p>
                <p className={styles.mediaCaption}>
                  {lang === 'ru'
                    ? 'Видео основателя (60–90 сек) появится здесь после записи.'
                    : 'Founder video (60–90 sec) will appear here when ready.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
