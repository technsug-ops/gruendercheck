// v1 verisini (Vercel Blob) Postgres'e aktarır. Birden çok kez çalıştırılabilir: aynı id'ler güncellenir, kopya oluşmaz.
// Kayıt yeni sistemde değiştirildiyse (ör. durum) Blob'daki eski hali onun üstüne yazar; geçişte bir kez,
// v1 kapatılmadan hemen önce son kez çalıştır.
//
// Çalıştır:
//   BLOB_READ_WRITE_TOKEN=… DATABASE_URL=… npx tsx scripts/import-blob.ts            (Blob'dan, kuru: --dry)
//   DATABASE_URL=… npx tsx scripts/import-blob.ts --dir yedek/                          (indirilmiş yedek klasöründen)
// Sırlar sadece ortam değişkeninde; hiçbir değer yazdırılmaz. Çıktıda kişisel veri yok, sadece sayılar ve id'ler.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { db, schema } from "@/lib/db";
import { convertDraft, convertPlan, convertReport, convertSubmission } from "@/lib/migrate/v1";

type V1 = Record<string, unknown>;
const PREFIXES = ["submissions/", "drafts/", "reports/", "plans/"] as const;

async function fromBlob(prefix: string): Promise<V1[]> {
  const { list, get } = await import("@vercel/blob");
  const out: V1[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    for (const b of page.blobs) {
      const r = await get(b.pathname, { access: "private", useCache: false });
      if (!r || r.statusCode !== 200) { console.warn(`okunamadı: ${b.pathname}`); continue; }
      out.push(JSON.parse(await new Response(r.stream).text()));
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

function fromDir(root: string, prefix: string): V1[] {
  const dir = join(root, prefix);
  try { if (!statSync(dir).isDirectory()) return []; } catch { return []; }
  return readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
}

export async function importAll(read: (prefix: string) => Promise<V1[]> | V1[], opts: { dry?: boolean } = {}) {
  const [subs, drafts, reports, plans] = await Promise.all(PREFIXES.map((p) => read(p)));
  const d = await db();
  const known = new Set<string>();
  const stats = { submissions: 0, feedback: 0, drafts: 0, reports: 0, plans: 0, skipped: [] as string[] };

  for (const rec of subs) {
    const c = convertSubmission(rec);
    if ("error" in c) { stats.skipped.push(`submission ${String(rec.id).slice(0, 8)}: ${c.error}`); continue; }
    known.add(c.submission.id!);
    if (!opts.dry) {
      const { id: _id, ...set } = c.submission;
      await d.insert(schema.submissions).values(c.submission).onConflictDoUpdate({ target: schema.submissions.id, set });
      if (c.feedback) {
        const { submissionId: _s, ...fset } = c.feedback;
        await d.insert(schema.feedback).values(c.feedback).onConflictDoUpdate({ target: schema.feedback.submissionId, set: fset });
      }
    }
    stats.submissions++;
    if (c.feedback) stats.feedback++;
  }
  // Bağlı kayıtlar: başvurusu olmayan (silinmiş) taslak/rapor/plan taşınmaz.
  const child = async <T extends { submissionId: string }>(name: "drafts" | "reports" | "plans", rows: V1[], conv: (r: V1) => T | null) => {
    for (const r of rows) {
      const row = conv(r);
      if (!row) { stats.skipped.push(`${name} ${String(r.id).slice(0, 8)}: okunamayan kayıt`); continue; }
      if (!known.has(row.submissionId)) { stats.skipped.push(`${name} ${row.submissionId.slice(0, 8)}: başvurusu yok`); continue; }
      if (!opts.dry) {
        const table = schema[name];
        const { submissionId: _s, ...set } = row;
        await d.insert(table).values(row).onConflictDoUpdate({ target: table.submissionId, set });
      }
      stats[name]++;
    }
  };
  await child("drafts", drafts, convertDraft);
  await child("reports", reports, convertReport);
  await child("plans", plans, convertPlan);
  return stats;
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const dirIdx = args.indexOf("--dir");
  const dir = dirIdx !== -1 ? args[dirIdx + 1] : null;
  if (!dir && !process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN gerekli (veya --dir <klasör>)");
  const stats = await importAll(dir ? (p) => fromDir(dir, p) : fromBlob, { dry });
  console.log(`${dry ? "[kuru çalıştırma] " : ""}başvuru ${stats.submissions}, geri bildirim ${stats.feedback}, taslak ${stats.drafts}, rapor ${stats.reports}, plan ${stats.plans}, atlanan ${stats.skipped.length}`);
  for (const s of stats.skipped) console.log("  atlandı: " + s);
}

if (process.argv[1]?.endsWith("import-blob.ts")) main().then(() => process.exit(0), (e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
