import type { Page } from "@playwright/test";
import type { VisualPage } from "../types";

// Form (/de, /tr). /api/submit iki sürümde de page.route ile taklit edilir.
const IDEA = {
  de: "Ich möchte in Frankfurt-Bornheim einen kleinen Laden für Fahrradreparaturen eröffnen. Kunden sind Pendler und Familien aus dem Viertel. Ich biete schnelle Reparaturen, Inspektionen und gebrauchte Räder an.",
  tr: "Frankfurt-Bornheim'da küçük bir bisiklet tamir dükkanı açmak istiyorum. Müşterilerim mahalledeki işe gidip gelenler ve aileler. Hızlı tamir, bakım ve ikinci el bisiklet satışı sunuyorum.",
};
const SOL = {
  de: "Sie gehen heute zu großen Fahrradläden in der Innenstadt und zahlen etwa 60 Euro pro Inspektion.",
  tr: "Bugün şehir merkezindeki büyük bisikletçilere gidiyorlar ve bakım için yaklaşık 60 Euro ödüyorlar.",
};

async function fill(page: Page, lang: "de" | "tr", o: { idea?: string; business?: string; customers?: string; rev?: string; priceUnknown?: boolean } = {}) {
  await page.fill("#idea", o.idea ?? IDEA[lang]);
  await page.fill("#current_solution", SOL[lang]);
  await page.selectOption("#talked", "1-5");
  await page.selectOption("#paid", "no");
  await page.selectOption("#business_type", o.business ?? "onsite_service");
  await page.selectOption("#customers", o.customers ?? "b2c");
  await page.fill("#city", "Frankfurt-Bornheim");
  await page.selectOption("#residence", "settlement");
  await page.selectOption("#situation", "employed_part");
  await page.fill("#hours", "20");
  await page.selectOption("#founders", "1");
  await page.fill("#experience", "Zweiradmechaniker-Geselle, 8 Jahre");
  await page.selectOption("#capital", "5-15k");
  await page.selectOption("#rev_model", o.rev ?? "one_time");
  if (o.priceUnknown) { await page.check("#price_unknown"); await page.fill("#competitor_price", "59.90"); }
  else await page.fill("#price", "45");
  await page.fill("#unit_cost", "12.5");
  await page.fill("#fixed_costs", "1800");
  await page.fill("#investment", "15000");
  await page.fill("#personal_need", "2200");
  await page.fill("#worry", "Ob genug Kunden kommen.");
  await page.fill("#first_name", "Alex");
  await page.fill("#email", "alex@example.com");
  await page.check("#consent");
}
const respond = (status: number, body: object) => async (page: Page) => {
  await page.route("**/api/submit", (r) => r.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }));
};
const submit = async (page: Page) => { await page.click("#submit"); await page.waitForTimeout(300); };

const cases = (lang: "de" | "tr"): VisualPage[] => [
  { name: `check-empty-${lang}`, path: `/${lang}` },
  { name: `check-required-${lang}`, path: `/${lang}`, prepare: submit },
  { name: `check-quality-${lang}`, path: `/${lang}`, prepare: async (p) => { await fill(p, lang, { idea: "Ein Laden." }); await p.fill("#current_solution", "Gar nicht"); await p.fill("#email", "kaputt@"); await submit(p); } },
  { name: `check-noprice-${lang}`, path: `/${lang}`, prepare: async (p) => { await fill(p, lang); await p.fill("#price", ""); await p.uncheck("#consent"); await submit(p); } },
  { name: `check-location-${lang}`, path: `/${lang}`, prepare: async (p) => { await fill(p, lang, { business: "location", customers: "b2b", rev: "subscription", priceUnknown: true }); await p.check("#price_is_net"); } },
  { name: `check-online-${lang}`, path: `/${lang}`, prepare: async (p) => { await fill(p, lang, { business: "online_products", customers: "both", rev: "commission" }); await p.fill("#delivery_days", "3"); } },
  { name: `check-filled-${lang}`, path: `/${lang}`, prepare: (p) => fill(p, lang) },
  { name: `check-sent-${lang}`, path: `/${lang}`, prepare: async (p) => { await respond(200, { ok: true })(p); await fill(p, lang); await submit(p); } },
  { name: `check-mailfail-${lang}`, path: `/${lang}`, prepare: async (p) => { await respond(502, { ok: false, error: "mail" })(p); await fill(p, lang); await submit(p); } },
  { name: `check-rate-${lang}`, path: `/${lang}`, prepare: async (p) => { await respond(429, { ok: false, error: "rate" })(p); await fill(p, lang); await submit(p); } },
  { name: `check-srvquality-${lang}`, path: `/${lang}`, prepare: async (p) => { await respond(400, { ok: false, error: "quality", fields: ["current_solution", "idea"] })(p); await fill(p, lang); await submit(p); } },
  { name: `check-footer-${lang}`, path: `/${lang}`, prepare: async (p) => { await p.click("#datenschutz summary"); await p.click("#impressum summary"); } },
];

// Aktiver Schritt (IntersectionObserver) hängt vom Scroll-Verlauf ab (Playwright scrollt beim Klicken/Füllen, ein
// Fokus scrollt ebenfalls); welche Zwischenstände der Observer sieht, ist Timing-Sache – in v1 wie neu. Daher hier
// deterministisch: Abschnitt <sec> in das Beobachtungsband (35–40 % der Höhe) scrollen, warten, dann nach oben.
const settle = async (page: Page, sec: string) => {
  await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (el && el.offsetParent) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.3);
  }, sec);
  await page.waitForTimeout(250);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
};
const all: (VisualPage & { sec?: string })[] = [
  ...cases("de"), ...cases("tr"),
  { name: "check-step3-de", path: "/de", sec: "s3" },
  { name: "check-step4-tr", path: "/tr", sec: "s4" },
];
export const pages: VisualPage[] = all.map(({ sec, ...c }) => ({
  ...c, prepare: async (page: Page) => { if (c.prepare) await c.prepare(page); await settle(page, sec ?? "s1"); },
}));
