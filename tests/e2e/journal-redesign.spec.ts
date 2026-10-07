import { test, expect, type Page } from '@playwright/test';

const errors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => { const list: string[] = []; errors.set(page, list); page.on('pageerror', error => list.push(error.name)); });
test.afterEach(({ page }) => { expect(errors.get(page) ?? []).toEqual([]); });
async function guest(page: Page, url = '/?view=journal&tab=journal') {
  await page.addInitScript(() => { if (!localStorage.getItem('sah-world-store')) localStorage.setItem('sah-world-store', JSON.stringify({ state: { xp: 0, journal: [], sukurList: [] }, version: 0 })); });
  await page.goto(url); await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
  await expect(page.locator('[data-journal-version="quiet-notebook-v1"]')).toBeVisible();
}
async function data(page: Page) { return page.evaluate(() => JSON.parse(localStorage.getItem('sah-world-store')!).state); }
async function seed(page: Page) {
  await page.addInitScript(() => {
    const base = { mood: 4, energy: 6, stress: 3, sleep: 7, moments: [], tags: [], selfNote: '', xpAwarded: 50, createdAt: '2026-10-01T12:00:00Z' };
    const journal = [
      { ...base, id: 'a1b2c3d4-1111-4111-8111-000000000001', date: '2026-10-01', ritualType: 'sabah', entryMode: 'full', content: 'Sabah destek notu', intentionText: 'İYİLİK için niyet', expectedChallengeText: 'Zorlu ders', tags: ['odak'] },
      { ...base, id: 'a1b2c3d4-1111-4111-8111-000000000002', date: '2026-10-01', ritualType: 'aksam', entryMode: 'full', content: 'Güzel bir ÇALIŞMA günü', gratitudeText: 'Sağlık · Ailem', selfNote: 'Şefkatli ol', moments: ['Kardeşimle yürüyüş'] },
      { ...base, id: 'a1b2c3d4-1111-4111-8111-000000000003', date: '2026-09-30', content: 'Eski kaydım', selfNote: 'Eski not', tags: ['korunan'] },
    ];
    localStorage.setItem('sah-world-store', JSON.stringify({ state: { journal, sukurList: [] }, version: 0 }));
  });
}

