import { expect, test, type Page } from "@playwright/test";

// Existing settings/mixer regression cases represent returning users.
// A separate phase-two suite covers the genuinely fresh one-button entry.
test.beforeEach(async ({ page }, testInfo) => {
  // This case supplies its own nearly-complete session and must seed it first.
  if (testInfo.title.startsWith("large chart stays")) return;
  await page.addInitScript(() => {
    if (!localStorage.getItem("sah-focus-sanctuary-v1"))
      localStorage.setItem("sah-focus-sanctuary-v1", JSON.stringify({ version: 1, state: { recentNiyets: ["Önceki çalışma"] } }));
  });
});

test('quota failure does not rewind a running clock and recovers after storage works',async({page})=>{
  await page.addInitScript(()=>{
    const original=Storage.prototype.setItem;
    (window as unknown as {focusQuota:boolean}).focusQuota=false;
    Storage.prototype.setItem=function(key,value){if(key==='sah-focus-sanctuary-v1' && (window as unknown as {focusQuota:boolean}).focusQuota)throw new DOMException('quota','QuotaExceededError');return original.call(this,key,value);};
  });
  await openFocus(page);
  await page.getByRole('textbox',{name:'Odak görevi',exact:true}).fill('Depolama testi');
  await page.getByRole('button',{name:'Ekle',exact:true}).click();
  await page.evaluate(()=>(window as unknown as {focusQuota:boolean}).focusQuota=true);
  await page.getByRole('button',{name:'Zamanlayıcıyı başlat'}).click();
  await expect(page.getByRole('status')).toContainText('kaydedilemiyor');
  await expect(page.getByRole('timer')).not.toContainText('25:00');
  await page.waitForTimeout(2100);
  await expect(page.getByRole('timer')).not.toContainText('25:00');
  await page.evaluate(()=>(window as unknown as {focusQuota:boolean}).focusQuota=false);
  await page.getByRole('button',{name:'Zamanlayıcıyı duraklat'}).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  const paused=await page.getByRole('timer').locator('strong').textContent();
  await page.reload();await expect(page.getByRole('timer').locator('strong')).toHaveText(paused!);
});

async function openFocus(page: Page, route = "/focus") {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  if (route !== "/focus")
    await page.getByRole("button", { name: "DEV: Misafir görünümü" }).click();
  await expect(
    page.getByRole("heading", { name: "Bir işe alan aç." }),
  ).toBeVisible();
}

