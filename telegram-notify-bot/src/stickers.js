/** Optional Telegram sticker file_id per notification type (from @BotFather / forwarded sticker). */
const STICKER_ENV = {
  homework_accepted: 'STICKER_HW_ACCEPTED',
  homework_resubmit: 'STICKER_HW_RESUBMIT',
  review_approved: 'STICKER_REVIEW_OK',
  review_rejected: 'STICKER_REVIEW_NO',
  purchase: 'STICKER_PURCHASE',
  promo_new: 'STICKER_PROMO',
  lesson_reminder: 'STICKER_REMINDER',
  course_news: 'STICKER_NEWS',
  application_accepted: 'STICKER_APPLICATION',
}

export function getStickerFileId(type) {
  const envKey = STICKER_ENV[type]
  if (!envKey) return null
  const id = process.env[envKey]?.trim()
  return id || null
}
