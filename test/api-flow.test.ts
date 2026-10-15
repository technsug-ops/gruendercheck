// Uçtan uca API akışı (gerçek route handler'lar, bellek içi Postgres, sahte Claude, deneme modunda e-posta).
import { beforeAll, describe, expect, it, vi } from "vitest";

const pending: Promise<unknown>[] = [];
vi.mock("next/server", async (orig) => ({ ...(await orig<typeof import("next/server")>()), after: (fn: () => unknown) => { pending.push(Promise.resolve().then(fn)); } }));

let claudeText = "===HALİL===\n- Kira sözleşmesi var mı?\n===RAPOR===\n# Prüfservice\nUntertitel\n\n## 1. Markt\nText";
let claudeStop: "end_turn" | "max_tokens" = "end_turn";
const claudeCalls: string[] = [];
vi.mock("@/lib/ai/draft", async (orig) => ({
  ...(await orig<typeof import("@/lib/ai/draft")>()),
  callClaude: async (text: string) => {
    claudeCalls.push(text);
    return { text: claudeText, model: "test-model", usage: { input_tokens: 1, output_tokens: 1 }, stopReason: claudeStop };
  },
}));

beforeAll(() => {
  Object.assign(process.env, {
    PGLITE_DIR: "memory://", MAIL_DRY: "1", SMTP_USER: "t", SMTP_PASS: "t", MAIL_FROM: "rapor@example.org",
    NOTIFY_TO: "halil@example.org", ANTHROPIC_API_KEY: "test", ADMIN_PASSWORD: "pw",
  });
});

const IDEA = "Mobile Fahrradwerkstatt für Pendler in Frankfurt mit Abholung am Arbeitsplatz und Reparatur noch am selben Tag, Abrechnung über den Arbeitgeber.";
const form = (over: Record<string, unknown> = {}) => ({
  lang: "de", idea: IDEA, current_solution: "Sie bringen das Rad selbst zur Werkstatt und warten.", business_type: "onsite_service",
  city: "Frankfurt", residence: "de_eu", situation: "employed_full", capital: "5-15k", email: "ayse@example.org",
  first_name: "Ayşe", consent: true, price: "45", unit_cost: "8", fixed_costs: "600", src: "insta", ...over,
});
const post = (body: unknown, ip = "1.2.3.4") =>
  new Request("http://localhost/api/x", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip }, body: JSON.stringify(body) });
const settle = async () => { while (pending.length) await pending.shift(); };

