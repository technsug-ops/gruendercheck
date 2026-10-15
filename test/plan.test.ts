import { describe, expect, it } from "vitest";
import * as v1 from "../legacy/plan.js";
import { buildPlan, planToCsv, planToText } from "@/lib/domain/plan";
import { randomAnswers, randomPlan, SAMPLES } from "./fixtures";

describe("plan = v1", () => {
  it("1500 rastgele başvuru + plan", () => {
    let ok = 0;
    for (let seed = 1; seed <= 1500; seed++) {
      const sub = seed % 3 === 0 ? SAMPLES[seed % SAMPLES.length] : randomAnswers(seed);
      const p = randomPlan(seed);
      const a = buildPlan(sub, p), b = v1.buildPlan(sub, p);
      expect(a).toEqual(b);
      expect(planToText(a)).toBe(v1.planToText(b));
      expect(planToCsv(a)).toBe(v1.planToCsv(b));
      if (a.ok) ok++;
    }
    expect(ok).toBeGreaterThan(300); // rastgele girdilerin anlamlı kısmı gerçekten hesaplanıyor
  });

  it("tam doldurulmuş plan", () => {
    const sub = { lang: "de", customers: "b2b", situation: "alg1", founders: "2", price: "90", unit_cost: "20", fixed_costs: "1500", rent: "700" };
    const p = { units_m1: "20", units_m12: "120", growth_y2: "20", growth_y3: "10", payment_days: "30",
      p1_name: "A", p1_price: "90", p1_cost: "20", p1_share: "70", p2_name: "B", p2_price: "300", p2_cost: "80", p2_share: "30",
      inv_equipment: "12000", inv_founding: "800", c_marketing: "300", c_staff_gross: "2000", c_staff_count: "1",
      f_equity: "10000", f_bank_loan: "25000", f_bank_rate: "6,5", f_bank_years: "5", f_bank_grace: "6", f_private_loan: "5000", f_private_repay: "250",
      gz_apply: "yes", alg1_monthly: "1400", pv_living: "1800", pv_health: "250", start_month: "2026-11" };
    const a = buildPlan(sub, p), b = v1.buildPlan(sub, p);
    expect(a.ok).toBe(true);
    expect(a).toEqual(b);
    expect(planToText(a)).toBe(v1.planToText(b));
    expect(planToCsv(a)).toBe(v1.planToCsv(b));
  });
});
