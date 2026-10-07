import { defineConfig, devices } from '@playwright/test';
const port = Number(process.env.SAH_E2E_PORT ?? 3010);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  // This suite requires its own isolated loopback backend and compiler.
  testIgnore: '**/quran-social.spec.ts',
  fullyParallel: false,
  // A single Next dev compiler serves all cases; avoid CPU-count based fan-out
  // starving lazy route compilation on developer machines and small CI runners.
  workers: 2,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL, channel: process.env.PW_USE_SYSTEM_CHROME ? 'chrome' : undefined, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  // Existing DEV-ONLY guest mode. These are UI/draft tests, NOT authenticated database tests.
  // Never add an auth bypass to production to make CI green.
  webServer: { command: `npm run dev -- --port ${port}`, env: { SAH_E2E: '1' }, url: baseURL, reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
