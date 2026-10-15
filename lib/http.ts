/** JSON yanıtı; önbelleğe alınmaz (v1 ile aynı başlıklar). */
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/** Gövdeyi okur; boyut sınırı aşılırsa veya JSON değilse hata kodu döner. */
export async function readJson(request: Request, maxBytes: number): Promise<{ data: Record<string, unknown> } | { error: Response }> {
  if (Number(request.headers.get("content-length") || 0) > maxBytes) return { error: json({ ok: false, error: "too_large" }, 413) };
  let data: unknown;
  try { data = await request.json(); } catch { return { error: json({ ok: false, error: "bad_json" }, 400) }; }
  if (!data || typeof data !== "object" || Array.isArray(data)) return { error: json({ ok: false, error: "bad_json" }, 400) };
  return { data: data as Record<string, unknown> };
}
