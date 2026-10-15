// Yerel geliştirme verisi (PGlite). Çalıştır: npm run db:seed  (dev sunucusu kapalıyken)
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { devAnswers, DEV_IDS, devReportMd, DEV_SENT_AT } from "./dev-data";

async function main() {
  if (process.env.DATABASE_URL) throw new Error("Sadece yerel veritabanı için (DATABASE_URL boş olmalı)");
  const d = await db();
  for (const lang of ["de", "tr"] as const) {
    const id = DEV_IDS[lang];
    await d.delete(schema.submissions).where(eq(schema.submissions.id, id));
    await d.insert(schema.submissions).values({
      id, lang, status: "report_sent", confirmed: true, email: `dev-${lang}@example.org`, firstName: "Dev",
      answers: devAnswers(lang), consentAt: new Date(), confirmedAt: new Date(), reportSentAt: new Date(DEV_SENT_AT),
    });
    await d.insert(schema.reports).values({ submissionId: id, md: devReportMd(lang), sentAt: new Date(DEV_SENT_AT) });
    console.log(`${lang}: http://localhost:3000/${lang}/r?id=${id}`);
  }
  await seedAdmin(d);
}

// admin paneli için ---------------------------------------------------------------------------------------
// Yönetici panelinin tüm durumlarını gösteren ek başvurular (sabit id ve tarihler; görsel karşılaştırma ve davranış testi).
// Bekleyen taslağın zamanı tohumlama anı: 6 dakika sonra panelde "yarıda kaldı" hatası olarak görünür.
type Db = Awaited<ReturnType<typeof db>>;
const ADMIN_DEV_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `00000000-0000-4000-8000-0000000000b${n}`);

const PLAN_DE = {
  consent: true, units_m1: 8, units_m12: 40, growth_y2: 15, growth_y3: 10, payment_days: 30,
  p1_name: "DGUV-V3-Prüfung", p1_price: 285, p1_cost: 20, p1_share: 80, p2_name: "Wiederholungsprüfung", p2_price: 190, p2_cost: 10, p2_share: 20,
  inv_equipment: 4500, inv_it: 900, inv_founding: 600, c_insurance: 120, c_marketing: 250, c_vehicle: 380, c_it_phone: 60, c_accounting: 150,
  f_equity: 6000, f_bank_loan: 10000, f_bank_rate: 6.5, f_bank_years: 5, f_bank_grace: 6, gz_apply: "yes", alg1_monthly: 1500, pv_living: 1900, pv_health: 260,
  start_month: "2027-01", t_offer: "Prüfung ortsveränderlicher Geräte nach DGUV V3 inkl. Protokoll.", t_target: "Büros, Praxen, Handwerksbetriebe bis 50 Mitarbeiter.",
  t_competitors: "Große Prüfdienste mit langen Wartezeiten.", t_usp: "Termine innerhalb einer Woche, feste Preise.", t_location: "Frankfurt und Umland",
  t_marketing: "Direktansprache, Google-Profil, Kooperation mit Steuerbüros.", t_cv: "Elektroniker, 12 Jahre Erfahrung.", t_risks: "Krankheit: Kooperation mit zweitem Prüfer.",
};
const PLAN_TR = {
  consent: true, units_m1: 120, units_m12: 600, growth_y2: 20, payment_days: 0,
  inv_equipment: 18000, inv_renovation: 9000, inv_deposit: 3600, inv_stock: 2500, c_rent: 1800, c_utilities: 350, c_insurance: 90, c_staff_count: 1, c_staff_gross: 1600,
  f_equity: 12000, f_private_loan: 8000, f_private_repay: 300, f_bank_loan: 20000, f_bank_rate: 7, f_bank_years: 6,
  pv_living: 2100, pv_health: 300, start_month: "2027-03", t_offer: "Kahvaltı ve öğle yemeği, Türk mutfağı.", t_cv: "Aşçı, 8 yıl restoran deneyimi.",
};

