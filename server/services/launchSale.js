/*
 * The opening sale: every store product's Personal license for 1 €, for 48
 * hours from the launch. Client and Agency licenses, courses, vaults and packs
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
  endsAt: '2026-11-27T19:00:00.000Z',
}

/** The sale while it runs, or null. */
export function launchSale(now = Date.now()) {
  if (process.env.LAUNCH_SALE === '0') return null
  const at = typeof now === 'number' ? now : now.getTime()
  if (at < Date.parse(LAUNCH_SALE.startsAt) || at >= Date.parse(LAUNCH_SALE.endsAt)) return null
  return LAUNCH_SALE
}

/** The sale price of a store product's license, or null when it is not on sale. */
export function launchSalePrice(licenseTier, listEur, now = Date.now()) {
  const sale = launchSale(now)
  if (!sale || licenseTier !== sale.license) return null
  return sale.priceEur < Number(listEur) ? sale.priceEur : null
}
