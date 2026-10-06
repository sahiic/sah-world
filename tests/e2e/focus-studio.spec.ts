import { expect, test, type Page } from '@playwright/test';

async function openFocus(page: Page, route: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  if (route !== '/focus') {
    await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Bir işe alan aç.' })).toBeVisible();
}

async function expectScene(page: Page, id: string, image: string) {
  const backdrop = page.locator(`[data-scene="${id}"]`);
  await expect(backdrop).toHaveCount(1);
  if (image) {
    await expect(backdrop.locator('img')).toHaveAttribute('src', image);
    await expect.poll(() => backdrop.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  } else {
    await expect(backdrop.locator('img')).toHaveCount(0);
  }
}

for (const route of ['/?view=focus', '/focus']) {
  test(`${route}: real landscape backgrounds, presets, dialogs and history`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await openFocus(page, route);
    await expectScene(page, 'nature-forest', '/images/focus-forest-ambient.webp');
    await expect(page.locator('video')).toHaveCount(0);
    await page.getByRole('button', { name: '50 dk Derin çalışma', exact: true }).click();
    await expect(page.locator('.focus-dial')).toContainText('50:00');
    await page.getByRole('button', { name: '25 dk Kısa odak', exact: true }).click();
    await expect(page.locator('.focus-dial')).toContainText('25:00');
    await page.getByRole('button', { name: 'Kıyı arka planı', exact: true }).click();
    await expectScene(page, 'ocean-waves', '/images/focus-coast.webp');
    await page.screenshot({ path: testInfo.outputPath('coast.png'), fullPage: true });
    await page.getByRole('button', { name: 'Arka Plan Kıyı', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Yıldızlı Göl arka planı', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expectScene(page, 'starry-night', '/images/focus-alpine-night.webp');
    await page.reload();
    if (route !== '/focus') await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
    await expectScene(page, 'starry-night', '/images/focus-alpine-night.webp');
    await page.getByRole('button', { name: 'Sade arka planı', exact: true }).click();
    await expectScene(page, 'none', '');
    await page.getByRole('button', { name: 'Geçmişim', exact: true }).click();
    await expect(page.locator('.focus-dial')).toHaveCount(0);
    await page.getByRole('button', { name: 'Oturum', exact: true }).click();
    await expect(page.locator('.focus-dial')).toContainText('25:00');
    await page.getByRole('button', { name: /^Arka Plan Sesi / }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    expect(errors).toEqual([]);
  });
}

test('core timer starts, pauses and survives history/minimise without changing duration mid-session', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'Notification', { value: { permission: 'denied' }, configurable: true });
  });
  await openFocus(page, '/?view=focus');
  await page.getByRole('button', { name: '25 dk Kısa odak', exact: true }).click();
  await page.getByRole('textbox', { name: 'Odak görevi', exact: true }).fill('Örnek odak testi');
  await page.getByRole('button', { name: 'Ekle', exact: true }).click();
  await page.getByRole('button', { name: 'Odaklanmaya Başlayın' }).click();
  await expect(page.getByRole('heading', { name: 'Şimdi, yalnızca bu an.' })).toBeVisible();
  await expect(page.getByRole('button', { name: '50 dk Derin çalışma', exact: true })).toBeDisabled();
  await expect(page.locator('.focus-dial')).not.toContainText('25:00');
  await page.getByRole('button', { name: 'Duraklat', exact: true }).click();
  const pausedTime = await page.locator('.focus-dial strong').textContent();
  await page.getByRole('button', { name: 'Geçmişim', exact: true }).click();
  await page.getByRole('button', { name: 'Oturum', exact: true }).click();
  await expect(page.locator('.focus-dial strong')).toHaveText(pausedTime!);
  await page.reload();
  await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
  await expect(page.getByRole('button', { name: 'Devam Et', exact: true })).toBeVisible();
  await expect(page.locator('.focus-dial strong')).toHaveText(pausedTime!);
  await page.getByRole('button', { name: 'Odak ekranını küçült' }).click();
  await expect(page.locator('.focus-shell')).toHaveCount(0);
  await expect(page.getByText('Örnek odak testi', { exact: true })).toBeVisible();
});
