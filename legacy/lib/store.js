import { get } from '@vercel/blob';

export const validId = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);
export const validPath = (p) => typeof p === 'string' && /^submissions\/[\w.-]+\.json$/.test(p);
export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export async function readBlob(pathname) {
  const r = await get(pathname, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200) return null;
  return JSON.parse(await new Response(r.stream).text());
}

/** Başvuruyu id ile bulur: { pathname, data } veya null. */
export async function findSubmission(id) {
  const { list } = await import('@vercel/blob');
  let cursor;
  do {
    const page = await list({ prefix: 'submissions/', cursor, limit: 1000 });
    const hit = page.blobs.find((b) => b.pathname.endsWith(`_${id}.json`));
    if (hit) { const data = await readBlob(hit.pathname); return data ? { pathname: hit.pathname, data } : null; }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return null;
}
