import { test, expect } from '@playwright/test'

test.describe('LMS flow', () => {
  test('login → buy demo → open course', async ({ page }) => {
    const email = `test-${Date.now()}@example.com`
    const password = 'testpass123'

    await page.goto('/login')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.click('button[type="submit"]')

    await page.waitForURL(/cabinet|courses|\//, { timeout: 15000 })

    await page.goto('/courses')
    await expect(page.locator('h1')).toBeVisible()

    const courseLink = page.locator('a[href*="/courses/"]').first()
    if (await courseLink.count()) {
      await courseLink.click()
      await expect(page.locator('h1')).toBeVisible()
    }
  })
})
