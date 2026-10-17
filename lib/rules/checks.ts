// KONTROLLER: kural tabanını form cevaplarına kodla uygular (HESAPLAR'ın kural karşılığı). Model bu maddeleri
// yeniden türetmez; "kesin" maddeleri aynen uygular, "olası" maddeleri fikir metniyle doğrular.
// Sıra kural tabanının karar ağacı (bölüm 9): oturum → Meister → izin → Freiberuf/Gewerbe → Rechtsform → vergi → finansman.
import { type Answers, calculate, fmt, num, suggestVat } from "@/lib/domain/calc";
import {
  ALCOHOL, FREIBERUF, GASTRO, HANDWERK_B, HEBESATZ, HESSEN, KB_RULES_CHECKED, type KeywordRule, MEISTER_A, MEISTER_PATHS,
  NUM, PERMITS, PRODUCTION_FOOD, RESIDENCE, type Status, TURKISH_CITIZEN_NOTE,
} from "./tables";

export type Area = "oturum" | "meister" | "izin" | "freiberuf" | "rechtsform" | "vergi" | "teşvik" | "bölge" | "eksik bilgi";
export interface Check {
  area: Area;
  /** engel: raporun ilk sayfasına (çözüm yoluyla) · uyarı: risklere · bilgi: ilgili bölüme */
  level: "engel" | "uyarı" | "bilgi";
  /** kesin: seçili alanlardan · olası: fikir metnindeki anahtar kelimeden (model doğrulamalı) */
  certainty: "kesin" | "olası";
  text: string;
  status: Status;
  kb: string;
}

const textOf = (a: Answers) => [a.idea, a.current_solution, a.experience].map((x) => String(x ?? "")).join(" \n ");
const matches = (rules: KeywordRule[], text: string) => rules.filter((r) => r.re.test(text));

