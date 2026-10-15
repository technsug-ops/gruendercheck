// v1 (legacy/plan.html) alan şeması; metinler messages/<dil>/plan.json → fields.<key>.label / .hint / .options.
// typ: num | text | area | month | select | lines. cond: koşullu alan (b2b | location | alg1). req: zorunlu.
export type FieldType = "num" | "area" | "month" | "select" | "lines";
export type Cond = "b2b" | "location" | "alg1";
export interface Field { key: string; type: FieldType; hint?: boolean; cond?: Cond; req?: boolean; options?: string[] }
export interface Section { id: string; sub?: boolean; subKey?: "costsub"; grid?: boolean; f: Field[]; after?: Field[] }

const num = (key: string, o: Partial<Field> = {}): Field => ({ key, type: "num", ...o });
const area = (key: string, o: Partial<Field> = {}): Field => ({ key, type: "area", ...o });

export const SECTIONS: Section[] = [
  { id: "offer", sub: true, f: [
    { key: "start_month", type: "month" },
    { key: "lines", type: "lines", hint: true },
    num("units_m1", { hint: true, req: true }),
    num("units_m12", { req: true }),
    num("growth_y2"),
    num("growth_y3"),
    num("payment_days", { cond: "b2b" }),
    area("t_offer", { hint: true }),
  ] },
  { id: "market", sub: true, f: [
    area("t_target", { hint: true }),
    area("t_competitors", { hint: true }),
    area("t_usp"),
    area("t_location", { hint: true, cond: "location" }),
    area("t_marketing", { hint: true }),
  ] },
  { id: "inv", sub: true, grid: true, f: [
    num("inv_equipment"), num("inv_renovation"), num("inv_vehicle"), num("inv_it"),
    num("inv_deposit"), num("inv_stock"), num("inv_founding"), num("inv_launch"),
  ] },
  { id: "costs", subKey: "costsub", grid: true, f: [
    num("c_rent"), num("c_utilities"), num("c_insurance"), num("c_marketing"), num("c_vehicle"),
    num("c_it_phone"), num("c_accounting"), num("c_other"), num("c_staff_count"), num("c_staff_gross", { hint: true }),
  ], after: [area("t_org")] },
  { id: "fin", grid: true, f: [
    num("f_equity", { req: true }), num("f_private_loan"), num("f_private_repay"), num("f_grants"),
    num("f_bank_loan"), num("f_bank_rate", { hint: true }), num("f_bank_years"), num("f_bank_grace"),
    { key: "gz_apply", type: "select", cond: "alg1", options: ["", "yes", "no"] },
    num("alg1_monthly", { cond: "alg1" }),
  ] },
  { id: "priv", sub: true, grid: true, f: [
    num("pv_living"), num("pv_health"), num("pv_pension"), num("pv_other_income", { hint: true }),
  ] },
  { id: "person", f: [area("t_cv", { hint: true }), area("t_risks")] },
];

export const ALL_FIELDS = SECTIONS.flatMap((s) => [...s.f, ...(s.after ?? [])]);
/** Zorunlu alanlar, sayfadaki sırayla (v1: REQ). */
export const REQ = ALL_FIELDS.filter((f) => f.req).map((f) => f.key);

/** v1 applyConditions: ön doldurmadan hangi koşullu alanlar görünür. */
export function condFlags(pre: Record<string, unknown>): Record<Cond, boolean> {
  return { b2b: pre.customers === "b2b" || pre.customers === "both", location: pre.business_type === "location", alg1: pre.situation === "alg1" };
}

/** v1 init/setVal: alanların başlangıç değerleri (kayıtlı plan varsa o, yoksa kontrol formundan birkaç sayı). */
export function initialValues(pre: Record<string, unknown>, plan: Record<string, unknown> | null): Record<string, string> {
  const out: Record<string, string> = {};
  const set = (k: string, v: unknown) => { if (v !== undefined && v !== null && !(k in out)) out[k] = String(v); };
  if (plan) for (const [k, v] of Object.entries(plan)) set(k, v);
  else {
    set("p1_price", pre.price); set("p1_cost", pre.unit_cost); set("p1_share", pre.price ? 100 : undefined);
    set("c_rent", pre.rent); set("pv_living", pre.personal_need); set("inv_equipment", pre.investment);
  }
  return out;
}
