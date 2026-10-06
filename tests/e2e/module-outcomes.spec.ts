import { test, expect, type Page } from '@playwright/test';

const errors = new WeakMap<Page, string[]>();
test.beforeEach(({page}) => { const items:string[]=[]; errors.set(page,items); page.on('pageerror',error=>items.push(error.name)); });
test.afterEach(({page})=>{expect(errors.get(page)??[]).toEqual([]);});
async function guest(page:Page,url:string){await page.goto(url);await page.getByRole('button',{name:'DEV: Misafir görünümü'}).click();}

test('reports invite one concrete next action before stats and navigate to journal',async({page})=>{
  await guest(page,'/?view=reports');
  const card=page.locator('.report-next-step');
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading',{name:'Bugünden tek bir cümle sakla.'})).toBeVisible();
  await expect(card.getByRole('button')).toHaveCount(1);
  await card.getByRole('button',{name:'Günlüğümü aç'}).click();
  await expect(page).toHaveURL(/view=journal/);
  await expect(page.locator('.journal-notebook')).toBeVisible();
});

test('personal mosque is a single flow; deep links and local identity survive refresh and Back',async({page})=>{
  test.setTimeout(120_000);
  await guest(page,'/?view=mescidim');
  await expect(page.getByRole('heading',{name:'Kişisel manevi alanım',exact:true})).toBeVisible();
  await expect(page.locator('.mosque-identity-hero')).toHaveCount(0);
  await expect(page.locator('.mescidim-main-tabs')).toHaveCount(0);
  await expect(page.locator('.mescidim-single-flow')).toBeVisible();
  await page.locator('.mescidim-section-nav button').filter({hasText:'Dualar'}).click();
  await expect(page).toHaveURL(/tab=dua/);
  await page.reload();await page.getByRole('button',{name:'DEV: Misafir görünümü'}).click();
  await expect(page.locator('#mescidim-dua')).toBeVisible();
  await page.getByRole('tab',{name:'BTÜ cami topluluğu'}).click();
  await expect(page).toHaveURL(/tab=etkinlikler/);
  await expect(page.locator('.mosque-identity-hero')).toBeVisible();
  await expect(page.locator('.mescidim-main-tabs')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  await page.goBack();
  await expect(page).toHaveURL(/tab=dua/);
  await expect(page.locator('.mosque-identity-hero')).toHaveCount(0);
  await expect(page.locator('#mescidim-dua')).toBeVisible();
});

test('mosque selections stay compact, search the full library and preserve both kinds of favorites',async({page})=>{
  await guest(page,'/?view=mescidim');
  await expect(page.locator('.asma-card')).toHaveCount(6);
  await expect(page.locator('.dua-library-card')).toHaveCount(4);
  const asmaFavorite = page.locator('.asma-card-favorite').first();
  const asmaLabel = await asmaFavorite.getAttribute('aria-label');
  await asmaFavorite.click();
  const duaFavorite = page.locator('.dua-library-card header button').first();
  const duaLabel = await duaFavorite.getAttribute('aria-label');
  await duaFavorite.click();
  await page.getByRole('button',{name:'99 ismin tamamını göster'}).click();
  await expect(page.locator('.asma-card')).toHaveCount(99);
  await page.locator('#mescidim-asma').getByRole('button',{name:'Seçkiye dön'}).click();
  await expect(page.locator('.asma-card')).toHaveCount(6);
  await page.getByRole('textbox',{name:'Esmâ ara'}).fill('es-Sabûr');
  await expect(page.locator('.asma-card')).toHaveCount(1);
  await expect(page.locator('.asma-card h3')).toHaveText('es-Sabûr');
  await page.reload();
  await page.getByRole('button',{name:'DEV: Misafir görünümü'}).click();
  await expect(page.getByRole('button',{name:asmaLabel!,exact:true})).toHaveClass(/active/);
  await expect(page.getByRole('button',{name:duaLabel!,exact:true})).toHaveClass(/active/);
  await page.locator('.mescidim-section-nav button').filter({hasText:'Günün Esmâsı'}).click();
  await page.getByRole('button',{name:'Bugünün ismini tefekkür et'}).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading').first()).toBeInViewport();
  const bounds = await dialog.boundingBox();
  expect(bounds?.y).toBe(0);
  expect(bounds?.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await dialog.getByRole('button',{name:'Kapat',exact:true}).click();
  await expect(dialog).toHaveCount(0);
});
