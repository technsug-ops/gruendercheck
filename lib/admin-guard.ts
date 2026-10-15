// Yönetici API'leri için ortak kontrol: oturum çerezi + (değişiklik yapan isteklerde) aynı siteden gelme.
import { isAdmin } from "@/lib/auth";
import { json, readJson } from "@/lib/http";
import { isId } from "@/lib/ids";

/** Tarayıcı başka bir siteden gelen isteğe Origin ekler; o durumda reddedilir (çerez SameSite=Strict'e ek önlem). */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export function guard(request: Request): Response | null {
  if (!isAdmin(request)) return json({ error: "unauthorized" }, 401);
  if (request.method !== "GET" && !sameOrigin(request)) return json({ error: "forbidden" }, 403);
  return null;
}

/** Gövdeyi okur ve kayıt kimliğini çıkarır (v1 panelinin gönderdiği "pathname" da kabul edilir). */
export async function readTarget(request: Request, maxBytes = 70000): Promise<{ id: string; body: Record<string, unknown> } | { error: Response }> {
  const r = await readJson(request, maxBytes);
  if ("error" in r) return r;
  const id = r.data.id ?? r.data.pathname;
  if (!isId(id)) return { error: json({ error: "bad_path" }, 400) };
  return { id, body: r.data };
}