for (const route of ["/?view=focus", "/focus"]) {
  test(`${route}: eight real scenes, three settings, responsive history and sound library`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await openFocus(page, route);
    await expect(
      page.locator('[data-focus-studio="sanctuary-v2"]'),
    ).toBeVisible();
    await expect(page.locator(".focus-controls > button")).toHaveCount(3);
    await page
      .getByRole("button", { name: "50 dk Derin çalışma", exact: true })
      .click();
    await expect(page.getByRole("timer")).toContainText("50:00");
    const stage = await page.locator(".focus-timer-stage").boundingBox();
    expect(
      Math.abs(stage!.x + stage!.width / 2 - page.viewportSize()!.width / 2),
    ).toBeLessThan(2);
    for (const [name, id] of [
      ["Kâbe", "kaaba-night"],
      ["Mescid-i Nebevî", "masjid-nabawi"],
      ["Mescid-i Aksâ", "masjid-aqsa"],
      ["Şam Emevî Camii", "umayyad-mosque"],
      ["Kıyı", "ocean-waves"],
      ["Yıldızlı Göl", "starry-night"],
      ["Orman", "nature-forest"],
      ["Sade", "none"],
    ]) {
      await page.locator(".focus-controls > button").nth(2).click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: `${name} arka planı`, exact: true })
        .click();
      await expect(page.locator(`[data-scene="${id}"]`)).toHaveCount(1);
      if (id !== "none")
        await expect
          .poll(() =>
            page
              .locator(`[data-scene="${id}"] img`)
              .evaluate(
                (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
              ),
          )
          .toBe(true);
    }
    await page.reload();
    if (route !== "/focus")
      await page.getByRole("button", { name: "DEV: Misafir görünümü" }).click();
    await expect(page.locator('[data-scene="none"]')).toHaveCount(1);
    await page.getByRole("button", { name: "Geçmişim", exact: true }).click();
    await expect(page.getByRole("timer")).toHaveCount(0);
    for (const bar of await page.locator('svg[role="img"]').all())
      expect((await bar.boundingBox())!.height).toBeLessThanOrEqual(121);
    await page.getByRole("button", { name: "Oturum", exact: true }).click();
    await page.locator(".focus-controls > button").nth(1).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("slider")).toHaveCount(16);
    await dialog
      .getByRole("button", { name: "Yağmur sesini aç", exact: true })
      .click();
    await expect(
      dialog.getByRole("button", { name: "Yağmur sesini kapat", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await dialog.getByRole("button", { name: "Tüm sesleri kapat" }).click();
    await expect(
      dialog.getByRole("button", { name: "Yağmur sesini aç", exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    expect(errors).toEqual([]);
  });
}

test("one clock survives exit, reload, pause, cross-tab and partial completion", async ({
  page,
  context,
}) => {
  await openFocus(page, "/?view=focus");
  await page
    .getByRole("textbox", { name: "Odak görevi", exact: true })
    .fill("Örnek odak testi");
  await page.getByRole("button", { name: "Ekle", exact: true }).click();
  await page
    .getByRole("button", { name: "Zamanlayıcıyı başlat", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Şimdi, yalnızca bu an." }),
  ).toBeVisible();
  await expect(page.locator(".focus-controls > button").first()).toBeEnabled();
  await expect(page.getByRole("timer")).not.toContainText("25:00");
  await page.getByRole("button", { name: "Odak ekranını küçült" }).click();
  const mini = page.locator("[data-focus-mini]");
  await expect(mini).toBeVisible();
  await expect(mini).toContainText("Örnek odak testi");
  await mini.getByRole("button", { name: "Duraklat", exact: true }).click();
  const paused = await mini.locator("strong").textContent();
  await page.reload();
  await expect(mini).toBeVisible();
  await expect(mini.locator("strong")).toHaveText(paused!);
  const second = await context.newPage();
  await second.goto("/focus");
  await expect(second.getByRole("timer")).toContainText(paused!);
  await page.waitForTimeout(1200);
  await expect(mini.locator("strong")).toHaveText(paused!);
  await mini.getByRole("button", { name: "Devam et", exact: true }).click();
  await expect(second.getByRole("timer")).not.toContainText(paused!);
  await expect(
    second.locator(".focus-controls > button").first(),
  ).toBeEnabled();
  second.once("dialog", (dialog) => dialog.accept());
  await second.getByRole("button", { name: "Oturumu bitir ve kaydet" }).click();
  await expect(mini).toHaveCount(0);
  await second.getByRole("button", { name: "Geçmişim", exact: true }).click();
  await expect(
    second.getByText("Kısmi oturum", { exact: false }),
  ).toBeVisible();
  await expect(
    second.getByText("Örnek odak testi", { exact: true }),
  ).toBeVisible();
});

test("large chart stays in its card; completion survives navigation and is saved once", async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("sah-focus-sanctuary-v1")) return;
    const now = Date.now();
    localStorage.setItem(
      "sah-focus-sanctuary-v1",
      JSON.stringify({
        version: 1,
        state: {
          currentNiyet: "Tamamlama testi",
          sessionStartTime: new Date(now - 1499000).toISOString(),
          lastTickAt: now,
          timeLeft: 1,
          totalTime: 1500,
          isRunning: true,
          sessions: [
            {
              id: "large-fixture",
              startTime: new Date(now - 86400000).toISOString(),
              endTime: new Date(now - 86400000).toISOString(),
              duration: 10000,
              mode: "focus",
              completed: true,
              niyet: "Grafik sınır testi",
              tags: [],
            },
          ],
        },
      }),
    );
  });
  await page.goto("/focus");
  await expect(page.getByRole("dialog")).toContainText("25 dakika");
  const other = await context.newPage();
  await other.goto("/focus");
  await expect(other.getByRole("dialog")).toContainText("25 dakika");
  await page.getByRole("button", { name: "Bitir", exact: true }).click();
  await expect(other.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Geçmişim", exact: true }).click();
  await expect(page.getByText("Tamamlama testi", { exact: true })).toHaveCount(
    1,
  );
  const chart = page.locator('[aria-label="Haftalık odaklanma grafiği"]');
  expect((await chart.boundingBox())!.height).toBeLessThanOrEqual(180);
  for (const rect of await chart.locator("svg rect").all())
    expect(Number(await rect.getAttribute("height"))).toBeLessThanOrEqual(120);
  await page
    .getByRole("textbox", { name: "Odak geçmişinde ara" })
    .fill("Grafik sınır");
  await expect(
    page.getByText("Grafik sınır testi", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Tamamlama testi", { exact: true })).toHaveCount(
    0,
  );
});

test("every sound generates an actual signal; mute releases audio channels", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    class Probe extends Native {
      createGain() {
        const gain = super.createGain(),
          analyser = super.createAnalyser();
        gain.connect(analyser);
        const probe = window as unknown as { focusAudioProbe?: AnalyserNode };
        if (!probe.focusAudioProbe) probe.focusAudioProbe = analyser;
        return gain;
      }
    }
    window.AudioContext = Probe;
  });
  await openFocus(page);
  await page.locator(".focus-controls > button").nth(1).click();
  const dialog = page.getByRole("dialog");
  const names = [
    "Yağmur",
    "Hafif yağmur",
    "Kuş sesleri",
    "Rüzgâr",
    "Okyanus",
    "Şömine",
    "Orman",
    "Dere",
    "Şelale",
    "Gece bahçesi",
    "Beyaz gürültü",
    "Kahverengi gürültü",
    "Pembe gürültü",
    "Vantilatör",
    "Tren ritmi",
  ];
  const rms = () =>
    page.evaluate(() => {
      const node = (window as unknown as { focusAudioProbe: AnalyserNode })
        .focusAudioProbe;
      const data = new Float32Array(node.fftSize);
      node.getFloatTimeDomainData(data);
      return Math.sqrt(data.reduce((sum, x) => sum + x * x, 0) / data.length);
    });
  for (const name of names) {
    await dialog
      .getByRole("button", { name: `${name} sesini aç`, exact: true })
      .click();
    await expect
      .poll(rms, { message: `${name} generates nonzero audio` })
      .toBeGreaterThan(0.00001);
    await dialog
      .getByRole("button", { name: `${name} sesini kapat`, exact: true })
      .click();
    await expect.poll(rms).toBeLessThan(0.000001);
  }
});
