// Eşdeğerlik testleri için girdiler: elle yazılmış gerçekçi başvurular + tohumlu rastgele başvurular.
import type { Answers } from "@/lib/domain/calc";
import type { PlanInput } from "@/lib/domain/plan";

/** Tekrarlanabilir rastgele sayı (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(next() * xs.length)];
  const maybe = <T,>(p: number, v: () => T): T | undefined => (next() < p ? v() : undefined);
  return { next, pick, maybe };
}

const NUMS = ["", "0", "1", "3,5", "9.99", "12", "45", "120", "250", "480", "1200", "1.234,5", "2500", "8000", "15000", "60000", "-5", "abc", " 30 "];

export function randomAnswers(seed: number): Answers {
  const r = rng(seed);
  const a: Answers = {
    lang: r.pick(["de", "tr"]),
    idea: "Mobile Fahrradwerkstatt für Pendler in Frankfurt mit Abholung am Arbeitsplatz und Reparatur noch am selben Tag.",
    current_solution: "Sie bringen das Rad selbst in eine Werkstatt und warten oft eine Woche.",
    business_type: r.pick(["location", "onsite_service", "online_service", "online_products", "production", "other", "x"]),
    customers: r.pick(["b2c", "b2b", "both"]),
    city: "Frankfurt",
    residence: r.pick(["de_eu", "settlement", "student", "job_search", "blue_card", "family", "other", "abroad"]),
    situation: r.pick(["employed_full", "employed_part", "alg1", "buergergeld", "student", "self_employed"]),
    capital: r.pick(["0-5k", "5-15k", "15-50k", "50k+", "", "toString"]),
    talked: r.pick(["0", "1-5", "6-20", "20+"]),
    paid: r.pick(["no", "yes"]),
    founders: r.pick(["1", "2", "3+"]),
    hours: r.pick(["10", "20", "40"]),
    rev_model: r.pick(["one_time", "subscription", "project", "commission", "", "bogus"]),
  };
  const fields = ["price", "competitor_price", "unit_cost", "fixed_costs", "rent", "investment", "personal_need", "delivery_days"];
  for (const f of fields) {
    const v = r.maybe(0.8, () => r.pick(NUMS));
    if (v !== undefined) a[f] = v;
  }
  const net = r.maybe(0.5, () => r.pick(["true", "false"]));
  if (net) a.price_is_net = r.next() < 0.5 ? net === "true" : net;
  if (r.next() < 0.3) a.price_unknown = true;
  if (r.next() < 0.5) {
    a.experience = "10 Jahre Zweiradmechaniker";
    a.worry = "Ob genug Firmen mitmachen.";
  }
  return a;
}

const PLAN_NUM_KEYS = ["units_m1", "units_m12", "growth_y2", "growth_y3", "payment_days",
  "p1_price", "p1_cost", "p1_share", "p2_price", "p2_cost", "p2_share", "p3_price", "p3_cost", "p3_share",
  "inv_equipment", "inv_vehicle", "inv_renovation", "inv_it", "inv_deposit", "inv_stock", "inv_founding", "inv_launch",
  "c_rent", "c_utilities", "c_insurance", "c_marketing", "c_vehicle", "c_it_phone", "c_accounting", "c_other", "c_staff_count", "c_staff_gross",
  "f_equity", "f_private_loan", "f_private_repay", "f_bank_loan", "f_bank_rate", "f_bank_years", "f_bank_grace", "f_grants", "alg1_monthly",
  "pv_living", "pv_health", "pv_pension", "pv_other_income"];

export function randomPlan(seed: number): PlanInput {
  const r = rng(seed * 7919 + 1);
  const p: PlanInput = {};
  for (const k of PLAN_NUM_KEYS) {
    const v = r.maybe(k.startsWith("units") ? 0.9 : 0.45, () => r.pick(NUMS));
    if (v !== undefined) p[k] = v;
  }
  if (r.next() < 0.5) p.p1_name = "Reparatur";
  if (r.next() < 0.3) p.p2_name = 'Wartung "Abo"';
  const gz = r.maybe(0.4, () => r.pick(["yes", "no"]));
  if (gz) p.gz_apply = gz;
  const start = r.maybe(0.6, () => r.pick(["2026-01", "2026-11", "2027-06", "bad"]));
  if (start) p.start_month = start;
  return p;
}

/** Gerçekçi örnekler (kenar durumları dahil). */
export const SAMPLES: Answers[] = [
  { lang: "de", business_type: "location", capital: "15-50k", price: "4,50", unit_cost: "1,2", fixed_costs: "3500", rent: "1800", investment: "40000", personal_need: "2200" },
  { lang: "tr", business_type: "online_service", rev_model: "subscription", capital: "0-5k", price: "29", unit_cost: "3", fixed_costs: "400", price_is_net: true },
  { lang: "de", business_type: "online_products", capital: "5-15k", price: "35", unit_cost: "14", fixed_costs: "900", investment: "6000", delivery_days: "3" },
  { lang: "de", business_type: "onsite_service", rev_model: "project", capital: "50k+", price: "2400", unit_cost: "600", fixed_costs: "1500", investment: "80000" },
  { lang: "tr", business_type: "other", rev_model: "commission", capital: "5-15k", competitor_price: "120", price_unknown: true, unit_cost: "10", fixed_costs: "300" },
  { lang: "de", business_type: "location", capital: "0-5k", price: "10", unit_cost: "12", fixed_costs: "1000" }, // negatif katkı
  { lang: "de", business_type: "production", capital: "5-15k", price: "10", unit_cost: "8", fixed_costs: "1000" }, // fiyat −%10 → negatif
  { lang: "tr", business_type: "location", capital: "15-50k", price_unknown: "true", fixed_costs: "800" }, // eksik girdi
];
