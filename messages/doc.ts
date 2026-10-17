// Rapor belgesi etiketleri (karar rozeti, alt bilgi …). render.ts tarayıcıda da çalıştığı için tüm metinler
// yerine sadece bu kısım içe aktarılır. Yeni dil eklerken burayı da doldur.
import type { Locale } from "@/i18n/routing";
import de from "./de/report.json";
import tr from "./tr/report.json";

export type DocTexts = typeof de.doc;
export const DOC: Record<Locale, DocTexts> = { de: de.doc, tr: tr.doc };
