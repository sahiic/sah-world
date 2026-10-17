import { test, expect, type Page } from '@playwright/test';

async function guest(page: Page, view: string) {
  await page.goto(`/?view=${view}`);
  await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
  await expect(page.locator('#main-content')).toBeVisible();
}

test('daily and weekly cards are mounted on the dashboard', async ({page}) => {
  await guest(page, 'dashboard');
  await expect(page.locator('.dashboard-lower-grid .dc-card')).toBeVisible();
  await expect(page.locator('.dashboard-lower-grid .ws-card')).toBeVisible();
});

test('profile menu opens badges, milestones and a working calendar', async ({page}) => {
  await guest(page, 'dashboard');
  await page.getByRole('button', {name:'Hesap menüsü'}).click();
  await page.getByRole('menuitem', {name:'Profilim ve rozetlerim'}).click();
  await expect(page).toHaveURL(/view=profile/);
  await expect(page.locator('.profile-view .mt-card')).toBeVisible({timeout: 20_000});
  await expect(page.getByRole('heading', {name:'Rozetlerin'})).toBeVisible();
  const month = page.locator('.ac-header h3');
  const initial = await month.textContent();
  await page.getByRole('button', {name:'Önceki ay'}).click();
  await expect(month).not.toHaveText(initial!);
  await page.getByRole('button', {name:'Sonraki ay'}).click();
  await expect(month).toHaveText(initial!);
  await expect(page.getByRole('button', {name:'Sonraki ay'})).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('reports include weekly summary and detail triggers', async ({page}) => {
  await guest(page, 'reports');
  await expect(page.locator('.reports-hero')).toBeVisible();
  await expect(page.locator('.reports-weekly')).toBeVisible();
  await expect(page.locator('.reports-details')).toBeVisible();
});

test('focus analytics stay in history, not in the timer', async ({page}) => {
  await page.goto('/focus');
  await expect(page.locator('.focus-analytics')).toHaveCount(0);
  await page.getByRole('button', {name:'Geçmişim',exact:true}).click();
  await expect(page.getByRole('region', {name:'Odak analizi'})).toBeVisible();
  await expect(page.locator('.focus-analytics')).toBeVisible();
  await page.getByRole('button', {name:'Oturum',exact:true}).click();
  await expect(page.locator('.focus-analytics')).toHaveCount(0);
});