async function seedAdmin(d: Db) {
  const [b1, b2, b3, b4, b5, b6, b7, b8, b9] = ADMIN_DEV_IDS;
  for (const id of ADMIN_DEV_IDS) await d.delete(schema.submissions).where(eq(schema.submissions.id, id));
  const at = (iso: string) => new Date(iso);
  const sub = (id: string, lang: "de" | "tr", created: string, o: Partial<typeof schema.submissions.$inferInsert>, answers: Record<string, string | boolean> = {}) =>
    d.insert(schema.submissions).values({
      id, lang, email: `admin-${id.slice(-2)}@example.org`, consentAt: at(created), createdAt: at(created), confirmed: true, confirmedAt: at(created),
      answers: { ...devAnswers(lang), ...answers }, ...o,
    });
  const cafe = {
    idea: "Kleines Café mit türkischem Frühstück\nund Mittagstisch in Offenbach.", current_solution: "Bäckereien und Imbisse in der Nähe.",
    business_type: "location", customers: "b2c", city: "Offenbach", capital: "15-50k", price: "9,50", unit_cost: "3,2", fixed_costs: "3200", rent: "1800",
    investment: "35000", personal_need: "2100", talked: "6-20", paid: "no", hours: "50", experience: "Koch, 8 Jahre", worry: "Ob der Standort genug Laufkundschaft hat.",
  };
  const model = "claude-opus-4-1";

  // 1) E-posta onayı bekleniyor (taslak yok)
  await sub(b1, "de", "2026-10-13T08:15:00.000Z", { firstName: "Lena", src: "insta", confirmed: false, confirmedAt: null }, { talked: "1-5", price_is_net: true });
  // 2) Taslak yazılıyor (yeni başladı)
  await sub(b2, "tr", "2026-10-12T17:40:00.000Z", { firstName: "Murat" }, cafe);
  await d.insert(schema.drafts).values({ submissionId: b2, state: "pending", model, createdAt: new Date() });
  // 3) Taslak hazır, göndermeden önce sorulacaklar var, rapor yok
  await sub(b3, "de", "2026-10-12T09:05:00.000Z", { firstName: "Jonas", src: "fb" }, { experience: "Elektroniker, 12 Jahre", worry: "Ob genug Firmen mitmachen.", hours: "20" });
  await d.insert(schema.drafts).values({
    submissionId: b3, state: "ready", md: devReportMd("de"), model, seconds: 94, createdAt: at("2026-10-12T09:07:30.000Z"),
    precheck: "1. Hast du schon eine Elektrofachkraft-Qualifikation?\n2. Wie viele Betriebe hast du schon angesprochen?",
  });
  // 4) Taslak hazır ama uyarılı (token sınırında kesildi)
  await sub(b4, "tr", "2026-10-11T14:20:00.000Z", { firstName: "Elif", status: "follow_up" }, { ...cafe, price_is_net: false });
  await d.insert(schema.drafts).values({
    submissionId: b4, state: "ready", md: devReportMd("tr").slice(0, 900), precheck: "", stopReason: "max_tokens", model, seconds: 181,
    error: "Taslak token sınırında kesildi (max_tokens); sonu eksik olabilir.", createdAt: at("2026-10-11T14:23:10.000Z"),
  });
  // 5) Başvuru yetersiz: rapor yazılmadı, başvurana mesaj
  await sub(b5, "de", "2026-10-10T11:00:00.000Z", { firstName: "Sven", status: "closed", src: "fb" },
    { idea: "Online-Shop", current_solution: "-", price: "", unit_cost: "", fixed_costs: "", investment: "" });
  await d.insert(schema.drafts).values({
    submissionId: b5, state: "insufficient", model, seconds: 12, createdAt: at("2026-10-10T11:01:00.000Z"),
    message: "Hallo Sven,\n\ndanke für deine Anfrage. Für eine belastbare Prüfung brauchen wir mehr Angaben: Was genau willst du verkaufen, an wen und zu welchem Preis?\n\nViele Grüße",
  });
  // 6) Taslak hatası, isimsiz başvuru
  await sub(b6, "tr", "2026-10-09T19:30:00.000Z", { firstName: null, status: "plan_link_sent", src: "google" }, { residence: "student", situation: "student", capital: "0-5k" });
  await d.insert(schema.drafts).values({ submissionId: b6, state: "error", error: "Anthropic API: 529 overloaded_error", model, createdAt: at("2026-10-09T19:31:00.000Z") });
  // 7) Rapor gönderildi + geri bildirim + plan, ödedi
  await sub(b7, "de", "2026-10-05T10:00:00.000Z", { firstName: "Anna", status: "paid", src: "insta", reportSentAt: at("2026-10-06T08:30:00.000Z") });
  await d.insert(schema.drafts).values({
    submissionId: b7, state: "ready", md: devReportMd("de"), precheck: "", model, seconds: 120, createdAt: at("2026-10-05T10:02:00.000Z"), editedAt: at("2026-10-06T08:20:00.000Z"),
  });
  await d.insert(schema.reports).values({ submissionId: b7, md: devReportMd("de"), sentAt: at("2026-10-06T08:30:00.000Z") });
  await d.insert(schema.feedback).values({
    submissionId: b7, useful: "5", next: "plan", wtp: "150-300", best: "Die Kostenrechnung.", missing: "Mehr zu Versicherungen.", createdAt: at("2026-10-07T12:00:00.000Z"),
  });
  await d.insert(schema.plans).values({ submissionId: b7, data: PLAN_DE, createdAt: at("2026-10-08T16:00:00.000Z"), updatedAt: at("2026-10-08T16:00:00.000Z") });
  // 8) Rapor gönderildi + geri bildirim (şimdilik bir şey istemiyor), TR
  await sub(b8, "tr", "2026-10-03T07:45:00.000Z", { firstName: "Ayşe", status: "feedback", reportSentAt: at("2026-10-04T09:00:00.000Z") }, cafe);
  await d.insert(schema.drafts).values({ submissionId: b8, state: "ready", md: devReportMd("tr"), precheck: "", model, seconds: 88, createdAt: at("2026-10-03T07:47:00.000Z") });
  await d.insert(schema.reports).values({ submissionId: b8, md: devReportMd("tr"), sentAt: at("2026-10-04T09:00:00.000Z") });
  await d.insert(schema.feedback).values({ submissionId: b8, useful: "3", next: "none", wtp: "0", createdAt: at("2026-10-05T18:10:00.000Z") });
  // 9) Plan gönderildi, TR, plan verisi var, geri bildirim yok
  await sub(b9, "tr", "2026-09-28T13:00:00.000Z", { firstName: "Can", status: "plan_sent", src: "insta", reportSentAt: at("2026-09-29T10:00:00.000Z") }, { ...cafe, price_is_net: false });
  await d.insert(schema.drafts).values({ submissionId: b9, state: "ready", md: devReportMd("tr"), precheck: "", model, seconds: 101, createdAt: at("2026-09-28T13:03:00.000Z") });
  await d.insert(schema.reports).values({ submissionId: b9, md: devReportMd("tr"), sentAt: at("2026-09-29T10:00:00.000Z") });
  await d.insert(schema.plans).values({ submissionId: b9, data: PLAN_TR, createdAt: at("2026-10-01T09:00:00.000Z"), updatedAt: at("2026-10-02T09:30:00.000Z") });
  console.log(`admin: ${ADMIN_DEV_IDS.length} örnek başvuru, http://localhost:3000/admin`);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
