// Yönetici API'leri: giriş, yetki, v1 ile aynı liste biçimi, durum, taslak, rapor gönderme, silme.
import { beforeAll, describe, expect, it, vi } from "vitest";

const pending: Promise<unknown>[] = [];
vi.mock("next/server", async (orig) => ({ ...(await orig<typeof import("next/server")>()), after: (fn: () => unknown) => { pending.push(Promise.resolve().then(fn)); } }));
vi.mock("@/lib/ai/draft", async (orig) => ({
  ...(await orig<typeof import("@/lib/ai/draft")>()),
  callClaude: async () => ({ text: "# Neu\nText", model: "test-model", usage: { input_tokens: 1, output_tokens: 1 }, stopReason: "end_turn" }),
}));

beforeAll(() => {
  Object.assign(process.env, {
    PGLITE_DIR: "memory://", MAIL_DRY: "1", SMTP_USER: "t", SMTP_PASS: "t", MAIL_FROM: "rapor@example.org",
    NOTIFY_TO: "halil@example.org", ANTHROPIC_API_KEY: "test", ADMIN_PASSWORD: "dogru-sifre-ü",
  });
});

const H = "http://localhost";
const req = (path: string, method: string, body?: unknown, headers: Record<string, string> = {}) =>
  new Request(H + path, { method, headers: { "content-type": "application/json", ...headers }, body: body ? JSON.stringify(body) : undefined });

