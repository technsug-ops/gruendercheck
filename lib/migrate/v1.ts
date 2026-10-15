// v1 (Vercel Blob JSON) kayıtlarını yeni tablolara çevirir. Saf fonksiyonlar: kaynak (Blob/dosya) ve yazma ayrı.
// Kayıt biçimleri: legacy/api/submit.js, legacy/lib/draft.js, legacy/lib/report.js, legacy/api/plan.js, legacy/api/feedback.js.
import { createHash } from "node:crypto";
import type { schema } from "@/lib/db";
import { STATUSES, type Status } from "@/lib/db/schema";
import { isId } from "@/lib/ids";

type Insert<T extends { $inferInsert: unknown }> = T["$inferInsert"];
type V1 = Record<string, unknown>;

const date = (v: unknown): Date | null => {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const str = (v: unknown) => (typeof v === "string" && v !== "" ? v : null);

// Ayrı sütuna giden veya hiç taşınmayan alanlar; geri kalan her şey form cevabıdır (answers).
const NOT_ANSWERS = new Set(["id", "submitted_at", "status", "status_changed_at", "confirmed", "confirm_token", "confirmed_at",
  "report_sent_at", "feedback", "lang", "email", "first_name", "consent", "src", "pathname", "draft", "report", "plan"]);

export interface Converted {
  submission: Insert<typeof schema.submissions>;
  feedback: Insert<typeof schema.feedback> | null;
}

/** v1 başvuru kaydı → submissions (+ içindeki geri bildirim). Geçersizse hata mesajı. */
export function convertSubmission(rec: V1): Converted | { error: string } {
  if (!isId(rec.id)) return { error: "geçersiz id" };
  const email = str(rec.email);
  if (!email) return { error: "e-posta yok" };
  const created = date(rec.submitted_at);
  if (!created) return { error: "gönderim tarihi yok" };
  const answers: Record<string, string | boolean> = {};
  for (const [k, v] of Object.entries(rec)) {
    if (NOT_ANSWERS.has(k) || v === undefined || v === null || v === "") continue;
    if (typeof v === "string" || typeof v === "boolean") answers[k] = v;
    else if (typeof v === "number") answers[k] = String(v);
  }
  const status = STATUSES.includes(rec.status as Status) ? (rec.status as Status) : "new";
  const token = str(rec.confirm_token);
  // v1'de "confirmed" alanı onay özelliğinden önceki kayıtlarda yoktu; onlar onaylı sayılırdı (confirmed !== false).
  const confirmed = rec.confirmed !== false;
  const submission: Insert<typeof schema.submissions> = {
    id: rec.id, createdAt: created, lang: rec.lang === "tr" ? "tr" : "de", status, statusChangedAt: date(rec.status_changed_at),
    confirmed, confirmTokenHash: token ? createHash("sha256").update(token).digest("hex") : null, confirmedAt: date(rec.confirmed_at),
    src: str(rec.src), email, firstName: str(rec.first_name), answers,
    consentAt: created, // v1 onayı gönderimle aynı anda alıyordu (consent: true zorunlu)
    reportSentAt: date(rec.report_sent_at),
  };
  const fb = rec.feedback as V1 | undefined;
  const feedback = fb && typeof fb === "object" && str(fb.useful) && str(fb.next) && str(fb.wtp)
    ? { submissionId: rec.id, useful: String(fb.useful), next: String(fb.next), wtp: String(fb.wtp), best: str(fb.best), missing: str(fb.missing), createdAt: date(fb.at) ?? created }
    : null;
  return { submission, feedback };
}

export function convertDraft(d: V1): Insert<typeof schema.drafts> | null {
  if (!isId(d.id)) return null;
  const createdAt = date(d.created_at) ?? new Date();
  const base = {
    submissionId: d.id, createdAt, editedAt: date(d.edited_at), model: str(d.model), kb: str(d.kb),
    seconds: typeof d.seconds === "number" ? d.seconds : null, usage: d.usage ?? null, stopReason: str(d.stop_reason),
  };
  // v1'de bekleyen taslak yarıda kaldıysa sonsuza dek "pending" kalırdı; taşınırken hata olarak işaretlenir.
  if (d.pending) return { ...base, state: "error", error: "v1'den taşındı: taslak yazımı tamamlanmamıştı" };
  if (d.insufficient) return { ...base, state: "insufficient", message: str(d.message) };
  if (d.error) return { ...base, state: "error", error: String(d.error).slice(0, 400) };
  if (typeof d.md === "string") return { ...base, state: "ready", md: d.md, precheck: str(d.precheck) };
  return null;
}

export function convertReport(r: V1): Insert<typeof schema.reports> | null {
  if (!isId(r.id) || typeof r.md !== "string") return null;
  return { submissionId: r.id, md: r.md, sentAt: date(r.sent_at) ?? new Date() };
}

export function convertPlan(p: V1): Insert<typeof schema.plans> | null {
  if (!isId(p.id)) return null;
  const at = date(p.submitted_at) ?? new Date();
  const data = Object.fromEntries(Object.entries(p).filter(([k]) => k !== "id" && k !== "submitted_at"));
  return { submissionId: p.id, data, createdAt: at, updatedAt: at };
}
