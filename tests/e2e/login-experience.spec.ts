import { test, expect } from '@playwright/test';

const quote = 'İnsan yaratılış bilgeliğini kavradıkça sorumluluğunun çemberini de genişletir.';

test.beforeEach(async ({ page }) => {
  // Never send an email or contact the real auth service in presentation tests.
  await page.route('**/auth/v1/**', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ external: { google: true } }),
  }));
});

test('cardioid and complete quote stay visible at every breakpoint without overlap', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page).toHaveTitle(/SAHİ World/);
  const motif = page.getByRole('figure', { name: 'Kardiyoid: bir çemberden doğan bütün' });
  const heading = page.getByRole('heading', { name: quote, exact: true });
  const heroText = await page.locator('section[aria-labelledby="login-title"]').innerText();
  expect(heroText.replace(/\s+/g, ' ').trim()).toBe(`SAHİ ${quote}`);
  for (const width of [320, 390, 620, 900, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(motif).toBeVisible();
    await expect(heading).toBeVisible();
    await expect(motif.locator('line')).toHaveCount(200);
    // Viewport changes can arrive before the browser's responsive layout settles.
    await expect.poll(async () => (await motif.boundingBox())?.width ?? 0)
      .toBeGreaterThanOrEqual(width <= 390 ? 270 : 380);
    const shape = (await motif.boundingBox())!;
    const text = (await heading.boundingBox())!;
    expect(shape.width).toBeGreaterThanOrEqual(width <= 390 ? 270 : 380);
    expect(shape.x).toBeGreaterThanOrEqual(0);
    expect(shape.x + shape.width).toBeLessThanOrEqual(width);
    expect(shape.y + shape.height).toBeLessThanOrEqual(text.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390 || width === 1440) await page.screenshot({ path: info.outputPath(`entry-${width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(motif).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('typewriter syncs with the cardioid, loops after a one-second pause, and preserves the form', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.getByLabel('E-posta adresi', { exact: true }).fill('presentation@example.com');
  const replay = page.getByRole('button', { name: 'Kardiyoid ve söz animasyonunu yeniden oynat' });
  await replay.click();
  await expect(page.getByTestId('login-reveal')).toHaveAttribute('data-replay', '1');
  const finalThread = page.getByRole('figure').locator('line').last();
  const glyphs = page.locator('#login-title [data-glyph]');
  expect(await glyphs.count()).toBe(Array.from(quote.replace(/\s/g, '')).length);
  const delays = await glyphs.evaluateAll(items => items.map(el => parseFloat(getComputedStyle(el).animationDelay)));
  expect(delays.every((delay, index) => index === 0 || delay > delays[index - 1])).toBe(true);
  const finalGlyph = glyphs.last();
  await expect(finalThread).toHaveCSS('opacity', '0');
  await expect(finalGlyph).toHaveCSS('opacity', '0');
  await expect(finalGlyph).toHaveCSS('opacity', '1', { timeout: 6000 });
  await expect(finalThread).toHaveCSS('stroke-dashoffset', '0px', { timeout: 6000 });
  await expect(page.getByTestId('login-reveal')).toHaveAttribute('data-replay', '2', { timeout: 6500 });
  await expect(page.getByTestId('login-reveal').locator('[data-glyph]').last()).toHaveCSS('opacity', '0');
  await expect(page.getByLabel('E-posta adresi', { exact: true })).toHaveValue('presentation@example.com');
  await replay.focus();
  await replay.press('Enter');
  await expect(page.getByTestId('login-reveal')).toHaveAttribute('data-replay', '3');
  await expect(replay).toBeFocused();
});

test('reduced motion immediately renders the complete illustration and keyboard jump reaches login', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.goto('/');
  const finalThread = page.getByRole('figure').locator('line').last();
  await expect(finalThread).toHaveCSS('animation-name', 'none');
  await expect(finalThread).toHaveCSS('stroke-dashoffset', '0px');
  await expect(page.locator('#login-title [data-glyph]').last()).toHaveCSS('opacity', '1');
  await expect(page.getByTestId('starfield').locator('circle')).toHaveCount(180);
  await expect(page.getByTestId('starfield').locator('circle').first()).toHaveCSS('animation-name', 'none');
  await page.getByRole('link', { name: 'Giriş formuna git' }).press('Enter');
  await expect(page.locator('#login-form')).toBeFocused();
  await expect(page.getByRole('heading', { name: 'SAHİ hesabına giriş yap' })).toBeInViewport();
});

test('mocked email-code flow still works and errors leave the entry composition intact', async ({ page }) => {
  let requested = 0;
  await page.route('**/auth/v1/otp', route => {
    requested++;
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/auth/v1/verify', route => route.fulfill({
    status: 403, contentType: 'application/json', body: JSON.stringify({ msg: 'Token has expired', code: 'otp_expired' }),
  }));
  await page.goto('/');
  await page.getByLabel('E-posta adresi', { exact: true }).fill('presentation@example.com');
  await page.getByRole('button', { name: 'Kod gönder', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Gelen kutunu kontrol et' })).toBeVisible();
  expect(requested).toBe(1);
  for (let index = 1; index <= 6; index++) await page.getByLabel(`${index}. kod hanesi`, { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Giriş yap', exact: true }).click();
  await expect(page.locator('#login-form').getByRole('alert')).toContainText('Kodun süresi dolmuş');
  await expect(page.getByRole('figure')).toBeVisible();
  await page.getByRole('button', { name: /E-posta adresini değiştir/ }).click();
  await expect(page.getByLabel('E-posta adresi', { exact: true })).toHaveValue('presentation@example.com');
});

test('SAHİ brand reaches public metadata and the signed-in navigation', async ({ page, request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.short_name).toBe('SAHİ World');
  await page.goto('/');
  await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
  await expect(page.getByRole('button', { name: 'SAHİ ana sayfa', exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/\bSAH(?:\s|’)/);
});
