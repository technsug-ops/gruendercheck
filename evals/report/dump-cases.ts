// Vakaları okunur etiketlerle ve KONTROLLER özetiyle JSON olarak verir (PDF/inceleme için). Çıktı: argv[2]
import { writeFileSync } from "node:fs";
import { val } from "@/lib/domain/brief";
import { runChecks } from "@/lib/rules/checks";
import { loadCases } from "./overview";

const out = loadCases().map((c) => {
  const a = c.answers;
  const L = (k: string) => (a[k] === undefined || a[k] === "" ? "—" : String(val(k, a[k])));
  return {
    id: c.id, lang: c.lang, source: c.source, notes: c.notes ?? "",
    idea: String(a.idea ?? ""), current: String(a.current_solution ?? ""), experience: String(a.experience ?? ""), worry: String(a.worry ?? ""),
    facts: [["Şehir", L("city")], ["Oturum", L("residence")], ["Durum", L("situation")], ["Saat/hafta", L("hours")], ["Kurucu", L("founders")],
      ["Sermaye", L("capital")], ["İşin türü", L("business_type")], ["Müşteri", L("customers")], ["Gelir modeli", L("rev_model")],
      ["Fiyat €", a.price ? L("price") : a.competitor_price ? `bilinmiyor (rakip ${a.competitor_price})` : "—"], ["Birim maliyet €", L("unit_cost")],
      ["Sabit gider €/ay", L("fixed_costs")], ["Kira €/ay", L("rent")], ["Yatırım €", L("investment")]],
    checks: runChecks(a).map((x) => ({ area: x.area, level: x.level, certainty: x.certainty, text: x.text })),
  };
});
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(out.length, "vaka");
