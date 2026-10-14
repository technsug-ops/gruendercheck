import { put } from '@vercel/blob';
import { randomUUID, randomBytes } from 'node:crypto';
import { confirmApplicant } from '../lib/mail.js';
import { qualityIssues } from '../lib/quality.js';
import { allow, clientIp } from '../lib/ratelimit.js';

const SITE = 'https://foundercheck.de';
const DAY = 24 * 3600 * 1000;

// Only these fields are stored; anything else in the request is ignored.
const FIELDS = {
  lang: 5, idea: 3000, current_solution: 2000, talked: 10, paid: 5, business_type: 30, customers: 10,
  city: 120, residence: 30, situation: 30, hours: 10, founders: 5, experience: 2000, capital: 10,
  price: 20, unit_cost: 20, fixed_costs: 20, rent: 20, investment: 20, price_is_net: 5, personal_need: 20,
  delivery_days: 10, worry: 2000, first_name: 80, email: 200, consent: 5, src: 30,
  rev_model: 15, price_unknown: 5, competitor_price: 20,
};
const REQUIRED = ['lang', 'idea', 'current_solution', 'business_type', 'city', 'residence', 'situation', 'capital', 'email'];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export async function POST(request) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > 30000) return json({ ok: false, error: 'too_large' }, 413);

  let data;
  try { data = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  if (!data || typeof data !== 'object') return json({ ok: false, error: 'bad_json' }, 400);

  // Honeypot: bots fill the hidden "website" field. Pretend success, store nothing.
  if (data.website) return json({ ok: true });

  const record = {};
  for (const [key, max] of Object.entries(FIELDS)) {
    const v = data[key];
    if (v === undefined || v === null || v === '') continue;
    record[key] = typeof v === 'boolean' ? v : String(v).slice(0, max);
  }
  for (const key of REQUIRED) {
    if (!record[key]) return json({ ok: false, error: 'missing', field: key }, 400);
  }
  if (record.consent !== true) return json({ ok: false, error: 'consent' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) return json({ ok: false, error: 'email' }, 400);
  if (!['de', 'tr'].includes(record.lang)) record.lang = 'de';
  if (record.src && !/^[a-z0-9_-]{1,30}$/.test(record.src)) delete record.src;
  if (record.rev_model && !['one_time', 'subscription', 'project', 'commission'].includes(record.rev_model)) delete record.rev_model;

  const bad = qualityIssues(record);
  if (bad.length) return json({ ok: false, error: 'quality', fields: bad }, 400);
  const ip = clientIp(request);
  if (!(await allow('e:' + record.email.toLowerCase(), 3, DAY)) || (ip && !(await allow('i:' + ip, 6, DAY)))) {
    return json({ ok: false, error: 'rate' }, 429);
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const token = randomBytes(16).toString('hex');
  const stored = { id, submitted_at: now, status: 'new', confirmed: false, confirm_token: token, ...record };
  const pathname = `submissions/${now.replace(/[:.]/g, '-')}_${id}.json`;

  try {
    await put(pathname, JSON.stringify(stored, null, 2), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
  } catch (err) {
    console.error('blob put failed', err);
    return json({ ok: false, error: 'storage' }, 500);
  }
  // Rapor ancak e-posta onaylanınca yazılır (api/confirm.js): gerçek kişi, gerçek adres, boşa API maliyeti yok.
  const url = `${SITE}/api/confirm?id=${id}&t=${token}`;
  const mail = await confirmApplicant(stored, url);
  if (mail && mail.ok === false) return json({ ok: false, error: 'mail' }, 502);
  return json({ ok: true });
}
