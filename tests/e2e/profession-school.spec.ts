import { test, expect, type Page } from '@playwright/test';

async function openSchool(page: Page) {
  await page.goto('/?view=profession-school');
  await page.getByRole('button',{name:'DEV: Misafir görünümü'}).click();
  await expect(page.getByRole('heading',{name:'Meslek ve Ahlak Okulu',exact:true})).toBeVisible();
}

test('profession path preserves locking, reading, completion and reflection', async ({page}) => {
  await openSchool(page);
  await page.locator('.profession-track-grid button').filter({hasText:'Mühendis'}).click();
  const steps=page.locator('.lesson-path button');
  await expect(steps).toHaveCount(8);
  await steps.nth(1).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('önceki adımı');
  await steps.nth(0).click();
  const dialog=page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.lesson-sources a')).toHaveCount(1);
  await dialog.getByRole('textbox').fill('Bugün işimin kontrol listesini gözden geçireceğim.');
  await dialog.getByRole('button',{name:/Tamamladım/}).click();
  await expect(dialog).toHaveCount(0);
  await expect(steps.nth(0)).toHaveAttribute('aria-label',/tamamlandı/);
  await expect(steps.nth(1)).toHaveAttribute('aria-label',/açık/);
  await steps.nth(0).click();
  await expect(dialog.getByRole('textbox')).toHaveValue('Bugün işimin kontrol listesini gözden geçireceğim.');
  await expect(dialog.getByRole('button',{name:'Tamamlandı',exact:true})).toBeDisabled();
  await dialog.getByRole('button',{name:'Dersi kapat'}).click();
  await page.getByRole('button',{name:'Yansımalarım',exact:true}).click();
  await expect(page.locator('.reflection-card')).toHaveCount(1);
  await expect(page.locator('.reflection-note')).toHaveText('Bugün işimin kontrol listesini gözden geçireceğim.');
  await page.getByRole('button',{name:'Dersi yeniden oku'}).click();
  await expect(dialog.getByRole('textbox')).toHaveValue('Bugün işimin kontrol listesini gözden geçireceğim.');
  await dialog.getByRole('button',{name:'Dersi kapat'}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('eight completed lessons show an accessible reduced-motion certificate', async ({page},testInfo) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await openSchool(page);
  await page.locator('.profession-track-grid button').filter({hasText:'Avukat'}).click();
  await page.getByRole('button',{name:'Yansımalarım',exact:true}).click();
  await expect(page.locator('.reflection-empty')).toContainText('Henüz yansıma notu yazmadın');
  await page.getByRole('button',{name:'Ders yoluna dön'}).click();
  for(let i=0;i<8;i++){
    await page.locator('.lesson-path button').nth(i).click();
    await page.getByRole('dialog').getByRole('button',{name:/Tamamladım/}).click();
    if(i<7){
      await expect(page.locator('.lesson-reader')).toHaveCount(0);
      const milestone=page.getByRole('button',{name:'Bu anı karşıla'});
      if(await milestone.isVisible())await milestone.click();
    }
  }
  const certificate=page.getByRole('dialog',{name:'Meslek Ahlakı Sertifikası'});
  await expect(certificate).toBeVisible();
  await expect(certificate).toContainText('8 dersin tamamını');
  await expect(certificate).toContainText('240 XH');
  await expect(certificate).toContainText('Avukat');
  const bounds=await certificate.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await expect(page.getByRole('button',{name:'Sertifikayı kapat'})).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(certificate.getByRole('button',{name:'Yolculuğuma devam et'})).toBeFocused();
  await page.screenshot({path:testInfo.outputPath('profession-certificate.png')});
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.lesson-path .is-complete')).toHaveCount(8);
});
