import { timingSafeEqual, createHash } from 'node:crypto';

/** Yönetici şifresi (Bearer) kontrolü; hash karşılaştırması uzunluk sızdırmaz. */
export function authorized(request) {
  const expected = process.env.ADMIN_PASSWORD || '';
  const header = request.headers.get('authorization') || '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!expected || !given) return false;
  const a = createHash('sha256').update(expected).digest();
  const b = createHash('sha256').update(given).digest();
  return timingSafeEqual(a, b);
}
