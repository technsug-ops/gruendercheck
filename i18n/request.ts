import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

// Metinler sayfa başına ayrı dosyada: messages/<dil>/<sayfa>.json → t("<sayfa>.…").
const NAMESPACES = ["common", "start", "check", "report", "feedback", "plan"] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const parts = await Promise.all(NAMESPACES.map(async (ns) => [ns, (await import(`../messages/${locale}/${ns}.json`)).default] as const));
  return { locale, messages: Object.fromEntries(parts) };
});
