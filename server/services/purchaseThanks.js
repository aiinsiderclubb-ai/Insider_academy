import { getDb, parseJson } from '../db.js'
import { notifyUserEmail } from './email.js'

/**
 * The thank-you that follows a purchase, with the review offer inside it.
 *
 * Sent once per settled payment, from the one place every provider's webhook
 * ends up. It never throws: a mail server having a bad minute must not turn a
 * paid order into a failed webhook that the provider then retries.
 */
export async function sendPurchaseThanks({ email, itemId, itemTitle, marketplace = false }) {
  try {
    const db = getDb()
    let slug = itemId
    let title = itemTitle || itemId

    if (marketplace) {
      const product = await db
        .get('SELECT slug, title_ru, title_en FROM marketplace_products WHERE id = ?', [itemId])
        .catch(() => null)
      slug = product?.slug || slug
      title = itemTitle || product?.title_ru || product?.title_en || title
    } else {
      const course = await db.get('SELECT data FROM courses WHERE id = ?', [itemId]).catch(() => null)
      const data = parseJson(course?.data, null)
      slug = data?.slug || slug
      title = itemTitle || data?.title || title
    }

    await notifyUserEmail(email, 'purchase_thanks', {
      itemId,
      itemTitle: title,
      itemSlug: slug,
      itemKind: marketplace ? 'product' : 'course',
    })
  } catch (err) {
    console.warn('[purchase-thanks] not sent:', err.message)
  }
}