describe("API akışı", () => {
  it("başvuru → onay → taslak → rapor → geri bildirim → plan → silme", async () => {
    const { POST: submit } = await import("@/app/api/submit/route");
    const confirm = await import("@/app/api/confirm/route");
    const { POST: feedback } = await import("@/app/api/feedback/route");
    const { POST: plan } = await import("@/app/api/plan/route");
    const { dryOutbox } = await import("@/lib/mail");
    const { getSubmission } = await import("@/lib/data/submissions");
    const { getDraft } = await import("@/lib/data/drafts");
    const { getReport } = await import("@/lib/data/reports");
    const { getPlanForm } = await import("@/lib/data/plans");
    const { getFeedbackState } = await import("@/lib/data/feedback");
    const { publishReport } = await import("@/lib/report/publish");
    const { db, schema } = await import("@/lib/db");

    // Reddedilenler
    expect((await submit(post(form({ idea: "zu kurz" })))).status).toBe(400);
    expect(await (await submit(post(form({ consent: false })))).json()).toEqual({ ok: false, error: "consent" });
    expect(await (await submit(post(form({ email: "kein-mail" })))).json()).toEqual({ ok: false, error: "email" });
    const hp = await submit(post(form({ website: "http://spam" })));
    expect(await hp.json()).toEqual({ ok: true });
    expect(await (await db()).select().from(schema.submissions)).toHaveLength(0); // honeypot hiçbir şey saklamaz

    // Başvuru
    dryOutbox.length = 0;
    const r = await submit(post(form()));
    expect(await r.json()).toEqual({ ok: true });
    expect(dryOutbox).toHaveLength(1);
    expect(dryOutbox[0].subject).toBe("Bitte bestätige deine E-Mail – Gründungs-Check");
    const link = dryOutbox[0].text.match(/https:\/\/foundercheck\.de\/api\/confirm\?id=([0-9a-f-]{36})&t=([0-9a-f]{32})/)!;
    const [, id, token] = link;
    const sub = (await getSubmission(id))!;
    expect(sub).toMatchObject({ lang: "de", email: "ayse@example.org", firstName: "Ayşe", src: "insta", confirmed: false });
    expect(sub.confirmTokenHash).not.toContain(token); // kod düz saklanmaz
    expect(sub.answers).not.toHaveProperty("email");
    expect(sub.answers).not.toHaveProperty("first_name");
    expect(sub.answers.price).toBe("45");

    // Onay: GET sadece düğme gösterir
    const g = await confirm.GET(new Request(`http://localhost/api/confirm?id=${id}&t=${token}`));
    expect(await g.text()).toContain('<button type="submit">E-Mail bestätigen</button>');
    expect((await getSubmission(id))!.confirmed).toBe(false);
    const fd = (t: string) => { const f = new FormData(); f.set("id", id); f.set("t", t); return new Request("http://localhost/api/confirm", { method: "POST", body: f }); };
    expect(await (await confirm.POST(fd("0".repeat(32)))).text()).toContain("Dieser Link ist ungültig");

    dryOutbox.length = 0;
    expect(await (await confirm.POST(fd(token))).text()).toContain("Danke, deine E-Mail ist bestätigt.");
    await settle();
    expect((await getSubmission(id))!.confirmed).toBe(true);
    expect(claudeCalls).toHaveLength(1);
    expect(claudeCalls[0]).not.toMatch(/Ayşe|ayse@example/); // modele isim/e-posta gitmez
    const draft = (await getDraft(id))!;
    expect(draft).toMatchObject({ state: "ready", precheck: "- Kira sözleşmesi var mı?", model: "test-model", error: null });
    expect(draft.md).toMatch(/^# Prüfservice/);
    expect(dryOutbox.map((m) => m.subject)).toEqual(["Yeni başvuru – Gründungs-Check", "Rapor taslağı hazır – onay bekliyor – Gründungs-Check"]);
    expect(dryOutbox.every((m) => m.to === "halil@example.org" && !m.text.includes(IDEA))).toBe(true);

    // İkinci onay: taslak tekrar yazılmaz
    expect(await (await confirm.POST(fd(token))).text()).toContain("bereits bestätigt");
    await settle();
    expect(claudeCalls).toHaveLength(1);

    // Rapor gönderimi
    dryOutbox.length = 0;
    const pub = await publishReport((await getSubmission(id))!, draft.md!);
    expect(pub).toMatchObject({ ok: true, url: `https://foundercheck.de/de/r?id=${id}` });
    expect(dryOutbox[0]).toMatchObject({ to: "ayse@example.org", subject: "Dein Bericht ist fertig – Gründungs-Check" });
    expect(dryOutbox[0].text).toContain(`https://foundercheck.de/de/feedback?id=${id}`);
    expect((await getSubmission(id))!.status).toBe("report_sent");
    expect(await getReport(id)).toMatchObject({ lang: "de", md: draft.md });

    // Geri bildirim
    expect((await feedback(post({ id, useful: "9", next: "plan", wtp: "0" }))).status).toBe(400);
    expect(await (await feedback(post({ id, useful: "4", next: "plan", wtp: "50-150", best: "Zahlen" }))).json()).toEqual({ ok: true });
    expect((await getSubmission(id))!.status).toBe("follow_up");
    expect(await getFeedbackState(id)).toEqual({ done: true });
    await feedback(post({ id, useful: "2", next: "none", wtp: "0" })); // tekrar: üstüne yazar
    const fbRows = await (await db()).select().from(schema.feedback);
    expect(fbRows).toHaveLength(1);
    expect(fbRows[0]).toMatchObject({ useful: "2", best: null });
    expect((await getSubmission(id))!.status).toBe("follow_up"); // ileri aşamadan geri düşmez

    // Plan
    expect(await (await plan(post({ id, consent: true, units_m1: "5" }))).json()).toEqual({ ok: false, error: "missing", field: "units_m12" });
    expect(await (await plan(post({ id, consent: true, units_m1: "5", units_m12: "-1", f_equity: "1" }))).json()).toEqual({ ok: false, error: "number", field: "units_m12" });
    expect(await (await plan(post({ id, consent: true, units_m1: "5", units_m12: "40", f_equity: "8000", start_month: "bad", t_offer: "Reparatur" }))).json()).toEqual({ ok: true });
    expect((await getPlanForm(id))!.plan).toEqual({ consent: true, units_m1: 5, units_m12: 40, f_equity: 8000, t_offer: "Reparatur" });

    // Silme: plan var → plan son işleminden 90 gün sonra
    const { cleanup } = await import("@/lib/retention");
    const in89 = new Date(Date.now() + 89 * 864e5), in91 = new Date(Date.now() + 91 * 864e5);
    expect((await cleanup(in89)).expired).toBe(0);
    expect((await cleanup(in91)).expired).toBe(1);
    expect(await getSubmission(id)).toBeNull();
    for (const t of [schema.drafts, schema.reports, schema.feedback, schema.plans]) expect(await (await db()).select().from(t)).toHaveLength(0);
  });

  it("onaysız 7 gün, rapordan 90 gün sonra silinir; sıklık sınırı çalışır", async () => {
    const { POST: submit } = await import("@/app/api/submit/route");
    const { cleanup } = await import("@/lib/retention");
    const { db, schema } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const d = await db();
    await d.delete(schema.rateLimits);

    for (let i = 0; i < 3; i++) expect((await submit(post(form({ email: "x@example.org" }), `9.9.9.${i}`))).status).toBe(200);
    expect(await (await submit(post(form({ email: "X@example.org" }), "9.9.9.9"))).json()).toEqual({ ok: false, error: "rate" }); // e-posta başına 3/gün
    for (let i = 0; i < 3; i++) await submit(post(form({ email: `ip${i}@example.org` }), "5.5.5.5"));
    expect((await submit(post(form({ email: "ip9@example.org" }), "5.5.5.5"))).status).toBe(200); // IP başına 6/gün: 4.
    expect((await submit(post(form({ email: "ipa@example.org" }), "5.5.5.5"))).status).toBe(200);
    expect((await submit(post(form({ email: "ipb@example.org" }), "5.5.5.5"))).status).toBe(200);
    expect((await submit(post(form({ email: "ipc@example.org" }), "5.5.5.5"))).status).toBe(429);

    const all = await d.select().from(schema.submissions);
    const [a, b] = all;
    await d.update(schema.submissions).set({ confirmed: true, reportSentAt: new Date() }).where(eq(schema.submissions.id, b.id));
    const r1 = await cleanup(new Date(Date.now() + 8 * 864e5));
    expect(r1.unconfirmed).toBe(all.length - 1); // onaysızların hepsi 7 gün sonra gider
    expect(r1.rateLimits).toBeGreaterThan(0);
    expect(await d.select().from(schema.submissions)).toHaveLength(1);
    expect((await cleanup(new Date(Date.now() + 91 * 864e5))).expired).toBe(1);
    void a;
  });

  it("AUTO_SEND: sorusuz taslak gider; yarım kalan veya sorulu taslak gitmez", async () => {
    const { draftInBackground } = await import("@/lib/ai/run");
    const { createSubmission, getSubmission } = await import("@/lib/data/submissions");
    process.env.AUTO_SEND = "1";
    try {
      const mk = async () => (await createSubmission({ lang: "tr", email: "a@example.org", answers: { idea: IDEA } })).id;
      claudeText = "# Rapor\nMetin"; claudeStop = "max_tokens";
      const t1 = await mk(); await draftInBackground(t1);
      expect((await getSubmission(t1))!.reportSentAt).toBeNull();
      claudeText = "===HALİL===\nsoru\n===RAPOR===\n# Rapor"; claudeStop = "end_turn";
      const t2 = await mk(); await draftInBackground(t2);
      expect((await getSubmission(t2))!.reportSentAt).toBeNull();
      claudeText = "# Rapor\nMetin";
      const t3 = await mk(); await draftInBackground(t3);
      expect((await getSubmission(t3))!.reportSentAt).not.toBeNull();
    } finally { delete process.env.AUTO_SEND; }
  });
});
