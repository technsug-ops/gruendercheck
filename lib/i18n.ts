// Dil yardımcıları. Diller tek yerde tanımlı: i18n/routing.ts. Yeni dil = routing'e ekle + messages/<dil>/ dosyaları
// + messages/index.ts kaydı. Record<Locale, …> tipleri, bir dil için eksik değer kalırsa derlemeyi durdurur.
import { routing, type Locale } from "@/i18n/routing";

export type { Locale };
export const LOCALES = routing.locales;
export const DEFAULT_LOCALE: Locale = routing.defaultLocale;

export const isLocale = (x: unknown): x is Locale => (LOCALES as readonly unknown[]).includes(x);
/** Kayıttaki/adresteki dil; tanınmıyorsa varsayılan dil. */
export const toLocale = (x: unknown): Locale => (isLocale(x) ? x : DEFAULT_LOCALE);

/** Dilin tanıtım sayfası. Site içi linkler dili hep açıkça yazar ("/de/start"): kök adres ("/") tarayıcı diline
 *  göre yönlendirir; açık dil seçimi yapan biri oraya düşüp başka dile atılmasın. */
export const homePath = (l: Locale) => `/${l}/start`;

/** Accept-Language başlığından en uygun dil ("tr-TR,tr;q=0.9,de;q=0.8" → "tr"). Eşleşme yoksa varsayılan dil.
 *  Sadece istek başlığı okunur; hiçbir şey saklanmaz (çerez yok). */
export function pickLocale(acceptLanguage: string | null | undefined): Locale {
  const prefs = (acceptLanguage || "")
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((x) => x.trim()).find((x) => x.startsWith("q="));
      return { lang: tag.trim().toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) : 1, i };
    })
    .filter((x) => x.lang && x.lang !== "*" && Number.isFinite(x.q) && x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  return prefs.map((x) => x.lang).find(isLocale) ?? DEFAULT_LOCALE;
}

/** Tarih ve sayıların kullanıcıya gösterim biçimi. */
export const INTL_LOCALE: Record<Locale, string> = { de: "de-DE", tr: "tr-TR" };

/** Dil adları Türkçe: yönetici paneli ve modele giden metin ("Form dili: Almanca") için (iç kullanım). */
export const LOCALE_NAME_TR: Record<Locale, string> = { de: "Almanca", tr: "Türkçe" };
