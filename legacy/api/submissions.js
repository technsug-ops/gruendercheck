import { list, get, del, put } from '@vercel/blob';
import { authorized } from '../lib/auth.js';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

async function readBlob(pathname) {
  const result = await get(pathname, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200) return null;
  return JSON.parse(await new Response(result.stream).text());
}

const validPath = (p) => typeof p === 'string' && /^submissions\/[\w.-]+\.json$/.test(p);

export async function GET(request) {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);
  const items = [];
  let cursor;
  do {
    const page = await list({ prefix: 'submissions/', cursor, limit: 1000 });
    const loaded = await Promise.all(
      page.blobs.map(async (b) => {
        try {
          const data = await readBlob(b.pathname);
          return data ? { pathname: b.pathname, ...data } : null;
        } catch { return null; }
      }),
    );
    items.push(...loaded.filter(Boolean));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  // Plan formları, rapor taslakları ve gönderilmiş raporlar
  const byId = async (prefix) => {
    const out = {};
    let c;
    do {
      const page = await list({ prefix, cursor: c, limit: 1000 });
      await Promise.all(page.blobs.map(async (b) => {
        try { const d = await readBlob(b.pathname); if (d && d.id) out[d.id] = d; } catch {}
      }));
      c = page.hasMore ? page.cursor : undefined;
    } while (c);
    return out;
  };
  const [plans, drafts, reports] = await Promise.all([byId('plans/'), byId('drafts/'), byId('reports/')]);
  for (const it of items) {
    if (plans[it.id]) it.plan = plans[it.id];
    if (drafts[it.id]) it.draft = drafts[it.id];
    if (reports[it.id]) it.report = { sent_at: reports[it.id].sent_at };
  }
  // Onaylanmamış başvurular 7 gün sonra silinir (onay e-postasında böyle yazıyor).
  const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
  for (const it of items.filter((i) => i.confirmed === false && Date.parse(i.submitted_at) < cutoff)) {
    try { await del(it.pathname); } catch {}
    it._deleted = true;
  }
  for (let i = items.length - 1; i >= 0; i--) { if (items[i]._deleted) items.splice(i, 1); else delete items[i].confirm_token; }
  items.sort((x, y) => String(y.submitted_at).localeCompare(String(x.submitted_at)));
  return json({ items });
}

// Update status of one submission: { pathname, status }
export async function PATCH(request) {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const { pathname, status } = body || {};
  if (!validPath(pathname)) return json({ error: 'bad_path' }, 400);
  if (!['new', 'report_sent', 'feedback', 'follow_up', 'plan_link_sent', 'plan_sent', 'paid', 'closed'].includes(status)) {
    return json({ error: 'bad_status' }, 400);
  }
  const data = await readBlob(pathname);
  if (!data) return json({ error: 'not_found' }, 404);
  data.status = status;
  data.status_changed_at = new Date().toISOString();
  await put(pathname, JSON.stringify(data, null, 2), {
    access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
  });
  return json({ ok: true });
}

export async function DELETE(request) {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const { pathname } = body || {};
  if (!validPath(pathname)) return json({ error: 'bad_path' }, 400);
  await del(pathname);
  const m = pathname.match(/_([0-9a-f-]{36})\.json$/);
  if (m) for (const pre of ['plans', 'drafts', 'reports']) { try { await del(`${pre}/${m[1]}.json`); } catch {} }
  return json({ ok: true });
}
