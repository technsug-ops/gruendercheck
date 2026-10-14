import { authorized } from '../lib/auth.js';
import { json } from '../lib/store.js';

// Yönetici: Vercel Web Analytics özetleri (çerezsiz ziyaret sayımı). Token yalnızca sunucuda kullanılır.
const API = 'https://api.vercel.com/v1/query/web-analytics/visits';
const PROJECT = 'prj_PkSxTvZErX9Yre3hmj0QdDNF4zYo';
const TEAM = 'team_JNbNQBosSt3orp9KKhwqpLTR';
const DIMS = ['requestPath', 'referrerHostname', 'utmSource', 'country', 'deviceType'];

const num = (r, keys) => { for (const k of keys) if (typeof r[k] === 'number') return r[k]; return null; };
const count = (r) => num(r, ['pageviews', 'pageViews', 'total', 'count', 'visits']) ?? Object.values(r).find((v) => typeof v === 'number') ?? 0;
const visitors = (r) => num(r, ['visitors', 'devices', 'uniqueVisitors']);

async function q(kind, params) {
  const u = new URL(`${API}/${kind}`);
  for (const [k, v] of Object.entries({ projectId: PROJECT, teamId: TEAM, ...params })) {
    if (Array.isArray(v)) v.forEach((x) => u.searchParams.append(k, x)); else u.searchParams.set(k, v);
  }
  const r = await fetch(u, { headers: { authorization: `Bearer ${process.env.VERCEL_API_TOKEN}` }, signal: AbortSignal.timeout(15000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${r.status} ${(j.error && j.error.message) || ''}`.trim());
  return j.data;
}

export async function GET(request) {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);
  if (!process.env.VERCEL_API_TOKEN) return json({ error: 'no_token' }, 200);
  const days = Math.min(Math.max(Number(new URL(request.url).searchParams.get('days')) || 30, 1), 365);
  const until = new Date(), since = new Date(until.getTime() - days * 864e5);
  const base = { since: since.toISOString(), until: until.toISOString() };
  try {
    const [totalRaw, daily, ...lists] = await Promise.all([
      q('count', base).catch(() => null),
      q('aggregate', { ...base, by: ['day'], limit: 100 }),
      ...DIMS.map((d) => q('aggregate', { ...base, by: [d], limit: 10 })),
    ]);
    const out = { days, since: base.since, until: base.until };
    out.daily = (daily || []).map((r) => ({ key: r.timestamp || r.day || r.date || '', n: count(r), v: visitors(r) }));
    DIMS.forEach((d, i) => { out[d] = (lists[i] || []).map((r) => ({ key: r[d] ?? '(bilinmiyor)', n: count(r), v: visitors(r) })); });
    const t = totalRaw && !Array.isArray(totalRaw) ? totalRaw : null;
    out.total = { n: t ? count(t) : out.daily.reduce((a, r) => a + r.n, 0), v: t ? visitors(t) : null };
    return json(out);
  } catch (err) {
    return json({ error: 'vercel', detail: String(err.message || err).slice(0, 200) }, 502);
  }
}
