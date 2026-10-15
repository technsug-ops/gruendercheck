// İş planı ek formu (/de/plan?id=…). v1: legacy/api/plan.js – aynı alan listeleri, aynı doğrulama.
import { json, readJson } from "@/lib/http";
import { isId } from "@/lib/ids";
import { savePlan } from "@/lib/data/plans";
import { getSubmission } from "@/lib/data/submissions";
import { notifyAdmin } from "@/lib/mail";

const NUM = ["units_m1", "units_m12", "growth_y2", "growth_y3", "payment_days",
  "p1_price", "p1_cost", "p1_share", "p2_price", "p2_cost", "p2_share", "p3_price", "p3_cost", "p3_share",
  "inv_equipment", "inv_vehicle", "inv_renovation", "inv_it", "inv_deposit", "inv_stock", "inv_founding", "inv_launch",
  "c_rent", "c_utilities", "c_insurance", "c_marketing", "c_vehicle", "c_it_phone", "c_accounting", "c_other", "c_staff_count", "c_staff_gross",
  "f_equity", "f_private_loan", "f_private_repay", "f_bank_loan", "f_bank_rate", "f_bank_years", "f_bank_grace", "f_grants", "alg1_monthly",
  "pv_living", "pv_health", "pv_pension", "pv_other_income"];
const TEXT: Record<string, number> = { p1_name: 80, p2_name: 80, p3_name: 80, start_month: 7, gz_apply: 3,
  t_offer: 3000, t_target: 2000, t_competitors: 2000, t_usp: 1500, t_location: 1500, t_marketing: 2000, t_org: 2000, t_cv: 3000, t_risks: 2000 };
const REQUIRED = ["units_m1", "units_m12", "f_equity"];

export async function POST(request: Request) {
  const body = await readJson(request, 40000);
  if ("error" in body) return body.error;
  const data = body.data;
  if (data.website) return json({ ok: true });
  if (!isId(data.id)) return json({ ok: false, error: "bad_id" }, 400);
  if (data.consent !== true) return json({ ok: false, error: "consent" }, 400);

  const rec: Record<string, string | number | boolean> = {};
  for (const k of NUM) {
    const v = data[k];
    if (v === undefined || v === null || v === "") continue;
    const x = Number(String(v).replace(",", "."));
    if (!Number.isFinite(x) || x < 0 || x > 1e8) return json({ ok: false, error: "number", field: k }, 400);
    rec[k] = x;
  }
  for (const [k, max] of Object.entries(TEXT)) {
    const v = data[k];
    if (v === undefined || v === null || v === "") continue;
    rec[k] = String(v).slice(0, max);
  }
  for (const k of REQUIRED) if (rec[k] === undefined) return json({ ok: false, error: "missing", field: k }, 400);
  if (rec.start_month && !/^\d{4}-\d{2}$/.test(String(rec.start_month))) delete rec.start_month;

  const sub = await getSubmission(data.id);
  if (!sub) return json({ ok: false, error: "not_found" }, 404);
  try {
    await savePlan(sub.id, { consent: true, ...rec });
  } catch (err) {
    console.error("plan save failed", err);
    return json({ ok: false, error: "storage" }, 500);
  }
  await notifyAdmin("plan", { lang: sub.lang, src: sub.src, city: sub.answers.city });
  return json({ ok: true });
}
