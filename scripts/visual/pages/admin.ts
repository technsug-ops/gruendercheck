// Yönetici paneli (/admin) ve rapor önizleme (/rapor). Veri: npm run db:seed ("admin paneli için" bloğu).
// v1 sahte sunucusu listeyi yeni sunucudan aynen alır (legacy-server.ts), iki sürüm aynı kayıtları gösterir.
// Yeni sunucu: ADMIN_PASSWORD=dev; v1 sahte sunucusu: NEW_URL=… ADMIN_PASSWORD=dev.
import type { Page } from "@playwright/test";
import { devReportMd } from "../../dev-data";
import type { VisualPage } from "../types";

const PASSWORD = process.env.ADMIN_PASSWORD || "dev";
let run = 0;

/** Giriş denemesi sınırı (IP başına saatte 10) karşılaştırmayı durdurmasın: her vaka ayrı bir istemci adresiyle. */
const freshClient = (page: Page) => page.setExtraHTTPHeaders({ "x-forwarded-for": `visual-${Date.now()}-${run++}` });

async function login(page: Page) {
  await freshClient(page);
  await page.fill("#pw", PASSWORD);
  await page.click("#go");
  await page.waitForSelector("#list .item");
}

/** Bilinçli farkı (taslak uyarısı satırı) içeren kaydı iki sürümde de listeden çıkarır; geri kalan her şey birebir olmalı. */
const dropWarningItem = (page: Page) => page.locator(".item", { hasText: "admin-b4@" }).evaluate((el) => el.remove());

async function openStats(page: Page) {
  await page.click('.tabs button[data-tab="ana"]');
  await page.waitForSelector("#ana > *");
  await page.waitForFunction(() => document.getElementById("anastate")?.textContent === "");
}

// Vercel Web Analytics özeti (api/stats.js çıktı biçimi), iki sürümde aynı cevap.
const day = (i: number) => new Date(Date.UTC(2026, 8, 16 + i)).toISOString().slice(0, 10);
const STATS = {
  days: 30, since: "2026-09-15T08:00:00.000Z", until: "2026-10-15T08:00:00.000Z",
  daily: Array.from({ length: 30 }, (_, i) => ({ key: day(i), n: [12, 18, 9, 25, 31, 14, 7, 22, 40, 36, 19, 11, 28, 45, 33][i % 15] + i, v: 5 + (i % 7) })),
  requestPath: [
    { key: "/", n: 412, v: 230 }, { key: "/tr/start", n: 188, v: 120 }, { key: "/de", n: 140, v: 96 }, { key: "/tr", n: 97, v: 70 },
    { key: "/de/r", n: 41, v: 18 }, { key: "/tr/feedback", n: 12, v: 9 }, { key: "/impressum-test", n: 3, v: 3 },
  ],
  referrerHostname: [{ key: "", n: 380, v: 210 }, { key: "instagram.com", n: 240, v: 150 }, { key: "google.com", n: 120, v: 88 }, { key: "facebook.com", n: 61, v: 40 }],
  utmSource: [{ key: "", n: 520, v: 300 }, { key: "insta", n: 210, v: 140 }, { key: "fb", n: 71, v: 50 }],
  country: [{ key: "DE", n: 690, v: 400 }, { key: "TR", n: 80, v: 60 }, { key: "AT", n: 21, v: 15 }, { key: "(bilinmiyor)", n: 9, v: 9 }],
  deviceType: [{ key: "mobile", n: 560, v: 330 }, { key: "desktop", n: 220, v: 140 }, { key: "tablet", n: 20, v: 14 }],
  total: { n: 893, v: 512 },
};
const cannedStats = (page: Page) =>
  page.route("**/api/stats*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(STATS) }));

/** Panelin "Önizle / PDF" düğmesinin bıraktığı sessionStorage (rapor_md, rapor_lang). */
async function preview(page: Page, lang: "de" | "tr") {
  await page.addInitScript(([md, l]) => { sessionStorage.setItem("rapor_md", md); sessionStorage.setItem("rapor_lang", l); }, [devReportMd(lang), lang]);
  await page.reload({ waitUntil: "networkidle" });
}

const WARNING = "Bilinçli fark 3: hazır taslaktaki draft.warning (ör. token sınırında kesildi) taslak bölümünün başında bir satır olarak gösterilir; v1'de bu alan yoktu. Uyarılı kayıt çıkarılınca liste birebir aynı (admin-list-nowarn).";

export const pages: VisualPage[] = [
  { name: "admin-login", path: "/admin" },
  {
    name: "admin-wrongpw", path: "/admin",
    prepare: async (page) => { await freshClient(page); await page.fill("#pw", "yanlis-sifre"); await page.click("#go"); await page.waitForSelector("#loginerr:not([hidden])"); },
  },
  { name: "admin-list-full", path: "/admin", prepare: login, known: WARNING },
  { name: "admin-list-nowarn", path: "/admin", prepare: async (page) => { await login(page); await dropWarningItem(page); } },
  {
    name: "admin-vat", path: "/admin",
    prepare: async (page) => {
      await login(page);
      await dropWarningItem(page);
      const anna = page.locator(".item", { hasText: "admin-b7@" });
      await anna.locator('select[data-a="vat"]').selectOption("red7");
      await anna.locator("details", { hasText: "Finans planı" }).locator("summary").click();
      const can = page.locator(".item", { hasText: "admin-b9@" });
      await can.locator('select[data-a="vat"]').selectOption("resto");
    },
  },
  { name: "admin-stats-notoken", path: "/admin", prepare: async (page) => { await login(page); await openStats(page); } },
  { name: "admin-stats-data", path: "/admin", prepare: async (page) => { await cannedStats(page); await login(page); await openStats(page); } },
  {
    name: "admin-stats-7days", path: "/admin",
    prepare: async (page) => { await cannedStats(page); await login(page); await openStats(page); await page.click('#period button[data-d="7"]'); await page.waitForFunction(() => document.getElementById("anastate")?.textContent === ""); },
  },
  { name: "admin-rapor-empty", path: "/rapor" },
  { name: "admin-rapor-preview-de", path: "/rapor", prepare: (page) => preview(page, "de") },
  { name: "admin-rapor-preview-tr", path: "/rapor", prepare: (page) => preview(page, "tr") },
  {
    name: "admin-rapor-plan-who-de", path: "/rapor",
    prepare: async (page) => { await preview(page, "de"); await page.fill("#who", "Elif"); await page.selectOption("#kind", "plan"); },
  },
];
