// Yönetici: taslağı (yeniden) oluştur → POST { id, force? }; düzeltilmiş taslağı kaydet → PUT { id, md }.
// v1: legacy/api/draft.js
import { after } from "next/server";
import { guard, readTarget } from "@/lib/admin-guard";
import { draftInBackground } from "@/lib/ai/run";
import { model } from "@/lib/ai/draft";
import { getDraft, saveDraft, saveDraftEdit } from "@/lib/data/drafts";
import { getSubmission } from "@/lib/data/submissions";
import { json } from "@/lib/http";

export const maxDuration = 300;

export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: "no_key" }, 400);
  const t = await readTarget(request);
  if ("error" in t) return t.error;
  if (!(await getSubmission(t.id))) return json({ error: "not_found" }, 404);
  // Panel hemen "yazılıyor" görsün diye önce bekleyen taslak kaydı (v1 ile aynı).
  await saveDraft(t.id, { state: "pending", model: model() });
  after(() => draftInBackground(t.id, { force: t.body.force === true }));
  return json({ ok: true, pending: true }, 202);
}

export async function PUT(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const t = await readTarget(request);
  if ("error" in t) return t.error;
  const md = t.body.md;
  if (typeof md !== "string" || md.length > 60000) return json({ error: "bad_input" }, 400);
  if (!(await getSubmission(t.id))) return json({ error: "not_found" }, 404);
  if (!(await getDraft(t.id))) await saveDraft(t.id, { state: "ready", md, editedAt: new Date() });
  else await saveDraftEdit(t.id, md);
  return json({ ok: true });
}
