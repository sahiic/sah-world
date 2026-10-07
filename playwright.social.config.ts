import { defineConfig, devices } from "@playwright/test";
const backendPort = Number(process.env.SAH_SOCIAL_FIXTURE_PORT ?? 3116),
  port = Number(process.env.SAH_SOCIAL_TEST_PORT ?? 3016);
const fixtureURL = `http://127.0.0.1:${backendPort}`;
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "quran-social.spec.ts",
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    channel: process.env.PW_USE_SYSTEM_CHROME ? "chrome" : undefined,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: [
    {
      command: "node tests/fixtures/quran-social-backend.cjs",
      url: fixtureURL + "/health",
      reuseExistingServer: false,
      env: { SAH_SOCIAL_FIXTURE_PORT: String(backendPort) },
    },
    {
      command: `npm run dev -- --port ${port}`,
      url: `http://localhost:${port}`,
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        SAH_SOCIAL_E2E: "1",
        SAH_E2E: "1",
        NEXT_PUBLIC_SUPABASE_URL: fixtureURL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-placeholder-not-a-real-key",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          "fixture-placeholder-not-a-real-key",
      },
    },
  ],
});
