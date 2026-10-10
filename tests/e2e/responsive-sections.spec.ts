import { test, expect } from '@playwright/test';

test('seven main sections render at 375px with reduced motion and usable navigation', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.name));
  await page.goto('/');
  await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
  await expect(page.locator('[data-growth-scene]')).toBeVisible();
  for (const [view, selector] of [['journal', '.journal-notebook'], ['quran-companion', '.quran-companion'], ['mescidim', '.mescidim-single-flow'], ['awareness', '.awareness-experience'], ['reports', '.report-next-step'], ['profession-school', '.profession-school'], ['focus', '[data-focus-studio]']]) {
    await page.evaluate(view => window.history.pushState(null, '', `/?view=${view}`), view);
    await expect(page.locator(selector)).toBeVisible();
    await expect(page.locator('.view-motion-shell')).toHaveCSS('opacity', '1');
    await expect(page.locator('.view-motion-shell h1, .view-motion-shell h2, .focus-dial').first()).toBeVisible();
    await expect(page.getByText('Bu bölüm şu anda görüntülenemiyor.')).toHaveCount(0);
    const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth,
      elements: [...document.querySelectorAll('main *')].filter(el => {
        const r = el.getBoundingClientRect(); return r.width > 0 && r.right > window.innerWidth + 1 && getComputedStyle(el).position !== 'absolute';
      }).slice(0, 8).map(el => el.className.toString()) }));
    expect(overflow.width, `${view}: ${JSON.stringify(overflow)}`).toBeLessThanOrEqual(overflow.viewport);
    await page.screenshot({ path: testInfo.outputPath(`${view}-375.png`) });
    const smallNav = await page.locator('.mobile-nav button, .quran-companion-tabs button, .journal-hub-tabs button, .mescidim-section-nav button').evaluateAll(buttons => buttons.filter(button => {
      const rect = button.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
    }).map(button => button.textContent?.trim()));
    expect(smallNav, `${view}: primary tabs/navigation >=44px`).toEqual([]);
    if (view === 'focus') {
      await expect(page.getByRole('dialog', {name:'Zaman çizelgesi'})).toHaveCount(0);
      await expect(page.getByRole('button', {name:'Zaman çizelgesini aç'})).toHaveAttribute('aria-expanded', 'false');
      await page.getByRole('button', {name:'Zaman çizelgesini aç'}).click();
      const timeline=page.getByRole('dialog', {name:'Zaman çizelgesi'});
      await expect(timeline).toBeVisible();
      await timeline.getByRole('button', {name:'Zaman çizelgesini kapat'}).click();
      await expect(timeline).toHaveCount(0);
    } else {
      await expect(page.locator('.mobile-nav')).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});

test('journal and Quran subtabs plus mosque section links remain usable at 375px', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?view=journal');
  await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
  for (const [view, tabs, selector] of [
    ['quran-companion', ['oku', 'calis', 'topluluk'], '.quran-companion-tabs button.active'],
  ] as const) {
    for (const tab of tabs) {
      await page.evaluate(({ view, tab }) => window.history.pushState(null, '', `/?view=${view}&tab=${tab}`), { view, tab });
      await expect(page.locator(selector)).toBeVisible();
      // Bring horizontally scrollable tab strips into view, as a touch user can.
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.locator(selector).click();
      await expect(page).toHaveURL(new RegExp(`view=${view}&tab=${tab}`));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${view}/${tab}`).toBe(true);
      await expect(page.getByText('Bu bölüm şu anda görüntülenemiyor.')).toHaveCount(0);
    }
  }
  for (const [tab, label] of [['matrix', 'Öncelik Matrisim'], ['sukur', 'Şükür Defterim'], ['lessons', 'Hatalar ve Dersler']] as const) {
    await page.evaluate(() => window.history.pushState(null, '', '/?view=journal'));
    await page.getByRole('button', { name: /Araçlar/ }).click();
    await page.getByRole('menuitem', { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`view=journal&tab=${tab}`));
    await expect(page.locator('.journal-tool-panel > header h2')).toHaveText(label);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `journal/${tab}`).toBe(true);
  }
  await page.evaluate(() => window.history.pushState(null, '', '/?view=mescidim'));
  await expect(page.locator('.mescidim-single-flow')).toBeVisible();
  for (const tab of ['vakitler', 'asma', 'dua'] as const) {
    await page.locator('.mescidim-section-nav button').filter({ hasText: tab === 'vakitler' ? 'Namaz vakitleri' : tab === 'asma' ? 'Günün Esmâsı' : 'Dualar' }).click();
    await expect(page).toHaveURL(new RegExp(`view=mescidim&tab=${tab}`));
    await expect(page.locator(`#mescidim-${tab}`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `mescidim/${tab}`).toBe(true);
  }
});
