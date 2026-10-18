import { test, expect } from '@playwright/test';

test('dark school notices and lesson actions remain readable without changing light colors', async ({ page }) => {
  await page.goto('/?view=profession-school');
  await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
  await expect(page.getByRole('heading', { name: 'Meslek ve Ahlak Okulu', exact: true })).toBeVisible();
  await page.locator('.profession-track-grid button').filter({ hasText: 'Mühendis' }).click();
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.locator('.lesson-path button').nth(1).click();
  await expect(page.locator('.profession-notice')).toHaveCSS('background-color', 'rgb(26, 46, 36)');
  await expect(page.locator('.profession-notice')).toHaveCSS('color', 'rgb(226, 237, 230)');
  await page.locator('.lesson-path button').first().click();
  const icon = page.locator('.lesson-action > .app-icon');
  await expect(icon).toHaveCSS('background-color', 'rgb(36, 68, 54)');
  await expect(icon).toHaveCSS('color', 'rgb(139, 223, 191)');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await expect(icon).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
