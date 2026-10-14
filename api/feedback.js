import { list, get, put } from '@vercel/blob';
import { notifyAdmin } from '../lib/mail.js';

// Geri bildirim: kişisel link (/de/feedback?id=<uuid>). Cevap başvuru kaydına yazılır.
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const validId = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);
const ALLOWED = { useful: ['1', '2', '3', '4', '5'], next: ['plan', 'talk', 'none'], wtp: ['0', 'lt50', '50-150', '150-300', '300+'] };
const EARLY = ['new', 'report_sent', 'feedback'];

async function find(id) {
  let cursor;
  do {
    const page = await list({ prefix: 'submissions/', cursor, limit: 1000 });
    const hit = page.blobs.find((b) => b.pathname.endsWith(`_${id}.json`));
    if (hit) {
      const r = await get(hit.pathname, { access: 'private', useCache: false });
      if (!r || r.statusCode !== 200) return null;
      return { pathname: hit.pathname, data: JSON.parse(await new Response(r.stream).text()) };
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return null;
}

export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!validId(id)) return json({ ok: false }, 400);
  const hit = await find(id);
  if (!hit) return json({ ok: false }, 404);
  return json({ ok: true, done: !!hit.data.feedback });
}

export async function POST(request) {
  if (Number(request.headers.get('content-length') || 0) > 10000) return json({ ok: false, error: 'too_large' }, 413);
  let d;
  try { d = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  if (!d || typeof d !== 'object' || !validId(d.id)) return json({ ok: false, error: 'bad_id' }, 400);
  if (d.website) return json({ ok: true });
  const fb = {};
  for (const [k, opts] of Object.entries(ALLOWED)) {
    if (!opts.includes(String(d[k]))) return json({ ok: false, error: 'missing', field: k }, 400);
    fb[k] = String(d[k]);
  }
  for (const [k, max] of [['best', 1500], ['missing', 1500]]) if (d[k]) fb[k] = String(d[k]).slice(0, max);
  fb.at = new Date().toISOString();

  const hit = await find(d.id);
  if (!hit) return json({ ok: false, error: 'not_found' }, 404);
  const rec = hit.data;
  rec.feedback = fb;
  if (EARLY.includes(rec.status || 'new')) {
    rec.status = fb.next === 'none' ? 'feedback' : 'follow_up';
    rec.status_changed_at = fb.at;
  }
  try {
    await put(hit.pathname, JSON.stringify(rec, null, 2), {
      access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
    });
  } catch (err) {
    console.error('feedback put failed', err);
    return json({ ok: false, error: 'storage' }, 500);
  }
  await notifyAdmin('feedback', rec);
  return json({ ok: true });
}
