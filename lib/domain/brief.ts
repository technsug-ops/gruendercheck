// Başvurudan rapor modeline giden metin. Admin ("Claude için kopyala") ve otomatik taslak aynı fonksiyonu kullanır.
// İsim ve e-posta bu metne asla girmez (Q'da yoklar).
// v1: legacy/brief.js
import { type Answers, calculate, suggestVat, toText } from "./calc";

export const Q: Record<string, string> = {
  idea: "1. İş fikri", current_solution: "2. Müşteriler bugün nasıl çözüyor", talked: "3. Konuşulan potansiyel müşteri sayısı",
  paid: "3b. Ödeme veya kesin söz", business_type: "4. İşin türü", customers: "4b. Müşteriler", city: "5. Şehir / semt",
  residence: "6. Oturum durumu", situation: "7. Şu anki durum", hours: "8. Haftalık saat", founders: "9. Kurucu sayısı",
  experience: "10. Eğitim ve deneyim", capital: "11. Öz sermaye", rev_model: "12. Gelir modeli", price: "12a. Fiyat (€)",
  price_unknown: "12a. Fiyatını henüz bilmiyor", competitor_price: "12a. Rakip fiyatı (€)", price_is_net: "12a. Fiyat net mi",
  unit_cost: "12c. Satış başına malzeme (€)", fixed_costs: "12b. Aylık sabit gider (€)", rent: "12b. Bunun kira kısmı (€)",
  investment: "12d. Kuruluş yatırımı (€)", personal_need: "15. Aylık kişisel ihtiyaç (€)", delivery_days: "16. Teslim süresi (gün)",
  worry: "13. En büyük endişe",
};
export const V: Record<string, Record<string, string>> = {
  talked: { "0": "Kimseyle", "1-5": "1–5", "6-20": "6–20", "20+": "20'den fazla" },
  paid: { no: "Hayır", yes: "Evet" },
  business_type: { location: "Mekan (dükkan, kafe, salon)", onsite_service: "Müşteriye giderek hizmet", online_service: "Online hizmet", online_products: "Online ürün satışı", production: "Üretim", other: "Diğer" },
  customers: { b2c: "Bireyler (B2C)", b2b: "Şirketler (B2B)", both: "İkisi de" },
  residence: { de_eu: "Alman / AB vatandaşı", settlement: "Niederlassungserlaubnis / Daueraufenthalt-EU", student: "Öğrenci oturumu (§16b)", job_search: "Mezuniyet sonrası iş arama (§20)", blue_card: "Blaue Karte / Fachkraft", family: "Aile birleşimi", other: "Diğer", abroad: "Henüz Almanya'da değil" },
  situation: { employed_full: "Tam zamanlı çalışan", employed_part: "Yarı zamanlı çalışan", alg1: "İşsiz (ALG I)", buergergeld: "Bürgergeld", student: "Öğrenci", self_employed: "Zaten serbest" },
  founders: { "1": "Tek", "2": "İki", "3+": "Üç veya fazla" },
  capital: { "0-5k": "0–5.000 €", "5-15k": "5.000–15.000 €", "15-50k": "15.000–50.000 €", "50k+": "50.000 €+" },
  price_is_net: { true: "Evet, net (B2B)", false: "Hayır, brüt" },
  price_unknown: { true: "Evet", false: "Hayır" },
  rev_model: { one_time: "Tek seferlik satış", subscription: "Aylık abonelik (fiyat = aylık ücret)", project: "Proje bazlı", commission: "Komisyon / aracılık" },
};
/** Seçenek kodunu okunur etikete çevirir; bilinmiyorsa değerin kendisi. */
export const val = (k: string, v: unknown) => (Object.hasOwn(V, k) && Object.hasOwn(V[k], String(v)) ? V[k][String(v)] : v);
export const calcText = (it: Answers, vatKey?: string) => toText(calculate(it, vatKey || suggestVat(it)));

/** "Claude için kopyala" metni: form cevapları + kodla hesaplanan sayılar. submittedAt: ISO tarih. */
export function briefText(it: Answers, submittedAt: string, vatKey?: string): string {
  const langName = it.lang === "tr" ? "Türkçe" : "Almanca";
  const lines = [`Rapor yaz. Form dili: ${langName} → raporu ${langName} yaz.`, `Gönderim tarihi: ${String(submittedAt).slice(0, 10)}`, ""];
  for (const [k, label] of Object.entries(Q)) {
    if (it[k] === undefined || it[k] === "") continue;
    lines.push(`${label}: ${val(k, it[k])}`);
  }
  lines.push("", calcText(it, vatKey));
  return lines.join("\n");
}
