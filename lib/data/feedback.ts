import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { isId } from "@/lib/ids";

export interface FeedbackState { done: boolean }

/** Geri bildirim linki (/de/feedback?id=…): başvuru varsa { done }, yoksa (veya id geçersizse) null. v1: GET /api/feedback. */
export async function getFeedbackState(id: string): Promise<FeedbackState | null> {
  if (!isId(id)) return null;
  const { feedback, submissions } = schema;
  const rows = await (await db())
    .select({ fb: feedback.submissionId })
    .from(submissions)
    .leftJoin(feedback, eq(feedback.submissionId, submissions.id))
    .where(eq(submissions.id, id))
    .limit(1);
  return rows[0] ? { done: rows[0].fb !== null } : null;
}
