import { defineRouting } from "next-intl/routing";

// v1 adresleri aynen kalır: /de, /tr (form), /de/start, /tr/start (tanıtım), /de/r?id=… (rapor).
// Dil algılama ve dil çerezi yok: adres dili belirler (çerezsiz).
export const routing = defineRouting({
  locales: ["de", "tr"],
  defaultLocale: "de",
  localePrefix: "always",
  localeDetection: false,
  localeCookie: false,
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];
