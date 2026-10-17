import { describe, expect, it } from "vitest";
import { piiFlags } from "../scripts/eval/export-v1";

describe("kişisel veri ön taraması", () => {
  it("tipik kalıpları işaretler", () => {
    const f = piiFlags("Ich bin Mehmet Yilmaz, Inhaber der Yilmaz Bau GmbH, Hauptstraße 12, 60311 Frankfurt, Tel 0171 1234567, www.yilmaz-bau.de, mehmet@x.de");
    const kinds = new Set(f.map((x) => x.split(":")[0]));
    for (const k of ["e-posta", "telefon", "web", "firma", "adres", "plz", "ad?"]) expect(kinds).toContain(k);
  });
  it("sıradan fikir metnini işaretlemez", () => {
    expect(piiFlags("Mobile Fahrradwerkstatt für Pendler in Frankfurt, Reparatur am selben Tag.")).toEqual([]);
  });
});

describe("ad kalıbı kelime sınırı", () => {
  it("kelime içindeki 'ben' eşleşmez, tanıtmadaki eşleşir", () => {
    expect(piiFlags("am selben Tag Reparatur")).toEqual([]);
    expect(piiFlags("Merhaba, ben Ayşe Kaya.").some((x) => x.startsWith("ad?"))).toBe(true);
  });
});
