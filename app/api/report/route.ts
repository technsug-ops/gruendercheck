// Yönetici: raporu onayla ve gönder → POST { id, md }. v1: legacy/api/report.js
// (Başvuranın rapor sayfası artık veriyi sunucuda okuyor; v1'deki herkese açık GET'e gerek yok.)
import { guard, readTarget } from "@/lib/admin-guard";
import { getSubmission } from "@/lib/data/submissions";
import { json } from "@/lib/http";
import { publishReport } from "@/lib/report/publish";

export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const t = await readTarget(request);
  if ("error" in t) return t.error;
  const md = t.body.md;
  if (typeof md !== "string" || !/^\s*#\s/.test(md) || md.length > 60000) return json({ error: "bad_input" }, 400);
  const sub = await getSubmission(t.id);
  if (!sub) return json({ error: "not_found" }, 404);
  const res = await publishReport(sub, md.trim());
  return json(res, res.ok ? 200 : 502);
}
