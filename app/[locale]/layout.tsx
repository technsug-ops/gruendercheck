import type { Metadata, Viewport } from "next";
import { toLocale } from "@/lib/i18n";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { routing } from "@/i18n/routing";
import "../globals.css";

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const locale = toLocale((await params).locale);
  return {
    robots: { index: false, follow: false },
    icons: { icon: { url: "/icon.svg", type: "image/svg+xml" }, apple: "/apple-touch-icon.png" },
    manifest: `/manifest-${locale}.webmanifest`,
  };
}
export const viewport: Viewport = { themeColor: "#0f2d4a" };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  // Geçersiz dil (/fr …) 404; toLocale'den ÖNCE kontrol edilir, yoksa varsayılan dile düşerdi.
  const raw = (await params).locale;
  if (!hasLocale(routing.locales, raw)) notFound();
  const locale = raw;
  setRequestLocale(locale);
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Analytics />
        <Script src="/pwa.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
