// Değerlendirme seti için v1 başvurularını (Vercel Blob) yerel, git dışı bir klasöre çeker. Blob'a SADECE okur.
// İsim, e-posta, onay kodu hiç yazılmaz. Serbest metinlerde kişiyi tanıtabilecek yerler işaretlenir; bunlar
// anonimleştirilmeden repoya girmez (Halil'in kararı, 2026-10-17). Ham klasör iş bitince silinir.
//
// Çalıştır (token .env.local'da, değeri hiç yazdırılmaz):
//   npx tsx --env-file=.env.local scripts/eval/export-v1.ts
// Çıktı: .data/eval-raw/cases.json (ham, git dışı) + .data/eval-raw/review.md (işaretli serbest metinler)
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";

type V1 = Record<string, unknown>;
const OUT = ".data/eval-raw";

// Formdaki serbest metin alanları: kişiyi tanıtabilecek bilgi ancak bunlarda olur.
export const FREE_TEXT = ["idea", "current_solution", "experience", "worry", "city"] as const;
// Kişisel veya gereksiz alanlar: hiç dışa aktarılmaz.
const DROP = new Set(["email", "first_name", "confirm_token", "consent", "pathname"]);

/** Kişiyi tanıtabilecek kalıplar (kaba ön tarama; son kontrol insanda). */
export function piiFlags(text: string): string[] {
  const flags: string[] = [];
  const add = (kind: string, re: RegExp) => { for (const m of text.matchAll(re)) flags.push(`${kind}: ${m[0]}`); };
  add("e-posta", /[^\s@]+@[^\s@]+\.[^\s@]+/g);
  add("telefon", /(?:\+|00)\d[\d\s/-]{7,}\d|\b0\d{2,4}[\s/-]?\d{4,}\b/g);
  add("web", /\bhttps?:\/\/\S+|\bwww\.\S+|\b[\w-]+\.(?:de|com|net|org|eu|io|shop|com\.tr)\b/gi);
  add("firma", /\b[\p{Lu}][\p{L}&.-]*(?:\s+[\p{Lu}][\p{L}&.-]*)*\s+(?:GmbH|UG|e\.\s?K\.|GbR|AG|KG|Ltd\.?|A\.Ş\.|Şti\.?)/gu);
  add("adres", /\b[\p{L}ß.-]+(?:straße|str\.|weg|platz|allee|gasse|ring)\s*\d+\w?/giu);
  add("plz", /\b\d{5}\b/g);
  add("iban", /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}\b/g);
  // Ad soyad: Almancada isimler de büyük harfle başladığından sadece tanıtma kalıplarının ardından.
  add("ad?", /(?<![\p{L}])(?:ich bin|ich heiße|mein name ist|name:|herr|frau|benim adım|adım|ismim|ben)\s+[\p{Lu}][\p{Ll}]+(?:\s+[\p{Lu}][\p{Ll}]+)?/giu);
  return [...new Set(flags)];
}

async function readAll(prefix: string): Promise<V1[]> {
  const { list, get } = await import("@vercel/blob");
  const out: V1[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    for (const b of page.blobs) {
      const r = await get(b.pathname, { access: "private", useCache: false });
      if (r && r.statusCode === 200) out.push(JSON.parse(await new Response(r.stream).text()));
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN yok (.env.local + --env-file=.env.local)");
  const [subs, drafts, reports] = await Promise.all(["submissions/", "drafts/", "reports/"].map(readAll));
  const byId = (rows: V1[]) => new Map(rows.map((r) => [String(r.id), r]));
  const D = byId(drafts), R = byId(reports);

  const cases = subs
    .filter((s) => s.confirmed !== false) // onaylanmamış başvurular gerçek kişi olmayabilir; alınmaz
    .map((s) => {
      const id = String(s.id);
      const caseId = "v1-" + createHash("sha256").update(id).digest("hex").slice(0, 8); // gerçek id dışarı çıkmaz
      const answers = Object.fromEntries(Object.entries(s).filter(([k, v]) =>
        !DROP.has(k) && !["id", "submitted_at", "status", "status_changed_at", "confirmed", "confirmed_at", "report_sent_at", "feedback"].includes(k) && v !== "" && v != null));
      const d = D.get(id), r = R.get(id);
      const fb = s.feedback as V1 | undefined;
      return {
        caseId,
        submittedDate: String(s.submitted_at).slice(0, 10),
        lang: s.lang === "tr" ? "tr" : "de",
        answers,
        flags: Object.fromEntries(FREE_TEXT.map((k) => [k, piiFlags(String(answers[k] ?? ""))]).filter(([, f]) => f.length)),
        draft: d && typeof d.md === "string" ? { md: d.md, precheck: d.precheck ?? "", model: d.model, kb: d.kb, edited: !!d.edited_at } : d ? { state: d.insufficient ? "insufficient" : d.error ? "error" : "other" } : null,
        sentReport: r && typeof r.md === "string" ? r.md : null,
        feedback: fb ? { useful: fb.useful, next: fb.next, wtp: fb.wtp, best: fb.best ?? null, missing: fb.missing ?? null } : null,
        status: s.status ?? "new",
      };
    })
    .sort((a, b) => a.submittedDate.localeCompare(b.submittedDate));

  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/cases.json`, JSON.stringify(cases, null, 2));
  const md = [
    "# İnceleme: serbest metinlerde kişiyi tanıtabilecek yerler",
    "",
    "Bu dosya git dışında. İşaretler kaba bir ön taramadır; son karar senin.",
    "",
    ...cases.map((c) => [
      `## ${c.caseId} (${c.lang}, ${c.submittedDate}) — taslak: ${c.draft ? "var" : "yok"}, gönderilen rapor: ${c.sentReport ? "var" : "yok"}, geri bildirim: ${c.feedback ? `${c.feedback.useful}/5` : "yok"}`,
      ...FREE_TEXT.map((k) => `- **${k}:** ${String(c.answers[k] ?? "").replace(/\n/g, " ")}${c.flags[k] ? `\n  - ⚠️ ${c.flags[k].join(" · ")}` : ""}`),
      "",
    ].join("\n")),
  ].join("\n");
  writeFileSync(`${OUT}/review.md`, md);

  const n = (f: (c: (typeof cases)[number]) => unknown) => cases.filter(f).length;
  console.log(`başvuru ${cases.length} (onaysız atlandı: ${subs.length - cases.length}); taslak ${n((c) => c.draft && "md" in c.draft)}, gönderilen rapor ${n((c) => c.sentReport)}, geri bildirim ${n((c) => c.feedback)}, işaretli ${n((c) => Object.keys(c.flags).length)}`);
  console.log(`yazıldı: ${OUT}/cases.json, ${OUT}/review.md (git dışı)`);
}

if (process.argv[1]?.endsWith("export-v1.ts")) main().then(() => process.exit(0), (e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
