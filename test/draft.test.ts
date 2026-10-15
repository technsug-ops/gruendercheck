import { describe, expect, it } from "vitest";
import * as v1 from "../legacy/lib/draft.js";
import { insufficientMessage, splitDraft, userText } from "@/lib/ai/draft";
import { SAMPLES } from "./fixtures";

const OUTPUTS = [
  "# Bericht\n\nText",
  "```markdown\n# Bericht\nText\n```",
  "===HALİL===\n- Frage 1\n===RAPOR===\n# Bericht\nText",
  "- Frage ohne Marker\n\n# Bericht\nText",
  "Vorspann ===RAPOR=== # Bericht",
  "===RAPOR===\n# Nur Rapor",
  "kein Titel",
  "",
];

describe("draft", () => {
  it("splitDraft = v1", () => {
    for (const o of OUTPUTS) expect(splitDraft(o)).toEqual(v1.splitDraft(o));
  });
  it("YETERSİZ mesajı", () => {
    expect(insufficientMessage("===YETERSİZ===\nBitte fülle das Formular erneut aus.")).toBe("Bitte fülle das Formular erneut aus.");
    expect(insufficientMessage("# Bericht")).toBeNull();
  });
  it("modele giden metin: isim/e-posta yok, force YETERSİZ kuralını kaldırır", () => {
    const a = { ...SAMPLES[0], first_name: "Ayşe", email: "a@example.org" };
    const t = userText(a, "2026-10-14T10:00:00Z", { today: "2026-10-15" });
    expect(t).not.toMatch(/Ayşe|example\.org/);
    expect(t).toContain("Bugünün tarihi: 2026-10-15.");
    expect(t).toContain("===YETERSİZ===");
    expect(userText(a, "2026-10-14T10:00:00Z", { force: true })).not.toContain("===YETERSİZ===");
  });
});
