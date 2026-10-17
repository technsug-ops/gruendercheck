// Gerçek tarayıcıda: tarayıcı diline göre ilk yönlendirme ve sayfalarda dil sızıntısı (başka dilin metni görünmesin).
import { expect, test } from "@playwright/test";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n";
import { fillOperator } from "@/lib/operator";
import { MESSAGES } from "@/messages";

test.describe("tarayıcı dili", () => {
  test("Türkçe tarayıcı kökten Türkçe sayfaya gider, kanal etiketi korunur", async ({ browser }) => {
    const ctx = await browser.newContext({ locale: "tr-TR", extraHTTPHeaders: { "accept-language": "tr-TR,tr;q=0.9,en;q=0.8" } });
    const page = await ctx.newPage();
    await page.goto("/?k=insta");
    await expect(page).toHaveURL(/\/tr\/start\?k=insta$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");
    await ctx.close();
  });

  test("Almanca ve desteklenmeyen dil kökte Almanca kalır", async ({ browser }) => {
    for (const al of ["de-DE,de;q=0.9", "en-US,en;q=0.9", ""]) {
      const ctx = await browser.newContext({ extraHTTPHeaders: al ? { "accept-language": al } : {} });
      const page = await ctx.newPage();
      await page.goto("/");
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator("html")).toHaveAttribute("lang", "de");
      await ctx.close();
    }
  });

  test("açık dil seçimi tarayıcı diliyle ezilmez", async ({ browser }) => {
    const ctx = await browser.newContext({ extraHTTPHeaders: { "accept-language": "tr-TR,tr" } });
    const page = await ctx.newPage();
    await page.goto("/de");
    await expect(page).toHaveURL(/\/de$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await page.locator("#homelink").click(); // logo → Almanca tanıtım, Türkçeye atılmaz
    await expect(page).toHaveURL(/\/de\/start$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await page.goto("/tr/start");
    await page.locator("a.lang").first().click(); // dil seçici → Almanca
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await ctx.close();
  });
});

// Bir dilin dosyalarındaki, diğer dilde karşılığı farklı olan uzun metin parçaları: bunlar öbür dilin sayfasında görünmemeli.
function fragments(l: Locale, other: Locale): string[] {
  const out: string[] = [];
  const walk = (a: unknown, b: unknown) => {
    if (typeof a === "string") {
      if (a === b) return;
      for (const part of fillOperator(a).replace(/<\/?\w+>/g, "").split(/\{\w+\}|\n/)) if (part.trim().length >= 18) out.push(part.trim());
    } else if (a && typeof a === "object") for (const k of Object.keys(a)) walk((a as Record<string, unknown>)[k], (b as Record<string, unknown> | undefined)?.[k]);
  };
  walk(MESSAGES[l], MESSAGES[other]);
  return out;
}

const PAGES = (l: Locale) => [`/${l}/start`, `/${l}`, `/${l}/feedback?id=00000000-0000-4000-8000-000000000000`, `/${l}/plan`];

for (const l of LOCALES) {
  for (const other of LOCALES.filter((x) => x !== l)) {
    test(`${l} sayfalarında ${other} metni yok`, async ({ page }) => {
      const foreign = fragments(other, l);
      expect(foreign.length).toBeGreaterThan(50);
      for (const path of PAGES(l)) {
        await page.goto(path);
        // Kapalı bölümler (Datenschutz, Impressum, SSS) dahil tüm metin.
        await page.evaluate(() => document.querySelectorAll("details").forEach((d) => d.setAttribute("open", "")));
        const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
        const head = await page.evaluate(() => `${document.title} ${document.querySelector('meta[name="description"]')?.getAttribute("content") ?? ""}`);
        const found = foreign.filter((f) => text.includes(f.replace(/\s+/g, " ")) || head.includes(f));
        expect({ path, found }).toEqual({ path, found: [] });
        await expect(page.locator("html")).toHaveAttribute("lang", l);
      }
    });
  }
}

test("varsayılan dil kök adreste", () => {
  expect(DEFAULT_LOCALE).toBe("de");
});
