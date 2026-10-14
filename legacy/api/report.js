import { authorized } from '../lib/auth.js';
import { json, readBlob, validId, validPath } from '../lib/store.js';
import { publishReport } from '../lib/report.js';

// Herkese açık: kişiye özel link (/de/r?id=<uuid>) ile gönderilmiş raporu okur.
export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!validId(id)) return json({ ok: false }, 400);
  const rep = await readBlob(`reports/${id}.json`).catch(() => null);
  if (!rep) return json({ ok: false }, 404);
  return json({ ok: true, lang: rep.lang, md: rep.md, sent_at: rep.sent_at });
}

// Yönetici: raporu onayla ve gönder → POST { pathname, md }
export async function POST(request) {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);
  let body; try { body = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const { pathname, md } = body || {};
  if (!validPath(pathname) || typeof md !== 'string' || !/^\s*#\s/.test(md) || md.length > 60000) return json({ error: 'bad_input' }, 400);
  const rec = await readBlob(pathname);
  if (!rec) return json({ error: 'not_found' }, 404);
  const res = await publishReport(rec, pathname, md.trim());
  return json(res, res.ok ? 200 : 502);
}
