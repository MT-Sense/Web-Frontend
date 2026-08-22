import { test, expect } from '@playwright/test'

test('unauthenticated root redirects to the login screen', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('button', { name: /เข้าสู่ระบบ|Sign in/ })).toBeVisible()
})
