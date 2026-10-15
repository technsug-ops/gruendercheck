import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as v1 from "../legacy/render.js";
import { md, splitCover } from "@/lib/report/render";
import { rng } from "./fixtures";

const RICH = [
  "# Gründungs-Check – Mobile Fahrradwerkstatt",
  "Für Pendler in Frankfurt, Stand Oktober 2026",
  "und eine zweite Zeile",
  "",
  "{{skor 64 | gelb | Trägt mit Auflagen: **Preis** prüfen ⚠️ zu prüfen}}",
  "{{skor 82}}",
  "{{score 30 | kırmızı | olmaz}}",
  "",
  "{{kpi 7.900 € | nötiger Monatsumsatz (Annahme)}}",
  "{{kpi ≈ 285 € | Marktpreis}}",
  "",
  "## 1. Markt & Nachfrage",
  "## Ohne Nummer",
  "Text mit *kursiv*, `code`, [Link](https://example.org/a?b=1) und <script>alert(1)</script> & \"Zitat\".",
  "Zweite Zeile ⚠ (varsayım) und ⚠️ doğrulanmalı",
  "",
  "### Kriterien",
  "| Kriterium | Puan | Wert |",
  "|---|---|---|",
  "| Nachfrage | 4 | 1.200 € |",
  "| Wettbewerb | 2 | 15 % |",
  "| **Gesamt** | 3 | ≈ 3.000–4.000 € |",
  "",
  "| Name | Text |",
  "| :--- | --- |",
  "| a | b |",
  "| Lücke | -500 € |",
  "",
  "{{grafik Nötige Prüftage pro Monat}}",
  "{{bar Büro | 12-20 | Tage}}",
  "{{bar Industrie, eigene Kunden | 3-5 | Tage | vurgu}}",
  "{{bar Groß | 80–140 | €}}",
  "",
  "{{bar Allein | 7 | x}}",
  "{{unbekannt was}}",
  "",
  "> Zitat **fett**",
  "> - Liste im Zitat",
  "",
  "- [ ] offen",
  "- [x] erledigt",
  "  Fortsetzung",
  "1. eins",
  "2) zwei",
  "",
  "---",
  "#### Klein",
  "***",
  "Letzter Absatz",
].join("\n");

function landingSamples(): string[] {
  const html = readFileSync(new URL("../legacy/landing.html", import.meta.url), "utf8");
  return [...html.matchAll(/sample: `([\s\S]*?)`/g)].map((m) => m[1]);
}

describe("render = v1", () => {
  it("örnek raporlar, iki dil", () => {
    const inputs = [RICH, ...landingSamples(), "", "\n\n", "# Nur Titel", "# T\n1. nicht Untertitel"];
    expect(inputs.length).toBeGreaterThan(6); // tanıtım sayfasındaki örnek raporlar da bulundu
    for (const src of inputs) for (const lang of ["de", "tr"]) {
      v1.setLang(lang);
      expect(md(src, lang)).toBe(v1.md(src));
      expect(splitCover(src)).toEqual(v1.splitCover(src));
    }
  });

  it("2000 rastgele satır karışımı", () => {
    const lines = RICH.split("\n"), r = rng(7);
    for (let k = 0; k < 2000; k++) {
      const src = Array.from({ length: 1 + Math.floor(r.next() * 25) }, () => r.pick(lines)).join("\n");
      const lang = r.pick(["de", "tr"]);
      v1.setLang(lang);
      expect(md(src, lang)).toBe(v1.md(src));
      expect(splitCover(src)).toEqual(v1.splitCover(src));
    }
  });

  it("ham HTML kaçışlanır", () => {
    expect(md("<img src=x onerror=alert(1)>", "de")).toBe("<p>&lt;img src=x onerror=alert(1)&gt;</p>");
  });
});
