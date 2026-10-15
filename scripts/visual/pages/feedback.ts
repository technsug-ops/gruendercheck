import type { Page } from "@playwright/test";
import { DEV_IDS } from "../../dev-data";
import type { VisualPage } from "../types";

const UNKNOWN = "00000000-0000-4000-8000-000000000000";

// POST /api/feedback'i iki sürümde de aynı cevapla yakalar (yeni sürümde rota henüz yok).
const answerPost = (page: Page, status: number) =>
  page.route("**/api/feedback*", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({ status, contentType: "application/json", body: JSON.stringify(status === 200 ? { ok: true } : { ok: false, error: "storage" }) })
      : route.continue());

async function fill(page: Page) {
  await page.check('input[name="useful"][value="4"]');
  await page.fill("#best", "Die Kostenrechnung und die Liste der Genehmigungen.");
  await page.fill("#missing", "Mehr zu Versicherungen.");
  await page.check('input[name="next"][value="plan"]');
  await page.check('input[name="wtp"][value="50-150"]');
}

export const pages: VisualPage[] = (["de", "tr"] as const).flatMap((lang): VisualPage[] => {
  const path = `/${lang}/feedback?id=${DEV_IDS[lang]}`;
  return [
    { name: `feedback-form-${lang}`, path },
    { name: `feedback-empty-${lang}`, path, prepare: async (page) => { await page.click("#submit"); await page.waitForSelector("#formerror:not(.hidden)"); } },
    {
      name: `feedback-partial-${lang}`, path,
      // Boş gönder, sonra bir soruyu cevapla: o sorunun kırmızısı kalkar, diğerleri kalır.
      prepare: async (page) => { await page.click("#submit"); await page.check('input[name="next"][value="talk"]'); },
    },
    { name: `feedback-filled-${lang}`, path, prepare: fill },
    {
      name: `feedback-sent-${lang}`, path,
      prepare: async (page) => { await answerPost(page, 200); await fill(page); await page.click("#submit"); await page.waitForSelector("#done:not(.hidden)"); },
    },
    {
      name: `feedback-senderror-${lang}`, path,
      prepare: async (page) => { await answerPost(page, 500); await fill(page); await page.click("#submit"); await page.waitForSelector("#formerror:not(.hidden)"); await page.waitForSelector("#submit:not([disabled])"); },
    },
    { name: `feedback-impressum-${lang}`, path, prepare: async (page) => { await page.click("footer summary"); } },
    { name: `feedback-unknown-${lang}`, path: `/${lang}/feedback?id=${UNKNOWN}` },
    { name: `feedback-noid-${lang}`, path: `/${lang}/feedback` },
    // Dil v1'deki gibi adresten gelir: Türkçe kaydın linki /de altında açılırsa Almanca gösterilir.
    { name: `feedback-crosslang-${lang}`, path: `/${lang}/feedback?id=${DEV_IDS[lang === "de" ? "tr" : "de"]}` },
  ];
});
