import { test, expect } from '@playwright/test'
import { MARKETPLACE_PRODUCTS } from '../src/data/marketplace/products.js'

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
]

for (const viewport of viewports) {
  test(`all marketplace product and buy routes render on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const runtimeErrors = []
    page.on('pageerror', (error) => runtimeErrors.push(error.message))
    for (const product of MARKETPLACE_PRODUCTS) {
      await page.goto(`/ru/marketplace/${product.slug}`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('h1').first()).toBeVisible()
      await page.goto(`/ru/marketplace/${product.slug}/buy`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('h2').first()).toBeVisible()
    }
    expect(runtimeErrors).toEqual([])
  })
}

test('unknown marketplace slug shows safe not-found state', async ({ page }) => {
  await page.goto('/ru/marketplace/unknown-product-that-does-not-exist')
  await expect(page).toHaveURL(/\/ru\/marketplace/)
  await expect(page.locator('body')).not.toContainText('В админ-панель')
})

test('only Beauty Salon exposes checkout controls', async ({ page }) => {
  await page.goto('/ru/marketplace/voice-agent-kit-beauty-salon/buy')
  await expect(page.getByText(/secure rollout|безопасного запуска/i)).toBeVisible()
  const unreleased = MARKETPLACE_PRODUCTS.find((product) => product.id !== 'mp-voice-beauty-salon')
  await page.goto(`/ru/marketplace/${unreleased.slug}/buy`)
  await expect(page.getByText(/ещё не выпущен|not released yet/i)).toBeVisible()
})
