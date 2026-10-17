// v1 ile yeni sürümün ekran görüntülerini piksel piksel karşılaştırır.
// Önce iki sunucu çalışıyor olmalı:
//   v1:   npx tsx scripts/visual/legacy-server.ts 3201
//   yeni: npx next build && npx next start -p 3200   (npm run db:seed ile örnek veri)
// Çalıştır: npx tsx scripts/visual/compare.ts [ad-filtresi]
// Portlar: OLD_PORT / NEW_PORT ortam değişkenleri. Çıktı: .data/visual/<ad>-<genişlik>-{old,new,diff}.png
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { pages as admin } from "./pages/admin";
import { pages as check } from "./pages/check";
import { pages as feedback } from "./pages/feedback";
import { pages as plan } from "./pages/plan";
import { pages as report } from "./pages/report";
import { pages as start } from "./pages/start";
import type { VisualPage } from "./types";

const OLD = `http://localhost:${process.env.OLD_PORT ?? 3201}`, NEW = `http://localhost:${process.env.NEW_PORT ?? 3200}`;
const ALL: VisualPage[] = [...start, ...check, ...report, ...feedback, ...plan, ...admin];
// v1'den bilerek ayrılan metinler (2026-10-17). Türkçe sayfaların referansı artık v1 değil; onları test/i18n.test.ts
// ve e2e/i18n.spec.ts korur. Almanca sayfalar v1 ile aynı kalmalı (tek istisna: güncel Datenschutz metni).
const DELIBERATE: [RegExp, string][] = [
  [/-tr(-|$)/, "Türkçe metinler düzeltildi (Datenschutz, künye, onay metni; Almanca sızıntılar giderildi)"],
  [/^(check|plan)-footer-de$/, "Datenschutz metni güncellendi (Neon eklendi, sadeleştirildi)"],
];
const knownOf = (p: VisualPage) => p.known ?? DELIBERATE.find(([re]) => re.test(p.name))?.[1];
const WIDTHS = [1280, 390];
const OUT = ".data/visual";

async function shot(page: Page, url: string, p: VisualPage) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "*{transition:none!important;animation:none!important;caret-color:transparent!important;scroll-behavior:auto!important}" });
  if (p.prepare) { await p.prepare(page); await page.waitForLoadState("networkidle"); }
  await page.evaluate(() => window.scrollTo(0, 0));
  return PNG.sync.read(await page.screenshot({ fullPage: true }));
}

async function main() {
  const filter = process.argv[2] ?? "";
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  let failed = 0;
  for (const p of ALL.filter((x) => x.name.includes(filter))) {
    for (const width of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: "block", locale: "de-DE", timezoneId: "Europe/Berlin" });
      const page = await ctx.newPage();
      const a = await shot(page, OLD + p.path, p), b = await shot(page, NEW + p.path, p);
      await ctx.close();
      const w = Math.max(a.width, b.width), h = Math.max(a.height, b.height);
      const pad = (img: PNG) => { const o = new PNG({ width: w, height: h }); o.data.fill(255); PNG.bitblt(img, o, 0, 0, img.width, img.height, 0, 0); return o; };
      const diff = new PNG({ width: w, height: h });
      const n = pixelmatch(pad(a).data, pad(b).data, diff.data, w, h, { threshold: 0.1 });
      const tag = `${p.name}-${width}`;
      writeFileSync(`${OUT}/${tag}-old.png`, PNG.sync.write(a));
      writeFileSync(`${OUT}/${tag}-new.png`, PNG.sync.write(b));
      writeFileSync(`${OUT}/${tag}-diff.png`, PNG.sync.write(diff));
      const size = a.height === b.height ? `${a.height}px` : `yükseklik ${a.height}→${b.height}px`;
      const known = knownOf(p);
      const state = n === 0 ? "AYNI   " : known ? "BİLİNEN" : "FARK   ";
      if (n > 0 && !known) failed++;
      console.log(`${state} ${tag.padEnd(30)} ${((n / (w * h)) * 100).toFixed(3)}% piksel, ${size}${n > 0 && known ? ` — ${known}` : ""}`);
    }
  }
  await browser.close();
  process.exitCode = failed ? 1 : 0;
}
main();
