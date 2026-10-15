import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { isId } from "@/lib/ids";

// v1 (legacy/api/plan.js): ön doldurma için sadece sayılar ve türler; isim ve e-posta asla.
export const PREFILL = ["lang", "business_type", "customers", "situation", "founders", "price", "unit_cost", "fixed_costs", "rent", "investment", "personal_need", "price_is_net"] as const;

export type Prefill = Partial<Record<(typeof PREFILL)[number], unknown>>;
export interface PlanForm { prefill: Prefill; plan: Record<string, unknown> | null }

/** İş planı formunun başlangıç verisi; v1'deki GET /api/plan yanıtıyla aynı biçim ({prefill, plan}). Başvuru yoksa null. */
export async function getPlanForm(id: string): Promise<PlanForm | null> {
  if (!isId(id)) return null;
  const { plans, submissions } = schema;
  const rows = await (await db())
    .select({ lang: submissions.lang, answers: submissions.answers, plan: plans.data })
    .from(submissions)
    .leftJoin(plans, eq(plans.submissionId, submissions.id))
    .where(eq(submissions.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  // v1'de dil başvuru kaydının bir alanıydı; burada ayrı sütun.
  const sub: Record<string, unknown> = { ...row.answers, lang: row.lang };
  const prefill = Object.fromEntries(PREFILL.filter((k) => sub[k] !== undefined).map((k) => [k, sub[k]])) as Prefill;
  const plan = row.plan ? Object.fromEntries(Object.entries(row.plan).filter(([k]) => k !== "id" && k !== "submitted_at")) : null;
  return { prefill, plan };
}
