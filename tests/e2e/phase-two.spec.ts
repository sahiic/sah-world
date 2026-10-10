import { test, expect, type Page } from '@playwright/test';
async function guest(page: Page, path = '/') {
  await page.goto(path);
  await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
}
test('progressive welcome completes only after a saved intention and never repeats', async ({ page }, info) => {
  test.setTimeout(120_000);
  await guest(page, '/?onboarding=preview');
  await expect(page.getByRole('heading', { name: /Hoş geldin/ })).toBeVisible();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'İlk niyetimi yaz' }).click();
  await expect(page.locator('.journal-main-textarea')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'İlk adımın tamamlandı!' })).toHaveCount(0);
  await page.locator('.journal-main-textarea').fill('Bugün öğrenmeye sakin bir alan açıyorum.');
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'İlk adımın tamamlandı!' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('onboarding-celebration.png') });
  const xp = await page.evaluate(() => JSON.parse(localStorage.getItem('sah-world-store')!).state.xp);
  await page.getByRole('button', { name: 'Evrenime dön' }).click();
  await page.reload(); await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
  await expect(page.locator('.welcome-guide-overlay')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sah-world-store')!).state.xp)).toBe(xp);
});
test('existing accounts do not see onboarding', async ({ page }) => {
  await guest(page);
  await expect(page.locator('[data-growth-scene]')).toBeVisible();
  await expect(page.locator('.welcome-guide-overlay')).toHaveCount(0);
});

test('three quick actions and persistent accessible icon rail', async ({ page }, info) => {
  await page.setViewportSize({ width:1280, height:900 });
  await guest(page);
  await expect(page.locator('.quick-actions > button')).toHaveCount(3);
  await expect(page.locator('.quick-actions')).toContainText('Odaklan');
  await expect(page.locator('.quick-actions')).toContainText('Günlük yaz');
  await expect(page.locator('.quick-actions')).toContainText('Mescidim');
  const sidebar = page.getByRole('complementary',{name:'Ana navigasyon'});
  await expect(sidebar).toHaveCSS('width','260px');
  await page.getByRole('button',{name:'Menüyü daralt',exact:true}).click();
  await expect(sidebar).toHaveCSS('width','72px');
  await expect(sidebar.locator('.sidebar-legal')).toBeHidden();
  const journal = sidebar.getByRole('button',{name:'Günlük',exact:true});
  await journal.focus();
  expect(await journal.evaluate(el => getComputedStyle(el,'::after').content)).toContain('Günlük');
  await journal.click();
  await expect(page.locator('.journal-notebook')).toBeVisible();
  await page.reload(); await page.getByRole('button',{name:'DEV: Misafir görünümü'}).click();
  await expect(sidebar).toHaveCSS('width','72px');
  await expect(page.locator('.journal-notebook')).toBeVisible();
  await page.screenshot({path:info.outputPath('sidebar-collapsed.png')});
  await page.setViewportSize({width:375,height:812});
  await expect(sidebar).toBeHidden();
  await expect(page.locator('.mobile-nav')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Quran has three areas, legacy destinations and responsive dark/light layouts', async ({ page }, info) => {
  test.setTimeout(120_000);
  await guest(page,'/?view=quran-companion&tab=study');
  await expect(page.locator('.quran-companion-tabs [role=tab]')).toHaveCount(3);
  await expect(page.getByRole('tab',{name:'OKU',exact:true})).toHaveAttribute('aria-selected','true');
  for (const [legacy,label,section] of [['exercises','ÇALIŞ','#quran-exercises'],['progress','ÇALIŞ','#quran-progress'],['achievements','ÇALIŞ','#quran-achievements'],['teachers','TOPLULUK','#quran-teachers'],['appointments','TOPLULUK','#quran-appointments'],['peers','TOPLULUK','#quran-peers'],['home','OKU','#quran-study']]) {
    await page.evaluate(tab=>history.pushState(null,'','/?view=quran-companion&tab='+tab),legacy);
    await expect(page.getByRole('tab',{name:label,exact:true})).toHaveAttribute('aria-selected','true');
    await expect(page.locator(section)).toBeVisible();
  }
  for(const width of [375,620,900,1280]) {
    await page.setViewportSize({width,height:900});
    for(const theme of ['light','dark']) {
      await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
      if (theme === 'dark') await expect(page.getByRole('heading',{name:'Oku, çalış, birlikte ilerle.',exact:true})).toHaveCSS('color','rgb(226, 237, 230)');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({path:info.outputPath('quran-'+width+'-'+theme+'.png')});
    }
  }
});

test('reports present an honest comparison without fabricated activity', async ({ page }) => {
  await guest(page,'/?view=reports');
  await expect(page.locator('.report-comparative-insight')).toContainText('henüz bir adım bırakmadın');
});

for(const path of ['/focus','/?view=focus']) test('fresh focus starts in one click and preserves preferences: '+path,async({page},info)=>{
  if(path === '/focus') await page.goto(path); else await guest(page,path);
  await expect(page.getByRole('timer')).toContainText('25:00');
  await expect(page.locator('.focus-controls')).toHaveCount(0);
  await expect(page.locator('.focus-action-row button')).toHaveCount(1);
  await page.screenshot({path:info.outputPath('focus-first-open.png')});
  await page.getByRole('button',{name:'Zamanlayıcıyı başlat',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('timer')).not.toContainText('25:00');
  await expect(page.locator('.focus-controls button')).toHaveCount(3);
  await page.getByRole('button',{name:'Zamanlayıcıyı duraklat',exact:true}).click();
  const time = await page.getByRole('timer').locator('strong').innerText();
  await page.locator('.focus-controls button').nth(2).click();
  await page.getByRole('button',{name:'Yıldızlı Göl arka planı',exact:true}).click();
  await page.reload();
  if(path !== '/focus') await page.getByRole('button',{name:'DEV: Misafir görünümü'}).click();
  await expect(page.getByRole('timer').locator('strong')).toHaveText(time);
  await expect(page.locator('[data-scene="starry-night"]')).toBeVisible();
  await expect(page.locator('.focus-controls button')).toHaveCount(3);
});
