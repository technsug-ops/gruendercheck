// v1 → Postgres veri taşıma: v1 kayıt biçimleri (legacy/api/*.js ile aynı alanlar) aktarılır, yeni sistemde çalışır.
import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => { process.env.PGLITE_DIR = "memory://"; });

const A = "11111111-1111-4111-8111-111111111111", B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333", OLD = "44444444-4444-4444-8444-444444444444";
const TOKEN_A = "0123456789abcdef0123456789abcdef";

const v1 = {
  "submissions/": [
    { id: A, submitted_at: "2026-10-10T08:00:00.000Z", status: "follow_up", status_changed_at: "2026-10-12T09:00:00.000Z", confirmed: false, confirm_token: TOKEN_A,
      lang: "de", idea: "Mobile Fahrradwerkstatt", current_solution: "Werkstatt", business_type: "onsite_service", city: "Frankfurt", residence: "de_eu",
      situation: "employed_full", capital: "5-15k", price: "45", price_is_net: true, email: "a@example.org", first_name: "Ayşe", consent: true, src: "insta",
      feedback: { useful: "4", next: "plan", wtp: "50-150", best: "Zahlen", at: "2026-10-12T09:00:00.000Z" } },
    { id: B, submitted_at: "2026-10-11T08:00:00.000Z", status: "report_sent", confirmed: true, confirmed_at: "2026-10-11T08:05:00.000Z",
      confirm_token: "fedcba9876543210fedcba9876543210", report_sent_at: "2026-10-11T10:00:00.000Z",
      lang: "tr", idea: "Kafe", current_solution: "Yok", business_type: "location", city: "Köln", residence: "settlement", situation: "alg1",
      capital: "15-50k", email: "b@example.org", consent: true },
    // Onay özelliğinden önceki kayıt: confirmed alanı ve kodu yok → onaylı sayılır.
    { id: OLD, submitted_at: "2026-10-01T08:00:00.000Z", lang: "de", idea: "Alt", email: "old@example.org", consent: true, status: "uydurma" },
    { id: "kein-uuid", submitted_at: "2026-10-01T08:00:00.000Z", email: "x@example.org" },
  ],
  "drafts/": [
    { id: A, created_at: "2026-10-10T08:10:00.000Z", model: "claude-sonnet-5-5", kb: "2026-10-14", seconds: 95, usage: { input_tokens: 10 }, stop_reason: "end_turn", precheck: "Frage?", md: "# Bericht A" },
    { id: B, created_at: "2026-10-11T08:06:00.000Z", pending: true },
    { id: OLD, created_at: "2026-10-01T08:06:00.000Z", insufficient: true, message: "Bitte erneut ausfüllen." },
    { id: C, created_at: "2026-10-01T08:06:00.000Z", md: "# Waise" }, // başvurusu silinmiş
  ],
  "reports/": [{ id: B, lang: "tr", md: "# Rapor B\nAlt başlık\n\n## 1. Pazar\nMetin", sent_at: "2026-10-11T10:00:00.000Z" }],
  "plans/": [{ id: A, submitted_at: "2026-10-12T10:00:00.000Z", consent: true, units_m1: 5, units_m12: 40, f_equity: 8000, t_offer: "Reparatur" }],
};

describe("v1 veri taşıma", () => {
  it("aktarır, yeni sistemde çalışır, tekrar çalıştırılabilir", async () => {
    const { importAll } = await import("@/scripts/import-blob");
    const { db, schema } = await import("@/lib/db");
    const read = (p: string) => structuredClone(v1[p as keyof typeof v1]) as Record<string, unknown>[];

    const dry = await importAll(read, { dry: true });
    expect(dry.submissions).toBe(3);
    expect(await (await db()).select().from(schema.submissions)).toHaveLength(0); // kuru çalıştırma yazmaz

    const s1 = await importAll(read);
    expect(s1).toMatchObject({ submissions: 3, feedback: 1, drafts: 3, reports: 1, plans: 1 });
    expect(s1.skipped).toHaveLength(2); // geçersiz id + başvurusu olmayan taslak
    expect(s1.skipped.join(" ")).not.toMatch(/@example/); // çıktıda kişisel veri yok

    const { getSubmission, findForConfirm } = await import("@/lib/data/submissions");
    const a = (await getSubmission(A))!;
    expect(a).toMatchObject({ lang: "de", status: "follow_up", confirmed: false, email: "a@example.org", firstName: "Ayşe", src: "insta" });
    expect(a.answers).toMatchObject({ idea: "Mobile Fahrradwerkstatt", price: "45", price_is_net: true });
    expect(a.answers).not.toHaveProperty("email");
    expect(a.answers).not.toHaveProperty("consent");
    expect(a.answers).not.toHaveProperty("feedback");
    // Eski e-postadaki onay linki çalışmaya devam eder (kod hash'lenerek taşındı).
    expect((await findForConfirm(A, TOKEN_A))?.id).toBe(A);
    expect(await findForConfirm(A, "f".repeat(32))).toBeNull();
    expect((await getSubmission(OLD))!).toMatchObject({ confirmed: true, status: "new", confirmTokenHash: null });

    // Rapor linki (/tr/r?id=B), plan formu ve panel
    const { getReport } = await import("@/lib/data/reports");
    expect(await getReport(B)).toMatchObject({ lang: "tr", md: "# Rapor B\nAlt başlık\n\n## 1. Pazar\nMetin" });
    const { getPlanForm } = await import("@/lib/data/plans");
    expect((await getPlanForm(A))!.plan).toEqual({ consent: true, units_m1: 5, units_m12: 40, f_equity: 8000, t_offer: "Reparatur" });
    const { listForAdmin } = await import("@/lib/data/admin");
    const items = await listForAdmin();
    const byId = Object.fromEntries(items.map((i) => [i.id, i]));
    expect(byId[A]).toMatchObject({ draft: { md: "# Bericht A", precheck: "Frage?", model: "claude-sonnet-5-5", seconds: 95 },
      feedback: { useful: "4", next: "plan", wtp: "50-150", best: "Zahlen" }, plan: { units_m1: 5 } });
    expect(byId[B]).toMatchObject({ draft: { error: expect.stringContaining("tamamlanmamıştı") }, report: { sent_at: "2026-10-11T10:00:00.000Z" } });
    expect(byId[OLD]).toMatchObject({ draft: { insufficient: true, message: "Bitte erneut ausfüllen." } });

    // Tekrar çalıştırma: kopya yok, sayılar aynı
    const s2 = await importAll(read);
    expect(s2).toMatchObject({ submissions: 3, feedback: 1, drafts: 3, reports: 1, plans: 1 });
    for (const [t, n] of [[schema.submissions, 3], [schema.drafts, 3], [schema.reports, 1], [schema.plans, 1], [schema.feedback, 1]] as const) {
      expect(await (await db()).select().from(t)).toHaveLength(n);
    }
  });
});
