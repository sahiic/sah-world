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
  await expect(page.getByRole('heading', { name: 'Kendini SAHİ’den Gör…' })).toBeVisible();
  await expect(page.locator('.login-privacy-note')).toContainText('Tek kullanımlık kod ile giriş yapmak için lütfen e-posta adresinizi giriniz.');
  const motif = page.getByRole('figure', { name: 'Kıble yönüne dönük, hafifçe süzülen kardiyoid motifi' });
  const heading = page.getByRole('heading', { name: quote, exact: true });
  const heroText = await page.locator('section[aria-labelledby="login-title"]').innerText();
  expect(heroText.replace(/\s+/g, ' ').trim()).toBe(`SAHİ ${quote}`);
  for (const width of [320, 390, 620, 900, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(motif).toBeVisible();
    await expect(heading).toBeVisible();
    await expect(motif.locator('line')).toHaveCount(200);
    await expect(motif.getByTestId('cardioid-points').locator('circle')).toHaveCount(114);
    await expect(motif.getByTestId('cardioid-orientation')).toHaveAttribute('data-bearing', '151°');
    const dotRadii = await motif.getByTestId('cardioid-points').locator('circle').evaluateAll(circles =>
      circles.map(circle => {
        const dot = circle as SVGCircleElement;
        return Math.hypot(Number(dot.getAttribute('cx')) - 260, Number(dot.getAttribute('cy')) - 260);
      }),
    );
    expect(dotRadii.every(radius => Math.abs(radius - 222) < 0.01)).toBe(true);
    await expect(motif.locator('circle[class*="outerRing"]')).toHaveCount(0);
    await expect(motif).toHaveCSS('animation-name', 'none');
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

test('keyboard-style quote finishes with the qibla-aligned cardioid, loops, and preserves the form', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.getByLabel('E-posta adresi', { exact: true }).fill('presentation@example.com');
  const replay = page.getByRole('button', { name: /Kardiyoid ve söz animasyonunu yeniden oynat/ });
  await replay.click();
  await expect(page.getByTestId('login-reveal')).toHaveAttribute('data-replay', '1');
  const finalThread = page.getByRole('figure').locator('line').last();
  const animatedQuote = page.getByTestId('login-quote');
  const characterCount = Number(await animatedQuote.getAttribute('data-character-count'));
  const typingDuration = Number(await animatedQuote.getAttribute('data-typing-duration-ms'));
  expect(characterCount).toBe(Array.from('İnsan yaratılış bilgeliğinikavradıkça sorumluluğununçemberini de genişletir.').length);
  expect(Number(await animatedQuote.getAttribute('data-typed-count'))).toBeLessThan(characterCount);
  // CSS Modules can place the generated hash before or after the local keyframe name.
  expect(await finalThread.evaluate(element => /(?:^|_)drawThread(?:_|$)/.test(getComputedStyle(element).animationName))).toBe(true);
  const finalThreadTiming = await finalThread.evaluate(element => {
    const style = getComputedStyle(element);
    return parseFloat(style.animationDelay) + parseFloat(style.animationDuration);
  });
  await expect(animatedQuote).toHaveAttribute('data-typed-count', String(characterCount), { timeout: 5000 });
  expect(Math.abs(typingDuration - finalThreadTiming * 1000)).toBeLessThanOrEqual(1);
  expect(await page.getByRole('figure').evaluate(element => /(?:^|_)qiblaDrift(?:_|$)/.test(getComputedStyle(element).animationName))).toBe(true);
  await expect(page.getByTestId('login-reveal')).toHaveAttribute('data-replay', '2', { timeout: 6500 });
  expect(Number(await page.getByTestId('login-quote').getAttribute('data-typed-count'))).toBeLessThan(10);
  await expect(page.getByLabel('E-posta adresi', { exact: true })).toHaveValue('presentation@example.com');
  await replay.focus();
  await replay.press('Enter');
  await expect(page.getByTestId('login-reveal')).toHaveAttribute('data-replay', '3');
  await expect(replay).toBeFocused();
});

test('cardioid combines live location and absolute screen heading to face qibla', async ({ context, page }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 41.0082, longitude: 28.9784 });
  await page.goto('/');

  const orientation = page.getByTestId('cardioid-orientation');
  await expect(orientation).toHaveAttribute('data-bearing', '152°');
  await page.evaluate(() => {
    const event = new Event('deviceorientationabsolute');
    Object.defineProperties(event, {
      absolute: { value: true },
      alpha: { value: 270 },
    });
    window.dispatchEvent(event);
  });

  await expect(orientation).toHaveAttribute('data-screen-heading', '90°');
  await expect(orientation).toHaveAttribute('data-relative-bearing', '62°');
  await expect(orientation).toHaveAttribute('data-direction-source', 'location-compass');
  await expect.poll(async () => orientation.evaluate((element) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    const angle = (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
    const normalized = ((angle % 360) + 360) % 360;
    return Math.abs(normalized - 151.62);
  }), { timeout: 2500 }).toBeLessThan(1);
});

test('reduced motion immediately renders the complete illustration and keyboard jump reaches login', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.goto('/');
  const finalThread = page.getByRole('figure').locator('line').last();
  await expect(finalThread).toHaveCSS('animation-name', 'none');
  await expect(finalThread).toHaveCSS('stroke-dashoffset', '0px');
  const animatedQuote = page.getByTestId('login-quote');
  const characterCount = await animatedQuote.getAttribute('data-character-count');
  expect(characterCount).not.toBeNull();
  await expect(animatedQuote).toHaveAttribute('data-typed-count', characterCount!);
  await expect(page.getByRole('figure')).toHaveCSS('animation-name', 'none');
  await expect(page.getByTestId('starfield').locator('circle')).toHaveCount(180);
  await expect(page.getByTestId('starfield').locator('circle').first()).toHaveCSS('animation-name', 'none');
  await page.getByRole('link', { name: 'Giriş formuna git' }).press('Enter');
  await expect(page.locator('#login-form')).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Kendini SAHİ’den Gör…' })).toBeInViewport();
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
