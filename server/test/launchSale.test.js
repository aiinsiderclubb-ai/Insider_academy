import test from 'node:test'
import assert from 'node:assert/strict'
import { LAUNCH_SALE, launchSale, launchSalePrice } from '../services/launchSale.js'

test('the opening sale prices a Personal license at 1 € for its 48 hours only', () => {
  const during = Date.parse(LAUNCH_SALE.startsAt) + 3600_000
  assert.equal(Date.parse(LAUNCH_SALE.endsAt) - Date.parse(LAUNCH_SALE.startsAt), 49 * 3600_000)
  assert.equal(launchSalePrice('personal', 59, during), 1)
  assert.equal(launchSalePrice('client', 103, during), null)
  assert.equal(launchSalePrice('personal', 1, during), null, 'nothing to take off')
  assert.equal(launchSale(Date.parse(LAUNCH_SALE.startsAt) - 1), null)
  assert.equal(launchSale(Date.parse(LAUNCH_SALE.endsAt)), null)
  process.env.LAUNCH_SALE = '0'
  try {
    assert.equal(launchSalePrice('personal', 59, during), null, 'LAUNCH_SALE=0 ends it')
  } finally {
    delete process.env.LAUNCH_SALE
  }
})
