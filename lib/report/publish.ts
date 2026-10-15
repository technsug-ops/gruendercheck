// Onaylanan raporu saklar, başvurana link gönderir, başvurunun durumunu günceller. v1: legacy/lib/report.js
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Submission } from "@/lib/data/submissions";
import { SITE } from "@/lib/ids";
import { sendReport } from "@/lib/mail";

export const reportUrl = (s: Pick<Submission, "id" | "lang">) => `${SITE}/${s.lang === "tr" ? "tr" : "de"}/r?id=${s.id}`;
export const feedbackUrl = (s: Pick<Submission, "id" | "lang">) => `${SITE}/${s.lang === "tr" ? "tr" : "de"}/feedback?id=${s.id}`;

export type PublishResult =
  | { ok: true; url: string; mail_skipped: boolean }
  | { ok: false; error: "mail"; detail: string; url: string };

export async function publishReport(sub: Submission, md: string): Promise<PublishResult> {
  const now = new Date();
  const d = await db();
  await d.insert(schema.reports).values({ submissionId: sub.id, md, sentAt: now })
    .onConflictDoUpdate({ target: schema.reports.submissionId, set: { md, sentAt: now } });
  const mail = await sendReport(sub, reportUrl(sub), feedbackUrl(sub));
  // v1 ile aynı: e-posta gitmezse rapor kayıtlı kalır ama başvuru "gönderildi" sayılmaz.
  if ("ok" in mail && !mail.ok) return { ok: false, error: "mail", detail: mail.error, url: reportUrl(sub) };
  await d.update(schema.submissions)
    .set({ reportSentAt: now, ...(sub.status === "new" ? { status: "report_sent" as const, statusChangedAt: now } : {}) })
    .where(eq(schema.submissions.id, sub.id));
  return { ok: true, url: reportUrl(sub), mail_skipped: "skipped" in mail };
}
