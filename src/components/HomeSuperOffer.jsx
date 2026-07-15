import { Check } from 'lucide-react'
import { getCourseField } from '../data/courses'
import { ACCELERATOR_OFFER, PROMO_VIDEOS } from '../data/promo'
import { MENTOR_IMAGES } from '../utils/designAssets'
import { BundleCourseActions } from './BundleCourseActions'
import { PromoVideo } from './PromoVideo'
import { UiIcon } from './UiIcon'
import styles from './HomeSuperOffer.module.css'

export function HomeSuperOffer({ course, lang }) {
  if (!course) return null

  const title = getCourseField(course, 'title', lang)
  const desc = getCourseField(course, 'shortDescription', lang)
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
      <div className={styles.hotWrap} aria-label={lang === 'ru' ? 'Горящее предложение — набор спецкурсов' : 'Hot offer — special course bundle'}>
        <div className={`${styles.hotRibbon} ${styles.hotRibbonGhost}`} aria-hidden>
          <div className={styles.hotTrack}>
            {[0, 1].map((copy) => (
              <div key={copy} className={styles.hotSegmentRow}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className={styles.hotSegment}>
                    AI INSIDER ACCELERATOR <i className={styles.hotStar}>✦</i>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.hotRibbon} aria-hidden>
          <div className={styles.hotTrack}>
            {[0, 1].map((copy) => (
              <div key={copy} className={styles.hotSegmentRow}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className={styles.hotSegment}>
                    <UiIcon name="flame" variant="inline" size={16} tone="onAccent" className={styles.hotFlame} />
                    {lang === 'ru' ? 'ГОРЯЩЕЕ ПРЕДЛОЖЕНИЕ' : 'HOT OFFER'}
                    <i className={styles.hotStar}>✦</i>
                    {lang === 'ru' ? 'НАБОР СПЕЦКУРСОВ' : 'SPECIAL COURSE BUNDLE'}
                    <i className={styles.hotStar}>✦</i>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.cardGlow} aria-hidden />
          <div className={styles.grid}>
            <div className={styles.content}>
              <div className={styles.badgeRow}>
                <span className={styles.badge}>
                  <UiIcon name="flame" variant="badge" tone="onAccent" />
                  {lang === 'en' ? ACCELERATOR_OFFER.badgeEn : ACCELERATOR_OFFER.badgeRu}
                </span>
                <span className={styles.tag}>
                  {lang === 'en' ? ACCELERATOR_OFFER.tagEn : ACCELERATOR_OFFER.tagRu}
                </span>
              </div>
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

              <div className={styles.tracksBlock}>
                <span className={styles.tracksLabel}>
                  {lang === 'ru' ? 'Пройдёте все направления' : 'You will explore'}
                </span>
                <div className={styles.tracks}>
                  {tracks.map((track) => (
                    <span key={track} className={styles.trackChip}>
                      {track}
                    </span>
                  ))}
                </div>
              </div>

              <ul className={styles.perks}>
                {perks.map((item) => (
                  <li key={item}>
                    <span className={styles.perkCheck} aria-hidden><Check size={13} strokeWidth={3} /></span>
                    {item}
                  </li>
                ))}
              </ul>

              <ol className={styles.steps} aria-label={lang === 'ru' ? 'Как попасть' : 'How it works'}>
                {steps.map((step, index) => (
                  <li key={step.title}>
                    <span className={styles.stepNum}>{index + 1}</span>
                    <strong className={styles.stepTitle}>{step.title}</strong>
                    <span className={styles.stepText}>{step.text}</span>
                  </li>
                ))}
              </ol>

              <div className={styles.actions}>
                <BundleCourseActions courseSlug={course.slug} lang={lang} />
              </div>
            </div>

            <aside className={styles.mediaCol}>
              <figure className={styles.mentorFigure}>
                <img
                  src={MENTOR_IMAGES.accelerator}
                  alt={lang === 'ru' ? 'AI Insider приглашает в Accelerator' : 'AI Insider invites you to the Accelerator'}
                  loading="lazy"
                />
                <figcaption className={styles.selectionStrip}>
                  <span className={styles.selectionIcon} aria-hidden>
                    <UiIcon name="target" size={16} tone="inherit" />
                  </span>
                  <span>{selection}</span>
                </figcaption>
              </figure>

              {videoUrl ? (
                <div className={styles.videoCard}>
                  <PromoVideo
                    url={videoUrl}
                    title={lang === 'ru'
                      ? 'Основатель о Accelerator — что соберёте за месяц'
                      : 'Founder on Accelerator — what you will build'}
                  />
                </div>
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
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}
