import { describe, expect, it } from "vitest";
import * as v1 from "../legacy/calc.js";
import { calculate, fmt, suggestVat, toText, VAT_OPTIONS } from "@/lib/domain/calc";
import { randomAnswers, SAMPLES } from "./fixtures";

const VATS = Object.keys(VAT_OPTIONS);

describe("calc = v1", () => {
  it("örnek başvurular, tüm KDV seçenekleri", () => {
    for (const s of SAMPLES) for (const vat of [undefined, ...VATS]) {
      expect(calculate(s, vat)).toEqual(v1.calculate(s, vat));
      expect(toText(calculate(s, vat))).toBe(v1.toText(v1.calculate(s, vat)));
    }
  });

  it("2000 rastgele başvuru", () => {
    for (let seed = 1; seed <= 2000; seed++) {
      const s = randomAnswers(seed);
      // v1 prototip alanlarını (ör. "toString") tablo anahtarı sanıyor; TS sürümü bilerek sanmıyor.
      if (s.capital === "toString") continue;
      const vat = VATS[seed % VATS.length];
      expect(suggestVat(s)).toBe(v1.suggestVat(s));
      expect(toText(calculate(s))).toBe(v1.toText(v1.calculate(s)));
      expect(calculate(s, vat)).toEqual(v1.calculate(s, vat));
    }
  });

  it("fmt", () => {
    for (const n of [0, 0.04, 3.14159, 9.99, 10, 1234.5, -7.5, 1e7, NaN, Infinity, null, undefined]) {
      for (const d of [0, 1, 2]) expect(fmt(n, d)).toBe(v1.fmt(n, d));
    }
  });

  it("bilinmeyen sermaye anahtarı yok sayılır (v1'den bilinçli fark)", () => {
    const r = calculate({ price: "50", unit_cost: "10", fixed_costs: "1000", capital: "toString" });
    expect(r.ok && r.values.capital_low).toBeUndefined();
  });
});
