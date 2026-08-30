import { test, expect } from '@playwright/test'

test('generates a QR preview and triggers an SVG download', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('qr-preview').locator('svg')).toBeVisible()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('download-svg').click()
  ])

  expect(download.suggestedFilename()).toBe('qr-code.svg')
})

test('live preview updates when the content input changes', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('qr-preview').locator('svg')).toBeVisible()

  const before = await page.getByTestId('qr-preview').innerHTML()
  await page.getByPlaceholder('Enter content').fill('https://changed.example')
  await expect.poll(() => page.getByTestId('qr-preview').innerHTML()).not.toBe(before)
})