export function runChecks(a: Answers): Check[] {
  const out: Check[] = [];
  const push = (c: Check) => out.push(c);
  const text = textOf(a);
  const hours = num(a.hours);
  const gastro = a.business_type === "location" && GASTRO.test(text) || GASTRO.test(String(a.idea ?? ""));

  // 1) Oturum (bölüm 7)
  const res = RESIDENCE[String(a.residence)];
  if (res) {
    push({ area: "oturum", level: res.cls === "serbest" ? "bilgi" : "engel", certainty: "kesin",
      text: `Sınıf: ${res.cls.toLocaleUpperCase("tr-TR")}. ${res.text}`, status: res.status, kb: "7" });
    if (res.cls !== "serbest" || a.residence === "abroad") push({ area: "oturum", level: "uyarı", certainty: "olası", text: TURKISH_CITIZEN_NOTE, status: "🔴", kb: "7" });
  }

  // 2) Meisterpflicht (bölüm 4)
  const meister = matches(MEISTER_A, text);
  for (const m of meister) {
    push({ area: "meister", level: "engel", certainty: "olası",
      text: `Olası Anlage A mesleği: ${m.text}. Kullanıcının Meister'i veya eşdeğeri yoksa Handwerksrolle kaydı olmaz. ${MEISTER_PATHS}`, status: m.status, kb: m.kb });
  }
  if (gastro && PRODUCTION_FOOD.test(text)) {
    push({ area: "meister", level: "uyarı", certainty: "olası",
      text: "Gastronomi + üretim: ağırlık noktası belirleyici (IHK München 03/2020). Kafede kendi pastası gastronomi; ağırlık paket/sipariş ürün satışındaysa Bäcker/Konditor (Anlage A). Ön kontrol sorusu: \"Cironun çoğu oturan müşteriden mi, paket/sipariş satışından mı?\"", status: "✅", kb: "4" });
  }
  for (const b of matches(HANDWERK_B, text)) push({ area: "meister", level: "bilgi", certainty: "olası", text: `${b.text}: Meister gerekmez, Handwerkskammer'e bildirim.`, status: b.status, kb: b.kb });

  // 3) İzne tabi işler (bölüm 5)
  for (const p of matches(PERMITS, text)) {
    if (p.id === "gaststaette" && !gastro && !ALCOHOL.test(String(a.idea ?? ""))) continue;
    push({ area: "izin", level: p.status === "🔴" ? "engel" : "uyarı", certainty: "olası", text: `${p.text}. İzin süresi nakit akışında gelirsiz bekleme olarak hesaba katılmalı.`, status: p.status, kb: p.kb });
  }

  // 4) Freiberuf / Gewerbe (bölüm 1)
  const fb = matches(FREIBERUF, text);
  if (fb.length) for (const f of fb) push({ area: "freiberuf", level: "bilgi", certainty: "olası", text: `${f.text}. Kesin hüküm yok: Finanzamt'ın Fragebogen zur steuerlichen Erfassung değerlendirmesi belirleyici.`, status: f.status, kb: f.kb });
  else if (["location", "online_products", "production"].includes(String(a.business_type)) || gastro)
    push({ area: "freiberuf", level: "bilgi", certainty: "kesin", text: "İşin türü (mekan / ürün satışı / üretim) → Gewerbe: Gewerbeanmeldung, IHK üyeliği, Gewerbesteuer.", status: "✅", kb: "1" });

  // 5) Rechtsform (bölüm 2, karar kuralları 1–5)
  const founders = String(a.founders || "1");
  const highRisk = gastro || a.business_type === "production" || meister.length > 0 || /bau\b|inşaat|lebensmittel|gıda/i.test(text);
  const cap = String(a.capital || "");
  const sideline = (hours !== null && hours < 20) || a.situation === "employed_full" || a.situation === "employed_part" || a.situation === "student";
  let rf: string;
  if (founders === "1" && fb.some((f) => ["lehre", "uebersetzung", "kreativ"].includes(f.id)) && !highRisk) rf = "Freiberufler (kural 1).";
  else if (founders === "1" && !highRisk) rf = "Einzelunternehmen (kural 2: tek kurucu, düşük sorumluluk riski).";
  else if (founders === "1") rf = cap === "50k+" ? "GmbH (kural 3: yüksek risk, sermaye ≥ 25.000 €)." : cap === "15-50k" ? "UG veya GmbH (kural 3): sermaye aralığı 25.000 €'yu kesiyor, gerçek tutar belirleyici." : "UG (kural 3: yüksek risk — gıda/üretim/el sanatı —, sermaye < 25.000 €). 🔴 '1 € sermaye' yanıltır: fiilen 1.000–3.000 € başlangıç sermayesi.";
  else rf = (highRisk ? "UG/GmbH (kural 4: birden fazla kurucu, yüksek risk)." : "GbR (kural 4: birden fazla kurucu, düşük risk).") + " Her durumda yazılı ortaklık sözleşmesi.";
  if (sideline) rf += " Yan iş / test aşaması: Einzelunternehmen ile başla, ciro ve risk artınca UG'ye geç (kural 5).";
  push({ area: "rechtsform", level: "bilgi", certainty: highRisk && meister.length ? "olası" : "kesin", text: `Önerilen başlangıç: ${rf}`, status: "⚠️", kb: "2" });

  // 6) Vergi (bölüm 3): HESAPLAR'daki başabaş cirosundan yıllık ölçek
  const calc = calculate(a, suggestVat(a));
  if (calc.ok && calc.values.breakeven_revenue_net) {
    const yearly = calc.values.breakeven_revenue_net * 12;
    const b2b = a.customers === "b2b" || a.customers === "both";
    push({ area: "vergi", level: "bilgi", certainty: "kesin",
      text: yearly <= NUM.kleinunternehmerPrev
        ? `Başabaşta yıllık net ciro ≈ ${fmt(yearly)} € ≤ ${fmt(NUM.kleinunternehmerPrev)} €: Kleinunternehmerregelung (§19 UStG) mümkün${b2b ? "; ama B2B müşteride ve yüksek başlangıç yatırımında dezavantaj (Vorsteuer düşülemez)" : ""}. Cari yılda ${fmt(NUM.kleinunternehmerCur)} € aşılırsa o andan itibaren %19 USt.`
        : `Başabaşta yıllık net ciro ≈ ${fmt(yearly)} € > ${fmt(NUM.kleinunternehmerPrev)} €: Kleinunternehmerregelung pratikte yok, KDV (USt) beyanı gerekir; Istversteuerung (ödeme gelince) varsayılan ⚠️.`,
      status: "✅", kb: "3" });
    push({ area: "vergi", level: "bilgi", certainty: "kesin", text: `Gewerbesteuer: Einzelunternehmen/kişi ortaklığında yıllık kâr ${fmt(NUM.gewstFreibetrag)} € altında GewSt yok; UG/GmbH'de muafiyet yok (KSt %15 + Soli + GewSt ≈ %30–32).`, status: "✅", kb: "3" });
  }
  if (gastro) push({ area: "vergi", level: "bilgi", certainty: "olası", text: "Gastronomi KDV: yiyecek %7 (01.01.2026'dan beri kalıcı, yerinde ve paket), içecek %19. HESAPLAR genel %19 ile hesaplandıysa raporda karışım oranını (kafe ≈ %50/%50, restoran ≈ %30/%70) varsayım olarak belirt.", status: "✅", kb: "3" });

  // 7) Teşvik ve durum (bölüm 6, 8)
  if (a.situation === "alg1") {
    push({ area: "teşvik", level: "uyarı", certainty: "kesin",
      text: `ALG I: Gründungszuschuss koşulları — kalan hak en az ${NUM.gzMinDays} gün, başvuru serbest çalışma BAŞLAMADAN önce, tam zamanlı faaliyet, fachkundige Stellungnahme; takdire bağlı (hak değil). Faz 1: 6 ay ALG I + 300 €, Faz 2: 9 ay 300 € (takdir). Doğru sıra: 1) AVGS koçluk talebi (Gewerbe kaydından önce) 2) iş planı + uzman görüşü 3) GZ başvurusu 4) onaydan sonra Gewerbe kaydı. Son başlangıç günü = ALG I bitişi − ${NUM.gzMinDays} gün: Bewilligungsbescheid tarihi formda yok → kesin tarih YAZMA, ön kontrol sorusu sor.`,
      status: "✅", kb: "6" });
    if (hours !== null && hours < NUM.algNebenHours) push({ area: "teşvik", level: "uyarı", certainty: "kesin", text: `ALG I + yan iş: haftada ${NUM.algNebenHours} saatin altında kalınmalı; aylık ${NUM.algNebenFree} € üzerindeki kâr ALG'den düşülür ⚠️ (2021 belgesi, Arbeitsagentur'dan doğrula).`, status: "⚠️", kb: "3" });
  }
  if (a.situation === "buergergeld") push({ area: "teşvik", level: "bilgi", certainty: "kesin", text: "Bürgergeld: Einstiegsgeld (§16b SGB II) en fazla 2 yıl, Regelbedarf'ın %50'si (en fazla %100), tamamen takdire bağlı ⚠️ Jobcenter'dan doğrula.", status: "⚠️", kb: "6" });

  // 8) Bölge: kural tabanının eyalete bağlı kısmı (Gaststätte bildirimi, Mikrodarlehen, Hebesatz) Hessen'e göre
  const city = String(a.city ?? "");
  const hessen = HESSEN.test(city);
  if (!hessen) push({ area: "bölge", level: "uyarı", certainty: "olası", text: `Şehir (\"${city.slice(0, 60)}\") Hessen olarak tanınmadı: kural tabanının eyalete bağlı kuralları (Gaststätte bildirimi, Hessen-Mikrodarlehen, Hebesatz) Hessen içindir. Bu eyalet için "ilgili eyalet makamıyla / teşvik bankasıyla doğrula" yaz; Hessen programlarını önerme.`, status: "⚠️", kb: "5, 8" });
  const heb = HEBESATZ.find(([re]) => re.test(city));
  if (heb) push({ area: "vergi", level: "bilgi", certainty: "kesin", text: `Gewerbesteuer Hebesatz ${heb[1]}: %${heb[2]} ⚠️ (yıllık belediye kararı).`, status: "⚠️", kb: "3" });

  // 9) Finansman: HESAPLAR'daki sermaye açığına göre
  if (calc.ok && calc.values.gap_worst != null && calc.values.gap_worst > 0) {
    const gap = calc.values.gap_worst;
    push({ area: "teşvik", level: "bilgi", certainty: "kesin",
      text: gap <= NUM.mikrodarlehenMax && hessen
        ? `Sermaye açığı en kötü durumda ≈ ${fmt(gap)} € ≤ ${fmt(NUM.mikrodarlehenMax)} €: Hessen-Mikrodarlehen (WIBank, 3.000–35.000 €, 7 yıl; önce işbirlikçi danışmanlık; tamamlanmış proje finanse edilmez) ✅.`
        : `Sermaye açığı en kötü durumda ≈ ${fmt(gap)} €: KfW ERP-Gründerkredit StartGeld (125.000 €'ya kadar, Hausbank üzerinden) ⚠️${hessen ? "" : "; eyaletin kendi mikro kredi programı Förderdatenbank'tan araştırılmalı"}.`,
      status: gap <= NUM.mikrodarlehenMax && hessen ? "✅" : "⚠️", kb: "8" });
  }

  // 10) Formun sormadığı ama kural tabanının istediği bilgiler → ön kontrol sorusu adayları
  const missing: string[] = [];
  if (meister.length) missing.push("Meister/Geselle belgesi var mı, diploma hangi ülkeden (AB dışı mühendis diploması otomatik eşit sayılmaz)?");
  if (a.situation === "alg1") missing.push("ALG I başlangıç tarihi ve Bewilligungsbescheid'deki bitiş tarihi?");
  if (res && res.cls !== "serbest") missing.push("Vatandaşlık (Türk vatandaşı mı: ARB 1/80)?");
  if (a.business_type === "location") missing.push("Oturma/servis kapasitesi ve açık saatler (kapasite hesabı için)?");
  if (PERMITS.find((p) => p.id === "edelmetall")!.re.test(text)) missing.push("Nakit ödeme kabul edilecek mi (GwG 2.000 € eşiği)?");
  for (const m of missing) push({ area: "eksik bilgi", level: "bilgi", certainty: "kesin", text: m, status: "✅", kb: "—" });

  return out;
}

