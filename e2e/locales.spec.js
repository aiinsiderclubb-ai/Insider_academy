import { test, expect } from '@playwright/test'

test.describe('public locale routing', () => {
  test('redirects legacy public URLs to Russian and renders all locale blogs', async ({ page }) => {
    await page.goto('/blog')
    await expect(page).toHaveURL(/\/ru\/blog$/)

    await page.goto('/ukr/blog')
    await expect(page).toHaveURL(/\/ukr\/blog$/)
    await expect(page.getByRole('heading', { name: 'Блог' })).toBeVisible()

    await page.goto('/en/blog')
    await expect(page).toHaveURL(/\/en\/blog$/)
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible()
  })

  test('preserves the current public path while switching languages', async ({ page }) => {
    await page.goto('/ru/blog')
    await page.getByRole('button', { name: 'Українська' }).click()
    await expect(page).toHaveURL(/\/ukr\/blog$/)
    await page.getByRole('button', { name: 'English' }).click()
    await expect(page).toHaveURL(/\/en\/blog$/)
  })
})
