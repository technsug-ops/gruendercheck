// Değerlendirme vakalarının genel bakışı (evals/report/cases.md): geçerlilik, kalite kontrolü, KONTROLLER özeti.
// Çalıştır: npx tsx evals/report/overview.ts
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { calculate, suggestVat } from "@/lib/domain/calc";
import { qualityIssues } from "@/lib/domain/quality";
import { runChecks } from "@/lib/rules/checks";

export interface EvalCase { id: string; source: string; lang: "de" | "tr"; submittedDate: string; answers: Record<string, string | boolean>; notes?: string }

const DIR = "evals/report/cases";
const REQUIRED = ["lang", "idea", "current_solution", "business_type", "city", "residence", "situation", "capital", "email"];

export const loadCases = (): EvalCase[] =>
  readdirSync(DIR).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(readFileSync(`${DIR}/${f}`, "utf8")));

function main() {
  const cases = loadCases();
  const rows: string[] = [];
  const details: string[] = [];
  for (const c of cases) {
    const a = c.answers;
    const missing = REQUIRED.filter((k) => k !== "email" && !a[k]);
    const quality = qualityIssues(a);
    const checks = runChecks(a);
    const blockers = checks.filter((x) => x.level === "engel").map((x) => x.area);
    const calc = calculate(a, suggestVat(a));
    const calcNote = !calc.ok ? `eksik: ${calc.missing.join(", ")}` : calc.warnings.length ? `uyarı: ${calc.warnings.length}` : "ok";
    const kind = c.id.split("-")[0];
    rows.push(`| ${c.id} | ${kind} | ${c.lang} | ${missing.length ? "eksik: " + missing.join(",") : quality.length ? "kalite: " + quality.join(",") : "geçerli"} | ${[...new Set(blockers)].join(", ") || "—"} | ${calcNote} |`);
    const fence = "````";
    details.push([
      `### ${c.id}`, "", `Kaynak: ${c.source}`, "", c.notes ? `Zor yanları: ${c.notes}` : "", "",
      `${fence}text`, `Fikir: ${a.idea}`, `Bugünkü çözüm: ${a.current_solution}`, `Deneyim: ${a.experience ?? "—"}`, `Endişe: ${a.worry ?? "—"}`,
      `Şehir: ${a.city} · oturum: ${a.residence} · durum: ${a.situation} · saat/hafta: ${a.hours ?? "—"} · kurucu: ${a.founders ?? "—"} · sermaye: ${a.capital}`,
      `İşin türü: ${a.business_type} · müşteri: ${a.customers ?? "—"} · gelir modeli: ${a.rev_model ?? "—"} · fiyat: ${a.price ?? (a.competitor_price ? "bilinmiyor, rakip " + a.competitor_price : "—")} · birim maliyet: ${a.unit_cost ?? "—"} · sabit gider: ${a.fixed_costs ?? "—"} · kira: ${a.rent ?? "—"} · yatırım: ${a.investment ?? "—"}`,
      fence, "",
      `KONTROLLER: ${checks.map((x) => `${x.area}/${x.level}`).join(" · ") || "—"}`, "",
    ].join("\n"));
  }
  const md = [
    "# Değerlendirme vakaları — genel bakış", "",
    `${cases.length} vaka. Üretildi: \`npx tsx evals/report/overview.ts\`. "geçerli": form gönderiminden (zorunlu alanlar + kalite kontrolü) geçerdi; anlamsız girdi vakası bilerek kalite kontrolüne takılır.`, "",
    "| vaka | tür | dil | form | engel (KONTROLLER) | HESAPLAR |", "|---|---|---|---|---|---|", ...rows, "", "## Vakalar", "", ...details,
  ].join("\n");
  writeFileSync("evals/report/cases.md", md + "\n");
  console.log(rows.join("\n"));
}

if (process.argv[1]?.endsWith("overview.ts")) main();