// Sıra ve başlıklar açıkça yazılı: Türkçe/Almanca karışık terimlerde otomatik büyük harf (i/İ) güvenilmez.
const SECTIONS: [Area, string][] = [
  ["oturum", "OTURUM"], ["meister", "MEISTER"], ["izin", "İZİN"], ["freiberuf", "FREIBERUF / GEWERBE"], ["rechtsform", "RECHTSFORM"],
  ["vergi", "VERGİ"], ["teşvik", "TEŞVİK"], ["bölge", "BÖLGE"], ["eksik bilgi", "EKSİK BİLGİ"],
];

/** Modele verilecek blok (HESAPLAR'ın hemen altına). */
export function checksText(checks: Check[]): string {
  if (!checks.length) return "";
  const L = [`KONTROLLER (kural tabanından kodla çıkarıldı, ${KB_RULES_CHECKED} — "kesin" maddeleri aynen uygula; "olası" maddeleri fikir metniyle doğrula, uymuyorsa yok say ve raporda anma; ⚠️/🔴 durumunu raporda "⚠️ doğrulanmalı" diye taşı)`];
  for (const [area, title] of SECTIONS) {
    const cs = checks.filter((c) => c.area === area);
    if (!cs.length) continue;
    L.push(`${title}:`);
    for (const c of cs) L.push(`- [${c.level}, ${c.certainty}, ${c.status}, bölüm ${c.kb}] ${c.text}`);
  }
  if (checks.some((c) => c.area === "eksik bilgi")) L.push('("EKSİK BİLGİ" maddeleri sonucu değiştiriyorsa HALİL bloğuna en fazla 3 soru olarak taşı.)');
  return L.join("\n");
}
