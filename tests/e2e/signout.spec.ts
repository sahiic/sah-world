import { expect, test, type Page } from '@playwright/test';

// Synthetic auth cookie: SSR and the browser both start with a real-shaped
// session against the loopback fixture, never a production account.
async function signedIn(page: Page) {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const user = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated',
    created_at: new Date().toISOString(), app_metadata: {}, user_metadata: {},
  };
  const token = [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    Buffer.from(JSON.stringify({ sub: user.id, aud: 'authenticated', exp: expires })).toString('base64url'),
    'fixture-signature',
  ].join('.');
  await page.context().addCookies([{
    name: 'sb-127-auth-token', url: 'http://localhost', sameSite: 'Lax',
    value: 'base64-' + Buffer.from(JSON.stringify({
      access_token: token, refresh_token: 'fixture-only-refresh',
      token_type: 'bearer', expires_in: 3600, expires_at: expires, user,
    })).toString('base64url'),
  }]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const response = await page.goto('/?view=journal', { waitUntil: 'domcontentloaded' });
  // Prevent a false-positive test that only exercises a client-only guest.
  expect(await response!.text()).toContain('Örnek Öğrenci');
  await expect(page.getByRole('button', { name: 'Hesap menüsü' })).toBeVisible();
}

for (const entry of ['menu', 'settings'] as const) {
  test(`${entry} logout hides the SSR account immediately and remains signed out after reload`, async ({ page }) => {
    await signedIn(page);
    let calls = 0;
    await page.route('**/auth/v1/logout*', route => {
      expect(new URL(route.request().url()).searchParams.get('scope')).toBe('local');
      calls++;
      return route.fulfill({ status: 204 });
    });
    // Withhold route refresh: rendering login cannot depend on new server props.
    let releaseRefresh!: () => void;
    const refreshGate = new Promise<void>(resolve => { releaseRefresh = resolve; });
    await page.route('**/*', async route => {
      if (route.request().headers().rsc === '1') {
        await refreshGate;
        return route.continue();
      }
      return route.fallback();
    });
    await page.getByRole('button', { name: 'Hesap menüsü' }).click();
    if (entry === 'settings') {
      await page.getByRole('menuitem', { name: 'Hesap ve gizlilik' }).click();
      await page.getByRole('button', { name: 'Oturumu kapat', exact: true }).click();
    } else {
      await page.getByRole('menuitem', { name: 'Oturumu kapat' }).click();
    }
    await expect(page.getByRole('heading', { name: 'SAHİ hesabına giriş yap' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hesap menüsü' })).toHaveCount(0);
    expect(calls).toBe(1);
    expect((await page.context().cookies()).filter(cookie => cookie.name.startsWith('sb-127-auth-token'))).toHaveLength(0);
    releaseRefresh();
    await expect(page).toHaveURL(/\/$/);
    await page.unroute('**/*');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'SAHİ hesabına giriş yap' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hesap menüsü' })).toHaveCount(0);
    await page.goto('/?view=journal', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'SAHİ hesabına giriş yap' })).toBeVisible();
  });
}

test('server logout failure still exits locally and explains the unconfirmed revocation', async ({ page }) => {
  await signedIn(page);
  await page.route('**/auth/v1/logout*', route => route.fulfill({
    status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Fixture unavailable' }),
  }));
  await page.getByRole('button', { name: 'Hesap menüsü' }).click();
  await page.getByRole('menuitem', { name: 'Oturumu kapat' }).click();
  await expect(page.getByRole('heading', { name: 'SAHİ hesabına giriş yap' })).toBeVisible();
  await expect(page.locator('#login-form').getByRole('alert')).toContainText('Bu cihazdaki oturum kapatıldı');
  await expect(page.getByRole('button', { name: 'Hesap menüsü' })).toHaveCount(0);
  expect((await page.context().cookies()).filter(cookie => cookie.name.startsWith('sb-127-auth-token'))).toHaveLength(0);
});

test('logout in another tab also removes the existing account view', async ({ page }) => {
  await signedIn(page);
  const otherTab = await page.context().newPage();
  await otherTab.route('**/auth/v1/logout*', route => route.fulfill({ status: 204 }));
  await otherTab.goto('/?view=journal', { waitUntil: 'domcontentloaded' });
  await otherTab.getByRole('button', { name: 'Hesap menüsü' }).click();
  await otherTab.getByRole('menuitem', { name: 'Oturumu kapat' }).click();
  // The original tab never navigates and retains its server initialUser props.
  await expect(page.getByRole('heading', { name: 'SAHİ hesabına giriş yap' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hesap menüsü' })).toHaveCount(0);
  await otherTab.close();
});
