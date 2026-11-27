/*
 * The opening sale: every store product's Personal license for 1 €, from the
 * launch to the end of its first week (Sunday 29 November, midnight Berlin). Client and Agency licenses, courses, vaults and packs
 * keep their prices. The buyer still pays on Gumroad, where the product keeps
 * its list price; a single-use offer code takes off the difference, as it does
 * for any discount.
 *
 * LAUNCH_SALE=0 on Render ends it early.
 */

export const LAUNCH_SALE = {
  priceEur: 1,
  license: 'personal',
  startsAt: '2026-11-25T18:00:00.000Z',
  endsAt: '2026-11-29T23:00:00.000Z',
  // Released during the sale at full price: not part of the 1 € offer.
  excluded: ['mp-mcp-cinematic-studio'],
}

/** The sale while it runs, or null. */
export function launchSale(now = Date.now()) {
  if (process.env.LAUNCH_SALE === '0') return null
  const at = typeof now === 'number' ? now : now.getTime()
  if (at < Date.parse(LAUNCH_SALE.startsAt) || at >= Date.parse(LAUNCH_SALE.endsAt)) return null
  return LAUNCH_SALE
}

/** The sale price of a store product's license, or null when it is not on sale. */
export function launchSalePrice(licenseTier, listEur, now = Date.now(), productId = null) {
  const sale = launchSale(now)
  if (!sale || licenseTier !== sale.license) return null
  if (productId && sale.excluded.includes(productId)) return null
  return sale.priceEur < Number(listEur) ? sale.priceEur : null
}

/*
 * The launch offer on courses: for the first 72 hours the mentor plan costs
 * the same as self-study. Gumroad and a fixed Tribute product sell one price
 * per course — the self-study one — so during the window the mentor plan can
 * be paid there too. MENTOR_LAUNCH=0 on Render ends it early; =1 holds it open.
 */
export const MENTOR_LAUNCH = {
  startsAt: '2026-11-25T18:00:00.000Z',
  endsAt: '2026-11-28T18:00:00.000Z',
}

/** The mentor-at-self-study-price window while it runs, or null. */
export function mentorLaunch(now = Date.now()) {
  if (process.env.MENTOR_LAUNCH === '0') return null
  if (process.env.MENTOR_LAUNCH === '1') return MENTOR_LAUNCH
  const at = typeof now === 'number' ? now : now.getTime()
  if (at < Date.parse(MENTOR_LAUNCH.startsAt) || at >= Date.parse(MENTOR_LAUNCH.endsAt)) return null
  return MENTOR_LAUNCH
}
