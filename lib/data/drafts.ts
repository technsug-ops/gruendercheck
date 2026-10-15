// Rapor taslağı (her başvuruya bir tane). v1: drafts/<id>.json.
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type Draft = typeof schema.drafts.$inferSelect;
type DraftInput = Omit<typeof schema.drafts.$inferInsert, "submissionId">;

/** Taslağı yazar; önceki taslağın yerine geçer (alanlar sıfırlanır, eski metin kalmaz). */
export async function saveDraft(submissionId: string, d: DraftInput): Promise<void> {
  const row = {
    md: null, precheck: null, message: null, model: null, kb: null, seconds: null, usage: null, stopReason: null, error: null, editedAt: null,
    createdAt: new Date(), ...d,
  };
  await (await db()).insert(schema.drafts).values({ submissionId, ...row })
    .onConflictDoUpdate({ target: schema.drafts.submissionId, set: row });
}

/** Yöneticinin düzeltmesi: sadece metin ve düzeltme zamanı değişir. */
export async function saveDraftEdit(submissionId: string, md: string): Promise<boolean> {
  const rows = await (await db()).update(schema.drafts)
    .set({ md, state: "ready", editedAt: new Date() })
    .where(eq(schema.drafts.submissionId, submissionId))
    .returning({ id: schema.drafts.submissionId });
  return rows.length === 1;
}

export async function getDraft(submissionId: string): Promise<Draft | null> {
  const rows = await (await db()).select().from(schema.drafts).where(eq(schema.drafts.submissionId, submissionId)).limit(1);
  return rows[0] ?? null;
}
