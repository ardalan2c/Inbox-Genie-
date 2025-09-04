import { test, expect } from '@playwright/test'

test('home renders hero + CTA', async ({ page }) => {
  await page.goto('http://localhost:3001/')
  await expect(page.getByRole('heading', { name: 'Never miss another lead.' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Start free pilot' })).toBeVisible()
})

test('pricing page shows plans + toggle', async ({ page }) => {
  await page.goto('http://localhost:3001/pricing')
  await expect(page.getByText('Starter')).toBeVisible()
  await expect(page.getByText('Pro')).toBeVisible()
  await expect(page.getByText('Team-10')).toBeVisible()
})

test('app is protected by auth', async ({ page }) => {
  await page.goto('http://localhost:3001/app/dashboard')
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
})

test('keyboard nav header + tabs + FAQ', async ({ page }) => {
  await page.goto('http://localhost:3001/')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(page).toHaveURL(/\//)
  await page.goto('http://localhost:3001/')
  await expect(page.getByText('Transparent minutes. No setup fees.')).toBeVisible()
})
