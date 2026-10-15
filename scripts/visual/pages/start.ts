import type { Page } from "@playwright/test";
import type { VisualPage } from "../types";

// Tüm SSS maddeleri ve Impressum açık (summary tıklanarak, kullanıcı gibi).
const openAll = async (page: Page) => {
  const closed = page.locator("details:not([open]) > summary");
  while (await closed.count()) await closed.first().click();
};
// İlk SSS maddesini kapat (varsayılan açık).
const closeFirst = async (page: Page) => { await page.locator(".faq details[open] > summary").first().click(); };

export const pages: VisualPage[] = [
  { name: "start-root-de", path: "/" },
  { name: "start-de", path: "/de/start" },
  { name: "start-tr", path: "/tr/start" },
  { name: "start-k-de", path: "/?k=Instagram" },
  { name: "start-k-tr", path: "/tr/start?k=fb_ads" },
  { name: "start-open-de", path: "/de/start", prepare: openAll },
  { name: "start-open-tr", path: "/tr/start", prepare: openAll },
  { name: "start-closed-de", path: "/de/start", prepare: closeFirst },
  { name: "start-closed-tr", path: "/tr/start", prepare: closeFirst },
];
