import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
  await expect(page.locator('[data-growth-scene]')).toBeVisible();
  await page.evaluate(() => window.history.pushState(null, '', '/?view=awareness'));
  await expect(page.locator('.awareness-editorial')).toBeVisible();
});

test('three keyboard-accessible tabs, compact reading and both geographies', async ({ page }, info) => {
  const root = page.locator('.awareness-editorial');
  await expect(root.getByRole('tab')).toHaveCount(3);
  await expect(root.locator('.awareness-story-panel')).toHaveCount(6);
  await expect(root.locator('.awareness-missions')).toHaveCount(0);
  await expect(root.locator('.awareness-visual-rail,.awareness-source-dock')).toHaveCount(0);
  await root.getByRole('tab', { name: 'Öğren', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(root.getByRole('tab', { name: 'Harekete Geç' })).toHaveAttribute('aria-selected', 'true');
  await root.getByRole('tab', { name: 'Öğren', exact: true }).click();
  await expect(root.locator('.awareness-opening')).toBeVisible();
  await page.screenshot({ path: info.outputPath('awareness-learn.png') });
  await root.getByLabel('Coğrafya seçimi').selectOption('dogu_turkistan');
  await expect(root.getByRole('heading', { name: '1759: tarihsel bir eşik' })).toBeVisible();
  await expect(root.locator('.awareness-story-panel')).toHaveCount(6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('boycott filters, references, empty state and preferences survive reload', async ({ page }, info) => {
  const root = page.locator('.awareness-editorial');
  await root.getByRole('tab', { name: 'Harekete Geç' }).click();
  await expect(root.locator('.awareness-boycott-card')).toHaveCount(6);
  await root.getByRole('textbox', { name: 'Marka arama' }).fill('Nestlé');
  await expect(root.locator('.awareness-boycott-card')).toHaveCount(1);
  await expect(root.getByRole('link', { name: 'Kaynak değerlendirmesi' })).toHaveAttribute('href', /\/b\/nestle-23$/);
  await root.getByRole('button', { name: 'Nestlé markasını boykot et', exact: true }).click();
  await expect(root.getByRole('button', { name: 'Nestlé boykotunu kaldır', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
  await expect(root).toBeVisible();
  await page.getByRole('tab', { name: 'Harekete Geç' }).click();
  await page.getByRole('textbox', { name: 'Marka arama' }).fill('Nestlé');
  await expect(page.getByRole('button', { name: 'Nestlé boykotunu kaldır', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Marka arama' }).fill('bulunmayanmarka');
  await expect(page.getByText('Aramanızla eşleşen marka bulunamadı.')).toBeVisible();
  await page.getByRole('button', { name: 'Aramayı temizle' }).click();
  await root.locator('.awareness-status-chip').filter({ hasText: 'Şüpheli' }).click();
  await expect(root.locator('.awareness-boycott-card')).toHaveCount(1);
  await expect(root.getByRole('heading', { name: 'A101', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('awareness-actions.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('tablet dark panels remain within the viewport', async ({ page }, info) => {
  await page.setViewportSize({ width: 900, height: 1000 });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  for (const name of ['Öğren', 'Harekete Geç', 'Bilgi Testi']) {
    await page.getByRole('tab', { name, exact: true }).click();
    await expect(page.getByRole('tabpanel', { name, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`tablet-${name}.png`) });
  }
});

test('dark quiz feedback is legible and repeat completion does not reward again', async ({ page }, info) => {
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.getByRole('tab', { name: 'Bilgi Testi' }).click();
  const answers = page.locator('.quiz-options button');
  await expect(answers).toHaveCount(4);
  await expect(answers.first()).toHaveCSS('border-top-width', '2px');
  await answers.nth(1).click();
  await expect(page.locator('.quiz-options .wrong')).toBeVisible();
  await expect(page.locator('.quiz-options .correct')).toBeVisible();
  const contrasts = await answers.evaluateAll(buttons => buttons.map(button => {
    const style = getComputedStyle(button);
    const luminance = (color: string) => {
      const channels = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number).map(value => {
        const s = value / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const foreground = luminance(style.color);
    const background = luminance(style.backgroundColor);
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  }));
  for (const contrast of contrasts) expect(contrast).toBeGreaterThanOrEqual(4.5);
  await page.screenshot({ path: info.outputPath('awareness-quiz-dark.png') });
  await page.getByRole('button', { name: 'Sonraki soru' }).click();
  for (let i = 1; i < 10; i++) {
    await answers.first().click();
    await page.getByRole('button', { name: i === 9 ? 'Sonucu gör' : 'Sonraki soru' }).click();
  }
  await expect(page.locator('.quiz-reward')).toContainText('XH kazandın');
  await page.getByRole('button', { name: 'Yeniden dene' }).click();
  for (let i = 0; i < 10; i++) {
    await answers.first().click();
    await page.getByRole('button', { name: i === 9 ? 'Sonucu gör' : 'Sonraki soru' }).click();
  }
  await expect(page.locator('.quiz-reward')).toContainText('Bu tur öğrenme amaçlıydı');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
