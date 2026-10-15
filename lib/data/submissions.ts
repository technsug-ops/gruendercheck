// Başvuru kaydı: oluşturma, e-posta onayı, durum. v1: submissions/<tarih>_<id>.json (Blob) → submissions tablosu.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Status } from "@/lib/db/schema";
import { isId } from "@/lib/ids";

export type Submission = typeof schema.submissions.$inferSelect;
type Answers = Submission["answers"];

/** Onay linkindeki kod düz saklanmaz; sadece SHA-256'sı. */
const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export async function createSubmission(input: {
  lang: "de" | "tr"; email: string; firstName?: string; src?: string; answers: Answers;
}): Promise<{ id: string; token: string }> {
  const token = randomBytes(16).toString("hex");
  const now = new Date();
  const [row] = await (await db()).insert(schema.submissions).values({
    lang: input.lang, email: input.email, firstName: input.firstName ?? null, src: input.src ?? null,
    answers: input.answers, consentAt: now, createdAt: now, confirmTokenHash: hashToken(token),
  }).returning({ id: schema.submissions.id });
  return { id: row.id, token };
}

export async function getSubmission(id: string): Promise<Submission | null> {
  if (!isId(id)) return null;
  const rows = await (await db()).select().from(schema.submissions).where(eq(schema.submissions.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Onay linki: id + kod doğruysa kayıt, değilse null. */
export async function findForConfirm(id: string, token: string): Promise<Submission | null> {
  if (!isId(id) || !/^[0-9a-f]{32}$/.test(token || "")) return null;
  const sub = await getSubmission(id);
  if (!sub?.confirmTokenHash) return null;
  const a = Buffer.from(sub.confirmTokenHash, "hex"), b = Buffer.from(hashToken(token), "hex");
  return a.length === b.length && timingSafeEqual(a, b) ? sub : null;
}

/** Onaylar; sadece ilk onayda true döner (iki sekmeden aynı anda basılsa da taslak bir kez yazılır). */
export async function markConfirmed(id: string): Promise<boolean> {
  const rows = await (await db()).update(schema.submissions)
    .set({ confirmed: true, confirmedAt: new Date() })
    .where(and(eq(schema.submissions.id, id), eq(schema.submissions.confirmed, false)))
    .returning({ id: schema.submissions.id });
  return rows.length === 1;
}

export async function setStatus(id: string, status: Status, onlyFrom?: Status[]): Promise<void> {
  const { submissions } = schema;
  await (await db()).update(submissions)
    .set({ status, statusChangedAt: new Date() })
    .where(onlyFrom ? and(eq(submissions.id, id), inArray(submissions.status, onlyFrom)) : eq(submissions.id, id));
}

/** Modele ve bildirimlere giden görünüm: form alanları + dil (isim/e-posta yok). */
export const answersOf = (sub: Submission) => ({ ...sub.answers, lang: sub.lang });
