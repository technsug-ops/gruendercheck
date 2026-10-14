// Basit sıklık sınırı: anahtar başına zaman penceresinde en fazla N istek. Anahtar hash'lenerek saklanır.
import { put } from '@vercel/blob';
import { createHash } from 'node:crypto';
import { readBlob } from './store.js';

const h = (s) => createHash('sha256').update(String(process.env.ADMIN_PASSWORD || '') + '|' + s).digest('hex').slice(0, 32);

export async function allow(key, max, windowMs) {
  const p = `rl/${h(key)}.json`, now = Date.now();
  let d = null;
  try { d = await readBlob(p); } catch {}
  const t = ((d && d.t) || []).filter((x) => now - x < windowMs);
  if (t.length >= max) return false;
  t.push(now);
  try { await put(p, JSON.stringify({ t }), { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true }); } catch {}
  return true;
}
export const clientIp = (request) => (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').split(',')[0].trim();
