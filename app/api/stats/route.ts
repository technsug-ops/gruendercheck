// Yönetici: Vercel Web Analytics özetleri (çerezsiz ziyaret sayımı). Token yalnızca sunucuda kullanılır.
// v1: legacy/api/stats.js. Proje/ekip kimlikleri ortam değişkeninden (yeni Vercel projesinde değişir).
import { guard } from "@/lib/admin-guard";
import { json } from "@/lib/http";

const API = "https://api.vercel.com/v1/query/web-analytics/visits";
const PROJECT = () => process.env.VERCEL_ANALYTICS_PROJECT_ID || process.env.VERCEL_PROJECT_ID || "prj_PkSxTvZErX9Yre3hmj0QdDNF4zYo";
const TEAM = () => process.env.VERCEL_ANALYTICS_TEAM_ID || "team_JNbNQBosSt3orp9KKhwqpLTR";
const DIMS = ["requestPath", "referrerHostname", "utmSource", "country", "deviceType"];

type Row = Record<string, unknown>;
const num = (r: Row, keys: string[]): number | null => { for (const k of keys) if (typeof r[k] === "number") return r[k] as number; return null; };
const count = (r: Row): number => num(r, ["pageviews", "pageViews", "total", "count", "visits"]) ?? (Object.values(r).find((v) => typeof v === "number") as number | undefined) ?? 0;
const visitors = (r: Row) => num(r, ["visitors", "devices", "uniqueVisitors"]);

async function q(kind: string, params: Record<string, string | string[] | number>): Promise<Row[] | Row | null> {
  const u = new URL(`${API}/${kind}`);
  for (const [k, v] of Object.entries({ projectId: PROJECT(), teamId: TEAM(), ...params })) {
    if (Array.isArray(v)) v.forEach((x) => u.searchParams.append(k, x)); else u.searchParams.set(k, String(v));
  }
  const r = await fetch(u, { headers: { authorization: `Bearer ${process.env.VERCEL_API_TOKEN}` }, signal: AbortSignal.timeout(15000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${r.status} ${j?.error?.message || ""}`.trim());
  return j.data;
}

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  if (!process.env.VERCEL_API_TOKEN) return json({ error: "no_token" }, 200);
  const days = Math.min(Math.max(Number(new URL(request.url).searchParams.get("days")) || 30, 1), 365);
  const until = new Date(), since = new Date(until.getTime() - days * 864e5);
  const base = { since: since.toISOString(), until: until.toISOString() };
  try {
    const [totalRaw, daily, ...lists] = await Promise.all([
      q("count", base).catch(() => null),
      q("aggregate", { ...base, by: ["day"], limit: 100 }),
      ...DIMS.map((d) => q("aggregate", { ...base, by: [d], limit: 10 })),
    ]);
    const rows = (x: unknown) => (Array.isArray(x) ? (x as Row[]) : []);
    const out: Record<string, unknown> = { days, since: base.since, until: base.until };
    const dailyRows = rows(daily).map((r) => ({ key: r.timestamp || r.day || r.date || "", n: count(r), v: visitors(r) }));
    out.daily = dailyRows;
    DIMS.forEach((d, i) => { out[d] = rows(lists[i]).map((r) => ({ key: r[d] ?? "(bilinmiyor)", n: count(r), v: visitors(r) })); });
    const t = totalRaw && !Array.isArray(totalRaw) ? totalRaw : null;
    out.total = { n: t ? count(t) : dailyRows.reduce((a, r) => a + r.n, 0), v: t ? visitors(t) : null };
    return json(out);
  } catch (err) {
    return json({ error: "vercel", detail: String((err instanceof Error && err.message) || err).slice(0, 200) }, 502);
  }
}
