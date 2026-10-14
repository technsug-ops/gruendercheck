import { waitUntil } from '@vercel/functions';
import { authorized } from '../lib/auth.js';
import { json, readBlob, validPath } from '../lib/store.js';
import { generateDraft, saveDraft } from '../lib/draft.js';

// Yönetici: taslağı (yeniden) oluştur  → POST { pathname }
//           düzeltilmiş taslağı kaydet  → PUT  { pathname, md }
export async function POST(request) {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: 'no_key' }, 400);
  let body; try { body = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }
  if (!validPath(body && body.pathname)) return json({ error: 'bad_path' }, 400);
  const rec = await readBlob(body.pathname);
  if (!rec) return json({ error: 'not_found' }, 404);
  await saveDraft(rec.id, { id: rec.id, created_at: new Date().toISOString(), pending: true });
  waitUntil(generateDraft(rec, { force: body.force === true }).catch((e) => console.error('draft failed', e)));
  return json({ ok: true, pending: true }, 202);
}

export async function PUT(request) {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);
  let body; try { body = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const { pathname, md } = body || {};
  if (!validPath(pathname) || typeof md !== 'string' || md.length > 60000) return json({ error: 'bad_input' }, 400);
  const rec = await readBlob(pathname);
  if (!rec) return json({ error: 'not_found' }, 404);
  const prev = (await readBlob(`drafts/${rec.id}.json`).catch(() => null)) || { id: rec.id };
  await saveDraft(rec.id, { ...prev, md, pending: false, edited_at: new Date().toISOString() });
  return json({ ok: true });
}
