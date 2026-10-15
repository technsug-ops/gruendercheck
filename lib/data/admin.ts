// Yönetici paneli için başvuru listesi. Kayıt biçimi v1 /api/submissions ile aynı (panel kodu buna göre yazılı):
// düz alanlar + form cevapları + draft/report/feedback/plan alt nesneleri. İsim/e-posta sadece burada, sadece yöneticiye.
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Draft } from "./drafts";

/** Yazılıyor durumunda bu süreden uzun kalan taslak "takıldı" sayılır (fonksiyon en fazla 300 sn). */
export const DRAFT_STUCK_MS = 6 * 60 * 1000;

export function draftView(d: Draft, now = Date.now()) {
  const base = {
    created_at: d.createdAt.toISOString(), edited_at: d.editedAt?.toISOString(), model: d.model ?? undefined,
    kb: d.kb ?? undefined, seconds: d.seconds ?? undefined, usage: d.usage ?? undefined, stop_reason: d.stopReason ?? undefined,
  };
  if (d.state === "pending") {
    // v1'de takılan taslak sonsuza dek "yazılıyor" görünürdü; artık hata olarak gösterilir (panelde "Tekrar dene").
    if (now - d.createdAt.getTime() > DRAFT_STUCK_MS) return { ...base, error: "Taslak yazımı yarıda kaldı (zaman aşımı). Tekrar dene." };
    return { ...base, pending: true };
  }
  if (d.state === "insufficient") return { ...base, insufficient: true, message: d.message ?? "" };
  if (d.state === "error") return { ...base, error: d.error ?? "bilinmeyen hata" };
  return { ...base, md: d.md ?? "", precheck: d.precheck ?? "", ...(d.error ? { warning: d.error } : {}) };
}

export async function listForAdmin(now = Date.now()) {
  const { submissions: s, drafts, reports, feedback, plans } = schema;
  const rows = await (await db())
    .select({ s, d: drafts, r: { sentAt: reports.sentAt }, f: feedback, p: plans })
    .from(s)
    .leftJoin(drafts, eq(drafts.submissionId, s.id))
    .leftJoin(reports, eq(reports.submissionId, s.id))
    .leftJoin(feedback, eq(feedback.submissionId, s.id))
    .leftJoin(plans, eq(plans.submissionId, s.id))
    .orderBy(desc(s.createdAt));
  return rows.map(({ s: x, d, r, f, p }) => ({
    ...x.answers,
    // v1'de "pathname" Blob yoluydu; panel onu kimlik olarak kullanır. Artık id.
    pathname: x.id, id: x.id, lang: x.lang, email: x.email, first_name: x.firstName ?? undefined, src: x.src ?? undefined,
    submitted_at: x.createdAt.toISOString(), status: x.status, status_changed_at: x.statusChangedAt?.toISOString(),
    confirmed: x.confirmed, confirmed_at: x.confirmedAt?.toISOString(), report_sent_at: x.reportSentAt?.toISOString(),
    ...(d ? { draft: draftView(d, now) } : {}),
    ...(r?.sentAt ? { report: { sent_at: r.sentAt.toISOString() } } : {}),
    ...(f ? { feedback: { useful: f.useful, next: f.next, wtp: f.wtp, ...(f.best ? { best: f.best } : {}), ...(f.missing ? { missing: f.missing } : {}), at: f.createdAt.toISOString() } } : {}),
    ...(p ? { plan: { id: x.id, submitted_at: p.updatedAt.toISOString(), ...p.data } } : {}),
  }));
}

export type AdminItem = Awaited<ReturnType<typeof listForAdmin>>[number];

export async function deleteSubmission(id: string): Promise<boolean> {
  const rows = await (await db()).delete(schema.submissions).where(eq(schema.submissions.id, id)).returning({ id: schema.submissions.id });
  return rows.length === 1;
}
