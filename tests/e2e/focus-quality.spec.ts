import { expect, test } from "@playwright/test";

// Existing settings/mixer regression cases represent returning users.
// A separate phase-two suite covers the genuinely fresh one-button entry.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("sah-focus-sanctuary-v1"))
      localStorage.setItem("sah-focus-sanctuary-v1", JSON.stringify({ version: 1, state: { recentNiyets: ["Önceki çalışma"] } }));
  });
});

test("leaving fullscreen restores the dashboard and keeps the active timer", async ({ page }) => {
  await page.route('**/auth/v1/**', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ external: { google: true } }),
  }));
  await page.route('**/rest/v1/**', route => route.fulfill({
    status: 200, contentType: 'application/json', body: '[]',
  }));
  await page.goto('/?view=focus');
  await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
  await page.getByRole('button', { name: 'Zamanlayıcıyı başlat', exact: true }).click();
  await page.getByRole('button', { name: 'Tam ekranı aç veya kapat' }).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await page.getByRole('button', { name: 'Odak modundan çık', exact: true }).click();
  await expect(page).toHaveURL(/view=dashboard/);
  await expect(page.locator('.dashboard-view')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
  const mini = page.getByRole('complementary', { name: 'Devam eden odak oturumu' });
  await expect(mini).toBeVisible();
  await expect(mini.getByRole('button', { name: 'Duraklat', exact: true })).toBeVisible();
});

test("session and sound library remain readable on compact screens", async ({ page }, testInfo) => {
  await page.setViewportSize(testInfo.project.name === "mobile" ? { width: 390, height: 700 } : { width: 1280, height: 720 });
  await page.goto("/focus");
  await expect(page.locator('[data-scene="kaaba-night"] img')).toBeVisible();
  await expect.poll(() => page.locator('[data-scene="kaaba-night"] img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  const action = await page.getByRole("button", { name: "Zamanlayıcıyı başlat" }).boundingBox();
  expect(action!.y + action!.height).toBeLessThan(page.viewportSize()!.height);
  await page.screenshot({ path: testInfo.outputPath("focus-session.png"), fullPage: true });
  await page.locator(".focus-controls > button").nth(1).click();
  await expect(page.getByRole("radiogroup", { name: "Doğal arka plan kayıtları" })).toBeVisible();
  await expect(page.getByRole("button", { name: /sesini (aç|kapat)$/ })).toHaveCount(7);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({ path: testInfo.outputPath("focus-sounds.png"), fullPage: true });
});

test("draft survives history and starts directly; pause preserves settings and does not request notifications", async ({ page }) => {
  await page.addInitScript(() => {
    const probe = window as unknown as { notificationRequests: number };
    probe.notificationRequests = 0;
    Notification.requestPermission = async () => { probe.notificationRequests++; return "denied"; };
  });
  await page.goto("/focus");
  await page.getByRole("textbox", { name: "Odak görevi", exact: true }).fill("Tek adımda başlat");
  await page.getByRole("button", { name: "Geçmişim", exact: true }).click();
  await page.getByRole("button", { name: "Oturum", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Odak görevi", exact: true })).toHaveValue("Tek adımda başlat");
  await page.getByRole("button", { name: "Zamanlayıcıyı başlat", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("timer")).not.toContainText("25:00");
  await expect(page.locator(".focus-task-chip")).toHaveText("Tek adımda başlat");
  expect(await page.evaluate(() => (window as unknown as { notificationRequests: number }).notificationRequests)).toBe(0);
  await page.getByRole("button", { name: "Zamanlayıcıyı duraklat", exact: true }).click();
  await expect(page.getByRole("timer")).toContainText("Duraklatıldı");
  const time = await page.getByRole("timer").locator("strong").innerText();
  await page.getByRole("button", { name: "Zamanlayıcı 25 dk", exact: true }).click();
  await expect(page.getByRole("button", { name: "Serbest Sayaç", exact: true })).toBeDisabled();
  await page.getByRole("checkbox", { name: /Molayı otomatik başlat/ }).check();
  await page.getByRole("button", { name: "Bildirimleri aç", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("tarayıcı ayarlarında engelli");
  expect(await page.evaluate(() => (window as unknown as { notificationRequests: number }).notificationRequests)).toBe(1);
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.getByRole("timer").locator("strong")).toHaveText(time);
  await expect(page.getByRole("timer")).toContainText("Duraklatıldı");
});

test("natural recordings stay single-select and mute persists without erasing the choice", async ({ page }) => {
  await page.goto("/focus");
  await page.getByRole("button", { name: "Arka Plan Sesi Sessiz", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Yağmur sesini aç", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Yağmur sesini kapat", exact: true })).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("button", { name: "Okyanus sesini aç", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Yağmur sesini aç", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(dialog.getByRole("button", { name: "Okyanus sesini kapat", exact: true })).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("button", { name: "Sessize al", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: "Arka Plan Sesi Sessize alındı", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Okyanus sesini kapat", exact: true })).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("button", { name: "Sesi geri aç", exact: true }).click();
  await dialog.getByRole("button", { name: "Sesi kapat", exact: true }).click();
  await expect(dialog.getByRole("button", { name: /sesini kapat$/ })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: /sesini aç$/ })).toHaveCount(7);
  await expect(dialog.getByRole("button", { name: "Dinlemeyi aç" })).toHaveCount(0);
});

test("stopwatch has no rounds or break skip and compact layout keeps controls usable", async ({ page }, testInfo) => {
  await page.goto("/focus");
  await page.getByRole("button", { name: "Sonraki oturum türüne geç" }).click();
  await page.locator(".focus-controls > button").first().click();
  await page.getByRole("button", { name: "Serbest Sayaç", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("timer")).toContainText("00:00");
  await expect(page.getByRole("timer")).toContainText("Serbest çalışma");
  await expect(page.getByRole("button", { name: "Sonraki oturum türüne geç" })).toHaveCount(0);
  await expect(page.getByLabel("Tur 1 / 4", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  const start = await page.getByRole("button", { name: "Zamanlayıcıyı başlat" }).boundingBox();
  expect(start!.y + start!.height).toBeLessThan(page.viewportSize()!.height);
  await page.screenshot({ path: testInfo.outputPath("focus-quality.png"), fullPage: true });
});
