import { expect, test } from "@playwright/test";

test("Quran pilot demo supports appointment chat and a completed lesson reflection", async ({ page }) => {
  await page.goto("/?view=quran-companion&tab=appointments");
  await page.getByRole("button", { name: "DEV: Misafir görünümü" }).click();

  await expect(page.getByRole("heading", { name: "İmam Hatip Ramazan Hoca" })).toBeVisible();
  await page.getByRole("button", { name: "Mesajlaş" }).click();
  await expect(page.getByRole("dialog", { name: /randevu mesajlaşması/ })).toBeVisible();
  await page.getByPlaceholder("Mesajını yaz…").fill("Fâtiha suresinin mahreçlerini çalışmak istiyorum.");
  await page.getByRole("button", { name: "Mesaj gönder" }).click();
  await expect(page.getByText("Fâtiha suresinin mahreçlerini çalışmak istiyorum.")).toBeVisible();
  await page.getByRole("button", { name: "Mesajlaşmayı kapat" }).click();

  await page.getByRole("button", { name: "Geçmiş" }).click();
  await page.getByRole("button", { name: "Ders Notu" }).click();
  await expect(page.getByRole("dialog", { name: "Ders Notu" })).toBeVisible();
  await page.getByRole("textbox", { name: /Bu derste ne hissettin/ }).fill("Mahreç farklarını daha iyi anladım.");
  await page.getByRole("button", { name: "4 / 5 zorluk" }).click();
  await page.getByRole("button", { name: "Ders notunu kaydet" }).click();
  await expect(page.getByText("Ders notu kaydedildi.")).toBeVisible();
});
