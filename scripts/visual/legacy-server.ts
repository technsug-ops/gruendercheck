// v1'i (legacy/) yerelde sunar: vercel.json yönlendirmeleri + örnek veriyle sahte API. Sadece görsel karşılaştırma için.
// Çalıştır: npx tsx scripts/visual/legacy-server.ts [port]
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { devAnswers, DEV_IDS, devReportMd, DEV_SENT_AT } from "../dev-data";

const ROOT = normalize(join(process.cwd(), "legacy"));
const REWRITES: Record<string, string> = {
  "/": "/landing", "/de/start": "/landing", "/tr/start": "/landing", "/de": "/app", "/tr": "/app",
  "/de/plan": "/plan", "/tr/plan": "/plan", "/de/feedback": "/feedback", "/tr/feedback": "/feedback", "/de/r": "/bericht", "/tr/r": "/bericht",
};
const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webmanifest": "application/manifest+json" };
const PREFILL = ["lang", "business_type", "customers", "situation", "founders", "price", "unit_cost", "fixed_costs", "rent", "investment", "personal_need", "price_is_net"];
const known = (id: string | null) => id === DEV_IDS.de || id === DEV_IDS.tr;
const langOf = (id: string | null) => (id === DEV_IDS.tr ? "tr" : "de") as "de" | "tr";

function api(path: string, q: URLSearchParams, method: string) {
  if (method !== "GET") return { ok: true };
  const id = q.get("id"), lang = langOf(id);
  if (!known(id)) return null;
  if (path === "/api/report") return { ok: true, lang, md: devReportMd(lang), sent_at: DEV_SENT_AT };
  if (path === "/api/feedback") return { ok: true, done: false };
  if (path === "/api/plan") {
    // v1 api/plan.js PREFILL: sadece sayılar ve türler, isim/e-posta yok.
    const a: Record<string, string> = devAnswers(lang);
    const prefill = Object.fromEntries(PREFILL.filter((k) => a[k] !== undefined).map((k) => [k, a[k]]));
    return { ok: true, prefill, plan: null };
  }
  return { ok: false };
}

// Yönetici paneli (admin.html): v1 Bearer şifreyle sorar; liste yeni sunucudan aynen alınır (iki sürüm aynı kayıtları gösterir).
// Yeni sunucuya bir kez çerezle giriş yapılır. NEW_URL (varsayılan http://localhost:3200), ADMIN_PASSWORD.
const NEW_URL = process.env.NEW_URL || "http://localhost:3200";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
let adminCookie: Promise<string> | null = null;
async function newServerCookie(): Promise<string> {
  const r = await fetch(`${NEW_URL}/api/admin/session`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: ADMIN_PASSWORD }) });
  if (!r.ok) throw new Error(`yeni sunucuya giriş olmadı: ${r.status}`);
  return (r.headers.get("set-cookie") || "").split(";")[0];
}
async function adminApi(path: string, method: string, auth: string): Promise<{ status: number; body: unknown }> {
  if (!ADMIN_PASSWORD || auth !== `Bearer ${ADMIN_PASSWORD}`) return { status: 401, body: { error: "unauthorized" } };
  if (method !== "GET") return { status: 200, body: { ok: true } };
  // Yeni sunucu VERCEL_API_TOKEN olmadan aynısını döner.
  if (path === "/api/stats") return { status: 200, body: { error: "no_token" } };
  adminCookie ??= newServerCookie();
  const cookie = await adminCookie.catch((e) => { adminCookie = null; throw e; });
  const r = await fetch(`${NEW_URL}/api/submissions`, { headers: { cookie } });
  return { status: r.status, body: await r.json() };
}
const isAdminApi = (path: string, method: string) =>
  ["/api/submissions", "/api/stats", "/api/draft"].includes(path) || (path === "/api/report" && method !== "GET");

const port = Number(process.argv[2] || 3201);
createServer(async (req, res) => {
  const u = new URL(req.url || "/", "http://x");
  if (isAdminApi(u.pathname, req.method || "GET")) {
    const r = await adminApi(u.pathname, req.method || "GET", req.headers.authorization || "").catch((e) => ({ status: 500, body: { error: String(e) } }));
    res.writeHead(r.status, { "content-type": "application/json" });
    return res.end(JSON.stringify(r.body));
  }
  if (u.pathname.startsWith("/api/")) {
    const body = api(u.pathname, u.searchParams, req.method || "GET");
    res.writeHead(body ? 200 : 404, { "content-type": "application/json" });
    return res.end(JSON.stringify(body ?? { ok: false }));
  }
  let p = REWRITES[u.pathname.replace(/\/+$/, "") || "/"] ?? u.pathname;
  if (!extname(p)) p += ".html";
  const file = normalize(join(ROOT, p));
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); return res.end("404"); }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`v1: http://localhost:${port}`));
