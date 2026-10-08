import { test, expect, type Page } from '@playwright/test';

const errors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => { const items: string[] = []; errors.set(page, items); page.on('pageerror', error => items.push(error.message)); });
test.afterEach(({ page }) => { expect(errors.get(page) ?? []).toEqual([]); });

async function openGuest(page: Page, url: string) {
  await page.goto(url);
  await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
}
test('home shows the growth simulation by default on desktop, tablet and mobile', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await openGuest(page, '/');
  await expect(page.locator('[data-growth-scene]')).toBeVisible();
  await expect(page.locator('.daily-home')).toHaveCount(0);
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('[data-growth-scene]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.locator('button[data-habitat]')).toHaveCount(7);
    await page.locator('[data-growth-scene]').screenshot({ path: testInfo.outputPath(`growth-${width}.png`) });
  }
  await page.getByRole('button', { name: 'Günlük', exact: true }).filter({ visible: true }).first().click();
  await expect(page.locator('.journal-notebook')).toBeVisible();
  await page.getByRole('button', { name: 'SAH ana sayfa', exact: true }).filter({ visible: true }).first().click();
  await expect(page.locator('[data-growth-scene]')).toBeVisible();
});

test('journal tabs have distinct URLs, Back restores the tab, and reload preserves it', async ({ page }) => {
  test.setTimeout(120_000);
  await openGuest(page, '/?view=journal&tab=journal');
  for (const [tab, label] of [['matrix','Öncelik Matrisim'],['sukur','Şükür Defterim'],['lessons','Hatalar ve Dersler']] as const) {
    await page.getByRole('button', { name: /Araçlar/ }).click();
    await page.getByRole('menuitem', { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`view=journal&tab=${tab}`));
    await expect(page.locator('.journal-tool-panel > header h2')).toHaveText(label);
    await page.reload();
    await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
    await expect(page.locator('.journal-tool-panel > header h2')).toHaveText(label);
  }
  await page.goBack();
  await expect(page).toHaveURL(/tab=sukur/);
  await expect(page.locator('.journal-tool-panel > header h2')).toHaveText('Şükür Defterim');
});

test('Quran tabs survive reload and direct ayah/hadith access shares the same wheel result', async ({ page }) => {
  test.setTimeout(120_000);
  await openGuest(page, '/?view=quran-companion&tab=study');
  await expect(page.locator('.quran-companion-tabs button.active')).toHaveText(/Çalışma Alanım/);
  for (const [tab,label] of [['teachers','Hocalar'],['appointments','Randevularım'],['peers',"Kur'an Kardeşi"],['achievements','Başarımlarım'],['study','Çalışma Alanım']] as const) {
    // The existing appointment tab includes a live count in its accessible name.
    await page.locator('.quran-companion-tabs').getByRole('button',{name:new RegExp(`^${label}(?: \\d+)?$`)}).click();
    await expect(page).toHaveURL(new RegExp(`view=quran-companion&tab=${tab}`));
    await page.reload(); await page.getByRole('button',{name:'DEV: Misafir görünümü'}).click();
    await expect(page.locator('.quran-companion-tabs button.active')).toHaveText(new RegExp(`^${label}(?:\\d+)?$`));
    await expect(page.locator('main video')).toHaveCount(0);
  }
  await page.getByRole('button',{name:'Not arşivini aç'}).click();
  await expect(page).toHaveURL(/tab=wheel/);
  await page.getByRole('tab',{name:'Ayet Çarkı',exact:true}).click();
  await expect(page.locator('.ritual-info > div')).toHaveCount(3);
  await page.getByRole('button',{name:'Bugünün ayetini direkt göster',exact:true}).click();
  await expect(page.locator('.wisdom-reveal')).toBeVisible();
  await expect(page.locator('.ritual-info .revealed')).toHaveCount(3);
  await page.getByRole('tab',{name:'Hadis Çarkı',exact:true}).click();
  await expect(page).toHaveURL(/wisdom=hadith/);
  await page.getByRole('button',{name:'Bugünün hadisini direkt göster',exact:true}).click();
  await expect(page.locator('.wisdom-reveal')).toBeVisible();
  await page.reload(); await page.getByRole('button',{name:'DEV: Misafir görünümü'}).click();
  await expect(page.getByRole('button',{name:'Bugünün hadisini direkt göster',exact:true})).toBeVisible();
});
