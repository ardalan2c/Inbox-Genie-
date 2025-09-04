import { test, expect } from '@playwright/test'

test('demo page shows badge + pills + actions', async ({ page }) => {
  // Attempt sign-in flow (MVP mode simulates sign-in)
  await page.goto('http://localhost:3001/auth/login')
  await page.getByPlaceholder('you@example.com').fill('demo@example.com')
  await page.getByRole('button', { name: 'Send magic link' }).click()

  // Go to demo page
  await page.goto('http://localhost:3001/demo')

  // Badge and provider pills
  await expect(page.getByText('Demo Mode — no real calls/SMS/billing')).toBeVisible()
  await expect(page.getByText('Retell')).toBeVisible()
  await expect(page.getByText('Twilio')).toBeVisible()
  await expect(page.getByText('Stripe')).toBeVisible()
  await expect(page.getByText('FUB')).toBeVisible()
  await expect(page.getByText('Google')).toBeVisible()

  // Actions: seed
  await page.getByRole('button', { name: 'Seed demo data' }).click()
  // Expect a toast or status update to appear
  await expect(page.locator('[role="status"]')).toHaveText(/seed/i)

  // Actions: missed call
  await page.getByRole('button', { name: 'Simulate missed call' }).click()
  await expect(page.locator('[role="status"]')).toHaveText(/missed call|simulated/i)

  // Actions: revive
  await page.getByRole('button', { name: 'Simulate revive campaign' }).click()
  await expect(page.locator('[role="status"]')).toHaveText(/revive/i)

  // Dashboard link works
  await page.getByRole('link', { name: 'Dashboard' }).click()
  await expect(page).toHaveURL(/\/app\/dashboard/)
})

