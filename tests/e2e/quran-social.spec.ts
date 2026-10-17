import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
const student = "11111111-1111-4111-8111-111111111111",
  teacher = "22222222-2222-4222-8222-222222222222",
  queueUser = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  queuePartner = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const fixtureURL = `http://127.0.0.1:${process.env.SAH_SOCIAL_FIXTURE_PORT ?? 3116}`;
async function login(page: Page, id = student, tab = "peers") {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = [
    { alg: "HS256", typ: "JWT" },
    { sub: id, aud: "authenticated", exp },
    "fixture-signature",
  ]
    .map((x, i) =>
      i === 2 ? x : Buffer.from(JSON.stringify(x)).toString("base64url"),
    )
    .join(".");
  const session = {
    access_token: token,
    refresh_token: "fixture-only-refresh",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: exp,
    user: {
      id,
      email: "fixture@example.invalid",
      aud: "authenticated",
      role: "authenticated",
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
    },
  };
  await page.context().addCookies([
    {
      name: "sb-127-auth-token",
      value:
        "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"),
      url: "http://localhost",
      sameSite: "Lax",
    },
  ]);
  await page.goto(`/?view=quran-companion&tab=${tab}`);
  await expect(page.locator(".qc-community-shortcuts")).toBeVisible();
}
test.beforeEach(async ({ request }) => {
  await request.get(fixtureURL + "/reset");
});

test('V2 onboarding, discovery, queue consent and responsive layout', async ({page},testInfo)=>{
  await page.setViewportSize({width:testInfo.project.name==='mobile'?375:1440,height:900});
  await login(page,queueUser);
  const area=page.locator('.peer-v2').first();
  await area.getByRole('button',{name:'Profilimi oluştur',exact:true}).click();
  const form=page.getByRole('region',{name:'Eşleşme profili'});
  await form.getByRole('button',{name:'Devam et',exact:true}).click();
  await form.getByRole('button',{name:'Devam et',exact:true}).click();
  await form.getByRole('checkbox',{name:'Pazartesi',exact:true}).check();
  await form.getByRole('button',{name:'Devam et',exact:true}).click();
  await form.getByLabel('Kısa tanıtım').fill('Her hafta birlikte okumak istiyorum.');
  await form.getByRole('checkbox',{name:/profilimi diğer/}).check();
  await form.getByRole('button',{name:'Profilimi kaydet',exact:true}).click();
  await expect(area.getByText('Uyumlu Kardeş',{exact:true})).toBeVisible();
  await area.getByRole('button',{name:'Uyumlu kardeş bul',exact:true}).click();
  await expect(area.getByRole('button',{name:'Aramayı durdur',exact:true})).toBeVisible();
  await expect(area.getByRole('button',{name:'Tanışma isteği gönder',exact:true})).toBeEnabled();
  await area.getByRole('button',{name:'Aramayı durdur',exact:true}).click();
  await expect(area.getByRole('button',{name:'Uyumlu kardeş bul',exact:true})).toBeEnabled();
  await area.scrollIntoViewIfNeeded();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('peer-light.png'),fullPage:true});
  await page.emulateMedia({colorScheme:'dark'});
  await page.screenshot({path:testInfo.outputPath('peer-dark.png'),fullPage:true});
});

