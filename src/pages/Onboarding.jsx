import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { PageMeta } from '../components/PageMeta'
import { LEARNING_PATHS, TELEGRAM_COMMUNITY } from '../data/learningPaths'
import { getMarketplaceProduct } from '../data/marketplace/products'
import {
  completePathOnboarding,
  isRegistrationOnboardingDone,
  getPreferredPath,
} from '../utils/onboardingStorage'
import styles from './Onboarding.module.css'

export function Onboarding() {
  const { user } = useAuth()
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const ru = lang === 'ru'
  const [selected, setSelected] = useState(getPreferredPath())
  const [done, setDone] = useState(false)

  if (!user) {
    return <Navigate to="/register" replace state={{ from: { pathname: '/onboarding' } }} />
  }

  if (isRegistrationOnboardingDone() && !done) {
    return <Navigate to="/cabinet" replace />
  }

  const path = LEARNING_PATHS.find((p) => p.id === selected)
  const product = path ? getMarketplaceProduct(path.productSlug) : null

  const finish = (pathId) => {
    completePathOnboarding(pathId)
    setDone(true)
  }

  const handleSelect = (pathId) => {
    setSelected(pathId)
    finish(pathId)
  }

  if (done && path) {
    return (
      <div className={styles.wrap}>
        <PageMeta
          title={ru ? 'Ваш путь готов' : 'Your path is ready'}
          description={ru ? 'Персональные рекомендации Academy' : 'Personalized Academy recommendations'}
          path="/onboarding"
        />
        <div className={styles.container}>
          <span className={styles.pill}>{ru ? 'Готово' : 'Done'}</span>
          <h1 className={styles.title}>
            {ru ? 'Ваш путь: ' : 'Your path: '}
            <span style={{ color: path.accent }}>{ru ? path.titleRu : path.titleEn}</span>
          </h1>
          <p className={styles.lead}>
            {ru
              ? 'Три шага, чтобы не потеряться в каталоге — начните с курса, возьмите шаблон и зайдите в сообщество.'
              : 'Three steps so you do not get lost — start a course, grab a template, join the community.'}
          </p>

          <div className={styles.recs}>
            <article className={styles.recCard}>
              <span className={styles.recLabel}>{ru ? 'Курс' : 'Course'}</span>
              <h2>{path.icon} {ru ? path.titleRu : path.titleEn}</h2>
              <p>{ru ? path.descRu : path.descEn}</p>
              <Link to={`/courses/${path.courseSlug}`} className={styles.recCta}>
                {ru ? 'Открыть курс →' : 'Open course →'}
              </Link>
            </article>

            {product && (
              <article className={styles.recCard}>
                <span className={styles.recLabel}>Marketplace</span>
                <h2>{product.coverIcon} {ru ? product.titleRu : product.titleEn}</h2>
                <p>{ru ? product.shortRu : product.shortEn}</p>
                <Link to={`/marketplace/${product.slug}`} className={styles.recCta}>
                  {ru ? `Смотреть · ${product.priceEur}€ →` : `View · €${product.priceEur} →`}
                </Link>
              </article>
            )}

            <article className={styles.recCard}>
              <span className={styles.recLabel}>Telegram</span>
              <h2>AI Insider</h2>
              <p>
                {ru
                  ? 'Анонсы розыгрышей, эфиры и поддержка сообщества.'
                  : 'Giveaways, live sessions and community support.'}
              </p>
              <a href={TELEGRAM_COMMUNITY} target="_blank" rel="noreferrer noopener" className={styles.recCta}>
                {ru ? 'Подписаться →' : 'Subscribe →'}
              </a>
            </article>
          </div>

          <div className={styles.footerActions}>
            <Link to="/cabinet" className={styles.primaryBtn}>
              {ru ? 'В кабинет' : 'Go to dashboard'}
            </Link>
            <Link to="/learning-map" className={styles.secondaryBtn}>
              {ru ? 'Карта обучения' : 'Learning map'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <PageMeta
        title={ru ? 'Какой путь вам нужен?' : 'Which path do you need?'}
        description={ru ? 'Выберите направление обучения за 1 минуту' : 'Pick your learning path in 1 minute'}
        path="/onboarding"
      />
      <div className={styles.container}>
        <span className={styles.pill}>{ru ? '~1 минута' : '~1 minute'}</span>
        <h1 className={styles.title}>{ru ? 'Какой путь вам нужен?' : 'Which path do you need?'}</h1>
        <p className={styles.lead}>
          {ru
            ? 'Выберите направление — покажем курс, продукт Marketplace и канал, где держаться комьюнити.'
            : 'Pick a direction — we will show a course, a Marketplace product and the community channel.'}
        </p>

        <div className={styles.pathGrid}>
          {LEARNING_PATHS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={styles.pathCard}
              style={{ '--path-accent': p.accent }}
              onClick={() => handleSelect(p.id)}
            >
              <span className={styles.pathIcon} aria-hidden>{p.icon}</span>
              <strong>{ru ? p.titleRu : p.titleEn}</strong>
              <span>{ru ? p.descRu : p.descEn}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className={styles.skip}
          onClick={() => {
            completePathOnboarding(null)
            navigate('/cabinet', { replace: true })
          }}
        >
          {ru ? 'Пропустить — в кабинет' : 'Skip — go to dashboard'}
        </button>
      </div>
    </div>
  )
}