describe("yönetici API", () => {
  it("giriş, yetki ve tam akış", async () => {
    const session = await import("@/app/api/admin/session/route");
    const subs = await import("@/app/api/submissions/route");
    const draft = await import("@/app/api/draft/route");
    const report = await import("@/app/api/report/route");
    const { createSubmission, getSubmission } = await import("@/lib/data/submissions");
    const { saveDraft } = await import("@/lib/data/drafts");
    const { savePlan } = await import("@/lib/data/plans");
    const { saveFeedback } = await import("@/lib/data/feedback");
    const { dryOutbox } = await import("@/lib/mail");

    // Yetkisiz
    expect((await subs.GET(req("/api/submissions", "GET"))).status).toBe(401);
    expect((await subs.GET(req("/api/submissions", "GET", undefined, { authorization: "Bearer dogru-sifre-u" }))).status).toBe(401); // v1 yolu kapalı
    expect((await session.POST(req("/api/admin/session", "POST", { password: "yanlış" }))).status).toBe(401);

    // Giriş
    const ok = await session.POST(req("/api/admin/session", "POST", { password: "dogru-sifre-ü" }));
    expect(ok.status).toBe(200);
    const setCookie = ok.headers.get("set-cookie")!;
    expect(setCookie).toMatch(/HttpOnly/);
    expect(setCookie).toMatch(/SameSite=Strict/);
    const cookie = setCookie.split(";")[0];
    const as = (path: string, method: string, body?: unknown, extra: Record<string, string> = {}) => req(path, method, body, { cookie, ...extra });
    expect(await (await session.GET(as("/api/admin/session", "GET"))).json()).toEqual({ ok: true });

    // Veri
    const { id } = await createSubmission({ lang: "tr", email: "a@example.org", firstName: "Ayşe", src: "insta", answers: { idea: "Fikir", city: "Köln", price: "45", price_is_net: true } });
    await saveDraft(id, { state: "ready", md: "# Rapor\nMetin", precheck: "Soru?", model: "m", seconds: 42 });
    await savePlan(id, { consent: true, units_m1: 5 });
    await saveFeedback(id, { useful: "4", next: "plan", wtp: "0", best: null, missing: "Daha çok sayı" });

    const { items } = await (await subs.GET(as("/api/submissions", "GET"))).json();
    expect(items).toHaveLength(1);
    const it0 = items[0];
    expect(it0).toMatchObject({
      pathname: id, id, lang: "tr", email: "a@example.org", first_name: "Ayşe", src: "insta", status: "new", confirmed: false,
      idea: "Fikir", city: "Köln", price: "45", price_is_net: true,
      draft: { md: "# Rapor\nMetin", precheck: "Soru?", model: "m", seconds: 42 },
      plan: { id, consent: true, units_m1: 5 },
      feedback: { useful: "4", next: "plan", wtp: "0", missing: "Daha çok sayı" },
    });
    expect(it0.feedback).not.toHaveProperty("best");
    expect(it0).not.toHaveProperty("report");
    expect(it0).not.toHaveProperty("confirmTokenHash");
    expect(it0).not.toHaveProperty("answers");

    // Başka siteden gelen değişiklik isteği reddedilir
    expect((await subs.PATCH(as("/api/submissions", "PATCH", { id, status: "closed" }, { origin: "https://evil.example" }))).status).toBe(403);
    // Durum (v1 panelinin "pathname" alanıyla)
    expect((await subs.PATCH(as("/api/submissions", "PATCH", { pathname: id, status: "uydurma" }))).status).toBe(400);
    expect((await subs.PATCH(as("/api/submissions", "PATCH", { pathname: id, status: "paid" }, { origin: H }))).status).toBe(200);
    expect((await getSubmission(id))!.status).toBe("paid");

    // Taslak düzeltme ve yeniden oluşturma
    expect((await draft.PUT(as("/api/draft", "PUT", { id, md: "# Düzeltilmiş" }))).status).toBe(200);
    let list = (await (await subs.GET(as("/api/submissions", "GET"))).json()).items;
    expect(list[0].draft).toMatchObject({ md: "# Düzeltilmiş" });
    expect(list[0].draft.edited_at).toBeTruthy();
    expect((await draft.POST(as("/api/draft", "POST", { id }))).status).toBe(202);
    list = (await (await subs.GET(as("/api/submissions", "GET"))).json()).items;
    expect(list[0].draft).toMatchObject({ pending: true });
    while (pending.length) await pending.shift();
    list = (await (await subs.GET(as("/api/submissions", "GET"))).json()).items;
    expect(list[0].draft).toMatchObject({ md: "# Neu\nText", model: "test-model" });

    // Rapor gönderme
    expect((await report.POST(as("/api/report", "POST", { id, md: "başlıksız" }))).status).toBe(400);
    dryOutbox.length = 0;
    const sent = await (await report.POST(as("/api/report", "POST", { id, md: "# Rapor\nSon hal" }))).json();
    expect(sent).toMatchObject({ ok: true, url: `https://foundercheck.de/tr/r?id=${id}`, mail_skipped: false });
    expect(dryOutbox[0]).toMatchObject({ to: "a@example.org", subject: "Raporun hazır – İş Fikri Kontrolü" });
    expect((await getSubmission(id))!.status).toBe("paid"); // ileri aşamadaki durum geri alınmaz (v1 ile aynı)
    list = (await (await subs.GET(as("/api/submissions", "GET"))).json()).items;
    expect(list[0].report.sent_at).toBeTruthy();

    // Silme
    expect((await subs.DELETE(as("/api/submissions", "DELETE", { id }))).status).toBe(200);
    expect(await getSubmission(id)).toBeNull();

    // Çıkış
    const out = await session.DELETE();
    expect(out.headers.get("set-cookie")).toMatch(/Max-Age=0/);
  });

  it("takılan taslak hata olarak görünür", async () => {
    const { draftView, DRAFT_STUCK_MS } = await import("@/lib/data/admin");
    const d = { submissionId: "x", state: "pending" as const, createdAt: new Date(0), md: null, precheck: null, message: null, model: "m", kb: null, seconds: null, usage: null, stopReason: null, error: null, editedAt: null };
    expect(draftView(d, 1000)).toMatchObject({ pending: true });
    expect(draftView(d, DRAFT_STUCK_MS + 1)).toMatchObject({ error: expect.stringContaining("yarıda kaldı") });
  });

  it("şifre denemesi sınırı", async () => {
    const session = await import("@/app/api/admin/session/route");
    const codes: number[] = [];
    for (let i = 0; i < 11; i++) codes.push((await session.POST(req("/api/admin/session", "POST", { password: "x" }, { "x-forwarded-for": "7.7.7.7" }))).status);
    expect(codes.slice(0, 10).every((c) => c === 401)).toBe(true);
    expect(codes[10]).toBe(429);
  });
});
