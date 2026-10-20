import { expect, test, type Page } from '@playwright/test';

async function guest(page: Page, view = 'dashboard', query = '') {
  await page.route('**/auth/v1/**', route => route.fulfill({ json: { external: { google: true } } }));
  await page.route('**/rest/v1/**', route => route.fulfill({ json: [] }));
  await page.goto(`/?view=${view}${query}`);
  await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
  await expect(page.locator('#main-content')).toBeVisible();
}

test('mobile quick-write keeps a visible icon and a 44px target', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await guest(page);
  const action = page.getByRole('button', { name: 'Gününü Yaz', exact: true });
  await expect(action.locator('.app-icon')).toBeVisible();
  const box = await action.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await action.click();
  await expect(page.locator('.journal-notebook')).toBeVisible();
});

test('settings retain focus, expose keyboard tabs and close with Escape', async ({ page }) => {
  await guest(page);
  await page.getByRole('button', { name: 'Hesap menüsü' }).click();
  await page.getByRole('menuitem', { name: 'Hesap ve gizlilik' }).click();
  const dialog = page.getByRole('dialog', { name: 'Sana ait alan' });
  await expect(dialog).toBeVisible();
  const close = dialog.getByRole('button', { name: 'Ayarları kapat' });
  await close.focus();
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate(root => root.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await dialog.getByRole('tab', { name: 'Hesap', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('tab', { name: 'Tercihler' })).toBeFocused();
  await expect(dialog.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'settings-tab-preferences');
  await page.keyboard.press('End');
  await expect(dialog.getByRole('tab', { name: 'Gizlilik ve Veri' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Hesap menüsü' })).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});

test('dark reports expose seven readable days and correctly label all-time categories', async ({ page }) => {
  await guest(page, 'reports');
  await expect(page.locator('.reports-hero')).toBeVisible();
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await expect(page.locator('.reports-week-days').getByRole('listitem')).toHaveCount(7);
  await expect(page.locator('.reports-category-card')).toContainText('TÜM ZAMANLAR');
  for (const heading of await page.locator('.reports-view-clean h2').all()) {
    const contrast = await heading.evaluate(element => {
      const rgb = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number);
      const luminance = (values: number[]) => values.map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; }).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
      const sample = document.createElement('span');
      element.append(sample);
      sample.style.color = 'var(--core-surface)';
      const background = luminance(rgb(getComputedStyle(sample).color));
      const foreground = luminance(rgb(getComputedStyle(element).color));
      sample.remove();
      return (Math.max(background, foreground) + .05) / (Math.min(background, foreground) + .05);
    });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  }
  await expect(page.locator('.reports-detail-trigger[aria-expanded="true"]')).toHaveCount(0);
});

test('priority tasks have labels and profile progress is not clipped', async ({ page }) => {
  await guest(page, 'journal', '&tab=matrix');
  const inputs = page.getByRole('textbox', { name: /için yeni görev/ });
  await expect(inputs).toHaveCount(4);
  await expect(page.getByRole('button', { name: /görev ekle/ })).toHaveCount(4);
  await page.evaluate(() => history.pushState(null, '', '/?view=profile'));
  const caption = page.locator('.profile-progress-summary p');
  await expect(caption).toBeVisible();
  expect(await caption.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThan(16);
  await expect(page.locator('.profile-xp-bar')).toHaveAttribute('aria-valuenow', /\d+/);
});

test('teacher biographies and actions stay readable on a 375px display', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await guest(page, 'quran-companion', '&tab=teachers');
  await expect(page.locator('.hoca-card').first()).toBeVisible();
  for (const text of await page.locator('.hoca-card>p').all()) await expect(text).toHaveCSS('font-size', '14px');
  for (const button of await page.locator('.hoca-actions button').all()) {
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('reflection dialog announces local saving and returns focus on Escape', async ({ page }) => {
  await guest(page, 'mescidim');
  const open = page.getByRole('button', { name: 'Bugünün ismini tefekkür et' });
  await open.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox').fill('Bugünün düşüncesi: sabır ve şükür.');
  await dialog.getByRole('button', { name: /Notu kaydet/ }).click();
  await expect(dialog.getByRole('status')).toContainText('bu cihaza kaydedildi');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
});

test('journal history accepts filters and explains an invalid date range', async ({ page }) => {
  await guest(page, 'journal', '&tab=journal&journalPanel=history');
  await expect(page.locator('.journal-history')).toBeVisible();
  await page.getByLabel('Başlangıç', { exact: true }).fill('2025-02-01');
  await page.getByLabel('Bitiş', { exact: true }).fill('2025-01-01');
  await expect(page.locator('.journal-history').getByRole('alert')).toContainText('Başlangıç tarihi bitiş tarihinden sonra olamaz');
  await page.getByRole('button', { name: 'Filtreleri temizle', exact: true }).first().click();
  await expect(page.getByLabel('Başlangıç', { exact: true })).toHaveValue('');
});

test('unavailable remote avatars use a local image without breaking the layout', async ({ page }) => {
  await page.route('https://api.dicebear.com/**', route => route.abort());
  await guest(page, 'quran-companion', '&tab=topluluk');
  const fallback = page.locator('img[src="/avatar-fallback.svg"]').first();
  await expect(fallback).toBeVisible();
  await expect.poll(() => fallback.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('community form errors remain inside the dialog and Escape restores focus', async ({ page }) => {
  await guest(page, 'community');
  await page.route('**/rest/v1/rpc/create_group', route => route.fulfill({
    status: 403, json: { code: '42501', message: 'permission denied' },
  }));
  const open = page.getByRole('button', { name: '+ Grup oluştur', exact: true });
  await open.click();
  const dialog = page.getByRole('dialog', { name: 'Birlikte gelişmek için alan aç' });
  await dialog.getByLabel('Grup adı', { exact: true }).fill('Deneme grubu');
  await dialog.getByRole('button', { name: 'Topluluğu oluştur', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('güvenli oturum');
  await dialog.getByRole('button', { name: 'Pencereyi kapat' }).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Topluluğu oluştur', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
});

test('direct discovery entry resolves its auth loader without exposing the village', async ({ page }) => {
  await page.goto('/kesif');
  await expect(page.getByRole('button', { name: 'Google ile devam et' })).toBeVisible({ timeout: 30000 });
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('dark account summaries use readable text on a matching surface', async ({ page }) => {
  await guest(page);
  await page.getByRole('button', { name: 'Hesap menüsü' }).click();
  await page.getByRole('menuitem', { name: 'Gece görünümü' }).click();
  const summary = page.locator('.awareness-profile-summary');
  await expect(summary.locator('strong')).toHaveCSS('font-size', '14px');
  await expect(summary.locator('small').first()).toHaveCSS('font-size', '12px');
  await expect.poll(() => summary.evaluate(element => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = 'var(--core-elevated)';
    element.append(probe);
    const matches = getComputedStyle(element).backgroundColor === getComputedStyle(probe).backgroundColor;
    probe.remove();
    return matches;
  })).toBe(true);
});
