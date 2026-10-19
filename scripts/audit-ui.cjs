// Run against the DEV-ONLY guest server; never use production credentials.
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const routes = [
  ['dashboard', 'dashboard', '', '[data-growth-scene]'],
  ['reports', 'reports', '', '.reports-hero'],
  ['journal', 'journal', '', '.journal-notebook'],
  ['journal-history', 'journal', 'journal&journalPanel=history', '.journal-history'],
  ['journal-matrix', 'journal', 'matrix', '.journal-tool-panel'],
  ['journal-gratitude', 'journal', 'sukur', '.journal-tool-panel'],
  ['journal-lessons', 'journal', 'lessons', '.journal-tool-panel'],
  ['quran-read', 'quran-companion', 'oku', '.quran-companion'],
  ['quran-study', 'quran-companion', 'calis', '.quran-companion'],
  ['quran-community', 'quran-companion', 'topluluk', '.quran-companion'],
  ['quran-peers', 'quran-companion', 'peers', '.quran-companion'],
  ['quran-teachers', 'quran-companion', 'teachers', '.quran-companion'],
  ['mescidim', 'mescidim', '', '.mescidim-single-flow'],
  ['mosque-community', 'mescidim', 'etkinlikler', '.mosque-identity-hero'],
  ['awareness', 'awareness', '', '.awareness-experience'],
  ['profession', 'profession-school', '', '.profession-school'],
  ['community', 'community', '', '.community-view'],
  ['profile', 'profile', '', '#main-content'],
  ['growth', 'growth', '', '#main-content'],
  ['focus', 'focus', '', '[data-focus-studio]'],
];
const out = path.resolve('test-results/ux-audit-' + (process.argv[2] || 'before'));
fs.mkdirSync(out, { recursive: true });
const findings = [];
const baseURL = `http://localhost:${Number(process.env.SAH_E2E_PORT || 3011)}`;
(async () => {
 const browser = await chromium.launch();
 try {
 for (const width of [375, 1440]) {
  for (const theme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.name));
  await page.route('**/auth/v1/**', route => route.fulfill({json:{external:{google:true}}}));
  await page.route('**/rest/v1/**', route => route.fulfill({json:[]}));
  await page.goto(baseURL, {waitUntil:'domcontentloaded'});
  await page.getByRole('button', {name:'DEV: Misafir görünümü'}).waitFor();
  if (theme === 'light') await page.screenshot({path:path.join(out, `login-${width}.png`),fullPage:true});
  await page.getByRole('button', {name:'DEV: Misafir görünümü'}).click();
  await page.locator('[data-growth-scene]').waitFor();
   if (await page.locator('html').getAttribute('data-theme') !== theme) {
    await page.getByRole('button', {name:'Hesap menüsü'}).click();
    await page.getByRole('menuitem', {name: theme === 'dark' ? 'Gece görünümü' : 'Aydınlık görünüm'}).click();
   }
   for (const [name, view, tab, selector] of routes) {
    await page.evaluate(({view,tab}) => {history.pushState(null,'',`/?view=${view}${tab?'&tab='+tab:''}`);window.scrollTo(0,0);}, {view,tab});
    let ready = true;
    try {await page.locator(selector).first().waitFor({timeout:12000});} catch {ready=false;}
    await page.waitForTimeout(450);
    await page.evaluate(()=>window.scrollTo(0,0));
    const metrics = await page.evaluate(() => {
     const root = document.querySelector('#main-content') || document.body;
     const visible = el => {const r=el.getBoundingClientRect();return r.width>0 && r.height>0 && el.checkVisibility({visibilityProperty:true});};
     const label = el => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim().replace(/\s+/g,' ').slice(0,100);
     return {
      width: document.documentElement.scrollWidth, viewport:innerWidth, height:document.documentElement.scrollHeight,
      headings:[...root.querySelectorAll('h1,h2,h3')].filter(visible).map(e=>({tag:e.tagName,text:label(e),size:getComputedStyle(e).fontSize})),
      smallControls:[...root.querySelectorAll('button,a,input,select,summary')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.width<43.5||r.height<43.5;}).map(e=>({name:label(e),class:e.className,width:Math.round(e.getBoundingClientRect().width),height:Math.round(e.getBoundingClientRect().height)})).slice(0,35),
      unlabelled:[...root.querySelectorAll('button,input,select,textarea')].filter(visible).filter(e=>!label(e)&&!e.labels?.length&&!e.getAttribute('aria-labelledby')).map(e=>e.outerHTML.slice(0,180)),
      smallCopy:[...root.querySelectorAll('p')].filter(visible).filter(e=>parseFloat(getComputedStyle(e).fontSize)<14).map(e=>({text:label(e),size:getComputedStyle(e).fontSize,class:e.className})).slice(0,15),
     };
    });
    findings.push({name,width,theme,ready,...metrics,errors:errors.splice(0)});
    await page.screenshot({path:path.join(out,`${name}-${theme}-${width}.png`), fullPage: false});
    if (['dashboard','reports','profession','mescidim','quran-community'].includes(name)) await page.screenshot({path:path.join(out,`${name}-${theme}-${width}-full.png`),fullPage:true});
    console.log(`${width} ${theme} ${name}: ready=${ready}, overflow=${metrics.width>width}, small=${metrics.smallControls.length}, unnamed=${metrics.unlabelled.length}`);
    fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify(findings,null,2));
   }
  await page.close();
  }
 }
 } finally {
  await browser.close();
 }
 const failures = findings.filter(row => !row.ready || row.width > row.viewport || row.errors.length);
 console.log(`Audited ${findings.length} states; ${failures.length} failed layout/runtime checks.`);
 if (failures.length) process.exitCode = 1;
})().catch(e=>{console.error(e);process.exitCode=1;});
