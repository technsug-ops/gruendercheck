import type { Page } from "@playwright/test";
import { DEV_IDS } from "../../dev-data";
import type { VisualPage } from "../types";

// POST /api/plan her iki sürümde de taklit edilir (yeni sürümde API henüz yok).
const mockPost = (status: number) => async (page: Page) => {
  await page.unrouteAll();
  await page.route("**/api/plan", (r) => r.request().method() === "POST"
    ? r.fulfill({ status, contentType: "application/json", body: JSON.stringify(status === 200 ? { ok: true } : { ok: false, error: "storage" }) })
    : r.continue());
};
const fillRequired = async (page: Page) => {
  await page.fill("#units_m1", "4");
  await page.fill("#units_m12", "20");
  await page.fill("#f_equity", "5000");
};
// v1'de koşullu alanlar başvurudan gelir; örnek veride location/alg1 yok, bu yüzden hepsi elle açılır (yerleşimi görmek için).
const revealAll = async (page: Page) => {
  await page.evaluate(() => document.querySelectorAll("[data-cond]").forEach((el) => el.classList.remove("hidden")));
};

const cases = (lang: "de" | "tr"): VisualPage[] => {
  const path = `/${lang}/plan?id=${DEV_IDS[lang]}`;
  return [
    { name: `plan-initial-${lang}`, path },
    { name: `plan-allcond-${lang}`, path, prepare: revealAll },
    { name: `plan-required-${lang}`, path, prepare: async (page) => { await page.click("#submit"); } },
    { name: `plan-consent-${lang}`, path, prepare: async (page) => { await fillRequired(page); await page.click("#submit"); } },
    {
      name: `plan-fixerr-${lang}`, path,
      prepare: async (page) => { await page.click("#submit"); await page.fill("#units_m1", "4"); await page.check("#consent"); await page.click("#submit"); },
    },
    {
      name: `plan-done-${lang}`, path,
      prepare: async (page) => {
        await mockPost(200)(page); await fillRequired(page); await page.check("#consent"); await page.click("#submit");
        await page.waitForSelector("#done:not(.hidden)");
      },
    },
    {
      name: `plan-senderr-${lang}`, path,
      prepare: async (page) => {
        await mockPost(500)(page); await fillRequired(page); await page.check("#consent"); await page.click("#submit");
        await page.waitForSelector("#formerror:not(.hidden)");
      },
    },
    { name: `plan-footer-${lang}`, path, prepare: async (page) => { await page.evaluate(() => document.querySelectorAll("footer details").forEach((d) => d.setAttribute("open", ""))); } },
    { name: `plan-unknown-${lang}`, path: `/${lang}/plan?id=00000000-0000-4000-8000-000000000000` },
    { name: `plan-badid-${lang}`, path: `/${lang}/plan?id=abc` },
    { name: `plan-noid-${lang}`, path: `/${lang}/plan` },
  ];
};

export const pages: VisualPage[] = [...cases("de"), ...cases("tr")];
