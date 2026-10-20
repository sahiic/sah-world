// Read-only smoke check of a local production build (npm start -- --port 3012).
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch();
  const out = path.resolve('test-results/production-ui-smoke');
  fs.mkdirSync(out, { recursive: true });
  try {
    for (const width of [375, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.name));
      for (const route of ['/', '/focus', '/kesif']) {
        await page.goto(`http://localhost:3012${route}`, { waitUntil: 'domcontentloaded' });
        const ready = route === '/focus' ? page.locator('[data-focus-studio]') : page.getByRole('button', { name: 'Google ile devam et' });
        await ready.waitFor({ timeout: 30000 });
        await page.evaluate(() => document.fonts.ready);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        if (overflow || errors.length) throw new Error(`Public layout/runtime check failed: ${route}, ${width}`);
        await page.screenshot({ path: path.join(out, `${route === '/' ? 'login' : route.slice(1)}-${width}.png`), fullPage: true });
        console.log(`${route} ${width}px: loaded, no overflow, no runtime errors`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
