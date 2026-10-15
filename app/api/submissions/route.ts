// Yönetici: başvuru listesi (GET), durum değiştirme (PATCH { id, status }), silme (DELETE { id }).
// v1: legacy/api/submissions.js. Onaysız başvuruların silinmesi artık günlük işte (lib/retention.ts).
import { guard, readTarget } from "@/lib/admin-guard";
import { deleteSubmission, listForAdmin } from "@/lib/data/admin";
import { getSubmission, setStatus } from "@/lib/data/submissions";
import { STATUSES, type Status } from "@/lib/db/schema";
import { json } from "@/lib/http";

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  return json({ items: await listForAdmin() });
}

export async function PATCH(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const t = await readTarget(request);
  if ("error" in t) return t.error;
  const status = t.body.status;
  if (!STATUSES.includes(status as Status)) return json({ error: "bad_status" }, 400);
  if (!(await getSubmission(t.id))) return json({ error: "not_found" }, 404);
  await setStatus(t.id, status as Status);
  return json({ ok: true });
}

export async function DELETE(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const t = await readTarget(request);
  if ("error" in t) return t.error;
  // Bağlı taslak, rapor, geri bildirim ve plan da silinir (ON DELETE CASCADE).
  await deleteSubmission(t.id);
  return json({ ok: true });
}
