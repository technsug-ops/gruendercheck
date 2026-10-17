// KONTROLLER: kural tabanının kodla uygulanan kısmı. Gerçekçi vakalar + yanlış alarm vermemesi gereken metinler.
import { describe, expect, it } from "vitest";
import type { Answers } from "@/lib/domain/calc";
import { type Check, checksText, runChecks } from "@/lib/rules/checks";

const base: Answers = { lang: "de", current_solution: "Sie gehen heute woanders hin und zahlen dafür.", city: "Frankfurt", residence: "de_eu", situation: "employed_full", capital: "5-15k", founders: "1" };
const run = (a: Answers) => runChecks({ ...base, ...a });
const has = (cs: Check[], area: Check["area"], re: RegExp) => cs.some((c) => c.area === area && re.test(c.text));
const areaOf = (cs: Check[], area: Check["area"]) => cs.filter((c) => c.area === area);

describe("KONTROLLER", () => {
  it("Meister'siz berber, öğrenci oturumu", () => {
    const cs = run({ idea: "Ich möchte einen Barbershop in Offenbach eröffnen, Herrenhaarschnitte und Bartpflege.", business_type: "location", residence: "student", city: "Offenbach", capital: "0-5k", hours: "20" });
    expect(has(cs, "oturum", /İZİN GEREKLİ.*Ausländerbehörde/)).toBe(true);
    expect(areaOf(cs, "oturum").find((c) => c.level === "engel")?.certainty).toBe("kesin");
    expect(has(cs, "meister", /Friseur \(Anlage A Nr\. 38\).*§7b/)).toBe(true);
    expect(has(cs, "rechtsform", /UG \(kural 3/)).toBe(true);
    expect(has(cs, "eksik bilgi", /Meister\/Geselle/)).toBe(true);
    expect(has(cs, "eksik bilgi", /Vatandaşlık/)).toBe(true);
    expect(has(cs, "oturum", /ARB 1\/80/)).toBe(true);
  });

  it("DGUV V3 test hizmeti, ALG I, Frankfurt", () => {
    const cs = run({ idea: "Prüfservice für ortsveränderliche Geräte nach DGUV V3 für kleine Betriebe, später Wallbox-Installation.", business_type: "onsite_service", residence: "settlement", situation: "alg1", hours: "40", price: "285", unit_cost: "20", fixed_costs: "900", investment: "6000" });
    expect(has(cs, "meister", /Elektrotechniker.*Installateurverzeichnis/)).toBe(true);
    expect(has(cs, "teşvik", /Gründungszuschuss.*150 gün.*AVGS.*kesin tarih YAZMA/)).toBe(true);
    expect(has(cs, "vergi", /Hebesatz Frankfurt am Main: %460/)).toBe(true);
    expect(has(cs, "eksik bilgi", /Bewilligungsbescheid/)).toBe(true);
    expect(areaOf(cs, "bölge")).toEqual([]); // Frankfurt Hessen
  });

  it("Kendi pastasını yapan kafe, Köln, aile birleşimi", () => {
    const cs = run({ idea: "Ein Café in Köln-Ehrenfeld, in dem wir eigene Torten und Kuchen backen und Frühstück anbieten.", business_type: "location", residence: "family", city: "Köln", price: "4,5", unit_cost: "1,2", fixed_costs: "3500", rent: "1800" });
    expect(has(cs, "meister", /ağırlık noktası/)).toBe(true);
    expect(has(cs, "meister", /Konditor/)).toBe(true);
    expect(has(cs, "bölge", /Hessen olarak tanınmadı/)).toBe(true);
    expect(has(cs, "vergi", /Gastronomi KDV: yiyecek %7/)).toBe(true);
    expect(has(cs, "eksik bilgi", /kapasite/)).toBe(true);
    expect(has(cs, "oturum", /SERBEST.*§4a/)).toBe(true);
  });

  it("Online mücevher satışı", () => {
    const cs = run({ idea: "Online-Shop für Goldschmuck aus der Türkei, Versand nach ganz Deutschland.", business_type: "online_products" });
    expect(has(cs, "izin", /GwG.*goAML/)).toBe(true);
    expect(has(cs, "eksik bilgi", /Nakit/)).toBe(true);
    expect(has(cs, "freiberuf", /Gewerbe/)).toBe(true);
  });

  it("Özel ders: Freiberuf, Kleinunternehmer", () => {
    const cs = run({ idea: "Online Türkçe özel ders veriyorum, çocuklara ve yetişkinlere dil kursu.", business_type: "online_service", hours: "10", price: "30", unit_cost: "0", fixed_costs: "50", personal_need: "0" });
    expect(has(cs, "freiberuf", /Öğretim → muhtemelen Freiberuf/)).toBe(true);
    expect(has(cs, "rechtsform", /Freiberufler \(kural 1\)/)).toBe(true);
    expect(has(cs, "vergi", /Kleinunternehmerregelung \(§19 UStG\) mümkün/)).toBe(true);
    expect(areaOf(cs, "meister")).toEqual([]);
  });

  it("Bar: alkollü servis bildirimi", () => {
    const cs = run({ idea: "Eine kleine Cocktailbar in Offenbach mit Snacks.", business_type: "location", city: "Offenbach" });
    expect(has(cs, "izin", /§14 GewO \+ §3 HGastG.*6 hafta/)).toBe(true);
  });

  it("ALG I + az saat: yan iş kuralı; Bürgergeld: Einstiegsgeld", () => {
    expect(has(run({ idea: "x", situation: "alg1", hours: "10" }), "teşvik", /15 saatin altında.*165 €/)).toBe(true);
    expect(has(run({ idea: "x", situation: "buergergeld" }), "teşvik", /Einstiegsgeld/)).toBe(true);
  });

  it("yanlış alarm yok", () => {
    const quiet = [
      "Online-Shop für Elektronik und Handyzubehör.", // elektronik satışı ≠ Elektrotechniker
      "Dükkanın altına bir depo kiralayıp ürünleri oradan göndereceğim.", // "altına" ≠ altın
      "Geldtransfer-App für Familien.", // para transferi ≠ yolcu taşıma
      "Wir machen es anders als die Konkurrenz.", // "anders" ≠ ders
      "IT-Security-Beratung für Arztpraxen.", // IT güvenliği ≠ Bewachung
      "Ev tadilatı ve renovasyon koordinasyonu.", // tadilat ≠ terzi
      "Ein Takeaway-Konzept, das vieles anders macht, mit Lieferung per Lastenrad.",
    ];
    for (const idea of quiet) {
      const cs = run({ idea, business_type: "online_service" });
      const loud = cs.filter((c) => ["meister", "izin"].includes(c.area));
      expect({ idea, loud: loud.map((c) => c.text.slice(0, 40)) }).toEqual({ idea, loud: [] });
    }
  });

  it("modele giden blok", () => {
    const t = checksText(run({ idea: "Barbershop", business_type: "location", residence: "student" }));
    expect(t).toMatch(/^KONTROLLER \(kural tabanından kodla çıkarıldı/);
    expect(t.indexOf("OTURUM:")).toBeLessThan(t.indexOf("MEISTER:"));
    expect(t).toMatch(/- \[engel, kesin, ✅, bölüm 7\] Sınıf: İZİN GEREKLİ/);
    expect(t).toContain("HALİL bloğuna");
    expect(checksText([])).toBe("");
  });
});
