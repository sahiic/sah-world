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
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
