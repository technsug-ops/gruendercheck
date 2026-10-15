// MIGRATION.md adım 8: kötü giriş reddedilir → iyi giriş → onay e-postası → onay → taslak → yönetici onayı
// → rapor e-postası → rapor sayfası → geri bildirim → plan formu.
import { existsSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { E2E } from "../playwright.config";

type Mail = { to: string; subject: string; text: string };
const mails = (): Mail[] => (existsSync(E2E.outbox) ? readFileSync(E2E.outbox, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const waitMail = async (match: (m: Mail) => boolean) => {
  await expect.poll(() => mails().some(match), { timeout: 30_000 }).toBe(true);
  return mails().filter(match).at(-1)!;
};

const IDEA = "Mobile Fahrradwerkstatt für Pendler in Frankfurt mit Abholung am Arbeitsplatz und Reparatur noch am selben Tag, Abrechnung über den Arbeitgeber.";
const EMAIL = "ayse.e2e@example.org";

async function fillCheck(page: Page, idea: string) {
  await page.fill("#idea", idea);
  await page.fill("#current_solution", "Sie bringen das Rad selbst zur Werkstatt und warten oft eine Woche.");
  for (const [n, v] of [["business_type", "onsite_service"], ["residence", "de_eu"], ["situation", "employed_full"], ["capital", "5-15k"], ["rev_model", "one_time"]]) {
    const el = page.locator(`[name=${n}]`).first();
    if ((await el.evaluate((e) => e.tagName)) === "SELECT") await el.selectOption(v);
    else await page.check(`[name=${n}][value="${v}"]`);
  }
  await page.fill("#city", "Frankfurt");
  await page.fill("#price", "45");
  await page.fill("#unit_cost", "8");
  await page.fill("#fixed_costs", "600");
  await page.fill("#first_name", "Ayşe");
  await page.fill("#email", EMAIL);
  await page.check("[name=consent]");
}

test("başvurudan rapora ve geri bildirime tam akış", async ({ page, browser }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // 1) Tanıtım sayfasından kanal etiketiyle forma
  await page.goto("/?k=e2e");
  await page.locator('a[href^="/de?k=e2e"]').first().click();
  await expect(page).toHaveURL(/\/de\?k=e2e/);

  // 2) Kötü giriş: anlamsız fikir metni istemcide reddedilir, istek gitmez
  let submitted = 0;
  page.on("request", (r) => { if (r.url().endsWith("/api/submit")) submitted++; });
  await fillCheck(page, "asdf qwrt zxcv asdf qwrt zxcv asdf qwrt zxcv asdf qwrt zxcv asdf qwrt zxcv asdf qwrt zxcv");
  await page.locator("#submit").click();
  await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
  expect(submitted).toBe(0);

  // 3) İyi giriş
  await page.fill("#idea", IDEA);
  const [resp] = await Promise.all([page.waitForResponse("**/api/submit"), page.locator("#submit").click()]);
  expect(resp.status()).toBe(200);
  await expect(page.locator("body")).toHaveClass(/sent/);
  await expect(page.locator("body")).toContainText("Fast geschafft – bitte bestätige deine E-Mail.");

  // 4) Onay e-postası → GET düğme gösterir (otomatik onay yok) → POST onaylar
  const confirmMail = await waitMail((m) => m.to === EMAIL && m.subject.startsWith("Bitte bestätige"));
  const link = confirmMail.text.match(/https:\/\/foundercheck\.de(\/api\/confirm\?id=([0-9a-f-]{36})&t=[0-9a-f]{32})/)!;
  const id = link[2];
  await page.goto(link[1]);
  await expect(page.locator("h1")).toHaveText("E-Mail bestätigen");
  await page.locator("button[type=submit]").click();
  await expect(page.locator("h1")).toHaveText("Danke, deine E-Mail ist bestätigt.");

  // 5) Taslak arka planda yazılır (sahte Claude); yöneticiye bildirim gider
  await waitMail((m) => m.to === "halil@example.org" && m.subject.startsWith("Rapor taslağı hazır"));
  const claudeReq = readFileSync(E2E.claudeLog, "utf8");
  expect(claudeReq).toContain("Mobile Fahrradwerkstatt");
  expect(claudeReq).not.toContain(EMAIL); // modele e-posta gitmez
  expect(claudeReq).not.toContain("Ayşe"); // ve isim
  expect(mails().filter((m) => m.to === "halil@example.org").every((m) => !m.text.includes(IDEA))).toBe(true);

  // 6) Yönetici: giriş, taslağı gör, onayla ve gönder
  const admin = await browser.newPage();
  admin.on("dialog", (d) => d.accept());
  await admin.goto("/admin");
  await admin.fill("#pw", "yanlış");
  await admin.locator("#go").click();
  await expect(admin.locator("#loginerr")).toBeVisible();
  await admin.fill("#pw", E2E.password);
  await admin.locator("#go").click();
  const item = admin.locator(".item", { hasText: EMAIL });
  await expect(item).toContainText("Taslak onay bekliyor");
  await expect(item.locator("textarea")).toHaveValue(/^# Mobile Fahrradwerkstatt/);
  await expect(item).toContainText("Hat der Gründer schon einen Mietvertrag?");
  await item.locator('[data-a="send"], button:has-text("Onayla ve gönder")').first().click();
  await expect(admin.locator(".item", { hasText: EMAIL })).toContainText("Rapor gönderildi");

  // 7) Rapor e-postası → rapor sayfası
  const reportMail = await waitMail((m) => m.to === EMAIL && m.subject.startsWith("Dein Bericht ist fertig"));
  expect(reportMail.text).toContain(`https://foundercheck.de/de/r?id=${id}`);
  await page.goto(`/de/r?id=${id}`);
  await expect(page.locator("h1")).toHaveText("Mobile Fahrradwerkstatt");
  await expect(page.locator(".verdict")).toBeVisible();
  await expect(page.locator(".doc")).not.toContainText("HALİL"); // ön kontrol soruları rapora girmez

  // 8) Geri bildirim
  await page.goto(`/de/feedback?id=${id}`);
  await page.locator('[name=useful][value="4"]').check();
  await page.locator('[name=next][value="plan"]').check();
  await page.locator('[name=wtp][value="50-150"]').check();
  const [fb] = await Promise.all([page.waitForResponse("**/api/feedback"), page.locator("button[type=submit]").click()]);
  expect(fb.status()).toBe(200);
  await waitMail((m) => m.to === "halil@example.org" && m.subject.startsWith("Geri bildirim geldi"));

  // 9) Plan formu: başvurudan ön dolu, gönderilir, panelde görünür
  await page.goto(`/de/plan?id=${id}`);
  await page.fill("[name=units_m1]", "20");
  await page.fill("[name=units_m12]", "120");
  await page.fill("[name=f_equity]", "8000");
  await page.check("[name=consent]");
  const [pl] = await Promise.all([page.waitForResponse("**/api/plan"), page.locator("button[type=submit]").last().click()]);
  expect(pl.status()).toBe(200);
  await admin.reload(); // oturum çerezi kalıcı: yeniden şifre sorulmaz
  await expect(admin.locator("#pw")).toBeHidden();
  const after = admin.locator(".item", { hasText: EMAIL });
  await expect(after).toContainText("Plan verisi var");
  await expect(after).toContainText("Geri bildirim 4/5");

  expect(errors).toEqual([]);
});
