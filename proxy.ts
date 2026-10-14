import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // v1: kök adres Almanca tanıtım sayfasıdır (adres çubuğunda "/" kalır).
  if (request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/de/start", request.url));
  }
  return intl(request);
}

export const config = {
  // admin, api ve dosyalar dil yönlendirmesinin dışında.
  matcher: ["/((?!api|admin|_next|_vercel|.*\..*).*)"],
};
