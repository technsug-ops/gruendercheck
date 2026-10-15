import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { isId } from "@/lib/ids";

export interface PublicReport { lang: "de" | "tr"; md: string; sentAt: Date }

/** Gönderilmiş rapor (kişiye özel link ile herkese açık). Yoksa null. */
export async function getReport(id: string): Promise<PublicReport | null> {
  if (!isId(id)) return null;
  const { reports, submissions } = schema;
  const rows = await (await db())
    .select({ lang: submissions.lang, md: reports.md, sentAt: reports.sentAt })
    .from(reports)
    .innerJoin(submissions, eq(submissions.id, reports.submissionId))
    .where(eq(reports.submissionId, id))
    .limit(1);
  return rows[0] ?? null;
}
