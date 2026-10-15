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
const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const known = (id: string | null) => id === DEV_IDS.de || id === DEV_IDS.tr;
const langOf = (id: string | null) => (id === DEV_IDS.tr ? "tr" : "de") as "de" | "tr";

function api(path: string, q: URLSearchParams, method: string) {
  if (method !== "GET") return { ok: true };
  const id = q.get("id"), lang = langOf(id);
  if (!known(id)) return null;
  if (path === "/api/report") return { ok: true, lang, md: devReportMd(lang), sent_at: DEV_SENT_AT };
  if (path === "/api/feedback") return { ok: true, done: false };
  if (path === "/api/plan") { const { idea: _i, current_solution: _c, city: _ci, residence: _r, capital: _ca, ...prefill } = devAnswers(lang); return { ok: true, prefill, plan: null }; }
  return { ok: false };
}

const port = Number(process.argv[2] || 3201);
createServer((req, res) => {
  const u = new URL(req.url || "/", "http://x");
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
