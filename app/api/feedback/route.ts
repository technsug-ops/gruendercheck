// Geri bildirim (/de/feedback?id=… sayfasından). v1: legacy/api/feedback.js – aynı alanlar ve durum geçişi.
// Tekrar gönderilirse öncekinin üstüne yazılır (v1 ile aynı; kişi cevabını düzeltebilir).
import { json, readJson } from "@/lib/http";
import { isId } from "@/lib/ids";
import { saveFeedback } from "@/lib/data/feedback";
import { getSubmission, setStatus } from "@/lib/data/submissions";
import { notifyAdmin } from "@/lib/mail";

const ALLOWED: Record<"useful" | "next" | "wtp", string[]> = {
  useful: ["1", "2", "3", "4", "5"], next: ["plan", "talk", "none"], wtp: ["0", "lt50", "50-150", "150-300", "300+"],
};

export async function POST(request: Request) {
  const body = await readJson(request, 10000);
  if ("error" in body) return body.error;
  const d = body.data;
  if (!isId(d.id)) return json({ ok: false, error: "bad_id" }, 400);
  if (d.website) return json({ ok: true });
  const fb = { useful: "", next: "", wtp: "", best: null as string | null, missing: null as string | null };
  for (const k of ["useful", "next", "wtp"] as const) {
    if (!ALLOWED[k].includes(String(d[k]))) return json({ ok: false, error: "missing", field: k }, 400);
    fb[k] = String(d[k]);
  }
  for (const k of ["best", "missing"] as const) if (d[k]) fb[k] = String(d[k]).slice(0, 1500);

  const sub = await getSubmission(d.id);
  if (!sub) return json({ ok: false, error: "not_found" }, 404);
  try {
    await saveFeedback(sub.id, fb);
    // Erken aşamadaki başvuru, cevaba göre ilerler; ileri aşamadakine (plan, ödeme) dokunulmaz.
    await setStatus(sub.id, fb.next === "none" ? "feedback" : "follow_up", ["new", "report_sent", "feedback"]);
  } catch (err) {
    console.error("feedback save failed", err);
    return json({ ok: false, error: "storage" }, 500);
  }
  await notifyAdmin("feedback", { lang: sub.lang, src: sub.src, city: sub.answers.city, feedback: fb });
  return json({ ok: true });
}