test('editor is above the fold, calm, responsive and keyboard accessible', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await guest(page);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('main h1')).toHaveCount(1);
  await expect(page.getByRole('tab')).toHaveCount(2);
  await expect(page.locator('.journal-cover-hero, .journal-binder, .journal-connections-grid')).toHaveCount(0);
  for (const width of [375, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: width >= 768 ? 900 : 844 });
    // Resize acknowledgement can precede responsive reflow on the CI browser.
    // Keep the acceptance limit; wait for the actual layout, not a fixed sleep.
    await expect.poll(async () => (await page.locator('.journal-main-textarea').boundingBox())?.y ?? Infinity,
      { message: `responsive editor top at ${width}px` }).toBeLessThanOrEqual(480);
    const box = await page.locator('.journal-main-textarea').boundingBox();
    expect(box!.y, `first editor top at ${width}px`).toBeLessThanOrEqual(480);
    expect(box!.height).toBeGreaterThanOrEqual(width >= 768 ? 220 : 160);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow ${width}px`).toBe(true);
    const small = await page.locator('.journal-navigation button, .journal-toolbar button, .journal-mood-picker button, .journal-mode-control button').evaluateAll(nodes => nodes.filter(node => { const r = node.getBoundingClientRect(); return r.height > 0 && (r.width < 44 || r.height < 44); }).map(node => node.textContent));
    expect(small).toEqual([]);
    if ([390, 1440].includes(width)) await page.screenshot({ path: info.outputPath(`journal-after-${width}.png`), fullPage: true });
  }
  const tools = page.getByRole('button', { name: /Araçlar/ });
  await tools.focus(); await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Öncelik Matrisim' })).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(page.getByRole('menuitem', { name: 'Şükür Defterim' })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(tools).toBeFocused();
  const write = page.getByRole('tab', { name: 'Yaz', exact: true });
  await write.focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Geçmiş', exact: true })).toBeFocused();
  await expect(page).toHaveURL(/journalPanel=history/);
  await page.keyboard.press('ArrowLeft'); await expect(write).toBeFocused();
  // Real CSS theme tokens, enlarged text and a reduced visual viewport (keyboard).
  await page.locator('.core-app').evaluate(node => node.setAttribute('data-theme', 'dark'));
  await expect(page.locator('.journal-editor')).toHaveCSS('background-color', 'rgb(23, 43, 34)');
  await page.screenshot({ path: info.outputPath('journal-dark.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 430 });
  await page.locator('.journal-workspace').evaluate(node => (node as HTMLElement).style.fontSize = '20px');
  await page.locator('.journal-main-textarea').fill('Uzun Türkçe metin. '.repeat(80));
  await page.getByRole('button', { name: 'Kaydet', exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Kaydet', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('quick and detailed fields survive modes, folds, tools, history and validation', async ({ page }) => {
  await guest(page);
  await page.getByRole('button', { name: 'Sabah Niyeti', exact: true }).click();
  await page.getByRole('button', { name: 'Hızlı Kayıt', exact: true }).click();
  await page.locator('.journal-main-textarea').fill('Destekleyen son karakter!');
  await page.getByRole('button', { name: 'Detaylı Yaz', exact: true }).click();
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await expect(page.getByText('Bugünün niyetini bir cümleyle yaz.', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Bugünkü niyetim', exact: true })).toBeFocused();
  await page.getByRole('textbox', { name: 'Bugünkü niyetim', exact: true }).fill('Niyetim ayrı kalır.');
  await page.locator('summary').filter({ hasText: 'Karşıma çıkabilecek zorluk' }).click();
  await page.getByRole('textbox', { name: 'Zorlukla nasıl karşılaşmak isterim?' }).fill('Sabırla yaklaşacağım.');
  await page.getByRole('button', { name: 'Hızlı Kayıt', exact: true }).click();
  await expect(page.locator('.journal-main-textarea')).toHaveValue('Destekleyen son karakter!');
  await page.getByRole('tab', { name: 'Geçmiş', exact: true }).click();
  await page.getByRole('tab', { name: 'Yaz', exact: true }).click();
  await page.getByRole('button', { name: /Araçlar/ }).click();
  await page.getByRole('menuitem', { name: 'Şükür Defterim' }).click();
  await page.getByRole('button', { name: 'Günlüğe dön', exact: true }).click();
  await page.getByRole('button', { name: 'Sabah Niyeti', exact: true }).click();
  await expect(page.locator('.journal-main-textarea')).toHaveValue('Destekleyen son karakter!');
  await page.getByRole('button', { name: 'Detaylı Yaz', exact: true }).click();
  await expect(page.locator('.journal-main-textarea')).toHaveValue('Niyetim ayrı kalır.');
  await page.locator('summary').filter({ hasText: 'Karşıma çıkabilecek zorluk' }).click();
  await expect(page.getByRole('textbox', { name: 'Zorlukla nasıl karşılaşmak isterim?' })).toHaveValue('Sabırla yaklaşacağım.');
  await page.locator('summary').filter({ hasText: 'Niyetimi destekleyen not' }).click();
  await expect(page.getByRole('textbox', { name: 'Niyetime eşlik eden not' })).toHaveValue('Destekleyen son karakter!');
  const before = (await data(page)).xp;
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  const first = await data(page); expect(first.journal).toHaveLength(1); expect(first.xp - before).toBe(20);
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  const second = await data(page); expect(second.journal[0].id).toBe(first.journal[0].id); expect(second.xp).toBe(first.xp);
  await page.getByRole('button', { name: 'Hızlı Kayıt', exact: true }).click(); await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await page.getByRole('button', { name: 'Detaylı Yaz', exact: true }).click(); await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  expect((await data(page)).xp).toBe(first.xp);
  await page.reload(); await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
  await page.getByRole('button', { name: 'Sabah Niyeti', exact: true }).click();
  await expect(page.locator('.journal-main-textarea')).toHaveValue('Niyetim ayrı kalır.');
});

test('evening validates, helper never writes text, and gratitude retries keep IDs and rewards', async ({ page }) => {
  await guest(page); await page.getByRole('button', { name: 'Akşam Muhasebesi', exact: true }).click();
  await page.getByRole('button', { name: 'Detaylı Yaz', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Yazmaya yardımcı ol' }).click();
  await page.getByRole('button', { name: 'Bugün ne için şükrediyorum?', exact: true }).click();
  await expect(page.locator('.journal-main-textarea')).toHaveValue('');
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await expect(page.getByText('Kaydetmek için bugünden bir cümle bırak.', { exact: true })).toBeVisible();
  await page.locator('.journal-main-textarea').fill('Bugünü değerlendirdim.');
  await page.locator('summary').filter({ hasText: 'Şükrettiklerim' }).click();
  await page.getByRole('textbox', { name: 'Fark ettiğim bir nimet 1', exact: true }).fill('Sağlık');
  const before = (await data(page)).xp;
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  const first = await data(page); expect(first.journal).toHaveLength(1); expect(first.sukurList).toHaveLength(1); expect(first.xp - before).toBe(70);
  await page.getByRole('textbox', { name: 'Fark ettiğim bir nimet 1', exact: true }).fill('Sağlık ve ailem');
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  const second = await data(page); expect(second.sukurList).toHaveLength(1); expect(second.sukurList[0].id).toBe(first.sukurList[0].id); expect(second.journal[0].id).toBe(first.journal[0].id); expect(second.xp).toBe(first.xp);
  await expect(page.getByText('Sunucuya kaydedildi', { exact: true })).toHaveCount(0);
});

test('trimmed save keeps the editor stable and only an explicit acknowledgement shows server success', async ({ page }) => {
  await guest(page);
  await page.locator('.journal-main-textarea').fill('  Çevresinde boşluk olan not.\n\n');
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await expect(page.getByText('Sunucuya kaydedildi', { exact: true })).toHaveCount(0);
  // Transport-status fixture only: this is NOT a real authenticated database write.
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('sah:journal-write-status', { detail: { owner: 'guest-user-123', value: 'saved' } })));
  await expect(page.locator('.journal-write-status')).toContainText('Sunucuya kaydedildi');
  await expect(page.locator('.journal-main-textarea')).toHaveValue('  Çevresinde boşluk olan not.\n\n');
  expect((await data(page)).journal[0].content).toBe('Çevresinde boşluk olan not.');
});

test('history searches all fields, combines filters, calendar and legacy readonly records', async ({ page }, info) => {
  await seed(page); await guest(page);
  await page.locator('.journal-main-textarea').fill('Bugünkü taslağım!');
  await page.getByRole('tab', { name: 'Geçmiş', exact: true }).click();
  await expect(page.locator('.journal-history-entry')).toHaveCount(3);
  await page.screenshot({ path: info.outputPath('journal-history.png'), fullPage: true });
  const search = page.getByRole('searchbox', { name: 'Günlük kayıtlarında ara' });
  for (const query of ['IYILIK', 'calisma', 'saglik', 'sefkatli', 'kardesim', 'odak']) {
    await search.fill(query); await expect(page.locator('.journal-history-entry')).toHaveCount(1);
  }
  await search.fill('  SAGLIK   ailem '); await page.getByRole('combobox', { name: 'Yazma zamanı', exact: true }).selectOption('sabah');
  await expect(page.locator('.journal-history-entry')).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Yazma zamanı', exact: true }).selectOption('aksam');
  await page.getByLabel('Başlangıç', { exact: true }).fill('2026-10-01'); await page.getByLabel('Bitiş', { exact: true }).fill('2026-10-01');
  await expect(page.locator('.journal-history-entry')).toHaveCount(1);
  await page.getByRole('button', { name: 'Filtreleri temizle', exact: true }).first().click();
  await page.locator('summary').filter({ hasText: 'Takvimden bir gün seç' }).click();
  await page.locator('.journal-calendar button.has-entry').filter({ hasText: /^1$/ }).click();
  await expect(page.locator('.journal-history-entry')).toHaveCount(2);
  await page.getByRole('button', { name: 'Filtreleri temizle', exact: true }).first().click();
  await search.fill('Eski kaydım'); await page.locator('.journal-history-entry').click();
  await expect(page.locator('.journal-readonly-note')).toContainText('Salt okunur');
  await expect(page.locator('.journal-main-textarea')).toHaveAttribute('readonly', '');
  await expect(page.locator('.journal-main-textarea')).toHaveValue('Eski kaydım');
  await expect(page.getByRole('button', { name: 'Kaydet', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Bugün yaz', exact: true }).click();
  await expect(page.locator('.journal-main-textarea')).toHaveValue('Bugünkü taslağım!');
  expect((await data(page)).journal).toHaveLength(3);
});

test('corrupt drafts remain intact until a recoverable copy succeeds', async ({ page }) => {
  await page.addInitScript(() => {
    const date = new Date(); const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    localStorage.setItem(`sah-journal-draft-v1:guest-user-123:${today}:aksam`, '{unreadable original');
  });
  await guest(page); await page.getByRole('button', { name: 'Akşam Muhasebesi', exact: true }).click();
  await expect(page.locator('.journal-notebook').getByRole('alert')).toContainText('eski taslak silinmedi');
  await page.locator('.journal-main-textarea').fill('Yeni metin korunur.');
  await expect(page.locator('.journal-write-status')).toContainText('Depolama hatası');
  const old = await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('sah-journal-draft-v1:') && key.endsWith(':aksam')).map(key => localStorage.getItem(key)));
  expect(old).toEqual(['{unreadable original']);
  await page.getByRole('button', { name: 'Yeniden dene', exact: true }).click();
  const recovered = await page.evaluate(() => Object.keys(localStorage).filter(key => key.includes(':recovery:')).map(key => localStorage.getItem(key)));
  expect(recovered).toEqual(['{unreadable original']);
  await expect(page.locator('.journal-write-status')).toContainText('Taslak bu cihazda saklandı');
});

test('quota failure stays honest and retries preserve the latest text', async ({ page }) => {
  await guest(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Object.assign(window, { restoreJournalStorage: () => { Storage.prototype.setItem = original; } });
    Storage.prototype.setItem = function(key, value) { if (key.startsWith('sah-journal-draft-v1:')) throw new DOMException('full', 'QuotaExceededError'); original.call(this, key, value); };
  });
  await page.locator('.journal-main-textarea').fill('Son karakter kaybolmaz!');
  await expect(page.locator('.journal-notebook').getByRole('alert')).toContainText('Cihaz depolamasına yazılamadı');
  await expect(page.locator('.journal-write-status')).toContainText('Depolama hatası');
  await expect(page.getByRole('button', { name: 'Metnimi kopyala', exact: true })).toBeVisible();
  await page.evaluate(() => (window as unknown as { restoreJournalStorage: () => void }).restoreJournalStorage());
  await page.getByRole('button', { name: 'Yeniden dene', exact: true }).click();
  await expect(page.locator('.journal-write-status')).toContainText('Taslak bu cihazda saklandı');
  await expect(page.locator('.journal-main-textarea')).toHaveValue('Son karakter kaybolmaz!');
});