test('V2 preserves existing peer chat and shared workspace',async({page})=>{
  await login(page);
  await page.locator('.peer-tabs').getByRole('button',{name:/Kardeşliğim/}).click();
  await expect(page.locator('.peer-session').first()).toBeVisible();
  await page.locator('.peer-active').first().getByRole('button',{name:/Mesajlaş/}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

async function requestWhileQueued(page: Page) {
  await login(page, queueUser);
  await page.getByRole('button', {name:'Profilimi oluştur',exact:true}).click();
  const form=page.getByRole('region',{name:'Eşleşme profili'});
  await form.getByRole('button',{name:'Devam et',exact:true}).click();
  await form.getByRole('button',{name:'Devam et',exact:true}).click();
  await form.getByRole('checkbox',{name:'Pazartesi',exact:true}).check();
  await form.getByRole('button',{name:'Devam et',exact:true}).click();
  await form.getByLabel('Kısa tanıtım').fill('Birlikte düzenli okumak istiyorum.');
  await form.getByRole('checkbox',{name:/profilimi diğer/}).check();
  await form.getByRole('button',{name:'Profilimi kaydet',exact:true}).click();
  await page.getByRole('button',{name:'Uyumlu kardeş bul',exact:true}).click();
  await expect(page.getByRole('button',{name:'Aramayı durdur',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Tanışma isteği gönder',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Kur’an kardeşliği isteği'});
  await expect(dialog).toContainText('İstek gönderildiğinde otomatik arama durur');
  await dialog.getByRole('textbox',{name:/Tanışma notun/}).fill('Haftada iki gün birlikte okuyalım.');
  await dialog.getByRole('button',{name:'İstek gönder',exact:true}).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('.peer-request')).toContainText('Yanıt bekleniyor');
}

test('queued discovery request becomes a shared workspace only after recipient accepts',async({page,browser})=>{
  await requestWhileQueued(page);
  await expect(page.locator('.peer-active')).toHaveCount(0);
  const recipient=await browser.newPage();
  await login(recipient,queuePartner);
  await expect(recipient.locator('.peer-request')).toContainText('Haftada iki gün birlikte okuyalım.');
  await recipient.getByRole('button',{name:'Kabul et',exact:true}).click();
  await expect(recipient.locator('.peer-active')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.peer-active')).toHaveCount(1);
  await expect(page.locator('.peer-session').first()).toBeVisible();
  await recipient.close();
});

test('sender can withdraw a pending request and resume automatic search',async({page})=>{
  await requestWhileQueued(page);
  await page.getByRole('button',{name:'İsteği geri çek',exact:true}).click();
  await expect(page.getByText('İsteğin geri çekildi. Yeni bir kardeş arayabilirsin.',{exact:true})).toBeVisible();
  await page.locator('.peer-tabs').getByRole('button',{name:'Keşfet',exact:true}).click();
  await page.getByRole('button',{name:'Uyumlu kardeş bul',exact:true}).click();
  await expect(page.getByRole('button',{name:'Aramayı durdur',exact:true})).toBeVisible();
});

test("private Presence shows typing only after opt-in and stops on opt-out", async ({
  page,
}) => {
  const tracks: Array<{ typing?: boolean; userId?: string }> = [];
  await page.routeWebSocket(/\/realtime\/v1\/websocket/, (ws) => {
    ws.onMessage((message) => {
      const packet = JSON.parse(message.toString()) as [
        string | null,
        string,
        string,
        string,
        {
          config?: {
            private?: boolean;
            postgres_changes?: Array<Record<string, unknown>>;
          };
          event?: string;
          payload?: { typing?: boolean; userId?: string };
        },
      ];
      const [joinRef, ref, topic, event, payload] = packet;
      if (event === "phx_join") {
        ws.send(
          JSON.stringify([
            joinRef,
            ref,
            topic,
            "phx_reply",
            {
              status: "ok",
              response: {
                postgres_changes: (payload.config?.postgres_changes ?? []).map(
                  (binding, i) => ({ ...binding, id: i + 1 }),
                ),
              },
            },
          ]),
        );
        if (payload.config?.private) {
          ws.send(
            JSON.stringify([
              joinRef,
              null,
              topic,
              "presence_state",
              {
                teacher: {
                  metas: [
                    {
                      phx_ref: "fixture-partner",
                      userId: teacher,
                      typing: true,
                      typingAt: Date.now(),
                    },
                  ],
                },
              },
            ]),
          );
        }
      } else {
        if (event === "presence" && payload.event === "track")
          tracks.push(payload.payload ?? {});
        ws.send(
          JSON.stringify([
            joinRef,
            ref,
            topic,
            "phx_reply",
            { status: "ok", response: {} },
          ]),
        );
      }
    });
  });
  await login(page, student, "appointments");
  await page.getByRole("checkbox", { name: /Çevrimiçi durumumu/ }).check();
  await page
    .locator(".appointment-list article")
    .filter({ hasText: "Fâtiha · birinci ders" })
    .getByRole("button", { name: /Mesajlaş/ })
    .click();
  const dialog = page.getByRole("dialog", { name: /randevu mesajlaşması/ });
  await expect(dialog.getByText("Örnek Hoca yazıyor…")).toBeVisible();
  await dialog.getByPlaceholder("Mesajını yaz…").fill("Hazırlanıyorum");
  await expect
    .poll(() => tracks.some((p) => p.typing && p.userId === student))
    .toBe(true);
  await dialog.getByRole("button", { name: "Mesajlaşmayı kapat" }).click();
  await page.getByRole("checkbox", { name: /Çevrimiçi durumumu/ }).uncheck();
  await page
    .locator(".appointment-list article")
    .filter({ hasText: "Fâtiha · birinci ders" })
    .getByRole("button", { name: /Mesajlaş/ })
    .click();
  await expect(dialog.getByText("Örnek Hoca yazıyor…")).not.toBeVisible();
});

test("rescheduling uses the atomic RPC and calendar export contains no private notes", async ({
  page,
}) => {
  await login(page, student, "appointments");
  const card = page
    .locator(".appointment-list article")
    .filter({ hasText: "Fâtiha · birinci ders" });
  const download = page.waitForEvent("download");
  await card.getByRole("button", { name: "Takvime ekle" }).click();
  const calendar = await download;
  expect(calendar.suggestedFilename()).toMatch(/^kuran-randevu-\d{4}-\d{2}-\d{2}\.ics$/);
  const calendarText = await readFile((await calendar.path())!, "utf8");
  expect(calendarText).toContain("BEGIN:VCALENDAR");
  expect(calendarText).toContain("DTSTART:");
  expect(calendarText).not.toContain("Öğrencinin karşılıklı özel notu");
  expect(calendarText).not.toContain("İkinci dersin özel mesajı");
  await card.getByRole("button", { name: "Yeniden planla" }).click();
  const modal = page.getByRole("dialog", { name: "Örnek Hoca randevu" });
  await expect(
    modal.getByText(/Yeni saat onaylanana kadar mevcut ders korunur/),
  ).toBeVisible();
  await expect(
    modal.locator(".booking-days button:not([disabled])"),
  ).toHaveCount(1);
  await modal.locator(".booking-days button:not([disabled])").click();
  await modal.locator(".slot-list button").click();
  await modal.getByRole("button", { name: "Yeni saati onayla" }).click();
  await expect(modal).not.toBeVisible();
  await expect(page.getByText("Dersin yeni saati onaylandı.")).toBeVisible();
});
test("peer request uses a bounded modal, updates timeline and badges without prompt", async ({
  page,
}) => {
  let prompt = false;
  page.on("dialog", () => {
    prompt = true;
  });
  await login(page, queueUser);
  await expect(
    page
      .locator(".qc-community-shortcuts")
      .getByRole("link", { name: /Kur’an Kardeşi/ })
      .locator(".qc-nav-badge"),
  ).toHaveCount(0);
  await page.locator('.peer-legacy summary').click();
  const helper = page
    .locator(".peer-legacy article")
    .filter({ hasText: "Yeni Destekçi" });
  await helper.getByRole("button", { name: "İstek gönder" }).click();
  const modal = page.getByRole("dialog", { name: "Kur’an kardeşliği isteği" });
  await expect(modal).toBeVisible();
  await modal
    .getByRole("textbox", { name: /Tanışma notun/ })
    .fill("İhlâs suresini birlikte çalışalım.");
  await modal.getByRole("button", { name: "İstek gönder" }).click();
  await expect(modal).not.toBeVisible();
  await expect(
    page
      .locator(".peer-matches")
      .getByText("İhlâs suresini birlikte çalışalım."),
  ).toBeVisible();
  expect(prompt).toBe(false);
});

test("opt-in Quran queue pairs two waiting people once and lets a participant leave", async ({
  browser,
}) => {
  const first = await browser.newPage();
  const second = await browser.newPage();
  await login(first, queueUser);
  await first.getByRole('button',{name:'Profilimi oluştur',exact:true}).click();
  const form=first.getByRole('region',{name:'Eşleşme profili'});
  await form.getByRole('button',{name:'Devam et',exact:true}).click();
  await form.getByRole('button',{name:'Devam et',exact:true}).click();
  await form.getByRole('checkbox',{name:'Pazartesi',exact:true}).check();
  await form.getByRole('button',{name:'Devam et',exact:true}).click();
  await form.getByLabel('Kısa tanıtım').fill('Her hafta birlikte okumak istiyorum.');
  await form.getByRole('checkbox',{name:/profilimi diğer/}).check();
  await form.getByRole('button',{name:'Profilimi kaydet',exact:true}).click();
  await first.getByRole("button", { name: "Uyumlu kardeş bul",exact:true }).click();
  await expect(first.getByText('Uyumlu kardeşin aranıyor',{exact:true})).toBeVisible();
  await expect(first.getByRole("button", { name: "Aramayı durdur" })).toBeVisible();

  await login(second, queuePartner);
  await second.getByRole("button", { name: "Uyumlu kardeş bul",exact:true }).click();
  await second.locator('.peer-tabs').getByRole('button',{name:/Kardeşliğim/}).click();
  await expect(second.locator('.peer-active').getByRole("button", { name: /Mesajlaş/ })).toBeVisible();

  await first.reload();
  await first.locator('.peer-tabs').getByRole('button',{name:/Kardeşliğim/}).click();
  await expect(first.locator(".peer-active")).toHaveCount(1);
  first.once("dialog", (dialog) => void dialog.accept());
  await first.locator(".peer-active").getByRole("button", { name: "Kardeşliği sonlandır" }).click();
  await expect(first.getByText("Eşleşme sonlandırıldı.",{exact:true})).toBeVisible();
  await first.locator('.peer-tabs').getByRole('button',{name:'Keşfet',exact:true}).click();
  await expect(first.getByRole("button", { name: "Uyumlu kardeş bul",exact:true })).toBeVisible();
  await first.close();
  await second.close();
});
test("lesson threads are isolated, read receipts update badges, archive is explicit and failures preserve text", async ({
  page,
}) => {
  await login(page, student, "appointments");
  const first = page
    .locator(".appointment-list article")
    .filter({ hasText: "Fâtiha · birinci ders" });
  await first.getByRole("button", { name: /Mesajlaş/ }).click();
  const chat = page.getByRole("dialog", { name: /randevu mesajlaşması/ });
  await expect(chat.getByText("Yalnızca ilk dersin mesajı")).toBeVisible();
  await expect(chat.getByText("İkinci dersin özel mesajı")).not.toBeVisible();
  await expect(
    page
      .locator(".qc-community-shortcuts")
      .getByRole("link", { name: /Randevularım/ })
      .locator(".qc-nav-badge"),
  ).toHaveText("1");
  await chat.getByPlaceholder("Mesajını yaz…").fill("FAIL TEST");
  await chat.getByRole("button", { name: "Mesaj gönder" }).click();
  await expect(chat.getByRole("alert")).toContainText("Metnin korunuyor");
  await expect(chat.getByPlaceholder("Mesajını yaz…")).toHaveValue("FAIL TEST");
  await chat.getByPlaceholder("Mesajını yaz…").fill("İlk satır");
  await chat.getByPlaceholder("Mesajını yaz…").press("Shift+Enter");
  await chat
    .getByPlaceholder("Mesajını yaz…")
    .pressSequentially("İkinci satır");
  await chat.getByPlaceholder("Mesajını yaz…").press("Enter");
  await expect(
    chat.locator(".qc-chat-bubble.mine").getByText(/İlk satır/),
  ).toBeVisible();
  await expect(chat.locator('[aria-label="Gönderildi"]')).toBeVisible();
  await chat.getByRole("button", { name: "Eski mesajlar" }).click();
  await expect(chat.getByText("Eski ortak sohbet arşivi")).toBeVisible();
  await expect(chat.getByPlaceholder("Mesajını yaz…")).not.toBeVisible();
  await chat.getByRole("button", { name: "Mesajlaşmayı kapat" }).click();
  const second = page
    .locator(".appointment-list article")
    .filter({ hasText: "İhlâs · ayrı ders" });
  await second.getByRole("button", { name: /Mesajlaş/ }).click();
  await expect(chat.getByText("İkinci dersin özel mesajı")).toBeVisible();
  await expect(chat.getByText("Yalnızca ilk dersin mesajı")).not.toBeVisible();
});
test("teacher sees student mutual note, and weekly calendar does not replace lesson cards", async ({
  page,
}) => {
  await login(page, teacher, "appointments");
  await expect(
    page.getByRole("button", { name: "Yeniden planla" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Haftalık takvim" }).click();
  await expect(
    page.getByRole("region", { name: "Haftalık ders takvimi" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Geçmiş", exact: true }).click();
  await page.getByRole("button", { name: "Ders Notu" }).click();
  const modal = page.getByRole("dialog", { name: "Ders Notu" });
  await expect(
    modal.getByText("Öğrencinin karşılıklı özel notu"),
  ).toBeVisible();
  await expect(modal.getByText(/Herkese açık yorum değildir/)).toBeVisible();
});
test("private study room form invites accepted peers and retains a real group bridge", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "Grup çalışması oluştur" }).click();
  const modal = page.getByRole("dialog", { name: "Grup çalışması oluştur" });
  await modal
    .getByRole("textbox", { name: "Oda adı" })
    .fill("Fâtiha tekrar halkası");
  await modal.getByRole("checkbox", { name: "Örnek Destekçi" }).check();
  await modal.getByRole("button", { name: "Oluştur ve davet et" }).click();
  await expect(modal).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Fâtiha tekrar halkası" }),
  ).toBeVisible();
  await expect(
    page.getByText("1/5 katılımcı · 1 davet bekliyor"),
  ).toBeVisible();
});
test("chat dark/mobile layout fits viewport with a visible composer and date separator", async ({
  page,
}, info) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await login(page, student, "appointments");
  await page
    .locator(".appointment-list article")
    .filter({ hasText: "Fâtiha · birinci ders" })
    .getByRole("button", { name: /Mesajlaş/ })
    .click();
  const dialog = page.getByRole("dialog", { name: /randevu mesajlaşması/ });
  await expect(dialog.getByPlaceholder("Mesajını yaz…")).toBeVisible();
  await expect(dialog.getByText("Bugün", { exact: true })).toBeVisible();
  const fit = await dialog.evaluate((el) => {
    const b = el.getBoundingClientRect();
    return (
      b.left >= 0 &&
      b.right <= innerWidth &&
      b.top >= 0 &&
      b.bottom <= innerHeight
    );
  });
  expect(fit).toBe(true);
  const headerFits = await dialog.locator(".qc-chat-header").evaluate((el) => {
    const b = el.getBoundingClientRect();
    return b.top >= 0 && b.bottom <= innerHeight;
  });
  expect(headerFits).toBe(true);
  await expect(
    dialog.getByRole("button", { name: "Mesajlaşmayı kapat" }).locator("svg"),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/quran-social-${info.project.name}-dark.png`,
    fullPage: false,
  });
});
