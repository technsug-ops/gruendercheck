import { describe, expect, it } from "vitest";
import * as v1 from "../legacy/lib/quality.js";
import { qualityIssues } from "@/lib/domain/quality";
import { rng } from "./fixtures";

const GOOD = "Mobile Fahrradwerkstatt für Pendler in Frankfurt mit Abholung am Arbeitsplatz und Reparatur noch am selben Tag, Abrechnung über den Arbeitgeber.";

describe("quality = v1", () => {
  it("bilinen durumlar", () => {
    expect(qualityIssues({ idea: GOOD, current_solution: "Sie bringen das Rad selbst zur Werkstatt." })).toEqual([]);
    expect(qualityIssues({ idea: "asdf qwrt zxcv ".repeat(10), current_solution: "x" })).toEqual(["idea", "current_solution"]);
  });

  it("3000 rastgele metin", () => {
    const r = rng(42);
    const W = ["kafe", "Döner", "xkcd", "qwrtz", "Laden", "für", "und", "müşteri", "123", "çok", "bb", "a", "Straße", "!!!"];
    const text = (n: number) => Array.from({ length: n }, () => r.pick(W)).join(r.pick([" ", "  ", ", "]));
    for (let k = 0; k < 3000; k++) {
      const rec = { idea: text(Math.floor(r.next() * 30)), current_solution: text(Math.floor(r.next() * 8)) };
      expect(qualityIssues(rec)).toEqual(v1.qualityIssues(rec));
    }
  });
});
