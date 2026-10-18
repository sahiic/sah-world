import { test, expect, type Page } from '@playwright/test';

async function guest(page: Page, view = 'dashboard', theme = 'light') {
  await page.addInitScript(theme => localStorage.setItem('sah-theme-preference', theme), theme);
  await page.goto(`/?view=${view}`);
  await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
  await expect(page.locator('#main-content')).toBeVisible();
  if (theme === 'dark' && await page.locator('html').getAttribute('data-theme') !== 'dark') {
    await page.getByRole('button', {name:'Hesap menüsü'}).click();
    await page.getByRole('menuitem', {name:'Gece görünümü'}).click();
  }
}

test('skip link, arrow navigation and route focus work without a mouse', async ({ page }) => {
  await page.setViewportSize({width:1280,height:900});
  await guest(page);
  const skip = page.getByRole('link', {name:'İçeriğe geç'});
  await skip.focus(); await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter'); await expect(page.locator('#main-content')).toBeFocused();
  const buttons=page.locator('.sidebar-nav section button');
  await buttons.first().focus(); await page.keyboard.press('ArrowDown'); await expect(buttons.nth(1)).toBeFocused();
  await page.keyboard.press('End'); await expect(buttons.last()).toBeFocused();
  await page.keyboard.press('Home'); await expect(buttons.first()).toBeFocused();
  await page.locator('.sidebar-nav').getByRole('button',{name:'Günlük',exact:true}).press('Enter');
  await expect(page.locator('.journal-notebook')).toBeVisible();
  await expect(page.locator('#main-content')).toBeFocused();
  await expect(page.locator('.core-app > [aria-live=polite]')).toHaveAttribute('aria-atomic','true');
});

test('light and dark muted tokens meet AA contrast', async ({page}) => {
  await guest(page);
  for (const theme of ['light','dark']) {
    const ratio=await page.evaluate(theme => {
      document.documentElement.dataset.theme=theme;
      const root=document.querySelector('.core-app')!;
      const css=getComputedStyle(root);
      const sample=document.createElement('span'); root.appendChild(sample);
      const rgb=(color:string)=>{ sample.style.color=color;return getComputedStyle(sample).color.match(/[\d.]+/g)!.slice(0,3).map(Number); };
      const luminance=(c:number[])=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
      const fg=luminance(rgb(css.getPropertyValue('--core-muted')));
      const bg=luminance(rgb(css.getPropertyValue('--core-surface')));
      sample.remove();return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);
    },theme);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  }
});

test('dark journal and mosque stay readable across responsive breakpoints', async ({page},info) => {
  test.setTimeout(120_000);
  await guest(page,'journal','dark');
  await expect(page.locator('.journal-notebook')).toBeVisible();
  await expect(page.locator('.journal-workspace')).toHaveCSS('--j-paper','#172b22');
  for(const width of [375,620,900,1280]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.screenshot({path:info.outputPath('journal-dark.png')});
  await page.goto('/?view=mescidim');
  await page.getByRole('button',{name:'DEV: Misafir görünümü'}).click();
  if (await page.locator('html').getAttribute('data-theme') !== 'dark') {
    await page.getByRole('button', {name:'Hesap menüsü'}).click();
    await page.getByRole('menuitem', {name:'Gece görünümü'}).click();
  }
  const tabs=page.getByRole('tablist',{name:'Mescidim kapsamı'});
  await tabs.getByRole('tab',{name:'Kişisel alanım'}).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.getByRole('tab',{name:'Bursa Teknik Üniversitesi cami topluluğu'})).toBeFocused();
  await expect(page.getByRole('heading',{name:'Şehit Astsubay Ömer Halisdemir Camii'})).toBeVisible();
  await expect(page.locator('.mosque-identity-copy')).toHaveCSS('color','rgb(239, 250, 244)');
  for(const width of [375,620,900,1280]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.screenshot({path:info.outputPath('mosque-dark.png')});
});
