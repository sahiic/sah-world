import {test,expect} from '@playwright/test';

test('extracted note editor keeps verse and hadith field contracts',async({page})=>{
  await page.goto('/?view=quran-companion&tab=wheel&wisdom=archive');
  await page.getByRole('button',{name:'DEV: Misafir görünümü'}).click();
  await page.getByRole('button',{name:'Kur’an notu ekle'}).click();
  const form=page.locator('.wisdom-note-composer');
  await form.getByLabel('Sure',{exact:true}).fill('İnşirah');
  await form.getByLabel('Ayet / referans').fill('94:5-6');
  await form.getByLabel('Tefsir / not').fill('Sentetik test notu');
  await form.getByLabel('Hayata taşıyacağım ders').fill('Sentetik küçük adım');
  await form.getByRole('button',{name:'Güvenle kaydet'}).click();
  await expect(form).toHaveCount(0);
  await expect(page.locator('.wisdom-note-grid')).toContainText('Sentetik test notu');
  await page.getByRole('button',{name:'Hadis notu ekle'}).click();
  await form.getByLabel('Kaynak',{exact:true}).fill('Sentetik kaynak');
  await form.getByLabel('Konu',{exact:true}).fill('Sentetik konu');
  await form.getByLabel('Hadis metni / kısa not').fill('Sentetik hadis notu');
  await form.getByLabel('Hayata taşıyacağım ders').fill('Sentetik uygulama');
  await form.getByRole('button',{name:'Güvenle kaydet'}).click();
  await expect(page.locator('.wisdom-note-grid')).toContainText('Sentetik hadis notu');
  await page.getByRole('button',{name:'Kur’an notu ekle'}).click();
  await form.getByRole('button',{name:'Vazgeç'}).click();
  await expect(form).toHaveCount(0);
});
