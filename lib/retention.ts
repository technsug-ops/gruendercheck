// Silme süreleri (Datenschutz metnindeki sözler). Günlük Vercel Cron ile çalışır: app/api/cron/cleanup.
// - Onaylanmayan başvuru: 7 gün sonra (onay e-postasında yazıyor).
// - Başvuru: raporun gönderilmesinden en geç 90 gün sonra ("spätestens 90 Tage nach Versand des Berichts").
// - Plan formu gönderilmişse: planla ilgili son işlemden 90 gün sonra ("90 Tage nach Übergabe des Plans").
//   Plan teslimi ayrı kaydedilmiyor; plan formunun son güncellenmesi ve son durum değişikliği esas alınır.
// - Onaylanıp hiç rapor gönderilmeyen (ör. yetersiz) başvuru: 90 gün sonra.
// - Sıklık sınırı kayıtları (hash'li e-posta/IP): 2 gün sonra.
// Bağlı tablolar (taslak, rapor, geri bildirim, plan) başvuruyla birlikte silinir (ON DELETE CASCADE).
import { and, eq, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const DAY = 24 * 3600 * 1000;

export async function cleanup(now = new Date()): Promise<{ unconfirmed: number; expired: number; rateLimits: number }> {
  const d = await db();
  const { submissions: s, plans: p, rateLimits } = schema;
  const ago = (days: number) => new Date(now.getTime() - days * DAY);

  const unconfirmed = await d.delete(s).where(and(eq(s.confirmed, false), lt(s.createdAt, ago(7)))).returning({ id: s.id });

  const hasPlan = sql`exists (select 1 from ${p} where ${p.submissionId} = ${s.id})`;
  const noPlan = sql`not exists (select 1 from ${p} where ${p.submissionId} = ${s.id})`;
  const planIdle = sql`not exists (select 1 from ${p} where ${p.submissionId} = ${s.id} and ${p.updatedAt} >= ${ago(90)})`;
  const expired = await d.delete(s).where(and(eq(s.confirmed, true), or(
    and(noPlan, isNotNull(s.reportSentAt), lt(s.reportSentAt, ago(90))),
    and(noPlan, isNull(s.reportSentAt), lt(s.createdAt, ago(90))),
    and(hasPlan, planIdle, or(isNull(s.statusChangedAt), lt(s.statusChangedAt, ago(90))), lt(s.createdAt, ago(90))),
  ))).returning({ id: s.id });

  const rl = await d.delete(rateLimits).where(lt(rateLimits.ts, ago(2))).returning({ id: rateLimits.id });
  return { unconfirmed: unconfirmed.length, expired: expired.length, rateLimits: rl.length };
}
