// Yerel geliştirme ve görsel karşılaştırma için ortak örnek veri (v1 ve yeni sürüm aynı içeriği gösterir).
import { readFileSync } from "node:fs";

export const DEV_IDS = { de: "00000000-0000-4000-8000-0000000000de", tr: "00000000-0000-4000-8000-0000000000a1" } as const;
export const DEV_SENT_AT = "2026-10-14T10:00:00.000Z";

const samples = () => [...readFileSync("legacy/landing.html", "utf8").matchAll(/sample: `([\s\S]*?)`/g)].map((m) => m[1]);
export function devReportMd(lang: "de" | "tr") {
  const [de, tr] = samples();
  return lang === "de" ? `# Prüfservice DGUV V3\nRhein-Main · Einzelgründung\n\n${de}` : `# DGUV V3 test hizmeti\nRhein-Main · Tek kurucu\n\n${tr}`;
}
export const devAnswers = (lang: "de" | "tr") => ({
  lang, idea: "Prüfservice für elektrische Geräte (DGUV V3) für kleine Betriebe im Rhein-Main-Gebiet.", current_solution: "Sie beauftragen große Prüfdienste.",
  business_type: "onsite_service", customers: "b2b", city: "Frankfurt", residence: "de_eu", situation: "employed_full", capital: "5-15k",
  price: "285", unit_cost: "20", fixed_costs: "900", investment: "6000", founders: "1",
});
