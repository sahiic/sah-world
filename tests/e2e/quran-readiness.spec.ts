import { expect, test, type Page } from "@playwright/test";
import {
  ORDERING_SURAHS,
  COMPLETION_QUESTIONS,
} from "../../src/lib/quranExercises";
const faults = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const list: string[] = [];
  faults.set(page, list);
  page.on("pageerror", (e) => list.push(e.message));
});
test.afterEach(({ page }) => expect(faults.get(page)).toEqual([]));
async function guest(page: Page, tab = "home") {
  await page.goto("/?view=quran-companion&tab=" + tab);
  await page.getByRole("button", { name: "DEV: Misafir görünümü" }).click();
  await expect(page.locator(".qc-ready")).toBeVisible();
  await expect(page.getByLabel("Sekme yükleniyor")).toHaveCount(0);
}
test("fresh guest has zero progress and no fabricated appointments or achievements", async ({
  page,
}, info) => {
  await guest(page);
  await expect(
    page.getByRole("heading", { name: "Bugün bir ayetle başla." }),
  ).toBeVisible();
  await expect(page.locator(".qc-streak-badge strong")).toHaveText("0");
  await expect(page.locator(".qc-hasanat-badge strong")).toHaveText("0");
  await page.screenshot({
    path: info.outputPath("quran-home.png"),
    fullPage: true,
  });
  await page
    .locator(".quran-companion-tabs")
    .getByRole("tab", { name: "TOPLULUK", exact: true })
    .click();
  await expect(page.getByText("Yaklaşan randevun yok")).toBeVisible();
  await page
    .locator(".quran-companion-tabs")
    .getByRole("tab", { name: "ÇALIŞ", exact: true })
    .click();
  await expect(page.locator(".qc-badge-grid article.earned")).toHaveCount(0);
});
test("completion, tajweed, meaning and letters each provide 8 explained answers and a single save", async ({
  page,
}) => {
  test.setTimeout(180000);
  await guest(page, "exercises");
  for (const label of [
    "Ayet Tamamlama",
    "Tecvid Tanıma",
    "Meal Eşleştirme",
    "Harf Tanıma",
  ]) {
    await page
      .locator(".qc-mode-card")
      .filter({ hasText: label })
      .click();
    for (let i = 1; i <= 8; i++) {
      await expect(
        page.getByText(`Soru ${i}/8`, { exact: true }),
      ).toBeVisible();
      const options = page.locator(".qc-option");
      expect(await options.count()).toBeGreaterThanOrEqual(4);
      await options.first().click();
      await expect(page.locator(".qc-exercise-feedback")).toBeVisible();
      await expect(options.first()).toBeDisabled();
      await page
        .getByRole("button", {
          name: i === 8 ? "Sonuçları gör" : "Sonraki soru",
          exact: true,
        })
        .click();
    }
    await expect(
      page.getByRole("region", { name: "Alıştırma sonucu" }),
    ).toBeVisible();
    await expect(page.locator(".qc-performance article").first()).toBeVisible();
    await page
      .getByRole("button", { name: "Sonucu kaydet", exact: true })
      .click();
    const badge = page.getByRole("dialog", { name: "Yeni başarım" });
    if (await badge.count())
      await badge.getByRole("button", { name: "Çalışmaya devam et" }).click();
    await expect(
      page.getByRole("button", { name: "Kaydedildi", exact: true }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Alıştırmalara dön", exact: true })
      .click();
  }
  await page
    .locator(".quran-companion-tabs")
    .getByRole("tab", { name: "ÇALIŞ", exact: true })
    .click();
  await expect(
    page.locator(".qc-badge-grid article.earned").first(),
  ).toBeVisible();
});
test("juz map includes cross-juz Bakara and progress can be set then reset", async ({
  page,
}, info) => {
  await guest(page, "progress");
  await expect(
    page.getByRole("button", { name: "2. Cüz: 0/111 ayet", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "2. Cüz: 0/111 ayet", exact: true })
    .click();
  await expect(page.locator(".qc-surah-cell")).toHaveCount(1);
  await expect(page.locator(".qc-surah-cell")).toContainText("Bakara");
  await expect(page.locator(".qc-surah-cell")).toContainText("142–252");
  await page.locator(".qc-surah-cell").click();
  const dialog = page.getByRole("dialog", { name: "Bakara ilerlemesi" });
  await dialog.getByLabel("Okuma durumu").selectOption("completed");
  await expect(
    dialog.getByRole("spinbutton", { name: "Okuduğum son ayet" }),
  ).toHaveValue("286");
  await dialog.getByLabel("Okuma durumu").selectOption("none");
  await expect(
    dialog.getByRole("spinbutton", { name: "Okuduğum son ayet" }),
  ).toHaveValue("0");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await page.getByLabel("Cüzlere göre grupla").check();
  await expect(page.locator('.qc-surah-group').getByRole("heading", { name: /^2\. Cüz/ })).toBeVisible();
  await page.screenshot({
    path: info.outputPath("quran-juz.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("ordering supports keyboard selection, undo and a verified perfect result", async ({
  page,
}) => {
  await guest(page, "exercises");
  await page
    .locator(".qc-mode-card")
    .filter({
      hasText: "Ayet Sıralama",
    })
    .click();
  const heading = await page.locator(".qc-exercise-active h2").innerText();
  const surah = ORDERING_SURAHS.find((s) => heading.startsWith(s.name + " ·"));
  expect(surah).toBeDefined();
  const pool = page.locator(".qc-ordering-pool");
  await pool.getByRole("button").first().focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".qc-ordered-verse")).toHaveCount(1);
  await page.getByRole("button", { name: "1. sıradaki ayeti geri al" }).click();
  await expect(pool.getByRole("button")).toHaveCount(surah!.verses.length);
  for (const verse of surah!.verses) {
    await pool.getByRole("button").filter({ hasText: verse.text }).click();
  }
  await page.getByRole("button", { name: "Sıralamayı kontrol et" }).click();
  await expect(
    page.locator(".qc-result-metrics article").first(),
  ).toContainText(`${surah!.verses.length}/${surah!.verses.length}`);
  await page
    .getByRole("button", { name: "Sonucu kaydet", exact: true })
    .click();
  const badge = page.getByRole("dialog", { name: "Yeni başarım" });
  if (await badge.count())
    await badge.getByRole("button", { name: "Çalışmaya devam et" }).click();
  await expect(
    page.getByRole("button", { name: "Kaydedildi", exact: true }),
  ).toBeDisabled();
});

test("saved wrong verses create real review items and self-rating advances each item", async ({
  page,
}) => {
  await guest(page, "exercises");
  await page
    .locator(".qc-mode-card")
    .filter({
      hasText: "Ayet Tamamlama",
    })
    .click();
  for (let i = 1; i <= 8; i++) {
    const text = (await page.locator(".qc-tajweed-text").innerText())
      .replace(/\s*…\s*$/, "")
      .trim();
    const question = COMPLETION_QUESTIONS.find((q) => q.start === text);
    expect(question).toBeDefined();
    const options = page.locator(".qc-option");
    const names = await options.allTextContents();
    const wrong = names.findIndex((name) => !name.includes(question!.answer));
    expect(wrong).toBeGreaterThanOrEqual(0);
    await options.nth(wrong).click();
    await page
      .getByRole("button", {
        name: i === 8 ? "Sonuçları gör" : "Sonraki soru",
        exact: true,
      })
      .click();
  }
  await page
    .getByRole("button", { name: "Sonucu kaydet", exact: true })
    .click();
  const badge = page.getByRole("dialog", { name: "Yeni başarım" });
  if (await badge.count())
    await badge.getByRole("button", { name: "Çalışmaya devam et" }).click();
  await page
    .getByRole("button", { name: "Alıştırmalara dön", exact: true })
    .click();
  await page
    .locator(".qc-mode-card")
    .filter({
      hasText: "Aralıklı Tekrar",
    })
    .click();
  await expect(page.locator(".qc-spaced-card")).toBeVisible();
  let count = 0;
  while (await page.locator(".qc-spaced-card").count()) {
    expect(count++).toBeLessThan(9);
    await page
      .getByRole("button", { name: "Metni aç ve kendimi değerlendir" })
      .click();
    await expect(page.locator(".qc-review-verses p").first()).toBeVisible();
    await page.getByRole("button", { name: /^İyi/ }).click();
  }
  await expect(
    page.getByRole("heading", { name: "Bekleyen tekrar yok." }),
  ).toBeVisible();
  await page
    .locator(".qc-exercise-active")
    .getByRole("button", { name: /Alıştırmalara dön/ })
    .click();
  await page
    .locator(".qc-mode-card")
    .filter({
      hasText: "Aralıklı Tekrar",
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Bekleyen tekrar yok." }),
  ).toBeVisible();
});
test("daily goals are memory-only for guests and leaderboard is never auto opted in", async ({
  page,
}) => {
  await guest(page, "study");
  await page.getByLabel("Çalışma niyetim").fill("Her gün beş ayet tekrarı");
  await page.getByLabel("Günlük ayet hedefi").fill("7");
  await page.getByRole("button", { name: "Hedefi kaydet" }).click();
  await expect(
    page.getByText("Hedefin yalnızca bu misafir oturumunda tutuluyor."),
  ).toBeVisible();
  await expect(
    page.getByLabel("Öğrenme puanımı anonim olarak paylaş"),
  ).not.toBeChecked();
  await expect(
    page.getByLabel("Öğrenme puanımı anonim olarak paylaş"),
  ).toBeDisabled();
  await page.reload();
  await page.getByRole("button", { name: "DEV: Misafir görünümü" }).click();
  await expect(page.getByLabel("Çalışma niyetim")).toHaveValue("");
});
test("teacher profile has honest empty feedback, and modal traps keyboard focus", async ({
  page,
}) => {
  await guest(page, "teachers");
  await page.getByRole("button", { name: "Profili incele" }).click();
  const dialog = page.getByRole("dialog", { name: /profili/ });
  await expect(dialog).toContainText("ÖRNEK PROFİL");
  await expect(dialog).toContainText("Özel ders notları burada yayımlanmaz.");
  await page.keyboard.press("Shift+Tab");
  expect(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
test("mobile dark/reduced-motion layouts have no horizontal overflow", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await guest(page);
  // Only local isolated app DOM styling; does not touch a user's browser session.
  await page.evaluate(() => (document.documentElement.dataset.theme = "dark"));
  for (const tab of [
    "home",
    "progress",
    "exercises",
    "study",
    "achievements",
  ]) {
    await page.evaluate(
      (tab) =>
        window.history.pushState(null, "", "/?view=quran-companion&tab=" + tab),
      tab,
    );
    await expect(page.locator(".quran-tab-transition")).toHaveCSS(
      "opacity",
      "1",
    );
    if (tab === "home") {
      const ratios = await page
        .locator(".qc-progress-stats article")
        .first()
        .evaluate((card) => {
          const luminance = (color: string) => {
            const rgb = color
              .match(/\d+(?:\.\d+)?/g)!
              .slice(0, 3)
              .map(Number);
            const linear = rgb.map((v) => {
              const s = v / 255;
              return s <= 0.04045
                ? s / 12.92
                : Math.pow((s + 0.055) / 1.055, 2.4);
            });
            return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
          };
          const background = luminance(getComputedStyle(card).backgroundColor);
          return Array.from(card.querySelectorAll("strong,span")).map((el) => {
            const foreground = luminance(getComputedStyle(el).color);
            return (
              (Math.max(background, foreground) + 0.05) /
              (Math.min(background, foreground) + 0.05)
            );
          });
        });
      for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      tab,
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath("quran-dark-" + tab + ".png"),
      fullPage: true,
    });
  }
});
