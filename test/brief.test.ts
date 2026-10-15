import { describe, expect, it } from "vitest";
import * as v1 from "../legacy/brief.js";
import { briefText } from "@/lib/domain/brief";
import { randomAnswers, SAMPLES } from "./fixtures";

describe("brief = v1", () => {
  it("örnekler + 500 rastgele başvuru", () => {
    const all = [...SAMPLES, ...Array.from({ length: 500 }, (_, i) => randomAnswers(i + 1))];
    for (const [i, s] of all.entries()) {
      if (s.capital === "toString") continue;
      const at = new Date(Date.UTC(2026, 9, 1 + (i % 28))).toISOString();
      const withPii = { ...s, first_name: "Ayşe", email: "a@example.org" };
      const text = briefText(withPii, at);
      expect(text).toBe(v1.briefText({ ...withPii, submitted_at: at }));
      expect(text).not.toMatch(/Ayşe|example\.org/); // isim ve e-posta modele gitmez
    }
  });
});
