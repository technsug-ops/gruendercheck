import { list, get, put } from '@vercel/blob';
import { notifyAdmin } from '../lib/mail.js';

// Businessplan-Zusatzformular. Zugang nur über den persönlichen Link (/de/plan?id=<uuid>).
const NUM = ['units_m1', 'units_m12', 'growth_y2', 'growth_y3', 'payment_days',
  'p1_price', 'p1_cost', 'p1_share', 'p2_price', 'p2_cost', 'p2_share', 'p3_price', 'p3_cost', 'p3_share',
  'inv_equipment', 'inv_vehicle', 'inv_renovation', 'inv_it', 'inv_deposit', 'inv_stock', 'inv_founding', 'inv_launch',
  'c_rent', 'c_utilities', 'c_insurance', 'c_marketing', 'c_vehicle', 'c_it_phone', 'c_accounting', 'c_other', 'c_staff_count', 'c_staff_gross',
  'f_equity', 'f_private_loan', 'f_private_repay', 'f_bank_loan', 'f_bank_rate', 'f_bank_years', 'f_bank_grace', 'f_grants', 'alg1_monthly',
  'pv_living', 'pv_health', 'pv_pension', 'pv_other_income'];
const TEXT = { p1_name: 80, p2_name: 80, p3_name: 80, start_month: 7, gz_apply: 3,
  t_offer: 3000, t_target: 2000, t_competitors: 2000, t_usp: 1500, t_location: 1500, t_marketing: 2000, t_org: 2000, t_cv: 3000, t_risks: 2000 };
const REQUIRED = ['units_m1', 'units_m12', 'f_equity'];
// Prefill: nur Zahlen und Typen aus dem Check, keine Namen oder E-Mail.
const PREFILL = ['lang', 'business_type', 'customers', 'situation', 'founders', 'price', 'unit_cost', 'fixed_costs', 'rent', 'investment', 'personal_need', 'price_is_net'];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const validId = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);

async function readBlob(pathname) {
  const r = await get(pathname, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200) return null;
  return JSON.parse(await new Response(r.stream).text());
}
async function findSubmission(id) {
  let cursor;
  do {
    const page = await list({ prefix: 'submissions/', cursor, limit: 1000 });
    const hit = page.blobs.find((b) => b.pathname.endsWith(`_${id}.json`));
    if (hit) return readBlob(hit.pathname);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return null;
}
async function readPlan(id) {
  const page = await list({ prefix: `plans/${id}.json`, limit: 1 });
  return page.blobs.length ? readBlob(page.blobs[0].pathname) : null;
}

export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!validId(id)) return json({ ok: false, error: 'bad_id' }, 400);
  const sub = await findSubmission(id);
  if (!sub) return json({ ok: false, error: 'not_found' }, 404);
  const prefill = Object.fromEntries(PREFILL.filter((k) => sub[k] !== undefined).map((k) => [k, sub[k]]));
  const plan = await readPlan(id);
  if (plan) { delete plan.id; delete plan.submitted_at; }
  return json({ ok: true, prefill, plan });
}

export async function POST(request) {
  if (Number(request.headers.get('content-length') || 0) > 40000) return json({ ok: false, error: 'too_large' }, 413);
  let data;
  try { data = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  if (!data || typeof data !== 'object') return json({ ok: false, error: 'bad_json' }, 400);
  if (data.website) return json({ ok: true });
  if (!validId(data.id)) return json({ ok: false, error: 'bad_id' }, 400);
  if (data.consent !== true) return json({ ok: false, error: 'consent' }, 400);

  const rec = {};
  for (const k of NUM) {
    const v = data[k];
    if (v === undefined || v === null || v === '') continue;
    const x = Number(String(v).replace(',', '.'));
    if (!Number.isFinite(x) || x < 0 || x > 1e8) return json({ ok: false, error: 'number', field: k }, 400);
    rec[k] = x;
  }
  for (const [k, max] of Object.entries(TEXT)) {
    const v = data[k];
    if (v === undefined || v === null || v === '') continue;
    rec[k] = String(v).slice(0, max);
  }
  for (const k of REQUIRED) if (rec[k] === undefined) return json({ ok: false, error: 'missing', field: k }, 400);
  if (rec.start_month && !/^\d{4}-\d{2}$/.test(rec.start_month)) delete rec.start_month;

  const sub = await findSubmission(data.id);
  if (!sub) return json({ ok: false, error: 'not_found' }, 404);

  const stored = { id: data.id, submitted_at: new Date().toISOString(), consent: true, ...rec };
  try {
    await put(`plans/${data.id}.json`, JSON.stringify(stored, null, 2), {
      access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
    });
  } catch (err) {
    console.error('plan put failed', err);
    return json({ ok: false, error: 'storage' }, 500);
  }
  await notifyAdmin('plan', sub);
  return json({ ok: true });
}
