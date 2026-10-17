// Çok dilli yapı: dil dosyaları aynı yapıda, aynı yer tutucularla; diller birbirine sızmıyor; tarayıcı dili seçimi.
import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, homePath, LOCALES, pickLocale, toLocale } from "@/lib/i18n";
import { MESSAGES } from "@/messages";

type Leaf = { path: string; value: string };
function leaves(o: unknown, path = ""): Leaf[] {
  if (typeof o === "string") return [{ path, value: o }];
  if (Array.isArray(o)) return o.flatMap((x, i) => leaves(x, `${path}[${i}]`));
  if (o && typeof o === "object") return Object.entries(o).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [];
}
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const tags = (s: string) => [...s.matchAll(/<\/?(\w+)/g)].map((m) => m[1]).sort();

const OTHERS = LOCALES.filter((l) => l !== DEFAULT_LOCALE);
const base = leaves(MESSAGES[DEFAULT_LOCALE]);

// Bilerek her dilde aynı kalan değerler: özel adlar, resmi Almanca terimler, salt yapı (yer tutucu/etiket).
const SAME_OK = new Set([
  "Telefon", "foundercheck.de", "Bürgergeld", "Niederlassungserlaubnis / Daueraufenthalt-EU",
]);
const structural = (s: string) => !/[\p{L}]{3,}/u.test(s.replace(/\{\w+\}|<\/?\w+>/g, ""));

// Türkçe metin içinde geçmesi doğal olan Almanca resmi adlar (kurum, belge, kanun). Bunlar çıkarıldıktan sonra
// Almanca işaretleri (ä, ß, sık kullanılan Almanca kelimeler) aranır.
const GERMAN_TERMS_OK = [
  "Hessischer Beauftragter für Datenschutz und Informationsfreiheit", "Niederlassungserlaubnis", "Daueraufenthalt-EU",
  "Ausländerbehörde", "Arbeitsagentur", "Gründungszuschuss", "haftungsbeschränkt", "Bürgergeld", "Geselle", "Gewerbe",
];
const GERMAN_MARKERS = /[äßÄ]|\b(und|der|die|das|für|mit|nicht|gemäß|Angaben|Datenschutz|Impressum|Bericht|Geschäftsführer|Telefon:|bitte)\b/;

describe("dil dosyaları", () => {
  it("her dilde aynı anahtarlar, yer tutucular ve etiketler", () => {
    for (const l of OTHERS) {
      const other = new Map(leaves(MESSAGES[l]).map((x) => [x.path, x.value]));
      expect([...other.keys()].sort()).toEqual(base.map((x) => x.path).sort());
      for (const { path, value } of base) {
        const v = other.get(path)!;
        expect({ path, ph: placeholders(v) }).toEqual({ path, ph: placeholders(value) });
        expect({ path, tags: tags(v) }).toEqual({ path, tags: tags(value) });
        expect({ path, empty: v.trim() === "" }).toEqual({ path, empty: value.trim() === "" });
      }
    }
  });

  it("çevrilmeden kalmış metin yok", () => {
    for (const l of OTHERS) {
      const other = new Map(leaves(MESSAGES[l]).map((x) => [x.path, x.value]));
      const same = base.filter(({ path, value }) => other.get(path) === value && !structural(value) && !SAME_OK.has(value));
      expect(same.map((x) => `${x.path}: ${x.value}`)).toEqual([]);
    }
  });

  it("Türkçe metinlerde Almanca sızıntı yok", () => {
    const leaks = leaves(MESSAGES.tr)
      .map(({ path, value }) => ({ path, value, clean: GERMAN_TERMS_OK.reduce((s, term) => s.split(term).join(""), value) }))
      .filter(({ clean }) => GERMAN_MARKERS.test(clean))
      .map(({ path, value }) => `${path}: ${value.slice(0, 80)}`);
    expect(leaks).toEqual([]);
  });

  it("e-posta ve onay sayfası her dilde dolu", () => {
    for (const l of LOCALES) {
      expect(MESSAGES[l].mail.confirm.text).toContain("{url}");
      expect(MESSAGES[l].mail.report.text).toContain("{feedbackUrl}");
      expect(MESSAGES[l].confirm.btn.length).toBeGreaterThan(3);
    }
  });
});

describe("tarayıcı dili", () => {
  it("Accept-Language'den dil seçimi", () => {
    expect(pickLocale("tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7")).toBe("tr");
    expect(pickLocale("de-DE,de;q=0.9,tr;q=0.8")).toBe("de");
    expect(pickLocale("en-US,en;q=0.9,tr;q=0.8")).toBe("tr"); // ilk desteklenen dil
    expect(pickLocale("en-US,en;q=0.9")).toBe(DEFAULT_LOCALE); // desteklenmeyen → varsayılan
    expect(pickLocale("de;q=0.5,tr;q=0.8")).toBe("tr"); // sıra değil ağırlık belirler
    expect(pickLocale("tr;q=0,de")).toBe("de"); // q=0 "istemiyorum" demek
    expect(pickLocale("*")).toBe(DEFAULT_LOCALE);
    expect(pickLocale("")).toBe(DEFAULT_LOCALE);
    expect(pickLocale(null)).toBe(DEFAULT_LOCALE);
    expect(pickLocale("TR")).toBe("tr");
  });
  it("yardımcılar", () => {
    expect(toLocale("tr")).toBe("tr");
    expect(toLocale("fr")).toBe(DEFAULT_LOCALE);
    expect(toLocale(undefined)).toBe(DEFAULT_LOCALE);
    for (const l of LOCALES) expect(homePath(l)).toBe(`/${l}/start`); // site içi linkler dili açıkça yazar
  });
});
