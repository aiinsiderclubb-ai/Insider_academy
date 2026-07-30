import { test, expect } from '@playwright/test'

test.describe('LMS flow', () => {
  test('health + promo validate', async ({ request }) => {
    const base = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001/api'
    const health = await request.get(`${base}/health`)
    expect(health.ok()).toBeTruthy()
    const promo = await request.post(`${base}/promo/validate`, {
      data: { code: 'WELCOME10', courseId: 'ai-start', amountEur: 100 },
    })
    expect([200, 400]).toContain(promo.status())
  })

  test('login → courses catalog', async ({ page }) => {
    const email = `test-${Date.now()}@example.com`
    const password = 'testpass123'

    await page.goto('/login')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.click('button[type="submit"]')

    await page.waitForURL(/cabinet|courses|\//, { timeout: 15000 })

    await page.goto('/courses')
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })

    const courseLink = page.locator('a[href*="/courses/"]').first()
    if (await courseLink.count()) {
      await courseLink.click({ force: true, timeout: 10000 })
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('feature flags public endpoint', async ({ request }) => {
    const base = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001/api'
    const res = await request.get(`${base}/feature-flags`)
    if (res.ok()) {
      const data = await res.json()
      expect(data).toHaveProperty('marketplace')
    }
  })
})
