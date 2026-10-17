import { getRequestConfig } from "next-intl/server";
import { MESSAGES } from "@/messages";
import { toLocale } from "@/lib/i18n";

// Metinler sayfa/konu başına ayrı dosyada: messages/<dil>/<ad>.json → t("<ad>.…"). Kayıt: messages/index.ts
export default getRequestConfig(async ({ requestLocale }) => {
  const locale = toLocale(await requestLocale);
  return { locale, messages: MESSAGES[locale] };
});
