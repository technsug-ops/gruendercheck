import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { DEFAULT_LOCALE, pickLocale } from "./lib/i18n";

const intl = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // Kök adres: tarayıcının diline göre. Varsayılan dil adres çubuğunda "/" olarak kalır (v1 gibi);
  // diğer diller kendi adresine yönlenir. Dil içeren adresler (/de, /tr/start, e-postadaki linkler) asla yönlenmez.
  if (request.nextUrl.pathname === "/") {
    const locale = pickLocale(request.headers.get("accept-language"));
    const search = request.nextUrl.search; // ?k=<kanal> korunur
    const res = locale === DEFAULT_LOCALE
      ? NextResponse.rewrite(new URL(`/${locale}/start${search}`, request.url))
      : NextResponse.redirect(new URL(`/${locale}/start${search}`, request.url), 307);
    res.headers.set("Vary", "Accept-Language");
    return res;
  }
  return intl(request);
}

export const config = {
  // admin, rapor (yönetici önizlemesi), api ve dosyalar dil yönlendirmesinin dışında.
  matcher: ["/((?!api|admin|rapor|_next|_vercel|.*\..*).*)"],
};
