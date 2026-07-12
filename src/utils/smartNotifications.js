import { addNotification, getNotifications } from '../api/adminStore'
import { getActiveGiveaways } from '../data/giveaways'
import { MARKETPLACE_PRODUCTS } from '../data/marketplace/products'
import { getPreferredPath } from './onboardingStorage'
import { getLearningPath } from '../data/learningPaths'

const TRACK_KEY = 'lms_smart_notif_sent'
const LAST_PROGRESS_KEY = 'lms_last_progress_at'

function readTrack() {
  try {
    return JSON.parse(localStorage.getItem(TRACK_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeTrack(data) {
  try {
    localStorage.setItem(TRACK_KEY, JSON.stringify(data))
  } catch (_) {}
}

function alreadySent(key) {
  return Boolean(readTrack()[key])
}

function markSent(key) {
  const t = readTrack()
  t[key] = Date.now()
  writeTrack(t)
}

export function touchLearningActivity() {
  try {
    localStorage.setItem(LAST_PROGRESS_KEY, new Date().toISOString())
  } catch (_) {}
}

export function getLastLearningActivity() {
  try {
    return localStorage.getItem(LAST_PROGRESS_KEY)
  } catch {
    return null
  }
}

/**
 * Создаёт осмысленные уведомления (без спама, с дедупом).
 * @returns {number} сколько новых уведомлений создано
 */
export function syncSmartNotifications({
  email,
  purchases = [],
  continueTarget = null,
  certificates = [],
  lang = 'ru',
}) {
  if (!email) return 0
  let created = 0
  const ru = lang === 'ru'
  const day = new Date().toISOString().slice(0, 10)

  // 1) Урок не досмотрен 3+ дня
  if (continueTarget?.course && continueTarget.percent > 0 && continueTarget.percent < 100) {
    const last = getLastLearningActivity()
    const lastTs = last ? new Date(last).getTime() : 0
    const threeDays = 3 * 86400000
    if (lastTs && Date.now() - lastTs >= threeDays) {
      const key = `lesson_stale:${email}:${continueTarget.course.id}:${day.slice(0, 7)}`
      if (!alreadySent(key)) {
        addNotification({
          email,
          type: 'lesson_stale',
          courseId: continueTarget.course.id,
          courseSlug: continueTarget.course.slug,
          courseTitle: continueTarget.course.title || continueTarget.course.titleRu || '',
          lessonIndex: continueTarget.lessonIndex,
          targetPath: `/courses/${continueTarget.course.slug}?lesson=${continueTarget.lessonIndex}`,
          message: ru
            ? 'Урок ждёт вас уже 3 дня — продолжите, пока свежий контекст.'
            : 'A lesson has been waiting 3 days — continue while context is fresh.',
        })
        markSent(key)
        created += 1
      }
    }
  }

  // 2) Новый продукт в категории пути пользователя
  const path = getLearningPath(getPreferredPath())
  if (path) {
    const product = MARKETPLACE_PRODUCTS.find(
      (p) => p.slug === path.productSlug || p.id === path.productId
    )
    if (product && !purchases.some((p) => p.id === product.id)) {
      const key = `product_path:${email}:${product.id}`
      if (!alreadySent(key)) {
        addNotification({
          email,
          type: 'product_new',
          targetPath: `/marketplace/${product.slug}`,
          message: ru
            ? `Новый продукт под ваш путь «${path.titleRu}»: ${product.titleRu}`
            : `New product for your “${path.titleEn}” path: ${product.titleEn}`,
        })
        markSent(key)
        created += 1
      }
    }
  }

  // 3) Розыгрыш заканчивается < 48ч
  for (const g of getActiveGiveaways()) {
    if (!g.endsAt) continue
    const left = new Date(g.endsAt).getTime() - Date.now()
    if (left > 0 && left <= 48 * 3600000) {
      const key = `giveaway_ending:${email}:${g.slug}`
      if (!alreadySent(key)) {
        addNotification({
          email,
          type: 'giveaway_ending',
          targetPath: `/giveaway/${g.slug}`,
          message: ru
            ? `Розыгрыш ${g.prizeRu} заканчивается менее чем через 48 часов`
            : `${g.prizeEn} giveaway ends in under 48 hours`,
        })
        markSent(key)
        created += 1
      }
    }
  }

  // 4) Сертификат готов (если есть запись и нет свежего certificate_added)
  const existing = getNotifications().filter((n) => n.email === email)
  for (const cert of certificates) {
    if (!cert?.courseId) continue
    const hasCertNotif = existing.some(
      (n) => n.type === 'certificate_added' && n.courseId === cert.courseId
    )
    const key = `cert_ready:${email}:${cert.courseId}`
    if (!hasCertNotif && !alreadySent(key)) {
      addNotification({
        email,
        type: 'certificate_ready',
        courseId: cert.courseId,
        courseTitle: cert.courseTitle || '',
        targetPath: '/cabinet#certificates',
        message: ru
          ? `Сертификат готов: ${cert.courseTitle || 'курс'}. Можно скачать и поделиться.`
          : `Certificate ready: ${cert.courseTitle || 'course'}. Download and share.`,
      })
      markSent(key)
      created += 1
    }
  }

  if (created > 0) {
    window.dispatchEvent(new Event('lms-notifications-refresh'))
  }
  return created
}
